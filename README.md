# MD-Blocks

**Structured documents in pure Markdown.** MD-Blocks is an enhanced Markdown authoring format:
sections, movable blocks, columns, media, and named data — expressed through YAML frontmatter and
invisible HTML comments, so the source stays ordinary, readable CommonMark.

> MDX and Markdoc put code in your Markdown. MD-Blocks puts structure in comments and leaves the
> Markdown alone.

```md
---
title: Aurora Desk
year: 2026
---

# Any heading is content

Plain Markdown is content. No markup needed.

<!-- mb:block preset=hero -->
![Alt text](images/hero.svg)

Text after the image is its caption.
<!-- mb:/block -->

---                              ← next section (= next slide)

<!-- mb:columns weights=[2,1] -->
<!-- mb:col -->
Left.
<!-- mb:col preset=card -->
Right.
<!-- mb:/columns -->

<!-- mb:var name=seconds value=12 -->
```

- **Readable** — the source reads like a normal document, not like scaffolding.
- **Portable** — GitHub, VS Code, and Obsidian render it pleasantly; the structural markers are
  invisible comments.
- **LLM-emitable** — guessable from one example, no spec lookup required
  ([measured](_Archive/test-runs/REPORT.md): three model tiers authored valid documents from the
  showcase alone).
- **Editor-safe** — a visual block editor can round-trip it losslessly; what the round-trip needs is
  written in the file, never guessed.

## What it's for

Two rendering targets, one format, no special casing:

- **Documents & webpages** — sections, blocks, and columns compose into block-level page layouts.
- **Slideshows** — each section is one slide; a slideshow renderer is a page renderer with one
  section per viewport.

The audience: **LLMs maintain MD-Blocks documents** (source readability is LLM-first; programmers
can read it too), and **tooling makes the edit experience easy for users**. The intended editor is
deliberately *not* a Word clone — it abstracts layout complexity by reducing capabilities to the
90% of what people actually need from a document.

Each section is one slide for a slideshow renderer, and a themed region for a page renderer.

## Documents

- **[md-blocks-spec.md](md-blocks-spec.md)** — the format specification (v1, adopted 2026-09-10)
- **[DECISIONS.md](DECISIONS.md)** — why the format looks this way: the proposals, the biased
  ranking, and the experiments that settled it
- **[demo/showcase.md](demo/showcase.md)** — the tutorial: every construct in one document
- **[demo/aurora-deck.md](demo/aurora-deck.md)** — a slideshow deck (one section = one slide, per-slide vars)
- **[demo/handbook-excerpt.md](demo/handbook-excerpt.md)** — a paged print document (section = page, `preset=page-break`)
- **[demo/mara-voss-portfolio.md](demo/mara-voss-portfolio.md)** — a portfolio page

## Try it

Two small **demonstration** scripts show the format is implementable and keep the examples honest.
They illustrate the spec; they are not the reference implementation, and the real renderer and editor
are separate projects.

- `node tools/validate.js demo/*.md` — check the structural rules (spec §7)
- `node tools/render.js demo/showcase.md` — render `page` (webpage), `print` (A4), or `deck`
  (slideshow) HTML into `demo/rendered/`; pass a profile to do one: `... showcase.md deck`

## Status

The spec is adopted (v1, 2026-09-10). The renderer lives in the nui library as `nui-blocks`; the
editor is a nui addon. The design history — four competing proposals, a blind ranking, and the
authoring experiments that decided between them — is preserved in [_Archive/](_Archive/).
