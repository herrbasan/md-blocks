# MD-Blocks — Decision Record

> Why the format looks the way it does. Written 2026-09-10, before this folder moved out of the
> `nui_wc2` repository, so the reasoning survives the move. Read this before changing the spec —
> most temptations you will have were already considered, and some were measured.

## Timeline

| Date | What happened |
|---|---|
| 2026-08-07 | CMS migration recon: the n000b CMS is a build-time tool (block-tree JSON → static HTML). The plan: replace its JSON block tree with a Markdown authoring format, preserving the editor's composition power. |
| 2026-09-08 | Three format proposals written independently: **A** (Kimi — renderer-oriented), **B** (Astra — parser/editor-oriented), **C** (Claude — author-oriented). All in `_Archive/`. |
| 2026-09-08 | Claude ranked the proposals (C 68, A 55, B 50) using a blind second-opinion review. |
| 2026-09-08 | **Authoring test, round 1** — the ranking's own proposed experiment, actually run: 2 models × 3 proposals, showcase-only, strict LLM validation. |
| 2026-09-09 | **Proposal D written**: C's authoring surface + B's editor contract, motivated by round 1. |
| 2026-09-10 | **Authoring test, round 2**: 3 models (DeepSeek Flash, Qwen 27B, Gemma 12B) on D, mechanical validation. Universal adoption, 2 minor errors total. |
| 2026-09-10 | **D adopted as working spec v1.** Named **MD-Blocks**. Folder restructured as standalone project: `spec.md` + `demo/` + `_Archive/`. |
| 2026-09-10 | Renamed `spec.md` → `md-blocks-spec.md`; goals + target audience written into README/Agents. |
| 2026-09-10 | **Directive prefix renamed `bm:` → `mb:`** to match the MD-Blocks name ("md blocks"). Live files only; `_Archive/` keeps `bm:` as history. |
| 2026-09-10 | **Page breaks decided**: section = page unit for paged renderers; `preset=page-break` empty block for forced breaks; `break=` attribute deferred (spec §9.6). |

## The ranking was biased — and why we trusted the test instead

Claude authored proposal C *and* the ranking that put C first. It disclosed this and mitigated
(anonymized bundle, fresh reviewer model, mechanical measurements) — but three structural biases
remained, and they shaped how we read the scores:

1. **Last-mover advantage.** C was written after A and B existed, with their weaknesses already
   diagnosed, against the goal list it would be scored on. Of course it fit best.
2. **One reviewer, one sample.** The blind scores were a single model's judgment with no replication.
   The totals implied confidence the method couldn't support.
3. **A tilted rubric.** Goal #1 (LLM guessability) was weighted top — exactly where B's rigor costs
   points and its strengths (validation, round-trip) score nothing.

The ranking document itself named the experiment that would settle it ("give a model only the
showcase, count first-pass validator failures"). We ran it instead of arguing.

**What the data showed** (full detail: `_Archive/test-runs/REPORT.md`):

- B's "unguessable" score (4/10) **did not reproduce** — a strong model authored flawless B from the
  showcase alone. B and C tied: 0 errors, 6/6 elements.
- C's forgiving parser **hid failure**: a weak model copied C's frontmatter and used *none* of the
  format, yet scored "0 errors" because plain Markdown is valid in C.
- A had a **capability ceiling**, not just ergonomics: no callout concept exists, so the task was
  unexpressible — one model omitted it, one invented a directive and was rejected.

Conclusion: the ranking's *order* survived (C's surface first is defensible), its *margins* did not.
The right answer was not a winner but a merge.

## Key format decisions

| Decision | Chosen | Alternatives | Why |
|---|---|---|---|
| Document metadata | **YAML frontmatter** | `document` directive with JSON/YAML-ish fields | Universal convention every LLM emits unprompted; renders as a table on GitHub; "position-locked at line 1" is a feature. |
| Section separator | **`---` thematic break** | Root H1; explicit `section` directive | Slideshow convention (Marp, reveal-md, Deckset) — sections double as slides for free; headingless sections possible; renders as a visible rule in generic previews. Cost accepted: root-level `<hr>` inside a section is inexpressible (use one inside a `block`), and `---` under a paragraph line is a setext H2 (validator warns). |
| Content unit | **Explicit `block` only when it matters** | Every content run wrapped; inferred types | Bare Markdown must stay markup-free (goal: readable source). A block is written the moment content gains identity, a preset, or drag-boundaries. |
| Unannotated chunking | **Maximal run = one implicit block (format law)** | Editor policy per implementation | C left this to editors. Then every editor (and every editor version) must invent identical chunk boundaries forever, or git diffs fill with structural noise. Not a parsing problem — *the information isn't in the file*, so it was made deterministic in the spec (§6.1). |
| Media typing | **Infer when authored, stamp when saved** | Always explicit `kind=` (B); always inferred (C) | Inference is authorable (measured). But inference alone means an editor drag ("paragraph above the image") *silently reclassifies* the block. So the editor stamps `kind=` on save; a stamped kind contradicting the body is a loud error (§6.2). |
| Stable identity | **Editor-stamped `id`s, never derived** | Position-derived; required on everything | Required ids are authoring friction (B's `count=`/`scope=` lesson). Derived ids break on reorder. Stamping keeps hand-authored docs clean and editor trees stable (§6.3). |
| Column count | **Derived from `col` markers** | Required `count=` | Redundant data is a sync trap, especially for LLM authors. `weights` length still validates arity. |
| Var scope | **Section-only vars; frontmatter is document data** | Required `scope=` attribute | With `---` sections there is no "before the first section" — two homes, zero scope flags. |
| Var payload | **`value=` or one immediately-following fence; the pair is one lexical unit** | Position-agnostic binding | Adjacency without atomicity means an editor can drop a paragraph between marker and fence and silently rebind data. The unit rule makes the binding structural (§4.4). |
| Attribute grammar | **`key=value`, opening line only, JSON-bounded values** | Multi-line field forms; YAML-ish values | One grammar, no per-directive syntax to learn. Malformed JSON is an error, never reinterpreted as a string. |
| Presentation hook | **`preset` (single semantic token)** | Free `class` strings | Free classes are HTML in disguise — presentation smuggled into source. Presets name intent; a renderer profile maps them to treatment. |
| Self-closing single-node block | **Rejected** | A second block form for the common one-node case | Round-2 test: models handle the full open/close form without errors. A second form buys one line at the cost of a second rule. Revisit only if real authoring data says otherwise. |
| Unknown things | **Kinds/attributes/duplicates = errors; unknown presets = renderer warning** | Silent ignore; everything an error | Typos must fail loud (that's what the `mb:` prefix is for — author comments stay possible). Presets are renderer concerns, so they degrade visibly, not fatally. |
| Page breaks (print/PDF) | **Section = page unit; `preset=page-break` empty block for forced breaks** | A `mb:page` separator/directive; `break=` attribute (now) | A page is a *viewport* decision (A4 vs Letter vs slide can break differently) — renderer-profile territory, not source structure. Same section-per-viewport law as slides. `break=` (`inside-avoid` etc.) deferred until a renderer asks with evidence (spec §9.6). |
| "No format used at all" | **Informational diagnostic, not an error** | Reject; ignore | Round-1 lesson (weak model wrote format-free Markdown that validated clean). A document with frontmatter but zero directives is valid prose — but the editor must *surface* it, because silence is how empty structure ships (§7 validation table). |

## The round-trip argument (why B's strictness survived the merge)

The deciding insight wasn't about parsing — parsing is easy. It's that **a parser can only recover
what the document contains**. C left four things implicit that a visual editor needs:

1. *Type* (first-node inference) → silent reclassification on edit.
2. *Boundaries* (unwritten chunks) → editors invent them, versions drift, diffs fill with noise.
3. *Whitespace* (`---` vs setext H2) → blank lines become load-bearing through a reflowing editor.
4. *Adjacency* (var binds "the next fence") → a dropped paragraph rebinds data.

None of these are hard to code. All are impossible to code *correctly*, because the information was
never in the file. §6 (the editor contract) exists to put that information in the file — written by
the tool, invisible to the author.

## Naming

**MD-Blocks.** Considered: `nMark`/`nBlocks` (rejected — the n-family is for *tools*; this is a
spec, and specs read like CommonMark/Markdoc, not like products; `nBlocks` also collided with the
planned `nui-blocks` renderer component), `Blocksdown` (fine, but less spec-like), `markblocks`
(taken). The `md-block` (singular) web component exists in an adjacent domain (rendering, not
authoring) — not a conflict. The `bm:` directive prefix ("blocks markdown") predates the name; renamed to **`mb:`**
2026-09-10 to match — "md blocks". Renaming a two-letter prefix is cheap while nothing is implemented;
it would only get more expensive after a parser exists.

Pitch line, for future reuse: *"MDX and Markdoc put code in your Markdown. MD-Blocks puts structure
in comments and leaves the Markdown alone."*

## What was deliberately NOT decided / remains open

- **Round-trip under a real editor** — the other half of the evidence. Everything so far measured
  authoring; the editor contract (§6) is argued, not yet measured. First parser milestone should
  test parse → mutate → serialize on the archived test-runs.
- **Frontmatter key schema** — an application-profile decision, not a format one.
- **Prefix name** (`mb:`) — only the *existence* of a prefix is load-bearing.
- **N=1 per model in both test rounds.** Trends were consistent across three capability tiers, but
  one document per cell is thin. Re-run with more briefs before any format revision.

## Where the evidence lives

| What | Where |
|---|---|
| The three proposals + the merged one | `_Archive/proposal-*/` |
| The ranking (with bias section) | `_Archive/proposal-ranking.md` |
| All 9 model-authored test documents + both rounds' analysis | `_Archive/test-runs/` |
| The format itself | `md-blocks-spec.md` |
| Tutorial + examples | `demo/` |
