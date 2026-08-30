param(
    [Parameter(Mandatory = $true)]
    [string]$SourcePath,
    [string]$OutputPath
)

$projectRoot = Split-Path -Parent $PSScriptRoot
if (-not $OutputPath) { $OutputPath = Join-Path $projectRoot 'output\北辰标志_非对称锋锐环透明版_v5.png' }
Add-Type -AssemblyName System.Drawing

$source = [System.Drawing.Bitmap]::FromFile($sourcePath)
$output = New-Object System.Drawing.Bitmap($source.Width, $source.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

for ($y = 0; $y -lt $source.Height; $y++) {
    for ($x = 0; $x -lt $source.Width; $x++) {
        $pixel = $source.GetPixel($x, $y)
        $maximum = [Math]::Max($pixel.R, [Math]::Max($pixel.G, $pixel.B))

        $blackThreshold = 24
        if ($maximum -le $blackThreshold) {
            $output.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
            continue
        }

        # Undo compositing over black: the brightest channel estimates coverage.
        $alpha = [Math]::Min(255, [Math]::Max(0, [Math]::Round(($maximum - $blackThreshold) * 255.0 / (255 - $blackThreshold))))
        $factor = 255.0 / $maximum
        $red = [Math]::Min(255, [Math]::Round($pixel.R * $factor))
        $green = [Math]::Min(255, [Math]::Round($pixel.G * $factor))
        $blue = [Math]::Min(255, [Math]::Round($pixel.B * $factor))
        $output.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $red, $green, $blue))
    }
}

$source.Dispose()
$output.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$output.Dispose()
Write-Output $outputPath
