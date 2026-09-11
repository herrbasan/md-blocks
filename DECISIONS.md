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
| 2026-09-10 | **Header/footer decided**: no directive. Chrome is profile data (`header`/`footer` frontmatter keys); derived chrome is renderer-only (spec §5, §9.7). |
| 2026-09-11 | **Chrome scope decided (spec v1.3)**: a `main` level above sections — the unit a renderer fragments into surfaces and the unit that owns chrome. Marked by a **break**, not an open/close pair: settled by a three-model authoring test (`_Archive/test-runs/main-marker/`) rather than by argument, after two consulted models split on the question. `preset` on a main names the treatment of its surfaces. `mb:/col` legalised. Supersedes the 2026-09-10 header/footer decision. |

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
| Shared header/footer — *superseded 2026-09-11 by the `main` scope + `repeat`; see the decisions log* | **Frontmatter `header`/`footer` keys (plain strings)** | `mb:header` / `mb:footer` directives; a `chrome` block | Two kinds of chrome, only one authorable. **Derived** chrome (page numbers, slide counts, progress, running heads from section titles) must stay renderer-computed — authoring "page 3 of 12" is the same redundancy trap as a `count=` on `columns`. **Authored** chrome (legal line, client name) is document data, so frontmatter already holds it, needs no grammar, and stays out of the movable body — an editor must never let a user drag a footer into a section. A directive would import viewport/positioning concerns into the authoring surface, the reason `class`/`style` are absent (spec §5, §9.7). |
| "No format used at all" | **Informational diagnostic, not an error** | Reject; ignore | Round-1 lesson (weak model wrote format-free Markdown that validated clean). A document with frontmatter but zero directives is valid prose — but the editor must *surface* it, because silence is how empty structure ships (§7 validation table). |
| Chrome scope (`main`) | **A level above sections: the renderer fragments it into surfaces and repeats its chrome onto each** | Per-section chrome; frontmatter strings only; a `layout` attribute | Chrome has to attach to the thing that repeats — the *surface* — not to a content region. Authored once, repeated by the renderer: neither source nor tool writes it per surface. One implicit main leaves every existing document untouched. |
| Main marker form | **A break: `mb:main` opens a scope, which ends at the next one or at EOF** | An open/close pair mirroring `block`/`columns` | Measured, not argued. Three models each followed the form they were shown (6/6 valid), and **none** wrote a close when the example used a break — so the predicted cost ("models will write `mb:/main` and be right") does not exist, while the pair's document-spanning unclosed state does. It also matches the structural rule already in force: nested containers close with a pair, siblings in a sequence are delimited by a break. |
| `preset` on a main | **Names the treatment of the surfaces that main produces** | Forbidden on a main; a separate scope-level vocabulary | The same relationship chrome already has — authored once on the scope, applied per surface — so no second concept enters the format. A section's preset addresses the *content region*, so the two never cascade and §4.1's non-inheritance law is untouched. Forbidding it would also turn a natural guess into a parse error, since unknown attributes fail loud. |
| Column close | **`mb:/col` accepted as the same boundary, written explicitly** | Error, as v1.2 implied | All three models in the test's control condition wrote it, unprompted. With `col` defined as a bare marker only, the spec would reject most first-pass decks over a construct nobody questioned — the format's own rule is that when an author would have to guess, the spec is wrong, not the author. |

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
- **One document per cell in the main-marker test too.** It is enough to refute a universal claim
  ("a model *will* write `mb:/main`"); it is not enough to prove no author ever will.
- **Content auto-fit for slides** — designed but not built, and deliberately deferred to the
  `nui-slides` fine-tuning pass: let the layout absorb (clamped media, reflow) → bounded
  deck-uniform shrink with a floor → report beyond it. Per-slide shrinking was rejected as a default
  because a deck looks composed only when one scale governs every surface.
- **`nui-slides` documentation.** The component exists and the preview page uses it, but it has no
  `documentation/components/` entry or playground page in `nui_wc2` yet.
- **Frontmatter key schema** — an application-profile decision, not a format one.
- **Prefix name** (`mb:`) — only the *existence* of a prefix is load-bearing.
- **N=1 per model in both test rounds.** Trends were consistent across three capability tiers, but
  one document per cell is thin. Re-run with more briefs before any format revision.

## Spec decisions log

> Moved out of the spec (2026-09-11, spec v1.1 → v1.2) so `md-blocks-spec.md` contains only what is
> needed to understand the format. Every change to the spec is appended here, with a spec version bump.

1. **Section separator** (2026-09-08): `---`. Cost accepted: a root-level `<hr>` inside a
   section is not expressible (use one inside a `block` if you truly need it).
2. **Unannotated chunking** (2026-09-09): maximal run, format law (spec §6.1). Left to editor policy,
   every implementation would have to invent identical chunk boundaries forever; made deterministic
   in the spec instead.
3. **Self-closing single-node blocks** (2026-09-10, reaffirmed): rejected. The authoring test showed
   models handle the full open/close form without errors, so a second form buys one line at the cost
   of a second rule.
4. **Prefix** (2026-09-10): `mb:` matches the MD-Blocks name. Only the *existence* of a prefix is
   load-bearing.
5. **Frontmatter schema** (2026-09-10): not a format concern. Which keys an application profile
   requires is a profile decision; the format stores keys and never interprets them.
6. **Page breaks (print/PDF)** (2026-09-10): no new separator or directive. A page is a *viewport*
   decision (A4 vs Letter vs slide), not source structure, so it lives in renderer profiles: paged
   renderers treat **one section = one page** (the same section-per-viewport law as slides), and an
   explicit forced break is an empty `mb:block preset=page-break` (spec §5). A `break=` attribute
   (`inside-avoid` etc., mapping to CSS fragmentation) is deferred until a renderer needs it with evidence.
7. **Shared header/footer** (2026-09-10): no directive. Chrome is profile data — `header`/`footer`
   frontmatter keys (plain strings) with a renderer convention (spec §5); derived chrome (page/slide
   numbers, running heads from section titles) is renderer-only and never authored. Rejected:
   `mb:header` / `mb:footer` directives, which would put viewport and positioning concerns into the
   authoring surface.
9. **Chrome scope — `main`** (2026-09-11, v1.3): a level above sections. A renderer fragments a main
   into surfaces (one section = one slide; pages for print) and repeats the main's chrome onto each.
   Chrome is authored once, as an ordinary block carrying `repeat=header|footer` (§4.6), and belongs
   to the main wherever it is written — canonical position first. A document has exactly one implicit
   main unless it writes a marker, so no existing document changes. **Supersedes entry 7**: chrome is
   no longer a plain frontmatter string, because plain strings cannot carry an image, a link, or
   formatting — the gap that reopened the question. The frontmatter keys remain profile data the
   format never interprets. Discovered while modelling the renderer, which had to invent a rule for
   the two cases the first attempt missed: a region holding only chrome is not a surface, and a
   comment-only region is empty.
10. **Main marker is a break, not a pair** (2026-09-11, v1.3): `mb:main` opens a scope; it ends where
    the next one begins or at EOF. Two consulted models split on this, so it went to an authoring test
    instead of a judgement call: three models × two forms, fresh context each, one example document per
    condition (`_Archive/test-runs/main-marker/`). All six followed the form they were shown, and none
    of the three shown a break wrote a close — so the guessability cost claimed for the break does not
    occur, and the break's advantage stands: no document-spanning malformed state, for no capability
    the pair has (a chrome-less tail is still just another main with no chrome blocks). It also follows
    the rule the format already used: nested containers (`block`, `columns`) close with a pair; siblings
    in a sequence (sections, mains) are delimited by a break. `mb:/main` is an error.
11. **`preset` on a main** (2026-09-11, v1.3): names the treatment of the surfaces that main produces.
    Both consulted models reached this independently, by the same route as entry 9 — chrome already
    established "scope data, applied per surface", so a main preset adds no concept. A section's preset
    addresses the content region; the two targets never cascade (§4.5.1). A profile that cannot tell the
    targets apart renders the main's plain and warns, like any preset it does not know.
12. **`mb:/col` accepted** (2026-09-11, v1.3): `col` stays a marker, but the explicit close is legal and
    preserved as authored. Evidence: all three models in the test's control condition wrote it. A spec
    that only allowed the bare form would have failed most first-pass decks on a construct no author
    was guessing about.
8. **Spec locked & stripped** (2026-09-11, v1.2): the spec now contains only what is needed to
   understand the format. History pointer (old §2) and this log (old §9) moved to this file;
   removed section numbers are never reused so external `§`-references stay valid. Fixed the §4.4
   `var` example fence (outer fence now four backticks so the nested ```json fence terminates correctly).

## Where the evidence lives

| What | Where |
|---|---|
| The three proposals + the merged one | `_Archive/proposal-*/` |
| The ranking (with bias section) | `_Archive/proposal-ranking.md` |
| All 9 model-authored test documents + both rounds' analysis | `_Archive/test-runs/` |
| The main-marker test (3 models × 2 forms) + verdict | `_Archive/test-runs/main-marker/` |
| The renderer experiments that produced the `main` model | `experiments/` (repo root) |
| The format itself | `md-blocks-spec.md` |
| Tutorial + examples | `demo/` |
