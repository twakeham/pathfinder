#!/usr/bin/env python
"""
Pathfinder project CLI.

Usage examples:
  python scripts/pf.py backend         # run Django dev server (SQLite via DEV)
  python scripts/pf.py frontend        # run React dev server
  python scripts/pf.py dev             # run both concurrently
  python scripts/pf.py migrate         # apply DB migrations
  python scripts/pf.py makemigrations  # create migrations
  python scripts/pf.py createsuperuser # create admin user
  python scripts/pf.py install all     # install backend and frontend deps
"""
from __future__ import annotations

import argparse
import os
import importlib.util
import shutil
import signal
import subprocess
import sys
from pathlib import Path
from typing import List, Optional
import json
from urllib import request as urlrequest
from urllib import error as urlerror

# Paths
ROOT_DIR: Path = Path(__file__).resolve().parents[1]
BACKEND_DIR: Path = ROOT_DIR / "backend"
FRONTEND_DIR: Path = ROOT_DIR / "frontend"
VENV_PY_WIN: Path = ROOT_DIR / ".venv" / "Scripts" / "python.exe"
VENV_PY_POSIX: Path = ROOT_DIR / ".venv" / "bin" / "python"


def get_python_exe() -> str:
    if os.name == "nt" and VENV_PY_WIN.exists():
        return str(VENV_PY_WIN)
    if VENV_PY_POSIX.exists():
        return str(VENV_PY_POSIX)
    return shutil.which("python") or "python"


def run(cmd: List[str], cwd: Optional[Path] = None, env: Optional[dict] = None) -> int:
    merged_env = os.environ.copy()
    if env:
        merged_env.update(env)
    proc = subprocess.Popen(cmd, cwd=str(cwd) if cwd else None, env=merged_env)
    try:
        return proc.wait()
    except KeyboardInterrupt:
        try:
            if os.name == "nt":
                proc.send_signal(signal.CTRL_BREAK_EVENT)
            else:
                proc.terminate()
        except Exception:
            pass
        return 130


def run_parallel(cmds: List[List[str]], cwds: List[Optional[Path]], envs: List[Optional[dict]]) -> int:
    procs: list[subprocess.Popen] = []
    try:
        for cmd, cwd, env in zip(cmds, cwds, envs):
            merged_env = os.environ.copy()
            if env:
                merged_env.update(env)
            procs.append(
                subprocess.Popen(cmd, cwd=str(cwd) if cwd else None, env=merged_env)
            )
        # Wait for any to exit; if one exits non-zero, terminate others
        exit_code = 0
        while procs:
            for p in list(procs):
                ret = p.poll()
                if ret is not None:
                    exit_code = ret
                    procs.remove(p)
                    for other in procs:
                        try:
                            if os.name == "nt":
                                other.send_signal(signal.CTRL_BREAK_EVENT)
                            else:
                                other.terminate()
                        except Exception:
                            pass
                    return exit_code
        return exit_code
    except KeyboardInterrupt:
        for p in procs:
            try:
                if os.name == "nt":
                    p.send_signal(signal.CTRL_BREAK_EVENT)
                else:
                    p.terminate()
            except Exception:
                pass
        return 130


def daphne_installed() -> bool:
    """Return True if Daphne is importable in the current environment."""
    return importlib.util.find_spec("daphne") is not None


def cmd_backend(args: argparse.Namespace) -> int:
    py = get_python_exe()
    env = {"DJANGO_DEV": "1"} if args.dev else None
    return run([py, "manage.py", "runserver"], cwd=BACKEND_DIR, env=env)


def cmd_frontend(_: argparse.Namespace) -> int:
    npm = shutil.which("npm") or "npm"
    return run([npm, "start"], cwd=FRONTEND_DIR)


def cmd_dev(_: argparse.Namespace) -> int:
    py = get_python_exe()
    npm = shutil.which("npm") or "npm"
    cmds = [[py, "manage.py", "runserver"], [npm, "start"]]
    cwds = [BACKEND_DIR, FRONTEND_DIR]
    envs = [{"DJANGO_DEV": "1"}, None]
    return run_parallel(cmds, cwds, envs)


def cmd_migrate(_: argparse.Namespace) -> int:
    py = get_python_exe()
    return run([py, "manage.py", "migrate"], cwd=BACKEND_DIR)


def cmd_makemigrations(_: argparse.Namespace) -> int:
    py = get_python_exe()
    return run([py, "manage.py", "makemigrations"], cwd=BACKEND_DIR)


def cmd_createsuperuser(_: argparse.Namespace) -> int:
    py = get_python_exe()
    return run([py, "manage.py", "createsuperuser"], cwd=BACKEND_DIR)


def cmd_install(args: argparse.Namespace) -> int:
    code = 0
    if args.target in ("backend", "all"):
        py = get_python_exe()
        code = run([py, "-m", "pip", "install", "-r", "requirements.txt"], cwd=BACKEND_DIR)
        if code:
            return code
    if args.target in ("frontend", "all"):
        npm = shutil.which("npm") or "npm"
        code = run([npm, "install"], cwd=FRONTEND_DIR)
    return code


def cmd_run_daphne(args: argparse.Namespace) -> int:
    """Run the backend using Daphne (ASGI server)."""
    if not daphne_installed():
        print("Daphne is not installed in this venv. Install it with:")
        print(r"  .\.venv\Scripts\pip install daphne")
        return 1

    py = get_python_exe()
    cmd: List[str] = [
        py,
        "-m",
        "daphne",
        "-b",
        args.host,
        "-p",
        str(args.port),
        "--access-log",
        "-",
    ]
    if args.reload:
        # Daphne doesn't support --reload; keep flag for UX parity and warn only.
        print("[info] --reload is not supported by Daphne; ignoring. Use pf backend for autoreload.")
    cmd.append("config.asgi:application")

    return run(cmd, cwd=BACKEND_DIR)


def cmd_dev_daphne(args: argparse.Namespace) -> int:
    """Run backend via Daphne and frontend concurrently."""
    if not daphne_installed():
        print("Daphne is not installed in this venv. Install it with:")
        print(r"  .\.venv\Scripts\pip install daphne")
        return 1

    py = get_python_exe()
    npm = shutil.which("npm") or "npm"

    daphne_cmd: List[str] = [
        py,
        "-m",
        "daphne",
        "-b",
        args.host,
        "-p",
        str(args.port),
        "--access-log",
        "-",
        "config.asgi:application",
    ]

    cmds = [daphne_cmd, [npm, "start"]]
    cwds = [BACKEND_DIR, FRONTEND_DIR]
    # Point CRA frontend to backend WS host:port
    fe_ws_host = f"localhost:{args.port}"
    envs = [
        {"DJANGO_DEV": "1"},
        {"REACT_APP_BACKEND_WS": fe_ws_host},
    ]
    return run_parallel(cmds, cwds, envs)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="pf", description="Pathfinder project CLI")
    sub = parser.add_subparsers(dest="command", required=True)

    p_backend = sub.add_parser("backend", help="Run Django dev server")
    p_backend.add_argument("--dev", action="store_true", help="Set DJANGO_DEV=1 for SQLite")
    p_backend.set_defaults(func=cmd_backend)

    p_frontend = sub.add_parser("frontend", help="Run React dev server")
    p_frontend.set_defaults(func=cmd_frontend)

    p_dev = sub.add_parser("dev", help="Run backend and frontend concurrently")
    p_dev.set_defaults(func=cmd_dev)

    p_migrate = sub.add_parser("migrate", help="Apply database migrations")
    p_migrate.set_defaults(func=cmd_migrate)

    p_mkm = sub.add_parser("makemigrations", help="Create new migrations")
    p_mkm.set_defaults(func=cmd_makemigrations)

    p_csu = sub.add_parser("createsuperuser", help="Create a Django superuser")
    p_csu.set_defaults(func=cmd_createsuperuser)

    p_install = sub.add_parser("install", help="Install dependencies")
    p_install.add_argument("target", choices=["backend", "frontend", "all"], default="all", nargs="?")
    p_install.set_defaults(func=cmd_install)

    # Run backend on Daphne (ASGI)
    p_daphne = sub.add_parser("run-daphne", help="Run backend via Daphne (ASGI)")
    p_daphne.add_argument("-H", "--host", default="0.0.0.0", help="Bind host (default: 0.0.0.0)")
    p_daphne.add_argument("-p", "--port", type=int, default=8000, help="Port (default: 8000)")
    p_daphne.add_argument("--reload", action="store_true", help="Auto-reload on code changes (dev)")
    p_daphne.set_defaults(func=cmd_run_daphne)

    # Dev with Daphne + Frontend
    p_dev_d = sub.add_parser("dev-daphne", help="Run Daphne (ASGI) backend and frontend concurrently")
    p_dev_d.add_argument("-H", "--host", default="0.0.0.0", help="Bind host (default: 0.0.0.0)")
    p_dev_d.add_argument("-p", "--port", type=int, default=8000, help="Backend port (default: 8000)")
    p_dev_d.set_defaults(func=cmd_dev_daphne)

    p_test = sub.add_parser("test-chat", help="Smoke test chat + AI backend (auth, create conversation, generate reply)")
    p_test.add_argument("--baseurl", "-b", default="http://127.0.0.1:8000", help="Backend base URL (default: %(default)s)")
    p_test.add_argument("--username", "-u", help="Username for JWT auth (required)")
    p_test.add_argument("--password", "-p", help="Password for JWT auth (required)")
    p_test.add_argument("--content", "-c", default="Hello from CLI", help="Prompt to send to generate endpoint")
    p_test.add_argument("--title", default="CLI Test Conversation", help="Conversation title")
    p_test.add_argument("--provider", choices=["echo", "openai"], help="Force provider for generate (overrides server default)")
    p_test.set_defaults(func=cmd_test_chat)

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    return args.func(args)


def _http_json(method: str, url: str, body: Optional[dict] = None, headers: Optional[dict] = None) -> tuple[int, dict]:
    data = None
    if body is not None:
        data = json.dumps(body).encode("utf-8")
    req = urlrequest.Request(url=url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if headers:
        for k, v in headers.items():
            req.add_header(k, v)
    try:
        with urlrequest.urlopen(req) as resp:
            status = resp.getcode() or 0
            content = resp.read().decode("utf-8") or "{}"
            try:
                return status, json.loads(content)
            except json.JSONDecodeError:
                return status, {"raw": content}
    except urlerror.HTTPError as e:
        content = e.read().decode("utf-8") if hasattr(e, "read") else ""
        try:
            return e.code, json.loads(content)
        except Exception:
            return e.code, {"error": content or str(e)}
    except urlerror.URLError as e:
        return 0, {"error": str(e)}


def cmd_test_chat(args: argparse.Namespace) -> int:
    base = args.baseurl.rstrip("/")
    user = args.username or os.environ.get("PF_USERNAME")
    pwd = args.password or os.environ.get("PF_PASSWORD")
    if not user or not pwd:
        print("Username and password are required. Pass --username/--password or set PF_USERNAME/PF_PASSWORD.")
        return 2

    # 1) Token
    status, tok = _http_json("POST", f"{base}/api/auth/token/", {"username": user, "password": pwd})
    if status != 200 or "access" not in tok:
        print("Auth failed:", status, tok)
        return 1
    headers = {"Authorization": f"Bearer {tok['access']}"}
    print("✓ Auth OK")

    # 2) Create conversation
    status, conv = _http_json("POST", f"{base}/api/chat/conversations/", {"title": args.title}, headers)
    if status not in (200, 201) or "id" not in conv:
        print("Create conversation failed:", status, conv)
        return 1
    conv_id = conv["id"]
    print(f"✓ Conversation created: {conv_id}")

    # 3) Generate reply
    url = f"{base}/api/chat/conversations/{conv_id}/generate/"
    if args.provider:
        url += f"?provider={args.provider}"
    status, gen = _http_json("POST", url, {"content": args.content}, headers)
    if status not in (200, 201):
        print("Generate failed:", status, gen)
        return 1
    assistant = (gen.get("assistant") or {}).get("content") or gen.get("content")
    print("✓ Assistant reply:\n", assistant)

    # 4) Fetch messages
    status, msgs = _http_json("GET", f"{base}/api/chat/conversations/{conv_id}/messages", None, headers)
    if status == 200:
        print(f"✓ Messages count: {len(msgs) if isinstance(msgs, list) else 'n/a'}")
    else:
        print("Fetch messages warned:", status)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
