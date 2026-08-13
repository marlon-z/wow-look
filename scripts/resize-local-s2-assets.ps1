param(
  [Parameter(Mandatory = $true)][string]$SourceRoot,
  [Parameter(Mandatory = $true)][string]$TargetRoot
)

Add-Type -AssemblyName System.Drawing

function Ensure-ParentDirectory([string]$Path) {
  $parent = Split-Path -Parent $Path
  if (-not (Test-Path $parent)) {
    New-Item -ItemType Directory -Path $parent -Force | Out-Null
  }
}

function Save-ScaledJpeg([string]$Source, [string]$Target, [int]$MaxWidth, [long]$Quality) {
  Ensure-ParentDirectory $Target
  $sourceImage = [System.Drawing.Image]::FromFile($Source)
  try {
    $scale = [Math]::Min(1, $MaxWidth / [double]$sourceImage.Width)
    $width = [Math]::Max(1, [int][Math]::Round($sourceImage.Width * $scale))
    $height = [Math]::Max(1, [int][Math]::Round($sourceImage.Height * $scale))
    $bitmap = New-Object System.Drawing.Bitmap $width, $height, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    try {
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      try {
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.DrawImage($sourceImage, 0, 0, $width, $height)
      } finally {
        $graphics.Dispose()
      }
      $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
      $parameters = New-Object System.Drawing.Imaging.EncoderParameters 1
      $parameters.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), $Quality
      try {
        $bitmap.Save($Target, $codec, $parameters)
      } finally {
        $parameters.Dispose()
      }
    } finally {
      $bitmap.Dispose()
    }
  } finally {
    $sourceImage.Dispose()
  }
}

function Save-ScaledPng([string]$Source, [string]$Target, [int]$MaxWidth) {
  Ensure-ParentDirectory $Target
  $sourceImage = [System.Drawing.Image]::FromFile($Source)
  try {
    $scale = [Math]::Min(1, $MaxWidth / [double]$sourceImage.Width)
    $width = [Math]::Max(1, [int][Math]::Round($sourceImage.Width * $scale))
    $height = [Math]::Max(1, [int][Math]::Round($sourceImage.Height * $scale))
    $bitmap = New-Object System.Drawing.Bitmap $width, $height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      try {
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.DrawImage($sourceImage, 0, 0, $width, $height)
      } finally {
        $graphics.Dispose()
      }
      $bitmap.Save($Target, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
      $bitmap.Dispose()
    }
  } finally {
    $sourceImage.Dispose()
  }
}

Get-ChildItem (Join-Path $SourceRoot 'zhiye\banner') -Filter '*.png' -File | ForEach-Object {
  Save-ScaledJpeg $_.FullName (Join-Path $TargetRoot ("classes\banner\{0}.jpg" -f $_.BaseName)) 320 56
}

Get-ChildItem (Join-Path $SourceRoot 'zhiye\emblem') -Filter '*.png' -File | ForEach-Object {
  Save-ScaledPng $_.FullName (Join-Path $TargetRoot ("classes\emblem\{0}.png" -f $_.BaseName)) 100
}

Save-ScaledPng (Join-Path $SourceRoot 'public\logo.png') (Join-Path $TargetRoot 'public\logo.png') 520
Copy-Item (Join-Path $SourceRoot 'public\bg.jpg') (Join-Path $TargetRoot 'public\bg.jpg') -Force
