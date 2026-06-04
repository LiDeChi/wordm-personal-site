# Local Font Assets

`ai-stroke-writer` will try to use `Brightmaths` for English glyph rendering first.

To enable bundled Brightmaths loading (static + dynamic mapper), place the font file here:

- `assets/fonts/Brightmaths-Regular.ttf`

If this file is missing, runtime automatically falls back to existing bundled fonts.
Static rendering may still use a system-installed `Brightmaths` font through `local(...)` lookup.
