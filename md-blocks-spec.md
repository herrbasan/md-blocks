# MD-Blocks — Format Spec

> **Status:** Working spec v1 (2026-09-10) — **adopted**. Merged from proposals
> [C (Claude, author-oriented)](_Archive/proposal-c-claude/spec.md) and
> [B (Astra, editor-oriented)](_Archive/proposal-b-astra/spec.md), informed by the
> [authoring test](_Archive/test-runs/REPORT.md). Parser and editor not yet implemented.
> **Companion:** [showcase.md](demo/showcase.md) — the showcase *is* the tutorial; this file is the rulebook
> for whoever writes the parser and the editor. Second example document:
> [mara-voss-portfolio.md](demo/mara-voss-portfolio.md).

---

## 0. The whole format on one screen

```md
---
title: Aurora Desk                      ← YAML frontmatter = document metadata + document data
year: 2026
header: Aurora Desk · Product Group     ← optional profile chrome (running head/foot), §5
footer: Aurora Systems · Concept · 2026
---

# Any heading is content

Plain Markdown is content. No markup needed. The file starts inside section 1.

<!-- mb:block preset=note -->            ← block: a movable, presentable unit
Anything Markdown, as many paragraphs as you like.
<!-- mb:/block -->

<!-- mb:block preset=hero -->            ← a block that starts with an image is media
![Alt text](images/hero.svg)

Text after the image is its caption.
<!-- mb:/block -->

---                                      ← a root-level rule starts the next section (= slide)

<!-- mb:section preset=band -->          ← optional: annotate the section just opened

<!-- mb:columns weights=[2,1] -->        ← columns: count = number of col markers
<!-- mb:col -->
Left.
<!-- mb:col preset=card -->
Right.
<!-- mb:/columns -->

<!-- mb:var name=seconds value=12 -->    ← named data for this section
```

Five directives: `section` `block` `columns` `col` `var`. Two of them close (`block`, `columns`).
Three optional attributes shared by all structural directives: `id`, `label`, `preset`.
One separator: `---` between sections — the convention Marp, reveal-md and Deckset use for slides.

That is the authoring surface. What distinguishes MD-Blocks is §6: **what the editor is required to
write down** so that nothing the round-trip needs is left implicit.

---

## 1. Goals, in priority order

1. **Guessable.** An LLM (or a person) who has seen one document writes valid documents. No spec lookup.
2. **Readable source.** The Markdown reads as a document. Directives are short, one line, and rare —
   plain content needs none.
3. **Pleasant in GitHub / VS Code / Obsidian.** Comments vanish, frontmatter renders as a table, images
   and links render normally, fenced data renders as code. Nothing looks broken; only layout is flat.
4. **Editor-safe.** Every visual-editor operation has exactly one serialization, and reparsing it yields
   the same tree. What the round-trip needs is *written in the file* — by the author, or stamped by the
   editor (§6) — never reconstructed by guessing.
5. **Fail loud.** Malformed structure is an error with a location, not a silent reclassification.

Non-goals: pixel parity between generic and enhanced rendering; expressing style; nested layouts.

---

## 2. Lineage — what came from where

| Topic | C (surface) | B (contract) | This proposal |
|---|---|---|---|
| Document metadata | YAML frontmatter | `mb:document` JSON | **frontmatter** (C) |
| Section separator | `---` thematic break | root H1 / `mb:section` | **`---`** (C) |
| Block | explicit, closes | explicit, closes | **C = B** (they agreed) |
| Media | block whose first node is media | `mb:media` + strict body + `caption=` | **C's shape** + B's strictness via editor-stamped `kind` (§6.2) |
| Column count | derived from `col` markers | required `count=` | **derived** (C) |
| Var scope | section-only, frontmatter for document data | required `scope=` | **section-only** (C) |
| Attribute grammar | `key=value`, opening line only | two forms | **one form** (C) |
| Unannotated-Markdown chunking | "editor policy, not format" | maximal run = one implicit block | **B's rule is format law** (§6.1) |
| Block identity | optional `id` | optional `id` | **editor stamps `id` on save** (§6.3) |
| Type reclassification | silent (first-node inference) | impossible (explicit `kind`) | **loud**: stamped `kind` contradicting the body is an error (§6.2) |
| Validation | strict table | strict table | **merged** (§8) |
| Round-trip | invariant stated | invariant + preservation list + trust boundary | **B's, adapted** (§9) |

The authoring test (2026-09-08) motivates the merge: C's surface and B's surface were *equally*
authorable by a strong model (0 errors, 6/6 elements each), but C's forgiveness let a weak model produce
a structurally empty document that validated clean. The format keeps C's surface; the parser and editor
enforce B's contract.

---

## 3. Recognition rules

The content baseline is **CommonMark 0.31.2**, plus GFM tables, task lists, strikethrough. Raw HTML
elements are outside the profile; escape them or show them as code.

- **Frontmatter:** a `---` line as **line 1**, closed by the next `---` line. Body is YAML. Optional.
  Keys are the application's business (an application profile documents its fields); the format only stores them.
  Frontmatter is also the home of document-level data: plain YAML, no `var`.
- **Section separator:** a **root-level thematic break** (`---`, `***`, `___` per CommonMark; canonical
  writer emits `---`). Not inside a list, quote, block, columns, or code — a rule in those positions is
  content (an ordinary `<hr>`). **Trap:** `---` directly under a paragraph line is a setext H2, not a
  rule. Always surround it with blank lines; the parser does not second-guess CommonMark here. The
  validator emits a warning for paragraph-line + `---` with no intervening blank line (§8).
- **Directive:** an HTML comment on its own line, at column 0, of the form
  `<!-- mb:kind key=value key=value -->` or `<!-- mb:/kind -->`. Lowercase. Nothing else on the line.
- Directives are recognized from the **Markdown block structure**, never by text replacement. Inside
  fenced code, indented code, or code spans they are literal text. Inside a list item or blockquote they
  are an error.
- Any other HTML comment is an ordinary comment: preserved, ignored, never a directive.
  `<!-- mb:blokc -->` is an error, not an ordinary comment.
- LF and CRLF are equivalent. Indentation *inside* Markdown is meaningful and preserved; directives are
  never indented.

### Attribute values

```
key=word                 bare token, ends at whitespace  → string
key="with spaces"        JSON string (JSON escapes)      → string
key=12  key=true  key=null                              → number / boolean / null
key=[2,1]  key={"x":0.5,"y":0.3}                        → strict JSON, no spaces unless quoted
```

Keys match `[a-z][a-z0-9_-]*`. Duplicate keys are errors. A value starting with `"`, `[` or `{` must be
valid JSON — malformed structured data is not reinterpreted as a string. Raw `<` or `>` in a value is an
error (use the JSON escapes \u003c and \u003e in a JSON string) — a value can never
escape the comment.

### Common attributes (all of `section block columns col`)

| Attribute | Type | Meaning |
|---|---|---|
| `id` | identifier | Optional stable identity, unique per file. Anchor target in enhanced output. Editor-stamped when absent (§6.3). |
| `label` | string | Editor-only name. Never rendered, never a substitute for content. |
| `preset` | token (colon-delimited: `family[:modifier[:variant]]`) | Semantic presentation hint interpreted by a renderer profile (§5). Bare token or quoted string. |

No `class`, `style`, `width`, `color`. Presentation lives in the renderer's preset table.

---

## 4. The five directives

### 4.1 Sections and `section`

The body (after frontmatter) is a sequence of sections separated by root-level `---`. The file starts
inside section 1; every root-level thematic break starts the next one. Headings of any level are content;
a section's *title*, if an editor wants one, is its first heading — a display convention, not a rule.

`<!-- mb:section … -->` **annotates the section it appears in.** It carries `id`/`label`/`preset` and
nothing else. Canonical position: first line of the section. Elsewhere it still applies to that section;
the writer moves it to the canonical spot on save. At most one per section.

- An empty section (two consecutive `---`, or a trailing `---`) is legal and preserved.
- Sections do not inherit anything. A section after a `preset=band` section is plain unless annotated.
- No section directive is ever required. A document with no `---` and no `mb:section` is one section.
- Each section is one slide for a slideshow renderer; a themed region for a page renderer.

### 4.2 `block`

```md
<!-- mb:block id=intro preset=lead label="Opening" -->
Ordinary Markdown: paragraphs, headings, lists, tables, code, quotes, rules, images, links.

Blank lines are content, not terminators. A `---` in here is an `<hr>`, not a section break.
<!-- mb:/block -->
```

- A block is the **unit the editor moves, presents, and names**.
- Always closed with `<!-- mb:/block -->`. The close takes no attributes.
- Contains Markdown only. No `section`, `columns`, `col`, `var`, or nested `block` inside. A `mb:` marker
  inside a block (outside code) is an error.
- An empty block is legal (the editor must be able to save unfinished structure).
- Two adjacent blocks are never merged on save. Blank lines between them are cosmetic.
- Unannotated Markdown outside any block is chunked by the **deterministic rule in §6.1** — identical on
  every parse, in every tool, forever. The moment a chunk gains an id, label, preset, or is dragged as a
  unit, the editor writes a `block` around it.

#### Block-level asset attributes

A block may carry an **asset reference in the directive** instead of in its body. This is for decorative
assets that belong to the presentation, not to the prose: an icon badge, a logo, a mark. Keeping them in
the attribute is what makes generic previews clean — the whole directive vanishes in GitHub or VS Code,
leaving readable prose instead of a stray image line.

| Attribute | Applies to | Meaning |
|---|---|---|
| `icon` | `preset=image:icon` | Media destination for the block's icon badge. Relative path or `http(s)` URL. |
| `alt` | `preset=image:icon` | Accessible description for the icon. Empty is legal for purely decorative marks. |

Destinations follow the same trust boundary as inline media (§8): relative paths or `http(s)` only;
executable schemes, protocol-relative URLs, and drive paths are refused.

```md
<!-- mb:block preset=image:icon icon=images/badge.svg alt="Native runtime" -->
### Zero Build Overhead
Native web components execute directly in modern browsers.
<!-- mb:/block -->
```

The body is the block's text; the icon is presentation. A renderer that does not implement `image:icon`
renders the body as ordinary Markdown and drops the attribute, so the block degrades to clean prose.

#### Media blocks

A block is a **media block** when its first Markdown node is one of:

| First node | Media kind |
|---|---|
| Paragraph containing exactly one image `![alt](src)` | image |
| Flat unordered list whose items each contain exactly one image | image, list form (one leaf, ordered items) |
| Paragraph containing exactly one link whose destination ends in a media extension, or a linked image `[![poster](p.jpg)](film.mp4)` | video / audio / file, by extension |
| Flat unordered list of such links | video / audio / file, list form |

Everything after that first node, up to the close, is the block's **caption** — ordinary Markdown
(no further images). An optional `focal={"x":0..1,"y":0..1}` applies to image blocks.
`kind` ∈ `image \| video \| audio \| file`; whether the body is a single item or a list is read from
the body itself, and the authored form is preserved (a one-item list stays a list). A `preset=gallery`
on an image list is presentation; the kind stays `image`.

`kind` is **optional when hand-authored** (inferred from the first node) and **stamped by the editor on
save** (§6.2). Once stamped, it is authoritative: if the body stops matching the stamped `kind`, that is a
validation *error*, not a silent reclassification. This is the mechanism that keeps an editor drag
("paragraph above the image") from quietly mutating the tree.

A standalone image paragraph *outside* a block is plain Markdown. No inference across paragraphs.

Destinations are relative paths (resolved against the file) or `http(s)` URLs. Alt text is the image
description; there is no competing attribute. Variants and pool IDs are the media service's concern.

### 4.3 `columns` / `col`

```md
<!-- mb:columns weights=[2,1] label="Story + facts" -->
<!-- mb:col -->
Markdown and blocks.
<!-- mb:col preset=card -->
Markdown and blocks.
<!-- mb:/columns -->
```

- `columns` is a container, closed by `<!-- mb:/columns -->`. Only blank lines and ordinary comments may
  appear before the first `col`.
- The **number of `col` markers is the column count**, minimum 2. `weights` (optional JSON array of
  positive numbers) must have exactly that many entries; default equal. Authored values are preserved,
  not normalized.
- `col` is a marker: it ends at the next `col` or the close. Empty columns are valid.
- A column contains Markdown and `block`s. No `columns`, `section`, or `var` inside columns.
- Source order is reading order. Narrow screens stack in source order; never reorder with CSS alone.

### 4.4 `var`

```md
<!-- mb:var name=seconds value=12 -->

<!-- mb:var name=slideshow -->
```json
{ "loop": false, "secondsPerSlide": 12 }
```
```

- `name` (identifier, required). Either `value=` (any attribute value) **or** exactly one following
  fenced code block with info string `json` or `text`, separated only by blank lines. JSON must parse;
  text is literal.
- **A var and its fenced payload are one lexical unit.** The fence must immediately follow (blank lines
  only between); the editor moves, copies, and deletes them together. Nothing may be inserted between a
  var marker and its fence.
- **A var belongs to the section it appears in.** There is no scope attribute and no document-level var:
  document data lives in frontmatter. Names are unique within a section; the same name in another
  section is a different var.
- Section level only (not inside `block` or `columns`). Position within the section is preserved but
  carries no meaning.
- Vars are data, never content. A fenced payload stays visible in generic previews — by design. A
  general display renderer may surface the var (its name beside its value) instead of dropping it:
  dropping it would make that renderer lossier than a generic preview, which cannot see the directive
  at all and quietly shows the fenced payload as an ordinary code block. A collection renderer reads
  the var from the tree and renders nothing.

---

## 5. Presets & Semantic HTML Mapping

`preset` names a semantic presentation intent using colon-separated segments: `family[:modifier[:variant]]`
(e.g. `card:warning`, `image:hero`, `image:left:small`, `gallery:featured`). The format stores and preserves
the authored token; a renderer profile maps the family and optional modifier/variant to layout and styling.

### Graceful degradation contract
1. **Full profile:** knows `family[:modifier[:variant]]` — applies the exact variant and size.
2. **Standard profile:** knows `family:modifier` — ignores optional `:variant` and applies standard modifier defaults.
3. **Base profile:** knows only `family` — discards all trailing segments and applies the family default.
4. **Generic preview (GitHub / VS Code / CommonMark):** ignores directives completely — renders valid, clean CommonMark.
5. **Unknown preset:** valid syntax, visible renderer diagnostic, content rendered plain.

Renderers should strive to emit **native semantic HTML5 elements** (`<section>`, `<figure>`,
`<aside>`, `<article>`, `<nav>`) so that documents are accessible and structured even without custom CSS.

### 5.1 Starter vocabulary & semantic mapping

| Family | Common Modifiers | Authored Markdown Shape | Semantic HTML5 Output | Renderer Intent |
|---|---|---|---|---|
| `card` | `note`<br>`warning`<br>`stat`<br>`quote`<br>`good`<br>`danger` | Paragraphs, headings, lists | Callout: `<aside role="note">`<br>Article: `<article>`<br>Quote: `<aside>` | Self-contained framed container.<br>`:note`, `:warning` apply contextual tint/border.<br>`:stat` = centered large numeric KPI callout.<br>`:quote` = editorial epigraph with attribution.<br>`:good`, `:danger` = recommendations / comparison cards. |
| `image` | `hero[:bleed]`<br>`contain`<br>`icon`<br>`left[:small]`<br>`right[:small]` | Single image + caption | `<figure class="media-image">`<br>`  <img ...>`<br>`  <figcaption>Caption</figcaption>`<br>`</figure>` | Single media figure.<br>`:hero` = prominent banner (optional `:bleed` expands flush edge-to-edge).<br>`:contain` = fit within bounds without cropping.<br>`:icon` = compact badge sized to text height (feature callout row).<br>`:left`, `:right` = float media and wrap subsequent text prose around it (optional `:small` for compact ~25% portrait/badge). |
| `gallery` | `featured`<br>`mosaic`<br>`row`<br>`masonry` | Image list + caption | `<figure class="media-gallery">`<br>`  <ul class="items">...</ul>`<br>`  <figcaption>Caption</figcaption>`<br>`</figure>` | Collection of media items.<br>Default = responsive thumbnail grid.<br>`:featured` = first image prominent/lead + sub-grid.<br>`:mosaic` = asymmetric editorial layout (1 large + 2 stacked).<br>`:row` = single full-width row split evenly.<br>`:masonry` = multi-column vertical waterfall. |
| `link` | `cta`<br>`download` | Single link or link list | `<nav class="actions">`<br>`  <a href="..." role="button">...</a>`<br>`</nav>` | Action item.<br>`:cta` = primary call-to-action button.<br>`:download` = file badge with download affordance. |
| `list` | `steps`<br>`features` | Ordered or unordered list | `<ol class="steps">` or `<ul class="features">` | Enhanced list presentation.<br>`:steps` = numbered timeline / connected process.<br>`:features` = checkmark feature grid. |
| `table` | `clean`<br>`specs`<br>`fit` | GFM Table | `<table class="table-[clean|specs|fit]">` | Tabular data presentation.<br>`:clean` = zero shades/backgrounds, subtle horizontal row dividers (clean list).<br>`:specs` = 2-column key/value sheet (header hidden, muted label column).<br>`:fit` = columns sized strictly by data cells; long header labels clip to fit and reveal full text via hover tooltip. |
| `section` | `band[:bleed]`<br>`cover` | (Applied to `mb:section`) | `<section class="band">` | A section on a different surface from the page — a full-width banded region. The name describes the shape, never a colour: the profile decides the treatment (a subtle shade shift in one renderer, a fully inverted theme in another). Optional `:bleed` expands the surface flush to the container edges. |
| `page-break` | *(none)* | `mb:block` (empty) | Forced break for paged renderers (print/PDF) — profile-defined; ignored (with warning) by screen renderers. |

Optional `:bleed` is an orthogonal spatial modifier for blocks and sections that expands them horizontally to the boundary of the surrounding document container, cancelling parent container padding. Content inside retains appropriate safe margins.

Unknown *directive kind* or *attribute*: parse error. Composite editor palette entries are templates that expand into these primitives; they are not vocabulary.

### Frontmatter: stored, not interpreted

The format stores frontmatter and never interprets it — keys belong to the application profile, and an
unknown key is ignored, never an error. One convention is worth fixing anyway, because profiles must
agree on a spelling before they can interoperate:

| Key | Meaning |
|---|---|
| `header` | Running head — chrome text for the top of a page, sheet, or slide |
| `footer` | Running foot — chrome text for the bottom |

Both are plain strings, rendered by the profile in whatever way suits its medium. Authoring them as
frontmatter rather than as content is the point: chrome is not part of the movable document body, so an
editor must never let a user drag a footer into the middle of a section.

**Derived chrome is never authored.** Page numbers, slide counts, progress bars, and section running
titles are computed by the renderer — see §4.1, where a section's title is "a display convention, not a
rule". A document that declares *page 3 of 12* has made the author responsible for keeping it true: the
same redundancy trap as a `count=` on `columns`. Position and viewport are renderer concerns, which is
why there is no `header`/`footer` directive, just as there is no `class` or `style`.

---

## 6. The editor contract (what distinguishes MD-Blocks)

C left three things implicit that a visual editor cannot afford to guess. MD-Blocks keeps C's
authoring surface untouched and assigns each gap a deterministic owner. **Authors never write what this
section describes by hand — but everything here is format law, so every tool computes the same tree.**

### 6.1 Unannotated Markdown: one rule, not editor policy

Outside explicit blocks, **maximal consecutive ordinary Markdown nodes form one implicit Markdown
block.** A structural directive, a `var`, or a section boundary flushes the current run; ordinary
comments and blank lines do not. Paragraph breaks, headings, lists, tables, and code do *not* split it.

Consequences: two parsers always produce the same chunk boundaries; an implicit block has no id, label,
or preset (adding one makes it explicit); a git diff after an unrelated edit never shows re-chunked
content; two editor versions never disagree about the tree.

### 6.2 Media `kind`: inferred when authored, stamped when saved

- **Hand-authored:** `kind` omitted → inferred from the first node (table in §4.2). The authoring test
  showed models infer this correctly.
- **Editor-saved:** the editor writes the resolved `kind=` (and `focal` if set through the UI) into the
  block marker. From then on the stamped kind is authoritative.
- **Mismatch is loud:** a block stamped `kind=image` whose first node is no longer a single image is a
  validation error at the block marker — the editor shows "this was an image block; fix or re-stamp"
  instead of silently reclassifying the block as text. Re-stamping is an explicit user action.

### 6.3 Stable identity: ids stamped, never derived

- The editor assigns an `id` to every section, block, and columns container it manages, on first save.
  Hand-authored documents may omit ids entirely.
- Ids are never derived from array positions or content hashes. Duplicating a node must not duplicate
  its id (the editor mints a fresh one). An id survives move, edit, and reload.
- Runtime-only selection state never enters the file.

### 6.4 What the editor never does

- Never merge two explicit blocks; never split an implicit run (it writes `block` boundaries instead).
- Never insert content between a `var` marker and its fence.
- Never reorder or reflow a Markdown body it didn't edit; editing block A must not rewrite the bytes of
  block B.
- Never publish a tree parsed from invalid source with guesses filled in.

---

## 7. Validation

Fail loud, with source range, stable code, message, expected form. Never guess.

| Condition | Result |
|---|---|
| Unknown `mb:` kind, unknown attribute, duplicate key, malformed value | error at marker |
| Directive inside list/quote; `mb:` marker inside a block; nested `block`/`columns` | error at marker |
| Unclosed `block`/`columns` | error at EOF or at the offending structural marker, citing the opener |
| Stray `/block`, `/columns`, `col` outside columns | error with location |
| `columns` with < 2 cols; `weights` length ≠ col count; nonpositive weight | error at `columns` marker |
| Stamped `kind` contradicting the block's first node (§6.2) | error at block marker, citing stamped kind |
| Content between a `var` marker and its fence; `var` with neither `value` nor a valid `json`/`text` fence; invalid JSON | error at marker / payload |
| Duplicate `id`; duplicate var `name` in same section; second `mb:section` in one section | error with both locations |
| Raw HTML element outside code | unsupported-content error |
| Paragraph line directly followed by `---` (setext H2) | **warning** at the rule, citing the trap |
| Document has frontmatter but zero directives | informational diagnostic ("no structure") — valid, but the editor surfaces it; this catches the "author used none of the format" case without rejecting plain prose |
| Unknown preset | renderer warning, plain rendering |
| Unresolvable asset | renderer warning, source reference retained |

The editor may hold invalid *source* and show diagnostics; it must not publish a guessed tree.

---

## 8. Round-trip contract

Tree shape:

```text
document { frontmatter, sections[] }
section  { id?, label?, preset?, vars[], children[] }
child    = markdown | block | columns
block    { id?, label?, preset?, kind?, focal?, media?, markdown }
columns  { id?, label?, preset?, weights?, cols[] }
col      { id?, label?, preset?, children[] }      ← children: markdown | block only
```

Must be preserved byte-for-byte or structurally equivalent: Markdown bodies (including whitespace inside
lists/code), frontmatter, block/column/section order, explicit boundaries, stamped attributes, var
values, ordinary comments and their position, reference-link definitions (file-wide — copying a block to
another file must carry or rewrite the definitions it uses).

May normalize: whitespace around directives, attribute order, bare vs quoted spelling of the same string.

Invariant: `parse(serialize(parse(src)))` ≡ `parse(src)`.

### Trust boundary

Parsing performs no network requests, media lookups, code execution, or CSS evaluation. Media
destinations are relative paths or HTTP(S); ordinary content links additionally permit fragments and
`mailto:`. Reject executable schemes, protocol-relative URLs, and filesystem drive paths. Build-time
asset resolvers enforce their configured asset-root policy — never trust a path merely because the
source parsed. Comments and vars must never store secrets in public documents.

---

## 9. Open questions (deliberately not decided here)

1. ~~**Section separator.**~~ Decided 2026-09-08: `---`. Cost accepted: a root-level `<hr>` inside a
   section is not expressible (use one inside a `block` if you truly need it).
2. ~~**Unannotated chunking.**~~ Decided 2026-09-09: maximal run, format law (§6.1). C had left it to
   editor policy; the round-trip argument and the authoring test settled it.
3. **Self-closing single-node blocks.** Still rejected: the authoring test showed models handle the full
   open/close form without errors, so the second form buys one line at the cost of a second rule.
4. **Prefix.** `mb:` is inherited. Only the *existence* of a prefix is load-bearing.
5. **Frontmatter schema.** Which keys an application profile requires is a profile decision, not a format one.
6. **Page breaks (print/PDF).** Decided 2026-09-10: no new separator or directive. A page is a *viewport*
   decision (A4 vs Letter vs slide), not source structure, so it lives in renderer profiles: paged
   renderers treat **one section = one page** (the same section-per-viewport law as slides), and an
   explicit forced break is an empty `mb:block preset=page-break` (§5). A `break=` attribute
   (`inside-avoid` etc., mapping to CSS fragmentation) is deferred until a renderer needs it with evidence.
7. **Shared header/footer.** Decided 2026-09-10: no directive. Chrome is profile data — `header`/`footer`
   frontmatter keys (plain strings) with a renderer convention (§5); derived chrome (page/slide numbers,
   running heads from section titles) is renderer-only and never authored. Rejected: `mb:header` /
   `mb:footer` directives, which would put viewport and positioning concerns into the authoring surface.

## 10. Conformance cases (to turn into fixtures)

Each fixture is source + expected tree + expected generic/enhanced behavior, including invalid documents.

| Case | Expected |
|---|---|
| Body with no `---` | one section |
| `---` `---` consecutive; trailing `---` | empty sections preserved |
| `---` inside a `block` / `col` / list / quote | `<hr>` content, not a break |
| Paragraph line immediately followed by `---` (no blank) | setext H2 — content, no break, validator warning |
| `***` at root | section break (CommonMark thematic break) |
| Two adjacent explicit blocks | two leaves; never merged on serialization |
| Maximal unannotated run with blank lines, heading, list inside | one implicit markdown block (§6.1) |
| Implicit run interrupted by `var`, then more markdown | two implicit blocks + one var |
| Block whose first node is an image, then two paragraphs | media block, two-paragraph caption |
| Block whose *second* node is an image | text block containing an inline image, not media |
| Hand-authored media block without `kind` | kind inferred from first node |
| Stamped `kind=image`, body edited so first node is a paragraph | validation error, not reclassification |
| `columns` with 3 `col` and `weights=[2,1]` | error: weights length |
| Var + fence with a paragraph inserted between | error at var marker |
| Frontmatter not at line 1 | `---` is a section break; following YAML is a paragraph |
| Same var name in two sections | valid, distinct |
| Document with frontmatter and no directives | valid; informational "no structure" diagnostic |
