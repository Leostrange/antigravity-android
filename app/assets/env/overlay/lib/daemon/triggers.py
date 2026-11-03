"""
Triggers module for Antigravity v2 daemon.
Handles battery level checking, file/directory modification watching,
GitHub issue/PR polling, and authenticated local HTTP webhooks.
"""

import os
import time
import json
import hmac
import subprocess
import urllib.request
import urllib.error
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler

from .executor import (
    log,
    load_tasks,
    execute_action_async,
    RISH_BIN,
)


def check_github_repo(trigger_info, endpoint_type="pulls"):
    repo = trigger_info.get("repo")
    if not repo:
        return False
    token = os.environ.get("GITHUB_TOKEN") or trigger_info.get("token")
    url = f"https://api.github.com/repos/{repo}/{endpoint_type}?state=open"
    headers = {"User-Agent": "Antigravity-Daemon", "Accept": "application/vnd.github.v3+json"}
    if token:
        headers["Authorization"] = f"token {token}"
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        last_count_key = f"last_{endpoint_type}_count"
        last_count = trigger_info.get(last_count_key)
        current_count = len(data)
        trigger_info[last_count_key] = current_count
        trigger_info["last_check_ts"] = time.time()

        if last_count is not None and current_count > last_count:
            item = data[0] if data else {}
            title = item.get("title", f"New {endpoint_type}")
            log(f"GitHub trigger fired for {repo} ({endpoint_type}): '{title}'")
            return True
    except Exception as e:
        log(f"GitHub check error for {repo}: {e}")
    return False


def check_file_watcher(trigger_info):
    target_path = trigger_info.get("path")
    if not target_path or not os.path.exists(target_path):
        return False
    try:
        last_mtime = trigger_info.get("last_mtime", 0)
        curr_mtime = os.path.getmtime(target_path)
        if last_mtime == 0:
            trigger_info["last_mtime"] = curr_mtime
            return False
        if curr_mtime > last_mtime:
            trigger_info["last_mtime"] = curr_mtime
            log(f"File watch trigger fired for: {target_path}")
            return True
    except Exception as e:
        log(f"File watch error: {e}")
    return False


def check_battery_condition(trigger_info):
    target_level = trigger_info.get("below_level")
    if target_level is None:
        return False
    try:
        p = subprocess.run([RISH_BIN, "-c", "dumpsys battery"], stdout=subprocess.PIPE, text=True, timeout=5)
        for line in p.stdout.splitlines():
            if "level:" in line:
                val = int(line.split(":", 1)[1].strip())
                return val <= target_level
    except Exception:
        pass
    return False


def start_webhook_listener(port):
    class WebhookHandler(BaseHTTPRequestHandler):
        MAX_BODY_BYTES = 64 * 1024

        def _reply(self, status, body):
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Connection", "close")
            self.end_headers()
            self.wfile.write(json.dumps(body).encode("utf-8"))
            self.close_connection = True

        def do_POST(self):
            if self.path != "/":
                self._reply(404, {"status": "not_found"})
                return
            try:
                content_length = int(self.headers.get("Content-Length", "0"))
            except ValueError:
                self._reply(400, {"status": "invalid_content_length"})
                return
            if content_length < 0 or content_length > self.MAX_BODY_BYTES:
                self._reply(413, {"status": "body_too_large"})
                return

            provided = self.headers.get("X-AGY-Token", "")
            tasks = load_tasks()
            authorized = []
            for task in tasks:
                trigger = task.get("trigger", {})
                expected = trigger.get("token", "")
                if (task.get("enabled", True)
                        and trigger.get("type") == "webhook"
                        and int(trigger.get("port", 45199)) == port
                        and expected
                        and hmac.compare_digest(str(provided), str(expected))):
                    authorized.append(task)
            if not authorized:
                self._reply(401, {"status": "unauthorized"})
                return

            try:
                body = self.rfile.read(content_length).decode("utf-8", errors="replace")
            except Exception:
                self._reply(400, {"status": "invalid_body"})
                return
            log(f"Authenticated webhook on port {port}: {body[:200]}")
            for task in authorized:
                execute_action_async(task)
            self._reply(200, {"status": "ok", "fired": len(authorized)})

        def log_message(self, format, *args):
            pass

    class LocalWebhookServer(ThreadingHTTPServer):
        daemon_threads = True
        allow_reuse_address = True

    try:
        server = LocalWebhookServer(("127.0.0.1", port), WebhookHandler)
        log(f"Authenticated local webhook receiver listening on 127.0.0.1:{port}")
        server.serve_forever()
    except Exception as e:
        log(f"Webhook listener failed on port {port}: {e}")
