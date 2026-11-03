"""
daemon package for Antigravity v2 background task manager and scheduler.
"""

from .scheduler import matches_cron, parse_duration, daemon_loop
from .triggers import (
    check_github_repo,
    check_file_watcher,
    check_battery_condition,
    start_webhook_listener,
)
from .executor import (
    log,
    notify,
    wake_antigravity_app,
    execute_action_async,
    load_tasks,
    save_tasks,
    CONFIG_DIR,
    TASKS_FILE,
    LOG_FILE,
    PID_FILE,
    STOP_EVENT,
    TASK_EXECUTOR,
    RUNNING_JOBS,
    RUNNING_LOCK,
)

__all__ = [
    "matches_cron",
    "parse_duration",
    "daemon_loop",
    "check_github_repo",
    "check_file_watcher",
    "check_battery_condition",
    "start_webhook_listener",
    "log",
    "notify",
    "wake_antigravity_app",
    "execute_action_async",
    "load_tasks",
    "save_tasks",
    "CONFIG_DIR",
    "TASKS_FILE",
    "LOG_FILE",
    "PID_FILE",
    "STOP_EVENT",
    "TASK_EXECUTOR",
    "RUNNING_JOBS",
    "RUNNING_LOCK",
]
