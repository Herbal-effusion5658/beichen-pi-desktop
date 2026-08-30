param(
    [string]$SourcePath,
    [string]$OutputPath
)

$projectRoot = Split-Path -Parent $PSScriptRoot
if (-not $SourcePath) { $SourcePath = Join-Path $projectRoot 'output\北辰标志_极简线构透明版_v8.png' }
if (-not $OutputPath) { $OutputPath = Join-Path $projectRoot 'output\北辰标志_极简漩涡聚焦版_v10.png' }
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

# Slightly strengthen only the central portion of the two-line blade.
$emphasisA = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(135, 120, 36, 240), 4.1)
$emphasisB = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(125, 164, 62, 255), 3.5)
foreach ($pen in @($emphasisA, $emphasisB)) {
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
}
$graphics.DrawLine($emphasisA, 520, 550, 722, 748)
$graphics.DrawLine($emphasisB, 528, 536, 730, 734)
$emphasisA.Dispose(); $emphasisB.Dispose()

# Compact open spiral: enough to read as a vortex, small enough to remain a detail.
$centerX = 625.0
$centerY = 643.0
$rotation = 0.78
$pointCount = 120
$points = New-Object System.Drawing.PointF[] $pointCount
for ($i = 0; $i -lt $pointCount; $i++) {
    $theta = ($i / ($pointCount - 1.0)) * 4.0 * [Math]::PI
    $radius = 2.0 + 1.52 * $theta
    $angle = $theta + $rotation
    $x = $centerX + $radius * [Math]::Cos($angle)
    $y = $centerY + $radius * [Math]::Sin($angle)
    $points[$i] = New-Object System.Drawing.PointF([single]$x, [single]$y)
}

$spiralPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$spiralPath.AddLines($points)
$spiralBase = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(245, 72, 18, 176), 3.0)
$spiralLight = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(235, 150, 58, 255), 1.15)
$spiralBase.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$spiralBase.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$spiralLight.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$spiralLight.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$graphics.DrawPath($spiralBase, $spiralPath)
$graphics.DrawPath($spiralLight, $spiralPath)

$coreBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(250, 2, 3, 9))
$graphics.FillEllipse($coreBrush, 619.8, 637.8, 10.4, 10.4)
$glintBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(230, 226, 230, 255))
$graphics.FillEllipse($glintBrush, 640.0, 627.0, 3.2, 3.2)

$spiralPath.Dispose(); $spiralBase.Dispose(); $spiralLight.Dispose(); $coreBrush.Dispose(); $glintBrush.Dispose()
$graphics.Dispose()

$output.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$output.Dispose()
Write-Output $OutputPath
