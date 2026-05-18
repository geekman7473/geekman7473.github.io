# Agent instructions

This file gives instructions to AI coding agents working in this repo.

## Stack

- Static site built with Jekyll 4 (see [Gemfile](Gemfile) and [_config.yml](_config.yml)).
- Deployed to GitHub Pages via Actions workflow at [.github/workflows/jekyll.yml](.github/workflows/jekyll.yml).
- Pages source must be set to **GitHub Actions** in repo settings, not "Deploy from a branch".
- Custom domain `justinbecker.dev` via [CNAME](CNAME).

## Authoring

- [index.html](index.html) and [resume.html](resume.html) are hand-written HTML. [index.html](index.html) opts into Jekyll Liquid processing via an empty `---\n---` front matter block; **do not remove that block**.
- Blog posts live in [_posts/](_posts) as `YYYY-MM-DD-slug.md` with YAML front matter (`title`, `date`, `summary`).
- The retro 1998 aesthetic is intentional. Match the existing typography, borders, and color palette in [styles.css](styles.css) when adding new components.

## Images

All images added to blog posts must:

1. Be placed under `assets/img/posts/<post-slug>/`.
2. Be compressed: max dimension 1600px on the long edge, JPEG quality 82, progressive, EXIF orientation baked in, all other metadata stripped before the watermark/copyright step.
3. Carry both a **visible watermark** ("(C) justinbecker.dev" in the bottom-right corner) and **embedded copyright metadata** across EXIF, IPTC, and XMP. The metadata to embed:
   - EXIF `Artist` = `Justin Becker`
   - EXIF `Copyright` = `(C) Justin Becker - justinbecker.dev - All rights reserved`
   - IPTC `By-line`, `Credit` = `Justin Becker`
   - IPTC `Source` = `justinbecker.dev`
   - IPTC `CopyrightNotice` = same as EXIF Copyright
   - XMP `dc:creator` = `Justin Becker`
   - XMP `dc:rights` = same as EXIF Copyright
   - XMP `xmpRights:Marked` = `True`
   - XMP `xmpRights:WebStatement` = `https://justinbecker.dev/`
4. Be embedded with explicit `width`, `height`, alt text, and `loading="lazy"` (or `loading="eager"` for hero images).
5. Be wrapped in `<figure>` with a `<figcaption class="meta">` that ends with the photo date in parentheses, e.g. `(March 2026)`. Read the date from EXIF `DateTimeOriginal` of the source file when possible.

The script [scripts/prepare-post-image.ps1](scripts/prepare-post-image.ps1) does all of (2) and (3) in one pass. Use it instead of running ImageMagick / exiftool ad hoc. It requires ImageMagick (`magick`) and exiftool to be installed and on PATH.

## Dependencies

The image pipeline depends on:

- [ImageMagick 7](https://imagemagick.org) (`magick` on PATH)
- [ExifTool](https://exiftool.org) (`exiftool` on PATH, or installed to `C:\Program Files\Exiftool\`)

Install on Windows with winget:

```pwsh
winget install -e --id ImageMagick.ImageMagick
winget install -e --id OliverBetz.ExifTool
```

## Local preview

```pwsh
$env:Path = "C:\Ruby33-x64\bin;" + $env:Path
bundle exec jekyll serve --livereload --incremental
```

Open <http://127.0.0.1:4000/>.

## Don't do

- Do not strip the `---\n---` front matter from [index.html](index.html). Liquid tags in the page will be served raw if you do.
- Do not commit `_site/`, `.jekyll-cache/`, or `vendor/` (already in [.gitignore](.gitignore)).
- Do not use em dashes in blog post prose.
- Do not create a markdown file summarizing your changes unless explicitly asked.
