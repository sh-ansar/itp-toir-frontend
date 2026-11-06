# Deploy only the public MRO frontend on WIN-487ME2E68DR.
# Source: C:/deploy/toir-portal-port-20261105/frontend (isolated feature worktree).
# Leaves Portal, HRM, Inventory, MRO backend and production database untouched.
[CmdletBinding()]
param(
  [string]$Source = 'C:/deploy/toir-portal-port-20261105/frontend',
  [string]$Ops = 'C:/deploy/toir-portal-port-20261105',
  [string]$Python = 'C:/Python311/python.exe',
  [string]$Npm = 'C:/Program Files/nodejs/npm.cmd'
)
$ErrorActionPreference = 'Stop'
$branch = 'feature/mro-portal-commercial-public-20261105'
$prod = 'C:/deploy/toir/site/current'
if (-not (Test-Path "$Source/.git")) { throw "MRO source checkout missing: $Source" }
if (-not (Test-Path "$Source/node_modules/@itpmining/vue-basic-components")) {
  throw 'MRO shared UI package is not installed locally. Do not replace with mocks.'
}
if (-not (Test-Path "$Ops/deploy-mro-ui-parity.py")) {
  throw 'Known MRO-only release/backup script missing.'
}
if (-not (Test-Path "$prod/index.html")) { throw 'MRO production target unavailable.' }
if (-not (Test-Path $Python) -or -not (Test-Path $Npm)) {
  throw 'Required Python or npm executable unavailable.'
}
Push-Location $Source
$oldBase = $env:VITE_BASE_PATH
try {
  $current = (& git branch --show-current).Trim()
  if ($LASTEXITCODE -ne 0 -or $current -ne $branch) {
    throw "Unexpected MRO source branch: $current"
  }
  $dirty = & git status --porcelain
  if ($LASTEXITCODE -ne 0 -or $dirty) { throw 'MRO source worktree is not clean.' }
  & git fetch origin $branch
  if ($LASTEXITCODE -ne 0) { throw 'Cannot fetch the isolated MRO feature branch.' }
  & git merge --ff-only "origin/$branch"
  if ($LASTEXITCODE -ne 0) { throw 'Non-fast-forward update refused.' }
  & $Npm run check:hero
  if ($LASTEXITCODE -ne 0) { throw 'MRO interactive hero contract failed.' }
  & $Npm run check:ui
  if ($LASTEXITCODE -ne 0) { throw 'MRO UI contract failed.' }
  $env:VITE_BASE_PATH = '/mro/'
  & $Npm run build
  if ($LASTEXITCODE -ne 0) { throw 'MRO frontend typecheck/build failed.' }

  # The existing helper backs up MRO only and swaps index.html atomically.
  $deployOutput = (& $Python "$Ops/deploy-mro-ui-parity.py" 2>&1 | Out-String).Trim()
  if ($LASTEXITCODE -ne 0) { throw "MRO-only deploy failed: $deployOutput" }
  $released = $deployOutput | ConvertFrom-Json
  if ($released.result -ne 'MRO_UI_DEPLOYED' -or -not $released.backup) {
    throw "MRO release helper returned an unexpected result: $deployOutput"
  }
  Write-Output "MRO_RELEASED backup=$($released.backup)"
  $snapshot = Join-Path 'C:/deploy/toir/backups' $released.backup

  try {
    & $Python "$Source/scripts/qa-mro-live-hero.py"
    if ($LASTEXITCODE -ne 0) { throw 'Authenticated browser smoke of the public MRO demo failed.' }
    Write-Output 'MRO_LIVE_HERO_ACCEPTANCE_PASS'
  }
  catch {
    if (Test-Path "$snapshot/index.html") {
      # Restore only the old MRO index. Previous hashed assets remain present.
      $temp = Join-Path $prod 'index.html.mro-rollback'
      Copy-Item -LiteralPath "$snapshot/index.html" -Destination $temp -Force
      [System.IO.File]::Replace($temp, (Join-Path $prod 'index.html'), $null)
      Write-Output 'MRO_FRONTEND_INDEX_ROLLED_BACK'
    }
    throw
  }
}
finally {
  $env:VITE_BASE_PATH = $oldBase
  Pop-Location
}
