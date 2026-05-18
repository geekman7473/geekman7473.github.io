<#
.SYNOPSIS
    Prepare a photo for inclusion in a blog post: resize, compress, watermark,
    and embed copyright metadata across EXIF, IPTC, and XMP.

.DESCRIPTION
    Takes one or more source images and a destination directory (typically
    assets/img/posts/<slug>/). For each source it:

        1. Resizes so the long edge is at most -MaxDim (default 1600 px).
        2. Re-encodes as progressive JPEG, quality 82, chroma subsampled.
        3. Auto-orients via EXIF and strips all source metadata.
        4. Burns a small "(C) justinbecker.dev" watermark in the bottom-right.
        5. Re-embeds copyright info in EXIF, IPTC, and XMP.

    The original file is never modified. The EXIF DateTimeOriginal of the
    source is preserved and printed so you can use it in your figcaption.

    Requires ImageMagick (`magick`) and exiftool on PATH.

.PARAMETER Source
    One or more paths to source images.

.PARAMETER Dest
    Destination directory. Will be created if it doesn't exist.

.PARAMETER Name
    Optional list of base filenames (without extension), one per source. If
    omitted, source filenames are kept (lowercased, .jpg).

.PARAMETER MaxDim
    Maximum pixel length on the long edge. Default 1600.

.PARAMETER Quality
    JPEG quality. Default 82.

.PARAMETER NoWatermark
    Skip the visible watermark step (metadata is still embedded).

.EXAMPLE
    .\scripts\prepare-post-image.ps1 `
        -Source "C:\Users\geekm\Downloads\IMG_0001.JPG" `
        -Dest   "assets\img\posts\2026-05-16-why-i-built-lanbucket" `
        -Name   "2026-03-recent"

.EXAMPLE
    Get-ChildItem C:\Users\geekm\Downloads\IMG_*.JPG | `
      .\scripts\prepare-post-image.ps1 -Dest assets\img\posts\my-slug
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory, ValueFromPipeline)]
    [string[]] $Source,

    [Parameter(Mandatory)]
    [string] $Dest,

    [string[]] $Name,

    [int] $MaxDim = 1600,

    [int] $Quality = 82,

    [switch] $NoWatermark
)

begin {
    $ErrorActionPreference = 'Stop'

    # Make exiftool reachable if installed to its default location.
    if (-not (Get-Command exiftool -ErrorAction SilentlyContinue)) {
        $candidate = 'C:\Program Files\Exiftool'
        if (Test-Path $candidate) { $env:Path += ";$candidate" }
    }

    foreach ($tool in 'magick','exiftool') {
        if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
            throw "$tool not found on PATH. See AGENTS.md for install instructions."
        }
    }

    New-Item -ItemType Directory -Force -Path $Dest | Out-Null
    $copyrightLine = '(C) Justin Becker - justinbecker.dev - All rights reserved'
    $allSources = @()
    $i = 0
}

process {
    foreach ($s in $Source) { $allSources += $s }
}

end {
    for ($i = 0; $i -lt $allSources.Count; $i++) {
        $src = (Resolve-Path $allSources[$i]).Path
        if ($Name -and $i -lt $Name.Count) {
            $base = $Name[$i]
        } else {
            $base = [System.IO.Path]::GetFileNameWithoutExtension($src).ToLower()
        }
        $out = Join-Path $Dest "$base.jpg"

        # Read EXIF date from source (best effort).
        $exifDate = (& magick identify -format "%[EXIF:DateTimeOriginal]" $src) 2>$null

        # Step 1-3: resize, re-encode, strip metadata.
        & magick $src `
            -auto-orient `
            -resize "${MaxDim}x${MaxDim}>" `
            -strip `
            -sampling-factor 4:2:0 `
            -interlace JPEG `
            -quality $Quality `
            $out

        # Step 4: visible watermark.
        if (-not $NoWatermark) {
            # Draw a 1px dark shadow then the white text over it for legibility.
            & magick $out `
                -gravity southeast `
                -pointsize 22 `
                -fill 'rgba(0,0,0,0.55)' -annotate +9+8 '(C) justinbecker.dev' `
                -fill 'rgba(255,255,255,0.85)' -annotate +10+9 '(C) justinbecker.dev' `
                $out
        }

        # Step 5: re-embed copyright across EXIF / IPTC / XMP.
        & exiftool -overwrite_original -P `
            "-EXIF:Artist=Justin Becker" `
            "-EXIF:Copyright=$copyrightLine" `
            "-IPTC:By-line=Justin Becker" `
            "-IPTC:CopyrightNotice=$copyrightLine" `
            "-IPTC:Credit=Justin Becker" `
            "-IPTC:Source=justinbecker.dev" `
            "-XMP-dc:Creator=Justin Becker" `
            "-XMP-dc:Rights=$copyrightLine" `
            "-XMP-xmpRights:Marked=True" `
            "-XMP-xmpRights:WebStatement=https://justinbecker.dev/" `
            $out | Out-Null

        $dim = & magick identify -format '%wx%h' $out
        $sz  = (Get-Item $out).Length
        [PSCustomObject]@{
            Output    = $out
            Dimensions= $dim
            BytesKB   = [math]::Round($sz / 1KB, 1)
            ExifDate  = $exifDate
        }
    }
}
