# Blocks Markdown — authoring test results

> **Date:** 2026-09-08. **Status:** Real data — settles (partially) the question posed in
> [`../proposal-ranking.md`](../proposal-ranking.md) §"The test that would settle it".
> **Method:** each proposal's *showcase only* (no spec) was given to a model with a fixed brief:
> author a photographer portfolio with document metadata, hero, two-column split, 3+ image gallery,
> callout, and one section variable. Outputs were then validated strictly against the proposal's spec
> by a fresh model. Two authoring models: DeepSeek V4 Flash (strong) and a local 27B (weak).
> Runs: [`a-deepseek.md`](a-deepseek.md) [`a-llama.md`](a-llama.md) [`b-deepseek.md`](b-deepseek.md)
> [`b-llama.md`](b-llama.md) [`c-deepseek.md`](c-deepseek.md) [`c-llama.md`](c-llama.md).

## Result matrix

| Run | Parse ERRORs | WARNINGs | Required elements valid (of 6) |
|---|---:|---:|---:|
| A × DeepSeek | 0 | 1 | 5 (callout impossible — see below) |
| A × 27B | 1 | 2 | 4 |
| B × DeepSeek | 0 | 0 | **6** |
| B × 27B | 1 | 1 | 4 |
| C × DeepSeek | 0 | 0 | **6** |
| C × 27B | 0 | 4 | **1** |

## Per-run notes

- **A × DeepSeek** — clean adoption of the six-word vocabulary, valid `var` forms, correct column
  counts. One invented `sections:` document field (warning). Callout missing *because A has no callout
  mechanism* — a format capability gap, not an authoring failure.
- **A × 27B** — invented `<!-- callout -->`, a seventh kind → hard parse error (A rejects unknown
  kinds). No `var` at all. Also multi-line media attributes and missing blank lines after images.
- **B × DeepSeek** — flawless. `bm:` prefix, explicit boundaries, caption grammar, weights, scopes —
  all correct on first pass. Directly contradicts the blind review's "4/10 guessability" for B.
- **B × 27B** — adopted the vocabulary but tripped on the strictest rule: `caption=true` followed by a
  `bm:block` instead of a caption paragraph (error), and placed a section var before its heading
  (mis-scoped, warning). No callout block.
- **C × DeepSeek** — flawless. Frontmatter, `---` sections, blocks, gallery, vars with fenced payloads.
- **C × 27B** — the most interesting failure. It copied the YAML frontmatter and **nothing else**:
  zero `bm:` directives, zero `---` separators. Columns faked as a table, gallery as loose images,
  callout as a blockquote, variables as bold prose. The document parses (plain markdown is valid in C)
  while implementing none of the format.

## What this confirms

1. **C's surface is the most learnable for a strong model** — but so is B's. With DeepSeek, B and C
   tie at zero errors and 6/6 elements. The ranking's guessability gap (C 9 vs B 4) did not reproduce.
2. **C's forgiving parser hides failure.** The 27B's C document scores "0 errors" while being
   format-free. B's strictness converts the same class of mistake into a loud error at the exact
   location. For an *editor round-trip*, loud is what you want; for the "0 errors" metric, C wins by
   not checking. Error counts alone overstate C.
3. **A's vocabulary ceiling is real.** The callout task is unexpressible in A — there is no preset or
   block-typing mechanism. Both models hit it: one omitted, one invented a kind and got rejected.
4. **Weak models discriminate more than strong ones.** The interesting signal is in the 27B row:
   A → adopted vocabulary, one invented kind; B → adopted vocabulary, tripped on strictness; C →
   ignored the vocabulary entirely. Frontmatter is so dominant a convention that it may *shadow* the
   directive system below it for weak models.

## What this does not settle

- **N=1 per cell.** One document, one brief, two models. The 27B C-failure could be run-specific.
- **Round-trip was not tested.** B's core strength (editor parse → mutate → serialize) has no
  measurement here. The ranking's (d) scores stand untested.
- **The brief favored B/C.** "Callout" is a preset-block concept only B and C have; A was guaranteed
  to lose that element.

## Bottom line

The ranking's *order* survives (C first is still defensible — strongest model output is equal to B's
with a smaller spec), but the *margins* do not: B is far more authorable than the blind review scored
it, and C's "0 errors" metric is partly an artifact of not validating. The deciding question is now
the one the test didn't cover: **what does the editor do with each format?** C + B's validator as the
implementation layer (the ranking's own suggestion) remains the most supported path.

---

# Round 2 — proposal D (merged), 2026-09-10

Same protocol, new subjects: [`d-deepseek.md`](d-deepseek.md) [`d-qwen.md`](d-qwen.md)
[`d-gemma.md`](d-gemma.md). Models: DeepSeek V4 Flash (strong), Qwen3.8 27B (local), Gemma 4 12B QAT
(local, small). Validation this round was **mechanical** (a deterministic rule checker implementing
D §3–§8: frontmatter, directive grammar, blockers/closers, col/weights counts, dup ids/keys, var fences,
JSON payloads) — no LLM judge.

## Result matrix

| Run | Parse ERRORs | WARNINGS | Required elements valid (of 6) |
|---|---:|---:|---:|
| D × DeepSeek | 1 | 0 | 6 |
| D × Qwen 27B | 1 | 0 | 6 |
| D × Gemma 12B | **0** | **0** | 6 |

## The two errors

- **DeepSeek:** one bare `<!-- bm:var name=commission -->` — a var with neither `value=` nor a fence.
  Placed as a "declaration" before a heading, mimicking the showcase's `seconds` placement but dropping
  the value. Loud, located, trivially fixable — exactly the failure shape the format wants.
- **Qwen:** one JSON typo in `focal={"x":0.5,"y":0.32"}` (stray quote). The rest of the document —
  including hand-stamped `kind=image` on hero and gallery — is conformant.

## What stands out

1. **Universal adoption.** All three models — down to a 12B local model — adopted the *entire* format:
   frontmatter, `---` sections, blocks, columns with correct weights arity, gallery, callouts, section
   vars, fenced payloads. Compare C × 27B in round 1, which used none of the format. The D showcase
   (which teaches hand-authored vs editor-stamped side by side) apparently pulls weak models in far
   better than C's did.
2. **Models hand-stamp `kind` voluntarily.** All three wrote `kind=image` on their galleries (Qwen and
   Gemma also on heroes) — copying the showcase's stamped example. Authors can produce editor-ready
   documents; the stamp is not a barrier.
3. **DeepSeek reproduced the subtle parts.** It left its hero unstamped (copying the hand-authored
   example), and reproduced the §7.1 implicit-run trailing paragraph. Its single error is a slip, not
   a misunderstanding.
4. **Gemma's misfires stayed off the page.** Its (unrequested) analysis invented directive kinds
   (`hr`, `image`, `gallery` as kinds) — but the document it actually wrote uses only valid kinds.
   Off-convention remnants: an unknown `preset=light` (renderer warning by design) and a CTA block
   missing `preset=cta`.

## Bottom line, updated

D passes the test that motivated it: maximal adoption across three capability tiers, all required
elements present in all runs, and the only two errors are small, loud, and located. The merged
format's guessability is at least C's, with none of C's silent-failure modes — the "no structure"
diagnostic is now also covered by §8. Remaining untested: round-trip under a real editor, and N=1 per
model as before.
