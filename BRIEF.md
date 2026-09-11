# MD-Blocks — Authoring Brief

Canonical spec: [md-blocks-spec.md](md-blocks-spec.md) (v1.3, locked) — read it when you need depth;
[demo/showcase.md](demo/showcase.md) is the tutorial.

One example with every feature:

````md
---
title: Aurora Desk                    ← YAML frontmatter = document metadata + document data
---

<!-- mb:main id=deck -->                ← a main: the chrome scope (§4.5). One per document by default
<!-- mb:block repeat=header -->         ← chrome, authored ONCE: the renderer repeats it per slide
Aurora Desk · Product Group
<!-- mb:/block -->

# Any heading is content

Plain Markdown needs no markup. The file starts inside section 1.

<!-- mb:block preset=card:note -->     ← block: a movable, presentable unit
Anything Markdown — paragraphs, lists, tables, code.
<!-- mb:/block -->

<!-- mb:block preset=image:hero -->    ← first node is an image → media block
![Alt text](images/hero.svg)

Text after the image is its caption.
<!-- mb:/block -->

---                                    ← root-level rule = next section (= one slide)

<!-- mb:section preset=band -->        ← optional: annotate the section just opened

<!-- mb:columns weights=[2,1] -->      ← column count = number of col markers
<!-- mb:col -->
Left column.
<!-- mb:col preset=card -->
Right column.
<!-- mb:/columns -->

<!-- mb:var name=slideshow -->         ← named data for this section
```json
{ "loop": false, "secondsPerSlide": 12 }
```
````
Six directives, each an HTML comment alone on its line at column 0: `mb:main` (a **break** — it
  ends where the next one begins), `mb:section`, `mb:block`…`mb:/block`, `mb:columns`/`mb:col`…`mb:/columns`
  (`mb:/col` is accepted), `mb:var`. Any other comment is ignored.
- **`main` is the chrome scope**: the unit a renderer turns into surfaces (one section = one slide;
  pages when printed) and the unit that owns the header/footer. A document has exactly one main
  unless it writes a marker, so write one only when the chrome changes part-way — a title sequence
  with no chrome, a closing slide with a different footer. `mb:/main` does not exist; it is an error.
- **Chrome is a block with `repeat`**: `<!-- mb:block repeat=header -->` … `<!-- mb:/block -->`, and
  `repeat=footer`. Author it once, at the top of the main; the renderer repeats it onto every surface.
  Several blocks may share a slot — the first sizes the strip, the rest overlay it in source order.
- Attributes on the opening line only: `key=word`, `key="with spaces"`, `key=12`, `key=[2,1]`
  (strict JSON). Shared optional attributes: `id`, `label`, `preset`. No `class` / `style` / `width` —
  presentation lives in the renderer's preset table.
- **Blocks** hold Markdown only — no nested blocks, columns, or vars — and are always closed.
  A `---` inside a block is an `<hr>`, not a section break.
- **Media blocks:** a block whose first node is a single image (or a flat list of images, or a link
  ending in a media extension) is media; everything after that node is the caption. `kind`
  (`image` / `video` / `audio` / `file`) is inferred when omitted. An image later in a block is just
  an inline image.
- **Columns:** number of `col` markers = column count (min 2); `weights` must have exactly that many
  entries. Columns hold Markdown and blocks, never sections or vars.
- **Vars:** section-level named data — either `value=` inline or one fenced `json` / `text` block
  immediately following (blank lines only between var and fence). Document-level data goes in
  frontmatter.
- **Sections:** root-level `---` separates them; surround it with blank lines (directly under a
  paragraph line it becomes a setext H2). Each section is one slide for a slideshow renderer.
- `preset` is a semantic hint: `family[:modifier[:variant]]` — e.g. `card:warning`,
  `image:hero:bleed`, `gallery:mosaic`. Unknown presets render plain with a warning, never an error.
- When in doubt, author plain Markdown — unannotated content is valid. Add directives only for
  structure the layout needs.
