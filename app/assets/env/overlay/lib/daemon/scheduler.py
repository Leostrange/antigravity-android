"""
Scheduler module for Antigravity v2 daemon.
Handles cron parsing, delay/interval duration calculations, and the primary
daemon ticking loop.
"""

import os
import time
import threading
from datetime import datetime

from .executor import (
    log,
    load_tasks,
    save_tasks,
    execute_action_async,
    PID_FILE,
    STOP_EVENT,
)
from .triggers import (
    check_github_repo,
    check_file_watcher,
    check_battery_condition,
    start_webhook_listener,
)


def read_daemon_pid():
    try:
        with open(PID_FILE, "r", encoding="utf-8") as f:
            raw = f.read().strip()
        try:
            import json
            value = json.loads(raw)
            return int(value.get("pid", 0)) if isinstance(value, dict) else int(value)
        except (ValueError, TypeError, Exception):
            return 0
    except (OSError, ValueError):
        return 0


def parse_duration(s):
    s = str(s).strip()
    if s.endswith("h"):
        return int(float(s[:-1]) * 3600)
    elif s.endswith("m"):
        return int(float(s[:-1]) * 60)
    elif s.endswith("s"):
        return int(float(s[:-1]))
    return int(s)


def _match_cron_field(val, pattern, min_val, max_val):
    pattern = pattern.strip()
    if pattern == "*":
        return True
    for part in pattern.split(","):
        part = part.strip()
        if not part:
            continue
        if "/" in part:
            subparts = part.split("/", 1)
            step = int(subparts[1])
            if subparts[0] == "*":
                if (val - min_val) % step == 0:
                    return True
            else:
                start = int(subparts[0])
                if val >= start and (val - start) % step == 0:
                    return True
        elif "-" in part:
            start, end = part.split("-", 1)
            if int(start) <= val <= int(end):
                return True
        else:
            if int(part) == val:
                return True
    return False


def matches_cron(cron_expr, dt=None):
    """
    Checks if datetime dt matches the 5-field cron:
    minute (0-59), hour (0-23), day of month (1-31), month (1-12), day of week (0-6, 0=Sun).
    """
    if dt is None:
        dt = datetime.now()
    fields = cron_expr.strip().split()
    if len(fields) != 5:
        return False
    m, h, dom, mon, dow = fields

    if not _match_cron_field(dt.minute, m, 0, 59):
        return False
    if not _match_cron_field(dt.hour, h, 0, 23):
        return False
    if not _match_cron_field(dt.day, dom, 1, 31):
        return False
    if not _match_cron_field(dt.month, mon, 1, 12):
        return False
    # weekday in Python: 0=Mon..6=Sun. In cron: 0=Sun..6=Sat (or 7=Sun)
    cron_dow = (dt.weekday() + 1) % 7
    if not _match_cron_field(cron_dow, dow, 0, 6):
        return False
    return True


def daemon_loop():
    """Main scheduler ticking loop."""
    log("Antigravity background micro-daemon loop started.")
    webhook_threads = {}

    while not STOP_EVENT.is_set():
        try:
            tasks = load_tasks()
            now = time.time()
            now_dt = datetime.now()
            changed = False

            for task in tasks:
                if not task.get("enabled", True):
                    continue

                trigger = task.get("trigger", {})
                ttype = trigger.get("type", "delay")
                should_run = False

                if ttype in ("once", "delay"):
                    run_at = trigger.get("run_at", 0)
                    if now >= run_at and not task.get("executed", False):
                        should_run = True
                        task["executed"] = True
                        task["enabled"] = False
                        changed = True

                elif ttype == "interval":
                    interval = trigger.get("interval_sec", 300)
                    last_run = trigger.get("last_run", 0)
                    if (now - last_run) >= interval:
                        should_run = True
                        trigger["last_run"] = now
                        changed = True

                elif ttype == "cron":
                    cron_expr = trigger.get("cron", "")
                    last_min_ts = trigger.get("last_cron_min", 0)
                    curr_min_ts = int(now // 60)
                    if curr_min_ts > last_min_ts:
                        if matches_cron(cron_expr, now_dt):
                            should_run = True
                            trigger["last_cron_min"] = curr_min_ts
                            changed = True

                elif ttype == "github_pr":
                    interval = trigger.get("interval_sec", 180)
                    last_check = trigger.get("last_check_ts", 0)
                    if (now - last_check) >= interval:
                        if check_github_repo(trigger, "pulls"):
                            should_run = True
                        changed = True

                elif ttype == "github_issue":
                    interval = trigger.get("interval_sec", 180)
                    last_check = trigger.get("last_check_ts", 0)
                    if (now - last_check) >= interval:
                        if check_github_repo(trigger, "issues"):
                            should_run = True
                        changed = True

                elif ttype == "watch_file":
                    interval = trigger.get("interval_sec", 15)
                    last_check = trigger.get("last_check_ts", 0)
                    if (now - last_check) >= interval:
                        trigger["last_check_ts"] = now
                        if check_file_watcher(trigger):
                            should_run = True
                        changed = True

                elif ttype == "battery":
                    interval = trigger.get("interval_sec", 300)
                    last_check = trigger.get("last_check_ts", 0)
                    if (now - last_check) >= interval:
                        trigger["last_check_ts"] = now
                        if check_battery_condition(trigger):
                            should_run = True
                            task["enabled"] = False
                        changed = True

                elif ttype == "webhook":
                    port = trigger.get("port", 45199)
                    if port not in webhook_threads:
                        t = threading.Thread(target=start_webhook_listener, args=(port,), daemon=True)
                        t.start()
                        webhook_threads[port] = t

                if should_run:
                    execute_action_async(task)

            if changed:
                save_tasks(tasks)

        except Exception as e:
            log(f"Daemon scheduler error: {e}")

        STOP_EVENT.wait(5)
    try:
        if read_daemon_pid() == os.getpid():
            os.unlink(PID_FILE)
    except OSError:
        pass
    log("Antigravity background micro-daemon stopped.")
