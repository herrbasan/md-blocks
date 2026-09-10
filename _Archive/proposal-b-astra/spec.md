# Blocks Markdown — editor-oriented proposal

> **Status:** Experimental proposal, revision 1 — 2026-09-08. Not an accepted replacement for
> [Kimi's renderer-oriented proposal](../proposal-a-kimi/spec.md), and not a renderer implementation.
> **Companion:** [showcase.md](showcase.md), written in this proposal's syntax.
> **Context:** [legacy CMS](../../../../cms-spec.md). Preserve its useful editing model, not its storage accidents.

## 1. The product this format serves

A block-level editor whose content language is Markdown. Authors can compose a page visually, edit its
source, and move between those modes without losing authored content, block boundaries, or metadata.

Three separate contracts:

| Layer | Owns |
|---|---|
| Format | Content, order, grouping, layout intent, media references, named data |
| Editor | Selection, drag handles, forms, presets, history, validation feedback |
| Renderer | HTML, typography, responsive layout, media resolution, theme interpretation |

The file is not a saved editor session, a CSS stylesheet, or an executable template.

**Compatibility promise:** ordinary Markdown renderers preserve readable content and reading order.
The enhanced renderer adds layout, media behavior, and metadata-driven presentation. Identical appearance
is not promised. Comments are visually hidden, not secret; fenced data remains visible in ordinary previews.

## 2. Design decisions

1. **Markdown is the default content block.** No `text` versus `richtext` inference. Adding bold must not
   change a block's identity or type.
2. **Structure is opt-in.** Normal paragraphs, headings, lists, tables, quotes, and code require no wrapper.
3. **Intentional boundaries survive.** An optional `block` groups Markdown into an independently editable
   unit. Unlike a paragraph break, its boundary is significant and must not disappear on save.
4. **Comments carry instructions, Markdown carries content.** Titles, link labels, alt text, and captions
   belong in Markdown. Editor labels and configuration belong in comments.
5. **No invisible guessing.** A media directive consumes a precisely defined body, not arbitrary following
   content. A variable never silently captures an ordinary paragraph.
6. **One attribute language.** No `columns:2` or `var:name` special grammars. Use `count=2` and `name=cta`.
7. **Few primitives, many presets.** A note is a Markdown block with a preset, not a new syntax family.
8. **Bounded layout first.** Columns contain content blocks, not nested columns. Recursion is a future
   capability decision, not an accidental consequence of the parser.

### Deliberate changes from working spec v2

| v2 | This proposal | Reason |
|---|---|---|
| Unprefixed comments | `bm:` reserved prefix | Ordinary author comments remain possible; directive typos can still fail loudly |
| Six directives frozen | Seven directives, adding `block` | Independent Markdown regions need durable boundaries |
| Only `/columns` closes | `/columns` and `/block` | Close authored regions whose boundaries matter |
| YAML-like structured fields | JSON arrays/objects plus scalar fields | Bounded, fully specified data syntax; no implied YAML features |
| Field overrides shorthand | Duplicate attributes are errors | Conflicting values are likely authoring mistakes |
| Three variable forms | Attribute value or one fenced payload | Remove accidental paragraph capture |
| Image-only media binding | Image/link/list binding | Audio, video, files, and galleries retain readable fallbacks |

## 3. Markdown and directive recognition

The content baseline is **CommonMark 0.31.2**, plus GFM tables, task lists, strikethrough, and extended
autolinks. These extensions may lose formatting in simpler renderers, but their text remains readable.
Raw HTML elements are outside this profile; escape them or show them as code. Ordinary HTML comments
are allowed. `<https://example.com>` is a Markdown autolink, not a forbidden HTML element.

References: [CommonMark](https://spec.commonmark.org/0.31.2/), [GFM](https://github.github.com/gfm/).

### Where markers are active

- A directive is a standalone HTML comment starting at **column 0**, with `bm:` immediately after the
  opening comment's space. Its closing `-->` has no trailing non-whitespace characters.
- Canonical opening: `<!-- bm:kind`. Closing markers: `<!-- bm:/block -->`, `<!-- bm:/columns -->`.
- Case-sensitive: lowercase kinds and attribute names.
- Recognize directives using Markdown context, **not global comment replacement**. Examples in fenced
  code, indented code, or code spans are literal content. A comment inside another comment is not a new
  directive.
- A reserved `bm:` HTML comment outside literal code, but inline, indented, or inside a Markdown list or
  blockquote, is a placement error. Ordinary comments have no such extra restriction.
- `<!-- Editor note: verify the quote -->` remains an ordinary comment. `<!-- bm:blcok -->` is an error.
- Blank lines are recommended around standalone structural markers. They are not required between
  `columns` and `col`. Comment field indentation is cosmetic; **Markdown body indentation is not**.
- Accept LF and CRLF; define blank lines by Markdown whitespace rules, not a literal `\n\n` byte test.

Recognize the comment carrier before decoding its attribute strings. An attribute cannot escape the
outer HTML comment by quoting a terminator.

## 4. Attribute grammar

The same attributes can be written on the opening line or one per subsequent line:

```md
<!-- bm:columns count=2 weights=[2,1] label="Product comparison" -->

<!-- bm:columns
  count: 2
  weights: [2, 1]
  label: Product comparison
-->
```

These opening markers have identical meaning; both still require columns and a closing marker.

### Lexical rules

| Item | Rule |
|---|---|
| Attribute key | `[a-z][a-z0-9_-]*` |
| Opening-line assignment | `key=value`; assignments separated by spaces or tabs |
| Subsequent-line assignment | `key: value`; one assignment per nonblank line |
| Quoted string | JSON double-quoted string, including JSON escapes |
| Array/object | Strict JSON; double-quoted object keys; no trailing commas or comments |
| Boolean/null | Exact lowercase `true`, `false`, `null` |
| Number | JSON number syntax; finite numbers only |
| Bare string | Nonempty text that is not one of the typed values above |

On the opening line, a bare string ends at whitespace; quote strings containing whitespace. A JSON value
is consumed through its matching delimiter, respecting string escapes, so spaces inside arrays/maps are
allowed. In a field, a bare string is the trimmed remainder of that physical line. A value starting with
`"`, `[` or `{` must be valid JSON; malformed structured data is not reinterpreted as a string. A number,
boolean, or null token is typed only when it matches the whole value; quote `"2026"` to keep it a string.

Structured field values occupy one physical line. Use a fenced variable for large/multiline data.
No single-quoted strings, YAML tags, anchors, block scalars, implicit dates, or expression evaluation.

Raw `<` and `>` are forbidden inside directive values. Encode them in JSON strings as `\u003c` and
`\u003e`; this also makes comment terminators representable as data. Bare strings cannot contain these
characters. The delimiter characters themselves are, naturally, exempt.

Duplicate keys are errors, including duplicates between shorthand and fields and within JSON objects.
Shorthand and fields have equal authority. Unknown structural attributes are errors. Arbitrary application
metadata belongs in the documented `data` object or a named variable, not new parser switches.

### Common attributes

| Attribute | Type | Applies to | Meaning |
|---|---|---|---|
| `id` | Identifier | section, block, media, columns, col | Optional stable identity, unique across the file |
| `label` | String | section, block, media, columns, col | Editor-only name; never a substitute for visible content |
| `preset` | Identifier | section, block, media, columns, col | Named presentation intent interpreted by a renderer profile |

An identifier is `[a-z][a-z0-9_-]*`. IDs are never derived from array positions. Empty labels are valid.
Empty IDs/presets are not. `class`, `style`, `width`, `color`, and `font` are not format attributes.

## 5. Vocabulary and consumption

| Kind | Allowed placement | Body/end |
|---|---|---|
| `document` | Root only; at most once | Self-contained comment |
| `section` | Root only | Until next root section start or EOF |
| `block` | Section flow or column flow | Markdown through matching `bm:/block` |
| `media` | Section flow or column flow | One image/link paragraph or one flat list; optional declared caption |
| `columns` | Section flow only | Through matching `bm:/columns` |
| `col` | Directly inside columns | Until next `col` or `/columns` |
| `var` | Root only | Self-contained value or one following fenced payload |

"Root" means outside explicit block/columns bodies and outside Markdown containers. Metadata and vars
may appear between root content nodes without ending the current section. "Column flow" is a sequence
of leaves inside a `col`, not a Markdown list or quote.

### 5.1 Document

```md
<!-- bm:document
  version: 1
  data: {"title":"Aurora Desk","customer":"Aurora Systems","year":2026,"tags":["Product","Design"]}
-->
```

- Attributes: `version` (required integer `1` when the directive exists), `data` (optional JSON object).
- `version: 1` identifies this experimental dialect, not the original v2 document's revision number.
- The directive is optional: plain Markdown is interpreted using this revision's implicit rules.
- A different version is a validation error. At most one document directive; no merging.
- It can occur anywhere at root, but the canonical writer places it first. Its position does not create
  or split a content block, label a section, or affect metadata visibility.
- `data.title` is metadata for listings/browser titles. It does not inject a heading into content.
- Domain fields and their validation are the CMS profile's responsibility. No form layout, widget type,
  collection query, validation script, or generated media manifest is stored here.

### 5.2 Section

A **root, column-0 ATX H1** starts a section. Its heading remains visible Markdown. Other headings are
ordinary content, including setext headings and ATX headings not at column 0. Inside a block or column,
headings are content, not page-section starts; canonical examples use H2–H6 there.

An explicit marker adds identity/presentation without putting visible headings in comments:

```md
<!-- bm:section id=tour preset=dark label="Product tour slide" -->
# The product tour
```

The explicit marker starts a section immediately. If the next root token is a section-start H1, attach
that heading to **the same section**, rather than opening a second section. Ignore blank lines and
ordinary comments for this adjacency check. Also ignore the position-independent `document` directive;
any other directive or any content breaks adjacency.
The canonical writer keeps this marker/heading pair together and places section variables **after** the
heading. The editor must treat insertion between the pair as a section-structure edit, not a neutral move.

- Without an adjacent H1, an explicitly started section has no visible heading. Its label is editor-only.
- Without any section start, root content creates one implicit, unheaded section. Empty and metadata-only
  files have no sections. Explicitly authored empty sections are preserved.
- Sections do not inherit attributes from previous sections. A plain new H1 resets presentation.
- No implicit section is created merely by reading document metadata or a document-scoped variable.
- Starting a section inside columns/block is invalid. A literal marker shown in code stays literal.
- Each section may be one slide for a slideshow renderer; timing/transitions are renderer/profile concerns.

### 5.3 Markdown content and explicit blocks

Outside explicit blocks, **maximal consecutive ordinary Markdown nodes form one implicit Markdown
block**. Paragraph breaks, H2–H6 headings, thematic breaks, tables, lists, and code do not create separate
CMS leaves. A structural directive, variable, standalone implicit image, or section boundary flushes
the current Markdown block. The document directive and ordinary comments do not flush it.

If an editor operation creates two independently movable adjacent text regions, the writer must mark
their boundaries rather than hoping blank lines will preserve them:

```md
<!-- bm:block id=introduction preset=lead -->
An introduction with **emphasis**.

A second paragraph, still part of the same movable block.
<!-- bm:/block -->
```

- An explicit block consumes ordinary Markdown until its close marker. Blank lines are content formatting,
  not closing syntax. Preserve them, including list indentation, code indentation, and hard line breaks.
- No nested blocks, media directives, columns, sections, or vars inside it. Unknown/misplaced reserved
  markers are errors, not silently hidden content. Markers in literal code remain ordinary code.
- A Markdown reference definition is allowed wherever the Markdown baseline permits it, but is not a
  visible body node. Preserve it as source and resolve it file-wide (§7), rather than dropping it when
  converting tokens to editor leaves.
- Native Markdown images and links inside the body stay inside it; no automatic media extraction.
- An explicitly empty block is legal: the block editor must be able to save unfinished structure.
- Implicit blocks carry no persistent IDs/labels/presets. Adding one of those makes a block explicit.
- A note/card/lead/CTA is the same Markdown block type with a different preset, not a new content type.
- `block` is the directive spelling for an explicit **Markdown leaf**, not an additional tree-node type.
  Thus “Markdown/media leaves” in a column includes explicitly wrapped Markdown blocks.

### 5.4 Media

An unannotated paragraph consisting of exactly one Markdown image becomes an implicit image-media leaf,
provided it is in section/column flow. Images inline with prose, linked images, and images inside lists,
quotes, or explicit blocks remain ordinary Markdown. Do not infer a gallery from adjacent images.

Use an explicit directive when behavior, grouping, or metadata matters:

```md
<!-- bm:media kind=image preset=hero caption=true -->
![Aurora kiosk in the showroom](../demo/images/hero.svg)

The kiosk in its **showroom setting**. This is a caption, not alt text.
```

Specific attributes: `kind` (`image` default, `video`, `audio`, `file`), `caption` (boolean, default false),
`focal` (optional JSON object with exactly finite numeric `x` and `y` in `[0,1]`; image only). Common
attributes also apply. Focal coordinates apply to the whole media leaf; split leaves for different crops.

#### Exact body grammar

After the directive, skip blank lines only and consume **one Markdown block**:

| kind | Single item | Multiple items |
|---|---|---|
| image | Paragraph containing exactly one image | Flat unordered list, exactly one image per item |
| video | Paragraph containing exactly one link; its label may be text or one poster image | Flat unordered list of the same link forms |
| audio | Paragraph containing exactly one text-labelled link | Flat unordered list of text-labelled links |
| file | Paragraph containing exactly one text-labelled link | Flat unordered list of text-labelled links |

- No nested lists, extra paragraphs, trailing text outside the image/link, or mixed kinds in one media body.
- Preserve the single-item versus list form, even for a one-item list. A list is one gallery/playlist/file
  block; its items are not separate editor leaves.
- With `caption=true`, skip blank lines after the body and consume exactly one ordinary paragraph as the
  **whole leaf's caption**. It supports Markdown inline formatting/links, but not images. Missing/wrong-type
  captions are errors. With `caption=false`, the next paragraph is ordinary content, never an inferred caption.
- The body and caption must be followed by a Markdown blank line or EOF. This prevents adjacent prose
  merging into a media paragraph in generic previews. The canonical writer always emits a blank line.
- Any reserved directive encountered while a required body/caption is pending is an error at the media
  marker; never skip unrelated content looking for a later image.
- Ordinary comments in that pending position are also errors: only blank lines may intervene. Place
  editorial comments before the media marker or after its complete body/caption.
- A missing media body is invalid, even in a draft. The editor can keep an unfilled insert action transient;
  it must not save an invalid reference or invent a placeholder URL.
  This prohibits a successful **tree save**, not saving raw invalid source for later repair (§8).
- Alt text comes from the image description; link text from the link label; optional Markdown link/image
  titles retain their normal meaning. There is no competing `alt`/`title` directive attribute.
- Per-item captions/crops can be represented as separate media leaves in columns. Do not infer them from
  nearby paragraphs or overload alt text with a visible caption.

#### References and fallbacks

Markdown destinations are relative paths or absolute HTTP(S) URLs, **not opaque pool IDs masquerading as
paths**. Relative references resolve against the Markdown file's location. The CMS resolver can map a
stable, previewable asset URL to a pool record. Variants stay in the media service, not this format.

Video may use `[![Poster](poster.jpg)](film.mp4)`: generic previews show a linked poster, enhanced output
can use a player. Audio remains a useful link in a generic preview. This is graceful reduction, not failure.

Moving/exporting a file requires copying/rebasing its relative assets. A bare database ID would need an
explicit export/resolution step before the compatibility promise could hold; that extension is deferred.

### 5.5 Columns and column slots

```md
<!-- bm:columns count=2 weights=[2,1] -->
<!-- bm:col label="Main content" -->
Markdown, implicit media, or explicit leaves.

<!-- bm:col preset=card label="Facts" -->
Supporting content.

<!-- bm:/columns -->
```

- `count`: required integer, at least 2. Exactly this many direct `col` markers must occur.
- `weights`: optional JSON array of exactly `count` positive finite numbers. Default: equal weights.
  `[2,1]` and `[4,2]` express the same ratio; preserve authored values rather than silently normalizing.
- Only whitespace and ordinary comments may precede the first `col` inside a columns region.
- A column's content is an ordered sequence of Markdown/media leaves, implicit or explicit.
- A column ends at the next `col` or `/columns`; it has no separate close marker. An open `block` must be
  closed first. Empty columns are valid and still count toward `count`.
- `col` accepts only common attributes. `columns` accepts common attributes plus `count` and `weights`.
- No nested columns or additional section/variable/document directives inside columns in this revision.
- Source column order is reading order: left-to-right in the layout's logical inline direction, then
  stacked in that same source order when space is insufficient. Never reorder content with CSS alone.
- Weights express proportions when side-by-side, not minimum widths or breakpoints. Responsive thresholds,
  gaps, and typography belong to the renderer. A renderer profile may set a practical maximum column count.

### 5.6 Named data (`var`)

Small values stay entirely inside the comment:

```md
<!-- bm:var name=autoplay scope=document value=false -->
```

Large values bind exactly one following fenced code block:

````md
<!-- bm:var name=slideshow scope=document -->
```json
{"loop":false,"secondsPerSlide":12}
```
````

- Attributes: `name` (required identifier), `scope` (required `document` or `section`), `value` (optional
  scalar/JSON value). No common block attributes: variables are named data records, not visible leaves.
- Without a `value` attribute, skip blank lines only and require a closed fenced block whose info string
  is exactly `json` or `text`. JSON must parse; text is literal. No language execution, YAML, or autodetection.
- With `value`, the directive is self-contained. A subsequent code fence is ordinary content.
- A fenced payload is atomic: marker-looking content inside it cannot change section/block scope. Honor
  CommonMark's fence character/length rules. Require a closing fence even though ordinary Markdown can
  render an unclosed fence at EOF.
- A `text` fence's value is its body with one final line ending before the closing fence excluded; internal
  line endings normalize to LF. Canonical fences start at column 0. Empty text and JSON `null` are valid.
- Document variables belong to the file regardless of position. Section variables require an already
  existing section and belong to that section. Their insertion flushes an implicit Markdown block.
- Names must be unique **within their scope**. The same name in another section is legal. Document and
  section names may overlap; consumers address the scope explicitly. No automatic inheritance/shadowing.
- Source placement among root blocks is preserved, even for document-scoped variables. Moving a section
  variable into another section is a semantic edit; moving a document variable is not a scope change.
- No interpolation syntax, template expressions, imports, or cross-block query language. Consumers can
  read a variable's typed value. A CTA belongs in Markdown as a link, not as hidden text in a variable.

## 6. Presentation profiles, not arbitrary CSS

`preset` is a single semantic name, not a CSS selector or a whitespace-separated class list. The format
preserves the name; a renderer profile documents which names it supports and how they are styled.

Suggested profile used by the showcase (not additional grammar):

| Preset | Target | Intent |
|---|---|---|
| `lead` | block | Introductory content emphasis |
| `note`, `warning` | block | Visually distinguished contextual information |
| `card` | block or col | Content grouped with a visible boundary |
| `cta` | block | Emphasize authored links; never invent their labels or destinations |
| `hero` | media | Prominent image treatment |
| `gallery` | image-media list | Display the authored media sequence as a gallery |
| `dark` | section | Contrasting section treatment with readable descendants |

An unknown preset is not an unknown directive: the syntax is valid, but the renderer emits an observable
unsupported-preset diagnostic and renders the ordinary content without that treatment. The editor can
warn before publishing. Themes can differ visually without changing the document's meaning.

The labels "Note" or "Warning" are not generated by the preset. If the words matter, write them in the
Markdown, as the showcase does. A preset must not be the only carrier of essential information.

## 7. Editing and round-trip contract

The semantic tree has this shape; the exact in-memory representation is not prescribed:

```text
document
  metadata
  sections[]
    optional Markdown heading + attributes
    ordered entries: markdown | media | columns | variable declaration | ordinary comment
      columns[]
        attributes + ordered markdown/media leaves + ordinary comments
  document-variable declarations may also precede the first section
```

Variable declarations retain source position but bind their value to the declared scope. Ordinary comments
between structural nodes also retain their position. Comments within Markdown remain in its source. The
document directive alone is normalized to the file start and does not create a content boundary.

### Required preservation

- Section/column/leaf order; intentional empty sections/columns/blocks.
- Explicit versus implicit Markdown/media boundaries. Never merge two explicitly authored blocks.
- Markdown content, including formatting, links, reference definitions, alt text, and captions.
- Media sequence, single/list form, identity/presentation attributes, and scoped typed values.
- Ordinary author comments. They are not disposable just because previews hide them.

Source whitespace outside payloads, shorthand versus field spelling, and attribute ordering may normalize.
Whitespace **inside Markdown** is not freely normalizable: lists, code, and hard breaks depend on it.
Preserve Markdown payload source unless the user edited it visually; then serialize an equivalent supported
Markdown structure. Editing a different block must not rewrite untouched Markdown bodies.

Reference-style links/images use a **file-wide definition table**, even when definitions occur in another
block/column. Resolve from the document's Markdown tokenization before rendering leaves separately.
Definitions inside fenced variable payloads are data, not Markdown definitions. Scoped definitions are not
introduced. Copying a block to another file must carry or rewrite the definitions it uses.

Parser output must include source ranges for diagnostics and targeted edits. IDs are optional durable
identities for authored nodes, not required on every paragraph. The editor may use transient runtime IDs;
an explicit persistent `id` survives save, move, and reload. Duplicating a node must not duplicate its ID.

**Testable invariant:** after normalizing permitted surface spelling, parsing a serialized tree preserves
its content, explicit boundaries, attributes, and scoped data. Exact bytes of the whole file need not match.

Keep Markdown authoritative for content; an editor can use a parsed tree while editing. A legacy CMS adapter
may emit `richtext` HTML, expand media references, or reconstruct header vars, but those are adapter tasks.
`group: block | columns` from the old CMS does not require a new wrapper directive. Legacy arbitrary HTML
and classes require an explicit migration policy; do not claim lossless legacy conversion automatically.

## 8. Validation and trust boundary

| Condition | Result |
|---|---|
| Unknown version/kind/structural attribute | Error at the source marker/key |
| Malformed/unterminated directive; invalid value type; duplicate key | Error, no guessed interpretation |
| Duplicate persistent ID or scoped variable name | Error with both source locations |
| `col` outside columns; unmatched close; forbidden nesting | Error with opener/closer locations |
| Unclosed block/columns | Error at invalid intervening structural marker or EOF, citing opener |
| Wrong column count/weight count; nonpositive weight | Error at columns marker |
| Media body/caption missing or of wrong shape | Error at media marker and offending next block |
| Missing required blank line after media/caption | Formatting error with insertion location |
| Variable without value or permitted closed fence; invalid JSON | Error with payload location |
| Raw HTML element outside literal code | Unsupported-content error; no silent stripping |
| Unsupported renderer preset | Visible diagnostic + ordinary content rendering |
| Asset unavailable at render/export | Visible unresolved-reference diagnostic; retain source reference |

Errors should carry a stable code, source range, short message, and expected form. An editor may retain an
invalid source draft and show diagnostics; it must not publish a guessed tree as if validation succeeded.

Parsing performs no network requests, media lookup, code execution, or CSS evaluation. Renderer boundaries
validate destinations and escape content/attributes. Media permits relative asset paths and HTTP(S); ordinary
content links additionally permit fragments and `mailto:`. Reject executable/unsupported schemes, protocol-
relative URLs, and filesystem drive paths. Inline executable HTML and event attributes are not an escape hatch.
Build-time asset resolvers must enforce their configured asset-root/network access policy, not trust paths
merely because the source parsed. Comments and vars must never be used to store secrets in public documents.

## 9. Capability boundary

### Included now

Markdown formatting; independently movable multi-paragraph blocks; named presentation presets; explicit
columns and ratios; image/audio/video/file references; galleries/playlists; rich single-paragraph captions;
document metadata; named typed data; optional persistent IDs; human-readable fallback output.

### Intentionally not included

- Arbitrary inline styling, floating elements, absolute positioning, CSS classes, or breakpoint syntax.
- Merged table cells, nested arbitrary HTML, scripts, executable embeds, or rich-text-to-HTML escape blocks.
- Recursive block/column nesting, general-purpose groups, includes, conditions, loops, or variable interpolation.
- Editor form schemas, database queries, media-variant manifests, upload tickets, or saved UI selection state.
- A new directive for each card, warning, testimonial, pricing panel, or CMS-specific palette preset.

Palette presets expand into these existing primitives. They do not remain opaque components whose content
only a particular editor can understand.

### Next candidates only after a real document needs them

Nested columns; structured per-item media captions; responsive art direction; richer table semantics;
portable asset-ID manifests; inline semantic marks missing from the Markdown baseline. Each extension must
specify its readable fallback and round-trip behavior before admission. Do not hide new grammar in presets.

## 10. Conformance examples to turn into tests

The showcase is an authored sample, not proof of a working parser. A future implementation needs fixtures
with **source + expected tree + expected generic/enhanced behavior**, including invalid documents.

| Case | Expected interpretation |
|---|---|
| Bare paragraph / blank file / metadata-only file | One implicit section + leaf / no sections / no sections |
| Two ordinary paragraphs | One implicit Markdown leaf |
| Two adjacent explicit blocks | Two leaves; never merged on serialization |
| Empty explicit block / empty column | Preserved, valid editable structure |
| `section` immediately followed by root H1 | One section, not an empty section plus another |
| Dark section followed by plain root H1 | New section without inherited preset |
| Standalone image / inline image / image inside explicit block | Media leaf / Markdown / Markdown |
| Media list with one item | One explicit media leaf, retaining list form |
| Media with and without `caption=true` | Following paragraph consumed / left as ordinary content |
| Media then unrelated prose instead of body | Error; never bind a later image |
| Source contains `bm:/block` inside a fence | Literal example; outer block remains open |
| Four-backtick fence containing three backticks | Inner backticks do not terminate the payload |
| Ordinary comment / unknown `bm:` kind | Preserved comment / validation error |
| Nested columns / too few columns / stray close | Validation errors with source positions |
| Repeated var name in different sections / same section | Valid / duplicate-name error |
| JSON `false` versus string `"false"` | Different typed values preserved |
| Link reference definition in another leaf | Resolves file-wide |
| LF versus CRLF; whitespace-only blank lines | Equivalent structure, with Markdown payload meaning preserved |

For LLM authoring, measure valid first-pass output and successful correction from diagnostics on realistic
pages. "Looks familiar" is a hypothesis; the grammar and examples must earn the claim of being easy to use.