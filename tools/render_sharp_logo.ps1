param([string]$OutputPath)

$projectRoot = Split-Path -Parent $PSScriptRoot
if (-not $OutputPath) { $OutputPath = Join-Path $projectRoot 'output\北辰标志_锋锐断环透明版_v4.png' }
Add-Type -AssemblyName System.Drawing

$scale = 3
$size = 1254
$canvas = $size * $scale

$bitmap = New-Object System.Drawing.Bitmap($canvas, $canvas, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.Clear([System.Drawing.Color]::Transparent)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

function S([double]$value) { return [single]($value * $scale) }

# Broken circular barrier: two precise arcs with narrow diagonal cuts.
$ringRect = New-Object System.Drawing.RectangleF((S 262), (S 262), (S 730), (S 730))
$ringPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 250, 251, 255), (S 56))
$ringPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Flat
$ringPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Flat
$ringPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Miter
$graphics.DrawArc($ringPen, $ringRect, [single]52, [single]166)
$graphics.DrawArc($ringPen, $ringRect, [single]232, [single]166)

# Thin cool edge accents keep the white ring bright without creating a glow.
$edgePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(150, 210, 217, 235), (S 2.2))
$edgePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Flat
$edgePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Flat
$graphics.DrawArc($edgePen, $ringRect, [single]52, [single]166)
$graphics.DrawArc($edgePen, $ringRect, [single]232, [single]166)

# Original double-ended arrow rebuilt as a narrow diagonal blade.
$u = 0.7071067811865476
$nX = -$u
$nY = $u
$p1x = 145.0; $p1y = 145.0
$p2x = 1109.0; $p2y = 1109.0
$headLength = 150.0
$headHalfWidth = 73.0
$shaftHalfWidth = 17.0
$b1x = $p1x + $u * $headLength; $b1y = $p1y + $u * $headLength
$b2x = $p2x - $u * $headLength; $b2y = $p2y - $u * $headLength

$coords = @(
    @($p1x, $p1y),
    @(($b1x + $nX*$headHalfWidth), ($b1y + $nY*$headHalfWidth)),
    @(($b1x + $nX*$shaftHalfWidth), ($b1y + $nY*$shaftHalfWidth)),
    @(($b2x + $nX*$shaftHalfWidth), ($b2y + $nY*$shaftHalfWidth)),
    @(($b2x + $nX*$headHalfWidth), ($b2y + $nY*$headHalfWidth)),
    @($p2x, $p2y),
    @(($b2x - $nX*$headHalfWidth), ($b2y - $nY*$headHalfWidth)),
    @(($b2x - $nX*$shaftHalfWidth), ($b2y - $nY*$shaftHalfWidth)),
    @(($b1x - $nX*$shaftHalfWidth), ($b1y - $nY*$shaftHalfWidth)),
    @(($b1x - $nX*$headHalfWidth), ($b1y - $nY*$headHalfWidth))
)
$points = New-Object System.Drawing.PointF[] $coords.Count
for ($i = 0; $i -lt $coords.Count; $i++) {
    $points[$i] = New-Object System.Drawing.PointF((S $coords[$i][0]), (S $coords[$i][1]))
}
$gradientStart = New-Object System.Drawing.PointF((S $p1x), (S $p1y))
$gradientEnd = New-Object System.Drawing.PointF((S $p2x), (S $p2y))
$arrowBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $gradientStart,
    $gradientEnd,
    [System.Drawing.Color]::FromArgb(255, 116, 42, 255),
    [System.Drawing.Color]::FromArgb(255, 86, 17, 224)
)
$graphics.FillPolygon($arrowBrush, $points)
$arrowOutline = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(210, 65, 10, 180), (S 1.5))
$arrowOutline.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Miter
$graphics.DrawPolygon($arrowOutline, $points)

# One restrained sharp detail inside the lower-left arc.
$diamond = [System.Drawing.PointF[]]@(
    (New-Object System.Drawing.PointF((S 406), (S 782))),
    (New-Object System.Drawing.PointF((S 424), (S 800))),
    (New-Object System.Drawing.PointF((S 406), (S 818))),
    (New-Object System.Drawing.PointF((S 388), (S 800)))
)
$diamondBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(235, 250, 251, 255))
$graphics.FillPolygon($diamondBrush, $diamond)

$graphics.Dispose()
$ringPen.Dispose(); $edgePen.Dispose(); $arrowBrush.Dispose(); $arrowOutline.Dispose(); $diamondBrush.Dispose()

# Supersampled downscale for clean antialiased edges.
$final = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$finalGraphics = [System.Drawing.Graphics]::FromImage($final)
$finalGraphics.Clear([System.Drawing.Color]::Transparent)
$finalGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$finalGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$finalGraphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$finalGraphics.DrawImage($bitmap, 0, 0, $size, $size)
$finalGraphics.Dispose()
$bitmap.Dispose()

$final.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$final.Dispose()
Write-Output $OutputPath
