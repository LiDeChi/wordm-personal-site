#!/usr/bin/env python3
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path
from urllib.request import urlretrieve

DEFAULT_BASE_URL = "https://wordm.us"
DEFAULT_PUBLISHER_ID = "openclaw-official"
DEFAULT_PUBLISHER_IDENTITY = "deploy@openclaw.dev"
DEFAULT_PUBLISHER_ISSUER = "https://accounts.google.com"


def ensure_runtime(runtime_url: str) -> Path:
    runtime_dir = Path.home() / ".openclaw" / "bin"
    runtime_dir.mkdir(parents=True, exist_ok=True)
    runtime_path = runtime_dir / "oc_deploy.py"
    urlretrieve(runtime_url, runtime_path)  # nosec - expected trusted runtime bootstrap.
    return runtime_path


def run(cmd: list[str]) -> int:
    return subprocess.call(cmd)


def main() -> int:
    parser = argparse.ArgumentParser(description="Bootstrap a hosted project deploy manifest")
    parser.add_argument("--manifest", required=True, help="hosted manifest URL")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL, help="site origin hosting deploy assets")
    parser.add_argument("--runtime-url", default=None, help="override oc_deploy.py URL")
    parser.add_argument(
        "--action",
        default="bundle",
        choices=("auto", "verify", "bundle", "run", "full"),
        help="deploy action",
    )
    parser.add_argument("--install-dir", default=None, help="override install directory")
    parser.add_argument("--plan", action="store_true", help="show plan only")
    parser.add_argument("--allow-unsigned-local", action="store_true", help="allow unsigned local artifacts")
    parser.add_argument("--quiet", action="store_true", help="reduce output")
    args = parser.parse_args()

    base_url = args.base_url.rstrip("/")
    runtime_url = args.runtime_url or f"{base_url}/deploy/oc_deploy.py"
    runtime_path = ensure_runtime(runtime_url)

    if not args.plan:
        bind_cmd = [
            sys.executable,
            str(runtime_path),
            "trust",
            "bind",
            "--publisher-id",
            DEFAULT_PUBLISHER_ID,
            "--identity",
            DEFAULT_PUBLISHER_IDENTITY,
            "--issuer",
            DEFAULT_PUBLISHER_ISSUER,
        ]
        bind_code = run(bind_cmd)
        if bind_code != 0:
            return bind_code

    deploy_cmd = [
        sys.executable,
        str(runtime_path),
        "deploy",
        "single",
        "--manifest",
        args.manifest,
        "--action",
        args.action,
        "--non-interactive",
    ]
    if args.install_dir:
        deploy_cmd.extend(["--install-dir", args.install_dir])
    if args.plan:
        deploy_cmd.append("--plan")
    if args.allow_unsigned_local:
        deploy_cmd.append("--allow-unsigned-local")
    if args.quiet:
        deploy_cmd.append("--quiet")

    return run(deploy_cmd)


if __name__ == "__main__":
    raise SystemExit(main())
