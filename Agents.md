# MD-Blocks — Agent Briefing

> **Read first:** [md-blocks-spec.md](md-blocks-spec.md) — the format's single source of truth.
> **Then:** [demo/showcase.md](demo/showcase.md) — the tutorial; the format is designed to be
> guessable from this one document.
> **Before changing anything:** [DECISIONS.md](DECISIONS.md) — why the format looks the way it does;
> most temptations were already considered, and some were measured.
> **For LLM instruction sets:** [BRIEF.md](BRIEF.md) — the drastically reduced authoring brief
> (one example + validity rules), meant to be embedded into system prompts and agent directives.

## What this project is

MD-Blocks is an **enhanced Markdown authoring format** — a spec, not a tool. Structure (sections,
blocks, columns, named data) rides in invisible HTML comments and YAML frontmatter; the content stays
pure CommonMark. One-line pitch: *"MDX and Markdoc put code in your Markdown. MD-Blocks puts structure
in comments and leaves the Markdown alone."*

Primary use case: structured documents that a visual block editor can round-trip losslessly, while
remaining LLM-authorable from a single example and pleasant in GitHub / VS Code / Obsidian previews.
Doubles as a slideshow source (each section = one slide).

## Goals

Two rendering targets, both covered by the same format with no special casing:

1. **Block-level layouts for documents and webpages** — sections, columns, media, and named data
     compose into rich page layouts.
2. **Slideshow renderings** — each section is one slide (Marp / reveal-md convention); a slideshow
   renderer is just a page renderer with one section per viewport.

Nothing format-level is needed beyond what the spec already has — sections *are* the slide unit,
blocks/columns *are* the layout primitives. Renderers are consumers, not spec concerns.

## Target audience

- **LLMs maintain these documents.** Source readability is optimized for LLM consumption first;
   humans with a programming background can read it too, but they are the secondary reader.
- **Tooling makes creation and editing easy for users.** The intended editor is *not* a Word clone —
   it is a genuinely easy document editor that abstracts layout complexity by *reducing*
   capabilities to what matters: the 90% of what people actually want and need from a document.
   The format's small closed directive set is what makes that reduction possible.

## The format in ten lines

1. YAML frontmatter = document metadata + document data.
2. Root-level `---` = section separator (Marp / reveal-md / Deckset convention).
3. Five directives, all HTML comments: `mb:section`, `mb:block`…`mb:/block`, `mb:columns`/`mb:col`…`mb:/columns`, `mb:var`.
4. Plain Markdown needs no markup: maximal unannotated runs = one implicit block (spec §6.1 — format law, not editor policy).
5. A block whose first node is an image / image list / media link is a media block; the rest is its caption.
6. Attributes: `key=value` on the opening line only; `id`, `label`, `preset` shared by all structural directives.
7. Media `kind` is inferred when hand-authored, **stamped by the editor on save**; a stamped kind that contradicts the body is an error, not a silent reclassification (spec §6.2).
8. Editor stamps stable `id`s; never derived from positions (spec §6.3).
9. A `var` and its fenced payload are one lexical unit; vars are section data, frontmatter is document data.
10. Validation fails loud with locations; unknown kinds/attributes/duplicates are errors; unknown presets are renderer warnings.

## Project structure

```text
md-blocks-spec.md  ← the format spec (v1, adopted 2026-09-10) — THE document
BRIEF.md           ← the reduced authoring brief for LLM instruction sets (synced with Agents_Prime_Chat.md)
DECISIONS.md       ← the decision record: why the format looks this way (read before editing md-blocks-spec.md)
demo/              ← tutorial + example documents (all validate clean via tools/validate.js)
  showcase.md      ← the tutorial; exercises every construct
  aurora-deck.md   ← slideshow demo (section = slide, per-slide vars)
  handbook-excerpt.md ← paged print demo (section = page, preset=page-break)
  mara-voss-portfolio.md
  images/
  rendered/        ← generated HTML (page/print/deck profiles) — committed as result examples
tools/             ← DEMONSTRATION artifacts, not the reference implementation (see below)
  validate.js      ← illustrative structural validator (zero-dep Node); walks the spec's rules
  render.js        ← illustrative tri-profile renderer (page/print/deck)
experiments/       ← format experiments with candidate syntax (NOT in the spec; validator errors expected)
modules/
  nui_wc2/         ← submodule (herrbasan/nui_wc2): the NUI library, home of the future
                     nui-blocks renderer — vendored so renderer work can be tried against the spec
_Archive/          ← history: proposals A–D, ranking, authoring-test runs + report
  proposal-a-kimi/  proposal-b-astra/  proposal-c-claude/  proposal-d-merged/
  proposal-ranking.md
  test-runs/       ← 9 model-authored documents + REPORT.md (the evidence for the design)
```

### Spec repo boundary — what belongs here

This repo is **the spec and its evidence**, plus demonstrations. `tools/` exists to show that the
format is implementable and to keep the examples honest; it is deliberately *not* the reference
implementation, and no consumer should depend on its internals.

The real consumers are **separate projects**:

- the **renderer** — the `nui-blocks` component in the nui library (`nui_wc2`), consumed by
  `nui-markdown`; **vendored here as the `modules/nui_wc2` submodule** (2026-09-11) so renderer
  work can be developed and tried against the spec in one workspace. It stays its own project:
  consumer-side work items belong in the `nui_wc2` repo's issues, and the submodule pin is only
  updated deliberately (check against upstream before editing inside it — never edit a stale pin).
- the **editor** — a `nui` addon.

Anything executable that ships to users lives there, not here. This format was originally developed
inside `nui_wc2` (`docs/cms-migration/`), so consumer-side work items belong in that repo's issues.
Because two separate implementations now read this spec, **ambiguity in it is a real bug**: if an
implementer would have to guess, the spec is wrong, not the implementer.

## Status and next steps

- **Spec v1.2, locked** (2026-09-11). Spec contains only format rules; history and decisions log
  live in DECISIONS.md. No parser, validator, renderer, or editor exists yet.
- Next: a zero-dependency JS parser/validator. Spec §10 (conformance cases) is the fixture list;
  §7 (validation) and §8 (round-trip contract) define its behavior. The archived test-runs are
  additional real-world fixtures.
- Consumers (renderers, editors, migration adapters) are separate projects;
  this repo contains the spec and its examples only.

## Working agreements

- **Every edit to md-blocks-spec.md is a format decision.** Record it: bump the spec's status header
  version, and append to the decisions log in [DECISIONS.md](DECISIONS.md) rather than editing history away.
  The spec itself contains only what is needed to understand the format; removed section numbers are
  never reused so external `§`-references stay valid.
- The showcase must stay valid: after touching it, run `node tools/validate.js demo/*.md`
  (zero errors required; warnings should be zero too).
- New examples go in `demo/`; they must validate clean and use only the five directives.
- The spec is the contract. Renderer presets, frontmatter schemas, and editor UX are **profiles** —
  they live with their consumers, not in this repo.
- **Edit `md-blocks-spec.md`, not the demonstration tools.** When `tools/` and the spec disagree, the
  spec wins and the tool is what gets fixed — but never treat a tool's behavior as the definition.
