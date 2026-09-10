# Blocks Markdown — minimal proposal

> **Status:** Proposal, revision 1 — 2026-09-08 (Claude). Third-generation draft after
> [Kimi v2](../proposal-a-kimi/spec.md) and [Astra's editor-oriented proposal](../proposal-b-astra/spec.md).
> Not adopted, not implemented. **Companion:** [showcase.md](showcase.md) — the showcase *is* the tutorial;
> this file is the rulebook for whoever writes the parser and the editor.

---

## 0. The whole format on one screen

```md
---
title: Aurora Desk                      ← YAML frontmatter = document metadata + document data
year: 2026
---

# Any heading is content

Plain Markdown is content. No markup needed. The file starts inside section 1.

<!-- bm:block preset=note -->            ← block: a movable, presentable unit
Anything Markdown, as many paragraphs as you like.
<!-- bm:/block -->

<!-- bm:block preset=hero -->            ← a block that starts with an image is media
![Alt text](images/hero.svg)

Text after the image is its caption.
<!-- bm:/block -->

---                                      ← a root-level rule starts the next section (= slide)

<!-- bm:section preset=dark -->          ← optional: annotate the section just opened

<!-- bm:columns weights=[2,1] -->        ← columns: count = number of col markers
<!-- bm:col -->
Left.
<!-- bm:col preset=card -->
Right.
<!-- bm:/columns -->

<!-- bm:var name=seconds value=12 -->    ← named data for this section
```

Five directives: `section` `block` `columns` `col` `var`. Two of them close (`block`, `columns`).
Three optional attributes shared by all structural directives: `id`, `label`, `preset`.
One separator: `---` between sections — the same convention Marp, reveal-md and Deckset use for slides.

That is the format. Everything below is precision, not additional vocabulary.

---

## 1. Goals, in priority order

1. **Guessable.** An LLM (or a person) who has seen one document writes valid documents. No spec lookup.
2. **Readable source.** The Markdown reads as a document. Directives are short, one line, and rare —
   plain content needs none.
3. **Pleasant in GitHub / VS Code / Obsidian.** Comments vanish, frontmatter renders as a table, images and
   links render normally, fenced data renders as code. Nothing looks broken; only layout is flat.
4. **Editor-safe.** Every visual-editor operation (drag, group, preset, reorder columns) has exactly one
   serialization, and reparsing it yields the same tree. Boundaries that matter are written down.

Non-goals: pixel parity between generic and enhanced rendering; expressing style; nested layouts.

---

## 2. Deliberate differences from the two predecessors

| Topic | Kimi v2 | Astra | This proposal | Why |
|---|---|---|---|---|
| Section separator | root `#` or `section` | root `#` or `section` | **`---` (thematic break)** | Slideshow convention (Marp, reveal-md, Deckset); headingless sections for free; H1 becomes ordinary content; renders as a rule in generic preview — which is exactly what a section break looks like. |
| Document metadata | `<!-- document -->` YAML-ish | `<!-- bm:document data={…json…} -->` | **YAML frontmatter** | Universal; rendered as a table by GitHub; every LLM emits it unprompted. "Position-locked" is a feature. |
| Content unit | inferred `text`/`richtext` | implicit runs + explicit `block` | **explicit `block` only when it matters** | Same as Astra; but the format doesn't prescribe how the editor chunks unannotated Markdown. |
| Media | `media` + next image | `media kind= caption=` + strict body | **a `block` whose first node is an image / image-list / media link** | One container type instead of two; caption is simply "the rest of the block"; no boolean that changes the meaning of the *next* paragraph. |
| Attribute syntax | `key=value` + multi-line `key: value` | both forms | **`key=value` on the opening line only** | One grammar. Large data goes in a fenced `var`. |
| Column count | `columns:2` | `count=2` (required) | **derived from `col` markers** | Redundant data is a sync trap, especially for LLMs. `weights` length still validates. |
| Var scope | position | `scope=document\|section` (required) | **none — vars are section data; frontmatter is document data** | With `---` sections the file starts inside section 1, so there is no "before the first section". Two homes, zero scope attributes. |
| Presentation hook | `class` (free string) | `preset` (single token) | `preset` | Free class strings are HTML in disguise. |
| Directive prefix | none | `bm:` | `bm:` | Author comments stay possible; typos fail loud. |

Kept from Astra without change: JSON-bounded values, duplicate keys are errors, unknown kinds/attributes
are errors, columns don't nest, directives inside code are literal, the round-trip contract, the fixture list.

---

## 3. Recognition rules

- **Frontmatter:** a `---` line as **line 1**, closed by the next `---` line. Body is YAML. Optional.
  Keys are the application's business (the CMS profile documents its fields); the format only stores them.
  Frontmatter is also the home of document-level data (slideshow config, feature flags): plain YAML, no `var`.
- **Section separator:** a **root-level thematic break** (`---`, `***`, `___` per CommonMark; canonical
  writer emits `---`). It must be a thematic break in Markdown terms — not inside a list, quote, block,
  columns, or code. A rule inside a `block` or `col` is content (an ordinary `<hr>`), not a separator.
  **Trap:** `---` directly under a paragraph line is a setext H2, not a rule. Always surround it with blank
  lines; the parser does not second-guess CommonMark here.
- **Directive:** an HTML comment on its own line, at column 0, of the form
  `<!-- bm:kind key=value key=value -->` or `<!-- bm:/kind -->`. Lowercase. Nothing else on the line.
- Directives are recognized from the **Markdown block structure**, never by text replacement. Inside fenced
  code, indented code, or code spans they are literal text. Inside a list item or blockquote they are an error.
- Any other HTML comment is an ordinary comment: preserved, ignored, never a directive.
  `<!-- bm:blokc -->` is an error, not an ordinary comment.
- LF and CRLF are equivalent. Indentation *inside* Markdown is meaningful and preserved; there is no
  indentation of directives.

### Attribute values

```
key=word                 bare token, ends at whitespace  → string
key="with spaces"        JSON string (JSON escapes)      → string
key=12  key=true  key=null                              → number / boolean / null
key=[2,1]  key={"x":0.5,"y":0.3}                        → strict JSON, no spaces unless quoted
```

Keys match `[a-z][a-z0-9_-]*`. Duplicate keys are errors. Raw `<` or `>` in a value is an error
(use `\u003c` / `\u003e` in a JSON string) — a value can never escape the comment.

### Common attributes (all of `section block columns col`)

| Attribute | Type | Meaning |
|---|---|---|
| `id` | identifier `[a-z][a-z0-9_-]*` | Optional stable identity, unique per file. Anchor target in enhanced output. |
| `label` | string | Editor-only name. Never rendered, never a substitute for content. |
| `preset` | identifier | Single semantic presentation name, interpreted by a renderer profile. |

No `class`, `style`, `width`, `color`. Presentation lives in the renderer's preset table.

---

## 4. The five directives

### 4.1 Sections and `section`

The body (after frontmatter) is a sequence of sections separated by root-level `---`. The file starts
inside section 1; every root-level thematic break starts the next one. Headings of any level are content;
a section's *title*, if an editor wants one, is its first heading — a display convention, not a rule.

`<!-- bm:section … -->` **annotates the section it appears in.** It carries `id`/`label`/`preset` and
nothing else. Canonical position: first line of the section (right after the `---`). Elsewhere in the
section it still applies to that section; the writer moves it to the canonical spot on save. At most one
per section.

- An empty section (two consecutive `---`, or a trailing `---`) is legal and preserved: the editor must be
  able to save a new blank slide. Empty files have one empty section.
- Sections do not inherit anything. A section after a `preset=dark` section is plain unless annotated.
- No section directive is ever required. A document with no `---` and no `bm:section` is one section.
- Each section is one slide for a slideshow renderer; each section is a themed region for a page renderer.

### 4.2 `block`

```md
<!-- bm:block id=intro preset=lead label="Opening" -->
Ordinary Markdown: paragraphs, headings, lists, tables, code, quotes, rules, images, links.

Blank lines are content, not terminators. A `---` in here is an `<hr>`, not a section break.
<!-- bm:/block -->
```

- A block is the **unit the editor moves, presents, and names**. It groups one or more Markdown nodes.
- Always closed with `<!-- bm:/block -->`. The close takes no attributes.
- Contains Markdown only. No `section`, `columns`, `col`, `var`, or nested `block` inside. A `bm:` marker
  inside a block (outside code) is an error.
- An empty block is legal (the editor must be able to save unfinished structure).
- Unannotated Markdown outside any block is content without an authored boundary. **How the editor chunks
  it (per paragraph, per run) is editor policy, not format.** The moment a chunk gains an id, label,
  preset, or is dragged as a unit, the editor writes a `block` around it.
- Two adjacent blocks are never merged on save. Blank lines between them are cosmetic.

#### Media blocks

A block is a **media block** when its first Markdown node is one of:

| First node | Media kind |
|---|---|
| Paragraph containing exactly one image `![alt](src)` | image |
| Flat unordered list whose items each contain exactly one image | gallery (one leaf, ordered items) |
| Paragraph containing exactly one link whose destination ends in a media extension, or a linked image `[![poster](p.jpg)](film.mp4)` | video / audio / file, by extension |
| Flat unordered list of such links | playlist / file list |

Everything after that first node, up to the close, is the block's **caption** — ordinary Markdown
(no further images). No `kind=` is needed; the destination decides. `kind=video|audio|file|image` may be
given to override a misleading extension. An optional `focal={"x":0..1,"y":0..1}` applies to image blocks.

A standalone image paragraph *outside* a block is plain Markdown. An editor may present it as a media leaf
and write a `block` around it the moment the author touches its settings. No inference across paragraphs.

Destinations are relative paths (resolved against the file) or `http(s)` URLs. Alt text is the image
description; there is no competing attribute. Variants and pool IDs are the media service's concern.

### 4.3 `columns` / `col`

```md
<!-- bm:columns weights=[2,1] label="Story + facts" -->
<!-- bm:col -->
Markdown and blocks.
<!-- bm:col preset=card -->
Markdown and blocks.
<!-- bm:/columns -->
```

- `columns` is a container, closed by `<!-- bm:/columns -->`. Only blank lines and ordinary comments may
  appear before the first `col`.
- The **number of `col` markers is the column count**, minimum 2. `weights` (optional JSON array of positive
  numbers) must have exactly that many entries; default equal. Authored values are preserved, not normalized.
- `col` is a marker: it ends at the next `col` or the close. Empty columns are valid.
- A column contains Markdown and `block`s. No `columns`, `section`, or `var` inside columns.
- Source order is reading order. Narrow screens stack in source order.

### 4.4 `var`

```md
<!-- bm:var name=seconds value=12 -->

<!-- bm:var name=slideshow -->
```json
{ "loop": false, "secondsPerSlide": 12 }
```
```

- `name` (identifier, required). Either `value=` (any attribute value) **or** exactly one following fenced
  code block with info string `json` or `text`, separated only by blank lines. JSON must parse; text is literal.
- **A var belongs to the section it appears in.** There is no scope attribute and no document-level var:
  document data lives in frontmatter. Names are unique within a section; the same name in another section
  is a different var.
- Section level only (not inside `block` or `columns`). Position within the section is preserved but
  carries no meaning.
- Vars are data, never content. The renderer decides whether and where they surface. A fenced payload stays
  visible in generic previews — by design: readable, not secret.

---

## 5. Presets

`preset` names a semantic intent; a renderer profile maps names to treatment. The format only preserves
the name. Suggested starter profile (used by the showcase):

| Preset | On | Intent |
|---|---|---|
| `lead` | block | Opening emphasis |
| `note`, `warning` | block | Contextual callout — the label word is *authored in the Markdown*, not injected |
| `card` | block, col | Grouped with a visible boundary |
| `cta` | block | Emphasize the authored link(s); never invent labels |
| `hero` | media block | Prominent image |
| `gallery` | media block (list) | Grid/carousel of the authored sequence |
| `dark` | section | Contrasting slide/section theme |

Unknown preset: valid syntax, visible renderer diagnostic, content rendered plain. Unknown *directive kind*
or *attribute*: parse error.

The legacy CMS's composite palette entries ("FDAR 3 Media Columns") are editor templates that expand into
these primitives. They are not vocabulary.

---

## 6. Mapping to the legacy CMS tree

| Markdown | Legacy `{ sections }` |
|---|---|
| frontmatter | page fields + Header `vars` block (`name`, `customer`, `year`, tags) |
| `---` (+ optional `bm:section`) | `section { label, class←preset }` |
| unannotated Markdown | `block { type: richtext }` (chunking per editor policy) |
| `bm:block` (text) | `block { type: richtext, label, class←preset }` |
| `bm:block` (media) | `block { type: media \| files, data: [refs], caption }` |
| `bm:columns` + `bm:col` | `columns { columns: [[…],[…]], label, class }` |
| `bm:var` | `block { type: input \| vars }` |

Legacy `group` = `block | columns` — no wrapper directive needed. Legacy arbitrary `class` strings need a
migration table to presets; not automatic.

---

## 7. Validation

Fail loud, with source range, stable code, message, expected form. Never guess.

| Condition | Result |
|---|---|
| Unknown `bm:` kind, unknown attribute, duplicate key, malformed value | error at marker |
| Directive inside list/quote; `bm:` marker inside a block; nested `block`/`columns` | error at marker |
| Unclosed `block`/`columns` | error at EOF or at the offending structural marker, citing the opener |
| Stray `/block`, `/columns`, `col` outside columns | error with location |
| `columns` with < 2 cols; `weights` length ≠ col count; nonpositive weight | error at `columns` marker |
| Duplicate `id`; duplicate var `name` in same section; second `bm:section` in one section | error with both locations |
| `var` with neither `value` nor a valid `json`/`text` fence; invalid JSON | error at marker / payload |
| Raw HTML element outside code | unsupported-content error |
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
block    { id?, label?, preset?, media?, markdown }
columns  { id?, label?, preset?, weights?, cols[] }
col      { id?, label?, preset?, children[] }      ← children: markdown | block only
```

Must be preserved byte-for-byte or structurally equivalent: Markdown bodies (including whitespace inside
lists/code), frontmatter, block/column/section order, explicit boundaries, attributes, var values, ordinary
comments and their position, reference-link definitions (file-wide).

May normalize: whitespace around directives, attribute order, bare vs quoted spelling of the same string.

Invariant: `parse(serialize(parse(src)))` ≡ `parse(src)`. Editing block A must not rewrite the source
bytes of block B.

---

## 9. Open questions (deliberately not decided here)

1. ~~**Section separator.**~~ Decided 2026-09-08: `---`, following the slideshow tools. Cost accepted: a
   root-level `<hr>` inside a section is not expressible (use one inside a `block` if you truly need it).
2. **Self-closing single-node blocks.** `<!-- bm:block preset=hero -->` followed by *one* Markdown node and
   no close would cover ~80 % of media and callouts with one line less. It costs a second form of the same
   directive. Rejected for now in favour of one rule ("block always closes"); revisit after LLM authoring tests.
3. **Prefix.** `bm:` is inherited. Bikeshed freely; only the *existence* of a prefix is load-bearing.
4. **Frontmatter schema.** Which keys the CMS profile requires (`title`, `customer`, `year`, `tags`, `cover`?)
   is a profile decision, not a format one.

## 10. Fixtures

Astra's [§10 conformance table](../proposal/spec.md#10-conformance-examples-to-turn-into-tests) applies
with these substitutions: `media` cases → media *block* cases; `count` cases → col-count-derived cases;
`scope` cases → section-only cases; `document` cases → frontmatter cases; H1-section cases → `---` cases. Add:

| Case | Expected |
|---|---|
| Block whose first node is an image, then two paragraphs | media block, two-paragraph caption |
| Block whose *second* node is an image | text block containing an inline image, not media |
| `[Watch](film.mp4)` alone in a block | video media |
| `[Watch](film.mp4)` with `kind=file` | file media |
| `columns` with 3 `col` and `weights=[2,1]` | error: weights length |
| Frontmatter not at line 1 | `---` is a section break; following YAML is a paragraph |
| Body with no `---` | one section |
| `---` `---` consecutive; trailing `---` | empty section preserved |
| `***` at root | section break (CommonMark thematic break) |
| `---` inside a `block` / `col` / list / quote | `<hr>` content, not a break |
| Paragraph line immediately followed by `---` (no blank) | setext H2 — content, no section break |
| `bm:section` mid-section | applies to that section; canonical writer moves it to section start |
| Two `bm:section` in one section | error |
| Same var name in two sections | valid, distinct |
