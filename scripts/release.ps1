[CmdletBinding()]
param(
  [switch]$CheckOnly
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repoRoot

$remoteHost = if ($env:EAGLECODER_DEPLOY_HOST) { $env:EAGLECODER_DEPLOY_HOST } else { '43.135.51.209' }
$remotePort = if ($env:EAGLECODER_DEPLOY_PORT) { [int]$env:EAGLECODER_DEPLOY_PORT } else { 22222 }
$remoteUser = if ($env:EAGLECODER_DEPLOY_USER) { $env:EAGLECODER_DEPLOY_USER } else { 'root' }
$remotePath = if ($env:EAGLECODER_DEPLOY_PATH) { $env:EAGLECODER_DEPLOY_PATH } else { '/www/wwwroot/eaglecoder.cn' }
$domain = if ($env:EAGLECODER_DEPLOY_DOMAIN) { $env:EAGLECODER_DEPLOY_DOMAIN } else { 'eaglecoder.cn' }
$deployKey = if ($env:EAGLECODER_DEPLOY_KEY) { $env:EAGLECODER_DEPLOY_KEY } else { Join-Path $env:USERPROFILE '.ssh\id_ed25519' }

function Invoke-Native {
  param(
    [Parameter(Mandatory)] [string]$FilePath,
    [Parameter()] [string[]]$Arguments = @()
  )

  & $FilePath @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed ($LASTEXITCODE): $FilePath $($Arguments -join ' ')"
  }
}

function Get-NativePath {
  param([Parameter(Mandatory)] [string]$Name)

  $command = Get-Command $Name -ErrorAction SilentlyContinue
  if (-not $command) {
    throw "Required command not found: $Name. Install Git for Windows or OpenSSH."
  }
  return $command.Source
}

if ($remotePath -notmatch '^/[A-Za-z0-9._/-]+$') {
  throw "Deployment path contains unsupported characters: $remotePath"
}

$git = Get-NativePath 'git.exe'
$npm = Get-NativePath 'npm.cmd'
$ssh = Get-NativePath 'ssh.exe'
$scp = Get-NativePath 'scp.exe'
$tar = Get-NativePath 'tar.exe'

$branch = (& $git branch --show-current).Trim()
if ($branch -ne 'master') {
  throw "Release must run from master. Current branch: $branch"
}

$dirtyFiles = @(& $git status --porcelain)
if ($dirtyFiles.Count -gt 0) {
  throw "Working tree is not clean. Commit or stash these changes first:`n$($dirtyFiles -join "`n")"
}

Write-Host 'Fetching origin/master...' -ForegroundColor Cyan
Invoke-Native $git @('fetch', 'origin', 'master')
$localHead = (& $git rev-parse HEAD).Trim()
$remoteHead = (& $git rev-parse origin/master).Trim()
if ($localHead -ne $remoteHead) {
  throw "Local master is not synchronized with origin/master. Run: git pull --ff-only origin master"
}

$sshOptions = @('-p', "$remotePort", '-i', $deployKey, '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=accept-new')
$remoteLogin = "${remoteUser}@${remoteHost}"
Write-Host 'Testing server connection...' -ForegroundColor Cyan
Invoke-Native $ssh ($sshOptions + @($remoteLogin, 'echo ok'))

if ($CheckOnly) {
  Write-Host 'Pre-release checks passed (no build or upload performed).' -ForegroundColor Green
  exit 0
}

try {
  Write-Host 'Running verification and production build...' -ForegroundColor Cyan
  $previousTelemetry = $env:ASTRO_TELEMETRY_DISABLED
  $env:ASTRO_TELEMETRY_DISABLED = '1'
  try {
    Invoke-Native $npm @('run', 'verify')
  } finally {
    if ($null -eq $previousTelemetry) {
      Remove-Item Env:ASTRO_TELEMETRY_DISABLED -ErrorAction SilentlyContinue
    } else {
      $env:ASTRO_TELEMETRY_DISABLED = $previousTelemetry
    }
  }

  $deployId = [Guid]::NewGuid().ToString('N')
  $artifact = Join-Path ([IO.Path]::GetTempPath()) "eaglecoder-site-$deployId.tar.gz"
  $remoteArchive = "/tmp/eaglecoder-site-$deployId.tar.gz"
  $remoteStage = "/tmp/eaglecoder-site-$deployId"

  try {
    Write-Host 'Packaging static files...' -ForegroundColor Cyan
    Invoke-Native $tar @('-czf', $artifact, '-C', (Join-Path $repoRoot 'dist'), '.')

    Write-Host 'Uploading and atomically replacing the online static directory...' -ForegroundColor Cyan
    Invoke-Native $scp ($sshOptions + @($artifact, "${remoteLogin}:$remoteArchive"))
    $remoteCommand = "set -eu; rm -rf -- $remoteStage; mkdir -p $remoteStage; tar -xzf $remoteArchive -C $remoteStage; mkdir -p $remotePath; find $remotePath -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +; cp -a $remoteStage/. $remotePath/; test -s $remotePath/index.html; rm -rf -- $remoteStage $remoteArchive"
    Invoke-Native $ssh ($sshOptions + @($remoteLogin, $remoteCommand))
  } finally {
    if (Test-Path -LiteralPath $artifact) {
      Remove-Item -LiteralPath $artifact -Force
    }
  }

  Write-Host 'Checking the online response...' -ForegroundColor Cyan
  $response = Invoke-WebRequest -Uri "https://$domain/" -UseBasicParsing -TimeoutSec 20
  if ($response.StatusCode -ne 200 -or $response.Content -notmatch 'EagleCoder') {
    throw "Online smoke check failed: HTTP $($response.StatusCode)"
  }

  Write-Host "Deployment completed: https://$domain/" -ForegroundColor Green
} catch {
  Write-Error $_
  exit 1
}
