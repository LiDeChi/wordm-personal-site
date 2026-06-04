import fs from 'node:fs'
import path from 'node:path'

const DEFAULT_GITHUB_ROOT = '/Users/lidechi/Documents/Github'
const DEFAULT_RELEASE_REPO = 'LiDeChi/wordm-personal-site'
const DEFAULT_RELEASE_TAG = 'wordm-deploy-kits-current'

const githubRoot = process.env.GITHUB_ROOT || DEFAULT_GITHUB_ROOT
const orchestrationRoot = path.join(githubRoot, 'orchestration')
const snapshotPath = path.resolve(process.cwd(), 'src/data/projects.snapshot.json')
const deployIndexPath = process.env.DEPLOY_INDEX_PATH || path.join(orchestrationRoot, 'deploy', 'index.json')
const runtimePath = process.env.DEPLOY_RUNTIME_PATH || path.join(orchestrationRoot, 'runtime', 'oc_deploy.py')
const publicDeployRoot = path.resolve(process.cwd(), 'public', 'deploy')
const publicProjectRoot = path.join(publicDeployRoot, 'projects')
const releasesRoot = process.env.DEPLOY_RELEASES_ROOT || path.join(path.dirname(deployIndexPath), 'releases')
const releaseRepo = process.env.DEPLOY_KITS_RELEASE_REPO || DEFAULT_RELEASE_REPO
const releaseTag = process.env.DEPLOY_KITS_RELEASE_TAG || DEFAULT_RELEASE_TAG
const releaseBaseUrl = `https://github.com/${releaseRepo}/releases/download/${releaseTag}`

function ensureDir(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true })
}

function normalizeSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
}

function toNullableString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function encodeAssetName(name) {
  return encodeURIComponent(name).replace(/%2F/g, '/')
}

function buildBootstrapScript() {
  return `#!/usr/bin/env python3
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
`
}

if (!fs.existsSync(snapshotPath)) {
  console.error(`[export-deploy-kits] projects snapshot not found: ${snapshotPath}`)
  process.exit(1)
}

if (!fs.existsSync(deployIndexPath)) {
  if (fs.existsSync(path.join(publicDeployRoot, 'index.json'))) {
    console.warn(`[export-deploy-kits] deploy index not found: ${deployIndexPath}; keeping existing public/deploy assets`)
    process.exit(0)
  }

  console.error(`[export-deploy-kits] deploy index not found: ${deployIndexPath}`)
  process.exit(1)
}

if (!fs.existsSync(runtimePath)) {
  if (fs.existsSync(path.join(publicDeployRoot, 'oc_deploy.py'))) {
    console.warn(`[export-deploy-kits] runtime not found: ${runtimePath}; keeping existing public/deploy assets`)
    process.exit(0)
  }

  console.error(`[export-deploy-kits] runtime not found: ${runtimePath}`)
  process.exit(1)
}

const snapshot = loadJson(snapshotPath)
const deployIndex = loadJson(deployIndexPath)
const manifestMap = new Map()

for (const item of deployIndex.projects || []) {
  const manifestPath = path.resolve(githubRoot, item.manifest)
  if (!fs.existsSync(manifestPath)) {
    continue
  }

  const manifest = loadJson(manifestPath)
  const keyCandidates = [
    normalizeSlug(item.slug),
    normalizeSlug(manifest.slug),
    normalizeSlug(manifest.name),
  ].filter(Boolean)

  for (const key of keyCandidates) {
    if (!manifestMap.has(key)) {
      manifestMap.set(key, { manifestPath, manifest })
    }
  }
}

fs.rmSync(publicDeployRoot, { recursive: true, force: true })
ensureDir(publicProjectRoot)
fs.copyFileSync(runtimePath, path.join(publicDeployRoot, 'oc_deploy.py'))
fs.writeFileSync(path.join(publicDeployRoot, 'bootstrap.py'), buildBootstrapScript(), 'utf8')

const exported = []
const missing = []

for (const project of snapshot.projects || []) {
  const lookupKey = normalizeSlug(project.slug || project.detail?.slug || project.name)
  const entry = manifestMap.get(lookupKey)
  if (!entry) {
    missing.push({ slug: project.slug, reason: 'manifest_missing' })
    continue
  }

  const manifest = JSON.parse(JSON.stringify(entry.manifest))
  const artifacts = Array.isArray(manifest.distribution?.artifacts) ? manifest.distribution.artifacts : []

  manifest.distribution = manifest.distribution || {}
  manifest.distribution.artifacts = artifacts
    .map((artifact) => {
      const artifactName = toNullableString(artifact?.name) || toNullableString(project.detail?.artifactName)
      if (!artifactName) {
        return null
      }

      return {
        name: artifactName,
        url: `${releaseBaseUrl}/${encodeAssetName(artifactName)}`,
        sha256: toNullableString(artifact?.sha256) || 'N/A',
        sha256_snapshot: toNullableString(artifact?.sha256_snapshot) || toNullableString(project.detail?.artifactSha256Snapshot) || 'N/A',
      }
    })
    .filter(Boolean)

  const localArtifactNames = manifest.distribution.artifacts
    .map((artifact) => artifact?.name)
    .filter(Boolean)

  const missingLocalArtifacts = localArtifactNames.filter((artifactName) => !fs.existsSync(path.join(releasesRoot, artifactName)))

  const outputPath = path.join(publicProjectRoot, `${project.slug}.json`)
  fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8')

  exported.push({
    slug: project.slug,
    manifestPath: `/deploy/projects/${project.slug}.json`,
    artifactNames: localArtifactNames,
  })

  if (missingLocalArtifacts.length) {
    missing.push({
      slug: project.slug,
      reason: 'artifact_missing_locally',
      artifactNames: missingLocalArtifacts,
    })
  }
}

const indexPayload = {
  generatedAt: new Date().toISOString(),
  releaseRepo,
  releaseTag,
  releaseBaseUrl,
  count: exported.length,
  projects: exported,
  missing,
}

fs.writeFileSync(path.join(publicDeployRoot, 'index.json'), JSON.stringify(indexPayload, null, 2) + '\n', 'utf8')

console.log(`[export-deploy-kits] exported ${exported.length} manifests to ${publicProjectRoot}`)
if (missing.length) {
  console.warn(`[export-deploy-kits] ${missing.length} project(s) still need local artifacts or manifest fixes`)
}
