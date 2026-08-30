param(
    [string]$Version = 'v24.19.0',
    [string]$ArchiveSha256 = '57f71ab3652e797d84acddc79c81cc9ff1c6ddb2a1974cdb83f00fee9bff4c73',
    [string]$NodeExeSha256 = '3602f2bb1a10f2cbab4c36886218a33c1ab3db87290e73b033c46c77147d0237'
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $projectRoot 'resources\runtime'
$nodePath = Join-Path $runtimeDir 'node.exe'
$licensePath = Join-Path $runtimeDir 'LICENSE.node.txt'
$expectedVersion = $Version.TrimStart('v')

function Get-Sha256([string]$Path) {
    $stream = [IO.File]::OpenRead($Path)
    try {
        $sha = [Security.Cryptography.SHA256]::Create()
        try {
            $bytes = $sha.ComputeHash($stream)
            return ([BitConverter]::ToString($bytes) -replace '-', '').ToLowerInvariant()
        }
        finally {
            $sha.Dispose()
        }
    }
    finally {
        $stream.Dispose()
    }
}

if ((Test-Path -LiteralPath $nodePath) -and (Test-Path -LiteralPath $licensePath)) {
    $installedVersion = (& $nodePath --version).Trim().TrimStart('v')
    $installedHash = Get-Sha256 $nodePath
    if ($installedVersion -eq $expectedVersion -and $installedHash -eq $NodeExeSha256.ToLowerInvariant()) {
        Write-Output "Node runtime $Version is already verified."
        exit 0
    }
}

$temporaryRoot = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
$temporaryDir = Join-Path $temporaryRoot ("beichen-pi-node-" + [guid]::NewGuid().ToString('N'))
$archiveName = "node-$Version-win-x64.zip"
$archivePath = Join-Path $temporaryDir $archiveName
$extractDir = Join-Path $temporaryDir 'extracted'
$downloadUrl = "https://nodejs.org/dist/$Version/$archiveName"

try {
    New-Item -ItemType Directory -Path $temporaryDir -Force | Out-Null
    Invoke-WebRequest -UseBasicParsing -Uri $downloadUrl -OutFile $archivePath

    $actualArchiveHash = Get-Sha256 $archivePath
    if ($actualArchiveHash -ne $ArchiveSha256.ToLowerInvariant()) {
        throw "Node archive checksum mismatch. Expected $ArchiveSha256, received $actualArchiveHash."
    }

    Expand-Archive -LiteralPath $archivePath -DestinationPath $extractDir -Force
    $distributionDir = Join-Path $extractDir "node-$Version-win-x64"
    $downloadedNode = Join-Path $distributionDir 'node.exe'
    $downloadedLicense = Join-Path $distributionDir 'LICENSE'
    if (-not (Test-Path -LiteralPath $downloadedNode) -or -not (Test-Path -LiteralPath $downloadedLicense)) {
        throw 'The official Node archive did not contain node.exe and LICENSE.'
    }

    $actualNodeHash = Get-Sha256 $downloadedNode
    if ($actualNodeHash -ne $NodeExeSha256.ToLowerInvariant()) {
        throw "Node executable checksum mismatch. Expected $NodeExeSha256, received $actualNodeHash."
    }

    $signature = Get-AuthenticodeSignature -LiteralPath $downloadedNode
    if ($signature.Status -ne 'Valid') {
        throw "Node executable signature is not valid: $($signature.Status)."
    }

    New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null
    Copy-Item -LiteralPath $downloadedNode -Destination $nodePath -Force
    Copy-Item -LiteralPath $downloadedLicense -Destination $licensePath -Force
    Write-Output "Prepared and verified Node runtime $Version."
}
finally {
    $resolvedTemporaryDir = [IO.Path]::GetFullPath($temporaryDir)
    if ($resolvedTemporaryDir.StartsWith($temporaryRoot, [StringComparison]::OrdinalIgnoreCase) -and
        [IO.Path]::GetFileName($resolvedTemporaryDir).StartsWith('beichen-pi-node-', [StringComparison]::OrdinalIgnoreCase) -and
        (Test-Path -LiteralPath $resolvedTemporaryDir)) {
        Remove-Item -LiteralPath $resolvedTemporaryDir -Recurse -Force
    }
}
