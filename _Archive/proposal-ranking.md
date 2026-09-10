# Blocks Markdown — proposal ranking

> **Date:** 2026-09-08. **Author of this document:** Claude (also author of proposal C — see *Bias* below).
> **Status:** Assessment, not a decision. The user has not accepted a proposal.
> **Method:** file measurements + a blind second-opinion review by a fresh model with no session context
> (all six documents bundled, authorship anonymized as A/B/C, names redacted).

## The three proposals

| Label | Author | Spec | Showcase | One-line character |
|---|---|---|---|---|
| **A** | Kimi | [`proposal-a-kimi/spec.md`](proposal-a-kimi/spec.md) | [`proposal-a-kimi/showcase.md`](proposal-a-kimi/showcase.md) | Six unprefixed comment directives, implicit flow, `class` hooks, three `var` forms. Optimized for a *renderer*. |
| **B** | GPT Astra | [`proposal-b-astra/spec.md`](proposal-b-astra/spec.md) | [`proposal-b-astra/showcase.md`](proposal-b-astra/showcase.md) | `bm:` prefix, explicit `block`/`/block`, strict media body grammar, JSON attributes, full round-trip and validation contract. Optimized for a *parser and editor*. |
| **C** | Claude | [`proposal-c-claude/spec.md`](proposal-c-claude/spec.md) | [`proposal-c-claude/showcase.md`](proposal-c-claude/showcase.md) | B's boundaries and rigor, minus redundant attributes; YAML frontmatter; `---` sections; media = block that starts with an image. Optimized for an *author* (human or LLM). |

A discarded first draft (DeepSeek + user) is in `../../../../_Archive/blocks-markdown-spec-v1.md` and is not ranked.

## The user's goals, in priority order

1. An LLM can author valid documents intuitively — ideally from one example, without the spec.
2. Source stays readable as plain text.
3. GitHub / VS Code / Obsidian render it pleasantly, undisturbed by the enhancements.
4. A visual block editor can round-trip it losslessly.
5. Flexibility for future needs.

## Measurements (from the files, not opinion)

| | A Kimi | B Astra | C Claude |
|---|---:|---:|---:|
| Spec length (words) | 1 720 | 4 696 | 2 927 |
| Directive kinds incl. closers | 7 | 9 | 7 |
| Showcase non-blank lines | 155 | 195 | 205 |
| Markup lines (directives + frontmatter) | 39 (25 %) | 41 (21 %) | 53 (26 %) |

Markup *density* is a wash — all three spend roughly a quarter of non-blank lines on structure. The
compactness difference is in what each line has to carry (required attributes, redundant counts), not in
line count. Spec size is the real spread: B is 2.7× A.

## Blind scores (1–10, fresh model, anonymized)

| Metric | A Kimi | B Astra | C Claude |
|---|---:|---:|---:|
| (a) LLM guessability without spec | 6 | 4 | **9** |
| (b) Source readability | 8 | 5 | **9** |
| (c) Rendered readability in generic renderers | 9 | 9 | 9 |
| (d) Editor round-trip safety | 5 | **9** | 8 |
| (e) Flexibility / extensibility | 6 | 7 | 7 |
| (f) Compactness of markup | 8 | 4 | **9** |
| (g) Failure-mode clarity | 6 | **10** | 8 |
| (h) Spec size / implementation burden (10 = small) | 7 | 3 | **9** |
| **Total** | **55** | **50** | **68** |

Reviewer's one-line justifications, verbatim where useful:

- **(a)** A: "mandatory image blank line, `col` count == N, and implicit flow create spec-required traps."
  B: "strict JSON attrs, `count=`, `scope=`, `kind=`, `version`, duplicate-key errors, and exact media
  grammar make casual authoring fragile." C: "frontmatter, `---` slides, `bm:block`, derived column count,
  and media-by-first-node are conventions LLMs already emit."
- **(c)** Three-way tie: all comment-based, all clean in preview; fenced vars are the only visible extra.
- **(d)** A: "only `columns` has a durable close; ordinary text runs lack authored boundaries." B: "explicit
  block boundaries, strict media consumption, IDs/duplicates, and preservation rules make round-trip nearly
  lossless." C: "inferred media and unannotated chunking leave reclassification risk."
- **(g)** B scores a perfect 10: prefix, duplicate/unknown-attribute errors, exact body grammar, located
  diagnostics. C loses two points for corner cases where `---` or an image is silently reclassified.

## Ranking

### 1. C — Claude, minimal (68)

Wins goals 1, 2, 3 and 5 outright; loses goal 4 to B by one point. The only proposal a model could
plausibly author from one example. Compact without giving up the explicit boundaries that matter.

**Weakest point: overloaded `---`.** A root-level horizontal rule inside a section cannot be authored
(it must go inside a `block`), and `---` directly under a paragraph line is a setext H2 in CommonMark, not
a break — a missing blank line silently changes structure. This is the format's one genuine footgun. It is
visible in any preview (a surprise H2), so it is not *silent*, but it is a trap an LLM will hit occasionally.

### 2. A — Kimi v2 (55)

The most pleasant *read* of the three, and the smallest spec. But it was designed for a renderer, not an
editor, and three things break the moment a visual editor sits on top:

- **No block identity.** "Bare markdown = content block, type inferred" gives the editor nothing to drag,
  and adding `**bold**` flips `text` → `richtext`. A type that changes when you format cannot round-trip.
- **Lookahead capture.** `media` binds "the next image", `var:cta` binds "the next line". The payload of
  `var:cta` renders as a stray paragraph in GitHub — data leaking into content, which A's own principle 7
  forbids.
- **`class` is HTML in disguise.** A refuses style attributes but allows arbitrary class strings; that is
  presentation in the source, spelled differently.

### 3. B — Astra, editor-oriented (50)

The strongest validation and round-trip contract of the three — a 10 on failure clarity and a 9 on
round-trip are earned. It fixed every structural problem in A (boundaries, prefix, bounded media, `preset`,
JSON-bounded values, duplicate-key errors). Those decisions are correct and C inherits them wholesale.

But it is a parser specification, not an authoring format. Required `count=`, `scope=`, `kind=`,
`version:`, the two-form attribute grammar, and the exact media-body matrix make first-pass LLM output
error-prone — and that is goal #1. It scores last on the user's top priority and on spec burden, which is
why it ranks last overall despite being the most rigorous.

## What C took from each

| From A (Kimi) | From B (Astra) |
|---|---|
| Comments as the only carrier; content stays pure Markdown | `bm:` prefix; typos fail loud, author comments stay possible |
| "Content is implicit; structure is explicit" | Explicit `block` / `/block` boundaries |
| Fenced payload as the format's CDATA | `preset` instead of `class` |
| Small frozen vocabulary as a stated value | JSON-bounded attribute values; duplicates and unknowns are errors |
| Columns as the one layout container | Media forms: image, image list, `[![poster]](film.mp4)`, audio/file links |
| | Round-trip contract, validation table, fixture list (referenced, not copied) |

The ranking says *which surface to expose to authors*. It does not say whose work to discard: B's rigor is
the implementation spec behind C's one-screen surface.

## Bias

The author of this document wrote proposal C. Mitigations: the scores above are from a separate model with
no session context, the bundle was anonymized, and the measurements are mechanical. Not mitigated: the
reviewer shares training-era assumptions about "what LLMs find natural" with the author, and the rubric
itself weights the user's stated priorities, which happen to favour a minimal surface.

## The test that would settle it

Rubrics are a proxy. The real measurement for goal #1:

1. Give a model **only** a proposal's showcase — no spec.
2. Ask it to author a new page with a hero, a two-column split, a gallery, a callout, and one section var.
3. Run the proposal's validator. Count first-pass failures. Repeat across several models and prompts.

Do this for all three. The failure count ranks them better than any table above. Expected stumbles for C:
forgetting `/block` on single-image blocks, and `---` without surrounding blank lines. If those dominate,
§9 of C's spec already names the candidate fix (a self-closing single-node block form).

**Ran 2026-09-08** (2 models × 3 proposals, showcase-only, strict validation): results in
[`test-runs/REPORT.md`](test-runs/REPORT.md). Headline: B's guessability deficit did not reproduce
(strong model: B and C tie at zero errors, 6/6 elements); C's forgiveness hides failure (weak model
wrote format-free plain markdown that scores "0 errors"); A's missing callout concept is a real
capability gap. Ranking order survives; margins do not.

**Follow-up 2026-09-09:** the test results motivated a merged proposal —
[`proposal-d-merged/`](proposal-d-merged/): C's authoring surface unchanged, B's contract underneath
(deterministic chunking of unannotated Markdown, editor-stamped `kind`/`id`, loud errors on type
reclassification).

**Adopted 2026-09-10:** after proposal D passed the authoring test with three more models (round 2 in
the report — universal adoption, 2 minor errors total), it was promoted to the working spec at
[`spec/spec.md`](../../spec/spec.md). This ranking is now historical record.

## Decisions taken so far

- 2026-09-08 — User chose `---` (thematic break) as the section/slide separator over root H1
  (Marp / reveal-md / Deckset convention). Applied to C. Consequence: document data = frontmatter, section
  data = `var`; no scope attribute; H1 is ordinary content.

## Open

- Self-closing single-node `block` form — wait for authoring data.
- Prefix name (`bm:` is inherited; only the existence of a prefix is load-bearing).
- Frontmatter key schema — CMS profile decision, not format.
- Whether to adopt C, adopt C with changes, or merge B's spec body under C's surface as one document.
