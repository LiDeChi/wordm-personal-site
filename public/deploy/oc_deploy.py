#!/usr/bin/env python3
"""OpenClaw trusted deploy runtime.

Implements one-time publisher trust and non-interactive deploy flows for:
- single project manifest
- bundle manifest that references multiple project manifests
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import shlex
import shutil
import subprocess
import sys
import tarfile
import tempfile
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path, PurePosixPath
from typing import Any
from urllib.parse import urlparse
from urllib.request import urlretrieve


DEFAULT_PUBLISHER_ID = "openclaw-official"
DEFAULT_CERT_IDENTITY = "deploy@openclaw.dev"
DEFAULT_CERT_ISSUER = "https://accounts.google.com"
APP_DIR = Path.home() / ".openclaw"
TRUST_FILE = APP_DIR / "trust" / "publishers.json"
LOG_DIR = APP_DIR / "logs"
CACHE_DIR = APP_DIR / "cache"


def now_iso() -> str:
    return datetime.now(UTC).isoformat()


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def load_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def dump_json(path: Path, payload: Any) -> None:
    ensure_parent(path)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def log_event(event: dict[str, Any]) -> None:
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    log_file = LOG_DIR / f"deploy-{datetime.now(UTC).strftime('%Y%m%d')}.jsonl"
    row = {"time": now_iso(), **event}
    with log_file.open("a", encoding="utf-8") as f:
        f.write(json.dumps(row, ensure_ascii=False) + "\n")


def shell_run(command: str, *, cwd: Path, stream: bool) -> int:
    env = os.environ.copy()
    if stream:
        proc = subprocess.run(command, cwd=str(cwd), shell=True, check=False, env=env)
    else:
        proc = subprocess.run(
            command,
            cwd=str(cwd),
            shell=True,
            check=False,
            capture_output=True,
            text=True,
            env=env,
        )
        if proc.stdout.strip():
            print(proc.stdout.rstrip())
        if proc.stderr.strip():
            print(proc.stderr.rstrip(), file=sys.stderr)
    return proc.returncode


def command_real(value: str | None) -> bool:
    return bool(value and value.strip() and value.strip() != "N/A")


def detect_root_from_manifest(manifest_path: Path) -> Path:
    # Expected manifest layout: <root>/orchestration/deploy/projects/<slug>/manifest.json
    parts = manifest_path.resolve().parts
    for idx in range(len(parts) - 1, -1, -1):
        if parts[idx] == "orchestration":
            return Path(*parts[:idx])
    # Fallback: 4 levels up from project kit dir.
    return manifest_path.resolve().parents[4]


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def should_exclude(rel: Path, excludes: set[str]) -> bool:
    if any(part in excludes for part in rel.parts):
        return True
    return rel.name.endswith(".log") or rel.name.endswith(".tmp")


@dataclass
class PublisherTrust:
    publisher_id: str
    identity: str
    issuer: str
    trust_mode: str
    signature_scheme: str
    trusted_at: str
    revoked: bool
    source: str


class TrustStore:
    def __init__(self, path: Path = TRUST_FILE) -> None:
        self.path = path
        self.payload = load_json(path, {"version": 1, "publishers": []})
        if "version" not in self.payload:
            self.payload["version"] = 1
        if "publishers" not in self.payload:
            self.payload["publishers"] = []

    def save(self) -> None:
        dump_json(self.path, self.payload)

    def list_publishers(self) -> list[PublisherTrust]:
        items: list[PublisherTrust] = []
        for row in self.payload.get("publishers", []):
            items.append(
                PublisherTrust(
                    publisher_id=row.get("publisher_id", ""),
                    identity=row.get("identity", DEFAULT_CERT_IDENTITY),
                    issuer=row.get("issuer", DEFAULT_CERT_ISSUER),
                    trust_mode=row.get("trust_mode", "publisher_signature_once"),
                    signature_scheme=row.get("signature_scheme", "sigstore_cosign"),
                    trusted_at=row.get("trusted_at", ""),
                    revoked=bool(row.get("revoked", False)),
                    source=row.get("source", "manual"),
                )
            )
        return items

    def get(self, publisher_id: str) -> PublisherTrust | None:
        for item in self.list_publishers():
            if item.publisher_id == publisher_id:
                return item
        return None

    def is_trusted(self, publisher_id: str) -> bool:
        item = self.get(publisher_id)
        return bool(item and not item.revoked)

    def bind(
        self,
        *,
        publisher_id: str,
        identity: str,
        issuer: str,
        trust_mode: str,
        signature_scheme: str,
        source: str,
    ) -> None:
        rows: list[dict[str, Any]] = self.payload["publishers"]
        now = now_iso()
        for row in rows:
            if row.get("publisher_id") == publisher_id:
                row.update(
                    {
                        "identity": identity,
                        "issuer": issuer,
                        "trust_mode": trust_mode,
                        "signature_scheme": signature_scheme,
                        "trusted_at": now,
                        "revoked": False,
                        "source": source,
                    }
                )
                self.save()
                return

        rows.append(
            {
                "publisher_id": publisher_id,
                "identity": identity,
                "issuer": issuer,
                "trust_mode": trust_mode,
                "signature_scheme": signature_scheme,
                "trusted_at": now,
                "revoked": False,
                "source": source,
            }
        )
        self.save()

    def revoke(self, publisher_id: str) -> bool:
        rows: list[dict[str, Any]] = self.payload["publishers"]
        for row in rows:
            if row.get("publisher_id") == publisher_id:
                row["revoked"] = True
                row["revoked_at"] = now_iso()
                self.save()
                return True
        return False


def resolve_publisher_meta(manifest: dict[str, Any]) -> dict[str, str]:
    publisher = manifest.get("publisher", {})
    return {
        "publisher_id": publisher.get("publisher_id", manifest.get("publisher_id", DEFAULT_PUBLISHER_ID)),
        "identity": publisher.get("certificate_identity", DEFAULT_CERT_IDENTITY),
        "issuer": publisher.get("certificate_oidc_issuer", DEFAULT_CERT_ISSUER),
        "trust_mode": publisher.get("trust_mode", "publisher_signature_once"),
        "signature_scheme": publisher.get("signature_scheme", "sigstore_cosign"),
    }


def download_if_url(ref: str) -> Path:
    parsed = urlparse(ref)
    if parsed.scheme in {"http", "https"}:
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        suffix = Path(parsed.path).name or "artifact.bin"
        tmp = Path(tempfile.mkstemp(prefix="ocd-", suffix=f"-{suffix}", dir=str(CACHE_DIR))[1])
        urlretrieve(ref, tmp)  # nosec - expected direct artifact download in deploy workflow.
        return tmp
    return Path(ref)


def is_url_ref(ref: str) -> bool:
    parsed = urlparse(ref)
    return parsed.scheme in {"http", "https"}


def resolve_ref_path(ref: str, *, base_dir: Path) -> Path:
    if is_url_ref(ref):
        return download_if_url(ref)
    return (base_dir / ref).resolve()


def has_artifact_refs(manifest: dict[str, Any]) -> bool:
    for item in manifest.get("distribution", {}).get("artifacts", []):
        if item.get("url") or item.get("path"):
            return True
    return False


def safe_extract_tar(archive: Path, *, target_dir: Path) -> None:
    target_dir = target_dir.resolve()
    with tarfile.open(archive, "r:*") as tar:
        safe_members: list[tarfile.TarInfo] = []
        for member in tar.getmembers():
            destination = (target_dir / member.name).resolve()
            if os.path.commonpath([str(target_dir), str(destination)]) != str(target_dir):
                raise RuntimeError(f"unsafe archive member path: {member.name}")
            if member.issym() or member.islnk():
                link = PurePosixPath(member.linkname)
                if link.is_absolute() or ".." in link.parts:
                    print(f"[warn] skipped unsafe link in archive: {member.name} -> {member.linkname}")
                    continue
            safe_members.append(member)
        tar.extractall(path=target_dir, members=safe_members, filter="fully_trusted")


def install_artifacts_from_manifest(
    manifest: dict[str, Any],
    *,
    manifest_path: Path,
    install_dir: Path | None,
) -> int:
    artifacts = manifest.get("distribution", {}).get("artifacts", [])
    if not artifacts:
        print("[skip] no artifacts found in manifest")
        return 2

    target_base = (install_dir or (APP_DIR / "apps")).expanduser().resolve()
    target_base.mkdir(parents=True, exist_ok=True)

    installed = 0
    failed = 0
    for item in artifacts:
        ref = item.get("url") or item.get("path")
        if not ref:
            continue
        artifact_path = resolve_ref_path(str(ref), base_dir=manifest_path.parent)
        if not artifact_path.exists():
            print(f"[error] artifact missing: {artifact_path}")
            failed += 1
            continue

        name = str(item.get("name") or artifact_path.name)
        if name.endswith((".tar.gz", ".tgz", ".tar")):
            print(f"[step] extracting archive: {name}")
            safe_extract_tar(artifact_path, target_dir=target_base)
            installed += 1
            continue

        out = target_base / artifact_path.name
        shutil.copy2(artifact_path, out)
        print(f"[step] copied artifact: {out}")
        installed += 1

    if failed > 0:
        print(f"[error] artifact install failed: installed={installed} failed={failed}")
        return 2

    print(f"[ok] artifacts installed: {installed}")
    print(f"[ok] install_dir: {target_base}")
    return 0


def verify_cosign_blob(
    *,
    artifact: Path,
    signature: Path | None,
    bundle: Path | None,
    identity: str,
    issuer: str,
) -> tuple[bool, str]:
    if not shutil_which("cosign"):
        return False, "cosign not found in PATH"
    cmd = ["cosign", "verify-blob", str(artifact)]
    if signature and signature.exists():
        cmd.extend(["--signature", str(signature)])
    if bundle and bundle.exists():
        cmd.extend(["--bundle", str(bundle)])
    cmd.extend(["--certificate-identity", identity, "--certificate-oidc-issuer", issuer])
    proc = subprocess.run(cmd, capture_output=True, text=True, check=False)
    if proc.returncode == 0:
        return True, "cosign verify-blob ok"
    message = proc.stderr.strip() or proc.stdout.strip() or "cosign verify failed"
    return False, message


def shutil_which(binary: str) -> str | None:
    for folder in os.environ.get("PATH", "").split(os.pathsep):
        path = Path(folder) / binary
        if path.exists() and os.access(path, os.X_OK):
            return str(path)
    return None


def create_bundle_from_manifest(manifest: dict[str, Any], *, root: Path, manifest_path: Path) -> Path:
    project_path = manifest.get("path", "")
    slug = manifest.get("slug") or manifest.get("name", "project")
    if not project_path:
        raise RuntimeError("manifest.path is empty")

    excludes = set(
        manifest.get("distribution", {}).get(
            "exclude",
            [
                ".git",
                "node_modules",
                ".venv",
                "venv",
                "__pycache__",
                ".pytest_cache",
                ".mypy_cache",
                ".ruff_cache",
                ".next",
                "dist",
                "build",
                "target",
                "DerivedData",
            ],
        )
    )

    out = root / "orchestration" / "deploy" / "releases" / f"{slug}.tar.gz"
    out.parent.mkdir(parents=True, exist_ok=True)
    if out.exists():
        out.unlink()

    project_root = root / project_path
    with tarfile.open(out, "w:gz") as tar:
        for node in [project_root] + list(project_root.rglob("*")):
            rel = node.relative_to(root)
            if should_exclude(rel, excludes):
                continue
            tar.add(node, arcname=str(rel), recursive=False)

    digest = sha256_file(out)
    print(f"[ok] bundle created: {out}")
    print(f"[ok] bundle sha256: {digest}")
    log_event(
        {
            "event": "bundle_created",
            "manifest": str(manifest_path),
            "bundle": str(out),
            "sha256": digest,
        }
    )
    return out


def select_verify_command(commands: dict[str, str]) -> str:
    for key in ("test", "build", "lint"):
        value = commands.get(key, "N/A")
        if command_real(value):
            return value
    return "N/A"


def print_single_plan(manifest: dict[str, Any], *, trusted: bool) -> None:
    commands = manifest.get("commands", {})
    publisher_meta = resolve_publisher_meta(manifest)
    verify_cmd = select_verify_command(commands)
    print("==== Trusted Deploy Plan ====")
    print(f"project: {manifest.get('name')} ({manifest.get('status')})")
    print(f"publisher: {publisher_meta['publisher_id']}")
    print(f"trusted: {'yes' if trusted else 'no'}")
    print("")
    print("Commands:")
    print(f"- run:   {commands.get('run', 'N/A')}")
    print(f"- build: {commands.get('build', 'N/A')}")
    print(f"- test:  {commands.get('test', 'N/A')}")
    print(f"- lint:  {commands.get('lint', 'N/A')}")
    print("")
    print("Execution:")
    print(f"1. verify: {verify_cmd}")
    print("2. bundle: create/reuse release archive")
    print("3. run: optional")
    print("=============================")


def resolve_manifest(path_or_url: str, *, base_dir: Path | None = None) -> tuple[dict[str, Any], Path]:
    parsed = urlparse(path_or_url)
    if parsed.scheme in {"http", "https"}:
        downloaded = download_if_url(path_or_url)
        return json.loads(downloaded.read_text(encoding="utf-8")), downloaded

    raw = Path(path_or_url)
    if not raw.is_absolute() and base_dir:
        raw = (base_dir / raw).resolve()
    else:
        raw = raw.resolve()
    return json.loads(raw.read_text(encoding="utf-8")), raw


def verify_artifacts(
    manifest: dict[str, Any],
    *,
    manifest_path: Path,
    trusted_identity: str,
    trusted_issuer: str,
    non_interactive: bool,
    allow_unsigned_local: bool,
) -> bool:
    distribution = manifest.get("distribution", {})
    artifacts = distribution.get("artifacts", [])
    all_ok = True
    for item in artifacts:
        ref = item.get("url") or item.get("path")
        if not ref:
            continue
        artifact_path = resolve_ref_path(str(ref), base_dir=manifest_path.parent)

        if not artifact_path.exists():
            print(f"[warn] artifact not found: {artifact_path}")
            all_ok = False
            continue

        expected = item.get("sha256", "N/A")
        if expected != "N/A":
            actual = sha256_file(artifact_path)
            if actual != expected:
                print(f"[error] sha256 mismatch for {artifact_path.name}")
                print(f"expected={expected}")
                print(f"actual={actual}")
                all_ok = False
                continue
            print(f"[ok] sha256 verified: {artifact_path.name}")

        signature = item.get("signature", {})
        required = bool(signature.get("required", False))
        if not signature:
            if required and not allow_unsigned_local:
                print(f"[error] signature required but missing: {artifact_path.name}")
                all_ok = False
            elif required:
                print(f"[warn] signature required but bypassed by allow_unsigned_local: {artifact_path.name}")
            continue

        sig_path = None
        bundle_path = None
        if signature.get("signature"):
            sig_path = resolve_ref_path(str(signature["signature"]), base_dir=manifest_path.parent)
        if signature.get("bundle"):
            bundle_path = resolve_ref_path(str(signature["bundle"]), base_dir=manifest_path.parent)

        ok, detail = verify_cosign_blob(
            artifact=artifact_path,
            signature=sig_path,
            bundle=bundle_path,
            identity=trusted_identity,
            issuer=trusted_issuer,
        )
        if ok:
            print(f"[ok] signature verified: {artifact_path.name}")
        else:
            if required and not allow_unsigned_local:
                print(f"[error] signature verification failed: {artifact_path.name} ({detail})")
                all_ok = False
            else:
                print(f"[warn] signature check skipped/fail tolerated: {artifact_path.name} ({detail})")

    return all_ok


def run_deploy_action(
    *,
    manifest: dict[str, Any],
    manifest_path: Path,
    root: Path,
    action: str,
    stream: bool,
    install_dir: Path | None,
) -> int:
    kit_dir = manifest_path.parent
    deploy_script = kit_dir / "deploy.sh"
    commands = manifest.get("commands", {})

    def run_cmd(cmd: str) -> int:
        if not command_real(cmd):
            return 2
        print(f"[step] running: {cmd}")
        return shell_run(cmd, cwd=root, stream=stream)

    if action == "verify":
        if not deploy_script.exists() and has_artifact_refs(manifest):
            print("[skip] source verify command not applicable for artifact-only deployment")
            return 0
        verify_cmd = select_verify_command(commands)
        if verify_cmd == "N/A":
            print("[skip] verify command not available")
            return 0
        return run_cmd(verify_cmd)

    if action == "bundle":
        if deploy_script.exists():
            cmd = f"bash {shlex.quote(str(deploy_script))} bundle"
            return shell_run(cmd, cwd=root, stream=stream)
        if has_artifact_refs(manifest):
            return install_artifacts_from_manifest(
                manifest,
                manifest_path=manifest_path,
                install_dir=install_dir,
            )
        create_bundle_from_manifest(manifest, root=root, manifest_path=manifest_path)
        return 0

    if action == "run":
        run_cmd_raw = commands.get("run", "N/A")
        if run_cmd_raw == "N/A":
            print("[skip] run command not available")
            return 0
        return run_cmd(run_cmd_raw)

    if action == "full":
        verify_code = run_deploy_action(
            manifest=manifest,
            manifest_path=manifest_path,
            root=root,
            action="verify",
            stream=stream,
            install_dir=install_dir,
        )
        if verify_code != 0:
            return verify_code
        bundle_code = run_deploy_action(
            manifest=manifest,
            manifest_path=manifest_path,
            root=root,
            action="bundle",
            stream=stream,
            install_dir=install_dir,
        )
        if bundle_code != 0:
            return bundle_code
        return run_deploy_action(
            manifest=manifest,
            manifest_path=manifest_path,
            root=root,
            action="run",
            stream=stream,
            install_dir=install_dir,
        )

    if action == "auto":
        verify_code = run_deploy_action(
            manifest=manifest,
            manifest_path=manifest_path,
            root=root,
            action="verify",
            stream=stream,
            install_dir=install_dir,
        )
        if verify_code not in {0, 2}:
            return verify_code
        return run_deploy_action(
            manifest=manifest,
            manifest_path=manifest_path,
            root=root,
            action="bundle",
            stream=stream,
            install_dir=install_dir,
        )

    raise RuntimeError(f"unsupported action: {action}")


def deploy_single(args: argparse.Namespace) -> int:
    manifest, manifest_path = resolve_manifest(args.manifest)
    root = detect_root_from_manifest(manifest_path)
    install_dir = args.install_dir.expanduser().resolve() if args.install_dir else None
    publisher_meta = resolve_publisher_meta(manifest)
    trust = TrustStore()
    trusted = trust.get(publisher_meta["publisher_id"])

    if args.plan:
        print_single_plan(manifest, trusted=bool(trusted and not trusted.revoked))
        return 0

    if not trusted or trusted.revoked:
        print("[error] publisher is not trusted on this machine.")
        print("Run one-time trust bind first:")
        print(
            "python3 orchestration/runtime/oc_deploy.py trust bind "
            f"--publisher-id {publisher_meta['publisher_id']} "
            f"--identity {publisher_meta['identity']} "
            f"--issuer {publisher_meta['issuer']}"
        )
        return 2

    if not verify_artifacts(
        manifest,
        manifest_path=manifest_path,
        trusted_identity=trusted.identity,
        trusted_issuer=trusted.issuer,
        non_interactive=args.non_interactive,
        allow_unsigned_local=args.allow_unsigned_local,
    ):
        log_event(
            {
                "event": "deploy_rejected",
                "mode": "single",
                "manifest": str(manifest_path),
                "reason": "artifact_or_signature_verification_failed",
                "publisher_id": trusted.publisher_id,
            }
        )
        return 2

    code = run_deploy_action(
        manifest=manifest,
        manifest_path=manifest_path,
        root=root,
        action=args.action,
        stream=not args.quiet,
        install_dir=install_dir,
    )
    log_event(
        {
            "event": "deploy_single",
            "mode": "single",
            "manifest": str(manifest_path),
            "project": manifest.get("name"),
            "publisher_id": trusted.publisher_id,
            "action": args.action,
            "exit_code": code,
        }
    )
    return code


def deploy_bundle(args: argparse.Namespace) -> int:
    bundle_manifest, bundle_path = resolve_manifest(args.manifest)
    base_dir = bundle_path.parent
    install_dir = args.install_dir.expanduser().resolve() if args.install_dir else None
    publisher_meta = resolve_publisher_meta(bundle_manifest)
    trust = TrustStore()
    trusted = trust.get(publisher_meta["publisher_id"])

    if args.plan:
        print(f"bundle: {bundle_manifest.get('name', bundle_path.name)}")
        print(f"publisher: {publisher_meta['publisher_id']}")
        print(f"trusted: {'yes' if trusted and not trusted.revoked else 'no'}")
        print(f"items: {len(bundle_manifest.get('items', []))}")
        return 0

    if not trusted or trusted.revoked:
        print("[error] publisher is not trusted on this machine.")
        print("Run one-time trust bind first.")
        return 2

    failed = 0
    for item in bundle_manifest.get("items", []):
        manifest_ref = item.get("manifest")
        if not manifest_ref:
            continue
        manifest_ref_str = str(manifest_ref)
        if is_url_ref(manifest_ref_str):
            single_manifest = manifest_ref_str
        else:
            single_manifest = str((base_dir / manifest_ref_str).resolve())
        print(f"[bundle] deploying {item.get('name', manifest_ref)}")
        single_args = argparse.Namespace(
            manifest=single_manifest,
            action=args.action,
            non_interactive=args.non_interactive,
            allow_unsigned_local=args.allow_unsigned_local,
            plan=False,
            quiet=args.quiet,
            install_dir=install_dir,
        )
        code = deploy_single(single_args)
        if code != 0:
            failed += 1

    log_event(
        {
            "event": "deploy_bundle",
            "mode": "bundle",
            "manifest": str(bundle_path),
            "publisher_id": trusted.publisher_id,
            "failed": failed,
        }
    )
    return 0 if failed == 0 else 2


def parse_trust_token(args: argparse.Namespace) -> dict[str, Any]:
    if args.token_file:
        payload = json.loads(Path(args.token_file).read_text(encoding="utf-8"))
    elif args.token_json:
        payload = json.loads(args.token_json)
    else:
        payload = {}
    if payload and "identity" not in payload and payload.get("certificate_identity"):
        payload["identity"] = payload["certificate_identity"]
    if payload and "issuer" not in payload and payload.get("certificate_oidc_issuer"):
        payload["issuer"] = payload["certificate_oidc_issuer"]
    return payload


def trust_bind(args: argparse.Namespace) -> int:
    token = parse_trust_token(args)
    publisher_id = token.get("publisher_id", args.publisher_id or DEFAULT_PUBLISHER_ID)
    identity = token.get("identity", args.identity or DEFAULT_CERT_IDENTITY)
    issuer = token.get("issuer", args.issuer or DEFAULT_CERT_ISSUER)
    trust_mode = token.get("trust_mode", "publisher_signature_once")
    signature_scheme = token.get("signature_scheme", "sigstore_cosign")
    source = "web_token" if token else "manual"

    trust = TrustStore()
    trust.bind(
        publisher_id=publisher_id,
        identity=identity,
        issuer=issuer,
        trust_mode=trust_mode,
        signature_scheme=signature_scheme,
        source=source,
    )
    print(f"[ok] trusted publisher bound: {publisher_id}")
    log_event(
        {
            "event": "trust_bind",
            "publisher_id": publisher_id,
            "identity": identity,
            "issuer": issuer,
            "source": source,
        }
    )
    return 0


def trust_list(_: argparse.Namespace) -> int:
    trust = TrustStore()
    items = trust.list_publishers()
    if not items:
        print("No trusted publishers.")
        return 0
    for item in items:
        print(
            f"{item.publisher_id}\tidentity={item.identity}\tissuer={item.issuer}\t"
            f"revoked={'yes' if item.revoked else 'no'}\ttrusted_at={item.trusted_at}"
        )
    return 0


def trust_revoke(args: argparse.Namespace) -> int:
    trust = TrustStore()
    ok = trust.revoke(args.publisher_id)
    if not ok:
        print(f"[error] publisher not found: {args.publisher_id}")
        return 2
    print(f"[ok] revoked publisher: {args.publisher_id}")
    log_event({"event": "trust_revoke", "publisher_id": args.publisher_id})
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="OpenClaw trusted deploy runtime")
    sub = parser.add_subparsers(dest="command", required=True)

    trust = sub.add_parser("trust", help="publisher trust operations")
    trust_sub = trust.add_subparsers(dest="trust_cmd", required=True)

    bind = trust_sub.add_parser("bind", help="bind one-time publisher trust")
    bind.add_argument("--publisher-id", default=DEFAULT_PUBLISHER_ID)
    bind.add_argument("--identity", default=DEFAULT_CERT_IDENTITY)
    bind.add_argument("--issuer", default=DEFAULT_CERT_ISSUER)
    bind.add_argument("--token-file", default=None, help="optional web trust token JSON file")
    bind.add_argument("--token-json", default=None, help="optional inline trust token JSON")
    bind.set_defaults(func=trust_bind)

    lst = trust_sub.add_parser("list", help="list trusted publishers")
    lst.set_defaults(func=trust_list)

    revoke = trust_sub.add_parser("revoke", help="revoke publisher trust")
    revoke.add_argument("--publisher-id", required=True)
    revoke.set_defaults(func=trust_revoke)

    deploy = sub.add_parser("deploy", help="deploy from signed/trusted manifests")
    deploy_sub = deploy.add_subparsers(dest="deploy_cmd", required=True)

    single = deploy_sub.add_parser("single", help="deploy a single project manifest")
    single.add_argument("--manifest", required=True, help="project manifest path or URL")
    single.add_argument(
        "--action",
        default="auto",
        choices=("auto", "verify", "bundle", "run", "full"),
        help="deploy action",
    )
    single.add_argument("--non-interactive", action="store_true", default=False)
    single.add_argument("--install-dir", type=Path, default=None, help="install target base directory")
    single.add_argument("--allow-unsigned-local", action="store_true", default=False)
    single.add_argument("--plan", action="store_true", help="show plan only")
    single.add_argument("--quiet", action="store_true", help="reduce streamed command output")
    single.set_defaults(func=deploy_single)

    bundle = deploy_sub.add_parser("bundle", help="deploy from a bundle manifest")
    bundle.add_argument("--manifest", required=True, help="bundle manifest path or URL")
    bundle.add_argument(
        "--action",
        default="auto",
        choices=("auto", "verify", "bundle", "run", "full"),
    )
    bundle.add_argument("--non-interactive", action="store_true", default=False)
    bundle.add_argument("--install-dir", type=Path, default=None, help="install target base directory")
    bundle.add_argument("--allow-unsigned-local", action="store_true", default=False)
    bundle.add_argument("--plan", action="store_true")
    bundle.add_argument("--quiet", action="store_true")
    bundle.set_defaults(func=deploy_bundle)

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
