param(
    [string]$SourcePath,
    [string]$OutputPath
)

$projectRoot = Split-Path -Parent $PSScriptRoot
if (-not $SourcePath) { $SourcePath = Join-Path $projectRoot 'output\北辰标志_极简线构透明版_v8.png' }
if (-not $OutputPath) { $OutputPath = Join-Path $projectRoot 'output\北辰标志_极简双线黑洞点缀版_v9.png' }
Add-Type -AssemblyName System.Drawing

$source = [System.Drawing.Bitmap]::FromFile($SourcePath)
$output = New-Object System.Drawing.Bitmap($source.Width, $source.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graphics = [System.Drawing.Graphics]::FromImage($output)
$graphics.Clear([System.Drawing.Color]::Transparent)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
$graphics.DrawImageUnscaled($source, 0, 0)
$source.Dispose()

# A nearly hidden black-hole signature centered inside the hollow double line.
$state = $graphics.Save()
$graphics.TranslateTransform(625, 643)
$graphics.RotateTransform(44.5)

$coreBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(245, 3, 4, 10))
$orbitPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(235, 123, 38, 235), 1.55)
$glintPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(210, 205, 214, 255), 0.9)

$graphics.FillEllipse($coreBrush, -4.2, -4.2, 8.4, 8.4)
$graphics.DrawEllipse($orbitPen, -18.0, -5.0, 36.0, 10.0)
$graphics.DrawArc($glintPen, -18.0, -5.0, 36.0, 10.0, 198, 96)

$coreBrush.Dispose(); $orbitPen.Dispose(); $glintPen.Dispose()
$graphics.Restore($state)
$graphics.Dispose()

$output.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$output.Dispose()
Write-Output $OutputPath
