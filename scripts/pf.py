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
import shutil
import signal
import subprocess
import sys
from pathlib import Path
from typing import List, Optional

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

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
