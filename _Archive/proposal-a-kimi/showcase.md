<!-- document
  title: Blocks Markdown — Layout Showcase
  purpose: Every layout option expressible in the format, in one document
  status: demo
  cover: images/hero.svg
-->

# Layout Showcase

This document exercises every structural construct in the format. Bare markdown renders fine in any
preview; the directives (HTML comments) carry structure for `nui-blocks` and the CMS.

---

## 1. Full-width prose (the default)

No directive at all. Everything between sections is a content block, type inferred from the markdown:
paragraphs, **emphasis**, lists, quotes, tables, code. This is the zero-cost layout — the document
reads top to bottom like any README.

> Single-column flow is the baseline. Every layout below is an *opt-in* exception, not the default.

---

## 2. Hero media

A `media` block with a class hook. One line of directive, one line of reference:

<!-- media class="hero" -->
![Hero](images/hero.svg)

The same block with **structured fields** — anything a CMS media block might carry:

<!-- media
  class: hero
  focal: { x: 0.5, y: 0.3 }
  variants: [mobile, desktop]
  alt: Aurora kiosk in showroom
-->
![Hero with metadata](images/hero.svg)

---

## 3. Two columns — text + media

The classic work-entry split. The container opens with `columns`, each `col` starts a slot,
`/columns` closes the region:

<!-- columns:2 class="product" -->
<!-- col -->
## The kiosk

Text column: headings, prose, and lists accumulate here.

- Self-guided, no staff needed
- **Flick** between screens, pinch to zoom
- Auto-returns to the attract loop when idle

<!-- col -->
![Kiosk](images/kiosk.svg)

<!-- /columns -->

---

## 4. Weighted columns — 2:1 split

Same grammar, one extra shorthand token. `split` is structural data for the renderer, not style:

<!-- columns:2 split="2:1" -->
<!-- col -->
## Wide column

The primary reading flow gets two parts of the grid. Long prose stays comfortable; the sidebar
stays narrow. Useful for article + fact-box layouts, changelogs with a metadata rail, or
spec + example pairings.

<!-- col -->
**Fact box**

- Year: 2026
- Stack: vanilla
- Deps: 0
<!-- /columns -->

---

## 5. Three columns — cards / steps

<!-- columns:3 -->
<!-- col -->
![Tour step 1](images/tour.svg)

**Overview**

The attract loop.

<!-- col -->
![Tour step 2](images/tour.svg)

**Live demo**

Full touch control.

<!-- col -->
![Tour step 3](images/tour.svg)

**Capture**

Lead form on exit.

<!-- /columns -->

---

## 6. Mixed media row — two-up gallery

Columns aren't required to mix types. Two media-only columns make a simple gallery:

<!-- columns:2 class="gallery" -->
<!-- col -->
![Kiosk](images/kiosk.svg)

<!-- col -->
![Launch](images/launch.svg)
<!-- /columns -->

---

## 7. Data blocks — `var` in all three forms

Inline, for one-liners:

<!-- var:link=https://aurora.example.com/desk -->

Two-line, for readability:

<!-- var:cta -->
Book a showroom demo

Fenced, for structured data — the fence bounds the value, the fence language declares the type.
In preview this shows as a normal syntax-highlighted code block:

<!-- var:config -->
```json
{
  "theme": "dark",
  "autoplay": true,
  "loop_seconds": 30,
  "screens": ["overview", "live-demo", "capture"]
}
```

None of these render as page content — they're data, referenced by the renderer or other blocks.

---

## 8. Section as slide — themed regions

An explicit `section` directive opens a themed slide (each section = one slide in the slideshow
reading). Shorthand on the first line:

<!-- section title="The Product Tour" class="dark" -->

## What the visitor sees

Dark-region content: prose, then a three-up grid, then a quote — a slide with real layout inside,
not just a title card.

<!-- columns:3 -->
<!-- col -->
![Tour step 1](images/tour.svg)

**Overview**

<!-- col -->
![Tour step 2](images/tour.svg)

**Live demo**

<!-- col -->
![Tour step 3](images/tour.svg)

**Capture**

<!-- /columns -->

> Sections close implicitly: the next `#` heading or `section` directive ends them. Only `columns`
> has an explicit close tag, because it's a container, not a flow marker.

---

## 9. Content inference — no directives needed

Everything below is bare markdown. The parser infers block types:

### Table

| Feature | Format | Preview |
|---------|--------|---------|
| Sections | `#` or `<!-- section -->` | heading |
| Columns | `<!-- columns:N -->` … `<!-- /columns -->` | stacked |
| Data | `<!-- var:name -->` | hidden or code block |
| Media | `<!-- media -->` + image | image |

### Task list

- [x] Sections from headings
- [x] Columns with close tag
- [x] Vars in three forms
- [ ] `nui-blocks` renderer

### Code

```js
const tree = parseBlocks(markdown);
// → { document: {...}, sections: [{ label, blocks: [...] }] }
```

---

## 10. The grammar, summarized

Six words of vocabulary. One grammar rule for directives:
`kind` + optional first-line shorthand + optional line-based fields.

| Directive | Scope | Closes |
|-----------|-------|--------|
| `document` | whole file | — |
| `section` / `#` | until next section | implicit |
| `media` | binds the next image | implicit |
| `var:name` | binds inline / next line / fence | implicit |
| `columns:N` | container | `<!-- /columns -->` (explicit) |
| `col` | next slot inside `columns` | next `col` or `/columns` |

Everything else is markdown.
