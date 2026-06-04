import type { PortfolioProject } from '../types'

export type ProjectDeployTarget = 'local' | 'remote'
export type ProjectDeployPlatform = 'mac' | 'linux' | 'windows' | 'cross_platform'

export type ProjectDeployDownloadSpec = {
  filename: string
  content: string
  mimeType: string
  label: string
}

function normalizeOrigin(origin: string): string {
  return origin.replace(/\/+$/, '')
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'"'"'`)}'`
}

function pythonQuote(value: string): string {
  return JSON.stringify(value)
}

function powershellQuote(value: string): string {
  return `'${value.replace(/'/g, "''")}'`
}

function batchQuote(value: string): string {
  return value.replace(/"/g, '""')
}

function slugPrefix(project: PortfolioProject): string {
  return project.slug.replace(/[^a-z0-9-]+/gi, '-').replace(/-{2,}/g, '-')
}

function getHostedBootstrapCommand(project: PortfolioProject, origin: string): string {
  const baseUrl = normalizeOrigin(origin)
  const manifestUrl = getProjectDeployManifestUrl(project, baseUrl)
  const bootstrapUrl = getProjectDeployBootstrapUrl(baseUrl)

  return [
    'if command -v python3 >/dev/null 2>&1; then PYTHON_BIN=python3;',
    'elif command -v python >/dev/null 2>&1; then PYTHON_BIN=python;',
    'else echo "Python 3 not found."; exit 1; fi;',
    `curl -fsSL ${shellQuote(bootstrapUrl)} | $PYTHON_BIN - --base-url ${shellQuote(baseUrl)} --manifest ${shellQuote(manifestUrl)} --action bundle`,
  ].join(' ')
}

function getRemoteHostedBootstrapCommand(project: PortfolioProject, origin: string): string {
  const baseUrl = normalizeOrigin(origin)
  const manifestUrl = getProjectDeployManifestUrl(project, baseUrl)
  const bootstrapUrl = getProjectDeployBootstrapUrl(baseUrl)

  return [
    'if command -v python3 >/dev/null 2>&1; then PYTHON_BIN=python3;',
    'elif command -v python >/dev/null 2>&1; then PYTHON_BIN=python;',
    'else echo Python 3 not found on remote host.; exit 1; fi;',
    `curl -fsSL ${shellQuote(bootstrapUrl)} | $PYTHON_BIN - --base-url ${shellQuote(baseUrl)} --manifest ${shellQuote(manifestUrl)} --action bundle`,
  ].join(' ')
}

function buildBashInstaller(project: PortfolioProject, origin: string, target: ProjectDeployTarget, withPause: boolean): string {
  const lines = ['#!/usr/bin/env bash', 'set -euo pipefail', '']

  if (target === 'remote') {
    lines.push('read -r -p "Remote host (user@host): " REMOTE_HOST')
    lines.push('if [ -z "${REMOTE_HOST}" ]; then')
    lines.push('  echo "Remote host required."')
    lines.push('  exit 1')
    lines.push('fi')
    lines.push(`ssh "\${REMOTE_HOST}" ${shellQuote(getRemoteHostedBootstrapCommand(project, origin))}`)
  } else {
    lines.push(getHostedBootstrapCommand(project, origin))
  }

  if (withPause) {
    lines.push('', 'echo', 'read -r -p "Press Enter to exit..."')
  }

  return `${lines.join('\n')}\n`
}

function buildPythonInstaller(project: PortfolioProject, origin: string, target: ProjectDeployTarget): string {
  const baseUrl = normalizeOrigin(origin)
  const manifestUrl = getProjectDeployManifestUrl(project, baseUrl)
  const bootstrapUrl = getProjectDeployBootstrapUrl(baseUrl)
  const remoteCommand = getRemoteHostedBootstrapCommand(project, baseUrl)

  const lines = [
    '#!/usr/bin/env python3',
    'from __future__ import annotations',
    '',
    'import subprocess',
    'import sys',
    'import tempfile',
    'from pathlib import Path',
    'from urllib.request import urlretrieve',
    '',
    `BOOTSTRAP_URL = ${pythonQuote(bootstrapUrl)}`,
    `BASE_URL = ${pythonQuote(baseUrl)}`,
    `MANIFEST_URL = ${pythonQuote(manifestUrl)}`,
    '',
    'def resolve_python() -> str | None:',
    '    if sys.executable:',
    '        return sys.executable',
    '    return None',
    '',
    'def main() -> int:',
    '    python_bin = resolve_python()',
    '    if not python_bin:',
    '        print("Python 3 not found.", file=sys.stderr)',
    '        return 1',
  ]

  if (target === 'remote') {
    lines.push('    remote_host = input("Remote host (user@host): ").strip()')
    lines.push('    if not remote_host:')
    lines.push('        print("Remote host required.", file=sys.stderr)')
    lines.push('        return 1')
    lines.push(`    remote_command = ${pythonQuote(remoteCommand)}`)
    lines.push('    return subprocess.call(["ssh", remote_host, remote_command])')
  } else {
    lines.push('    with tempfile.TemporaryDirectory(prefix="wordm-install-") as tmp_dir:')
    lines.push('        bootstrap_path = Path(tmp_dir) / "bootstrap.py"')
    lines.push('        urlretrieve(BOOTSTRAP_URL, bootstrap_path)')
    lines.push('        return subprocess.call([')
    lines.push('            python_bin,')
    lines.push('            str(bootstrap_path),')
    lines.push('            "--base-url",')
    lines.push('            BASE_URL,')
    lines.push('            "--manifest",')
    lines.push('            MANIFEST_URL,')
    lines.push('            "--action",')
    lines.push('            "bundle",')
    lines.push('        ])')
  }

  lines.push('', 'if __name__ == "__main__":', '    raise SystemExit(main())', '')

  return lines.join('\n')
}

function buildPowerShellInstaller(project: PortfolioProject, origin: string, target: ProjectDeployTarget): string {
  const baseUrl = normalizeOrigin(origin)
  const manifestUrl = getProjectDeployManifestUrl(project, baseUrl)
  const bootstrapUrl = getProjectDeployBootstrapUrl(baseUrl)
  const remoteCommand = getRemoteHostedBootstrapCommand(project, baseUrl)

  const lines = [
    '$ErrorActionPreference = "Stop"',
    `$BaseUrl = ${powershellQuote(baseUrl)}`,
    `$ManifestUrl = ${powershellQuote(manifestUrl)}`,
    `$BootstrapUrl = ${powershellQuote(bootstrapUrl)}`,
  ]

  if (target === 'remote') {
    lines.push('$RemoteHost = Read-Host "Remote host (user@host)"')
    lines.push('if (-not $RemoteHost) {')
    lines.push('  Write-Host "Remote host required." -ForegroundColor Red')
    lines.push('  exit 1')
    lines.push('}')
    lines.push(`$RemoteCommand = ${powershellQuote(remoteCommand)}`)
    lines.push('ssh $RemoteHost $RemoteCommand')
  } else {
    lines.push('$TmpBootstrap = Join-Path $env:TEMP "wordm-bootstrap.py"')
    lines.push('Invoke-WebRequest -Uri $BootstrapUrl -OutFile $TmpBootstrap')
    lines.push('if (Get-Command py -ErrorAction SilentlyContinue) {')
    lines.push('  py -3 $TmpBootstrap --base-url $BaseUrl --manifest $ManifestUrl --action bundle')
    lines.push('} elseif (Get-Command python -ErrorAction SilentlyContinue) {')
    lines.push('  python $TmpBootstrap --base-url $BaseUrl --manifest $ManifestUrl --action bundle')
    lines.push('} else {')
    lines.push('  Write-Host "Python 3 not found. Install Python 3 first." -ForegroundColor Red')
    lines.push('  exit 1')
    lines.push('}')
  }

  lines.push('Read-Host "Press Enter to exit"', '')
  return `${lines.join('\r\n')}`
}

function buildBatchInstaller(project: PortfolioProject, origin: string, target: ProjectDeployTarget): string {
  const baseUrl = normalizeOrigin(origin)
  const manifestUrl = getProjectDeployManifestUrl(project, baseUrl)
  const bootstrapUrl = getProjectDeployBootstrapUrl(baseUrl)
  const remoteCommand = getRemoteHostedBootstrapCommand(project, baseUrl)
  const lines = ['@echo off', 'setlocal']

  if (target === 'remote') {
    lines.push('set /p REMOTE_HOST=Remote host (user@host): ')
    lines.push('if "%REMOTE_HOST%"=="" (')
    lines.push('  echo Remote host required.')
    lines.push('  exit /b 1')
    lines.push(')')
    lines.push(`ssh "%REMOTE_HOST%" "${batchQuote(remoteCommand)}"`)
  } else {
    lines.push(`set "BOOTSTRAP_URL=${bootstrapUrl}"`)
    lines.push(`set "BASE_URL=${baseUrl}"`)
    lines.push(`set "MANIFEST_URL=${manifestUrl}"`)
    lines.push(`set "TMP_BOOTSTRAP=%TEMP%\\${slugPrefix(project)}-bootstrap.py"`)
    lines.push('curl -fsSL "%BOOTSTRAP_URL%" -o "%TMP_BOOTSTRAP%"')
    lines.push('if errorlevel 1 (')
    lines.push('  echo Failed to download bootstrap runtime.')
    lines.push('  exit /b 1')
    lines.push(')')
    lines.push('where py >nul 2>nul')
    lines.push('if %errorlevel%==0 (')
    lines.push('  py -3 "%TMP_BOOTSTRAP%" --base-url "%BASE_URL%" --manifest "%MANIFEST_URL%" --action bundle')
    lines.push('  goto :done')
    lines.push(')')
    lines.push('where python >nul 2>nul')
    lines.push('if %errorlevel%==0 (')
    lines.push('  python "%TMP_BOOTSTRAP%" --base-url "%BASE_URL%" --manifest "%MANIFEST_URL%" --action bundle')
    lines.push('  goto :done')
    lines.push(')')
    lines.push('echo Python 3 not found. Install Python 3 first.')
    lines.push('exit /b 1')
    lines.push(':done')
  }

  lines.push('pause', '')
  return lines.join('\r\n')
}

function getPlatformLabel(platform: ProjectDeployPlatform): string {
  switch (platform) {
    case 'mac':
      return 'Mac 安装器'
    case 'linux':
      return 'Linux 安装器'
    case 'windows':
      return 'Windows 安装器'
    case 'cross_platform':
      return 'Python 安装器'
  }
}

function getRemotePlatformLabel(platform: ProjectDeployPlatform): string {
  switch (platform) {
    case 'mac':
      return 'Mac 远程部署脚本'
    case 'linux':
      return 'Linux 远程部署脚本'
    case 'windows':
      return 'Windows 远程部署脚本'
    case 'cross_platform':
      return 'Python 远程部署脚本'
  }
}

export function detectProjectDeployPlatform(): ProjectDeployPlatform {
  if (typeof navigator === 'undefined') {
    return 'cross_platform'
  }

  const agent = `${navigator.userAgent} ${navigator.platform}`.toLowerCase()
  if (agent.includes('win')) {
    return 'windows'
  }
  if (agent.includes('mac') || agent.includes('darwin')) {
    return 'mac'
  }
  if (agent.includes('linux')) {
    return 'linux'
  }
  return 'cross_platform'
}

export function getProjectDeployManifestUrl(project: PortfolioProject, origin: string): string {
  return `${normalizeOrigin(origin)}/deploy/projects/${encodeURIComponent(project.slug)}.json`
}

export function getProjectDeployBootstrapUrl(origin: string): string {
  return `${normalizeOrigin(origin)}/deploy/bootstrap.py`
}

export function getProjectDeployCommand(
  project: PortfolioProject,
  origin: string,
  options?: {
    remoteHost?: string | null
  },
): string {
  const localCommand = getHostedBootstrapCommand(project, origin)
  const remoteHost = options?.remoteHost?.trim()
  if (!remoteHost) {
    return localCommand
  }

  return `ssh ${shellQuote(remoteHost)} ${shellQuote(getRemoteHostedBootstrapCommand(project, origin))}`
}

export function getProjectDeployDownloadSpec(
  project: PortfolioProject,
  origin: string,
  options?: {
    target?: ProjectDeployTarget
    platform?: ProjectDeployPlatform
  },
): ProjectDeployDownloadSpec {
  const target = options?.target ?? 'local'
  const platform = options?.platform ?? detectProjectDeployPlatform()
  const prefix = slugPrefix(project)

  if (platform === 'mac') {
    return {
      filename: target === 'remote' ? `${prefix}-remote-deploy.command` : `${prefix}-install.command`,
      content: buildBashInstaller(project, origin, target, true),
      mimeType: 'text/plain;charset=utf-8',
      label: target === 'remote' ? getRemotePlatformLabel(platform) : getPlatformLabel(platform),
    }
  }

  if (platform === 'linux') {
    return {
      filename: target === 'remote' ? `${prefix}-remote-deploy.sh` : `${prefix}-install.sh`,
      content: buildBashInstaller(project, origin, target, false),
      mimeType: 'text/x-shellscript;charset=utf-8',
      label: target === 'remote' ? getRemotePlatformLabel(platform) : getPlatformLabel(platform),
    }
  }

  if (platform === 'windows') {
    return {
      filename: target === 'remote' ? `${prefix}-remote-deploy.bat` : `${prefix}-install.bat`,
      content: buildBatchInstaller(project, origin, target),
      mimeType: 'text/plain;charset=utf-8',
      label: target === 'remote' ? getRemotePlatformLabel(platform) : getPlatformLabel(platform),
    }
  }

  return {
    filename: target === 'remote' ? `${prefix}-remote-deploy.py` : `${prefix}-install.py`,
    content: buildPythonInstaller(project, origin, target),
    mimeType: 'text/x-python;charset=utf-8',
    label: target === 'remote' ? getRemotePlatformLabel(platform) : getPlatformLabel(platform),
  }
}

export function triggerProjectDeployDownload(spec: ProjectDeployDownloadSpec): void {
  const blob = new Blob([spec.content], { type: spec.mimeType })
  const blobUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = blobUrl
  anchor.download = spec.filename
  anchor.rel = 'noreferrer'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 0)
}

export function getProjectDeployPowerShellPreview(
  project: PortfolioProject,
  origin: string,
  target: ProjectDeployTarget,
): string {
  return buildPowerShellInstaller(project, origin, target)
}
