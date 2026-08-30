param(
    [Parameter(Mandatory = $true)]
    [string]$SourcePath,
    [string]$OutputPath
)

$projectRoot = Split-Path -Parent $PSScriptRoot
if (-not $OutputPath) { $OutputPath = Join-Path $projectRoot 'output\北辰标志_极简线构透明版_v8.png' }
Add-Type -AssemblyName System.Drawing

$source = [System.Drawing.Bitmap]::FromFile($SourcePath)
$output = New-Object System.Drawing.Bitmap($source.Width, $source.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$threshold = 18

# Keep only the neutral white/cool-gray ring elements and discard the old purple arrow.
for ($y = 0; $y -lt $source.Height; $y++) {
    for ($x = 0; $x -lt $source.Width; $x++) {
        $pixel = $source.GetPixel($x, $y)
        $maximum = [Math]::Max($pixel.R, [Math]::Max($pixel.G, $pixel.B))
        $minimum = [Math]::Min($pixel.R, [Math]::Min($pixel.G, $pixel.B))
        $chroma = $maximum - $minimum

        if ($maximum -le $threshold -or $minimum -le 55 -or $chroma -gt 52) {
            $output.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
            continue
        }

        $alpha = [Math]::Min(255, [Math]::Max(0, [Math]::Round(($maximum - $threshold) * 255.0 / (255 - $threshold))))
        $factor = 255.0 / $maximum
        $red = [Math]::Min(255, [Math]::Round($pixel.R * $factor))
        $green = [Math]::Min(255, [Math]::Round($pixel.G * $factor))
        $blue = [Math]::Min(255, [Math]::Round($pixel.B * $factor))
        $output.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $red, $green, $blue))
    }
}
$source.Dispose()

# Two exact lines, converging at both ends: proportion and negative space do all the work.
$graphics = [System.Drawing.Graphics]::FromImage($output)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

$tipA = New-Object System.Drawing.PointF(126, 152)
$tipB = New-Object System.Drawing.PointF(1124, 1134)
$midA = New-Object System.Drawing.PointF(618.3, 649.7)
$midB = New-Object System.Drawing.PointF(631.7, 636.3)

$pathA = New-Object System.Drawing.Drawing2D.GraphicsPath
$pathA.AddLines([System.Drawing.PointF[]]@($tipA, $midA, $tipB))
$pathB = New-Object System.Drawing.Drawing2D.GraphicsPath
$pathB.AddLines([System.Drawing.PointF[]]@($tipA, $midB, $tipB))

$lineA = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 112, 34, 230), 3.2)
$lineB = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 151, 48, 255), 2.6)
foreach ($pen in @($lineA, $lineB)) {
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Flat
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Flat
    $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Miter
}

$graphics.DrawPath($lineA, $pathA)
$graphics.DrawPath($lineB, $pathB)

$lineA.Dispose(); $lineB.Dispose(); $pathA.Dispose(); $pathB.Dispose(); $graphics.Dispose()
$output.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$output.Dispose()
Write-Output $OutputPath
