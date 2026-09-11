# Authoring test — the main marker form (2026-09-11)

## Question

A **main** is the chrome scope: the unit a renderer fragments into surfaces (one section per
slide; physical pages for print) and the unit that owns the running header/footer. Two forms were
proposed for it, and two consulted models split on which to adopt:

- **pair** — `<!-- mb:main id=… -->` … `<!-- mb:/main -->`, mirroring `block` and `columns`.
- **break** — `<!-- mb:main id=… -->` opens a scope; it ends where the next one begins, or at EOF.

`glm5-chat` argued for the break (a break has no inferred boundaries; a pair adds a
whole-document-spanning malformed state). `kimi-k3-chat` argued for the pair, on guessability: *"a
model that has seen `block`/`columns` will write `mb:/main` and be right"* — under break-only that
natural guess becomes a parse error.

That claim is testable, so it was tested rather than argued.

## Method

Three models, three capability tiers, **fresh context each**, two conditions. Each condition shows
one example deck (identical except for the main form) and asks for the same document: six slides,
the first two a chrome-less title sequence, the last four carrying a running header and footer,
one of them a two-column comparison.

- **A** — the example uses the **pair** form.
- **B** — the same example uses the **break** form, with the rule stated: *a scope needs no closing
  marker.*

Mechanical measures: does the output use the form it was shown; are scopes opened and (in A)
closed; is chrome placed first inside its scope; did any model write a close it was not shown (B),
which is the guessability claim under test.

Raw outputs: [runs.md](runs.md).

## Results

| Condition | Model | Form followed | Main errors | Other |
|---|---|---|---|---|
| A (pair) | glm5-chat | 3 scopes, 3 closes | none | valid |
| A (pair) | kimi-k3-chat | 2 scopes, 2 closes | none | valid |
| A (pair) | deepseek-flash-chat | 2 scopes, 2 closes | none | valid |
| B (break) | glm5-chat | 2 markers, **0 closes** | none | mis-nested `/columns` |
| B (break) | kimi-k3-chat | 2 markers, **0 closes** | none | valid |
| B (break) | deepseek-flash-chat | 2 markers, **0 closes** | none | valid |

## Findings

1. **Both forms are equally teachable from one example: 6/6 followed the form they were shown**,
   with chrome placed first inside the scope, columns used correctly, and no missed boundaries.
2. **The guessability claim is refuted.** Zero of three models wrote `mb:/main` when the example
   showed a break. Models generalise from the example they are given, not from `block`/`columns`
   precedent. The asymmetry kimi predicted does not exist, so it cannot decide the question.
3. **What remains is the pair's cost:** a malformed state that spans the whole document (an
   unclosed main, whose error must cite a line far above) — for no capability the break lacks.
   A chrome-less tail is still expressible under the break: start another main and give it no
   chrome blocks.
4. **Incidental find — a real bug in v1.2.** All three models in condition A wrote
   `<!-- mb:/col -->`. That directive **does not exist** in the spec: §4.3 defines `col` as a bare
   marker, and §7 makes a stray close an error. The current spec would therefore reject the
   majority of first-pass decks over a construct nobody questioned. Per the project's own rule —
   *if an implementer would have to guess, the spec is wrong, not the implementer* — `mb:/col` is
   legalised in v1.3.

## Verdict

**The break form is adopted.** The decision rests on items 1–3: teachability is identical, the
predicted failure mode does not occur, and the pair buys nothing the break cannot express, at the
cost of a document-spanning error class. This also matches the structural rule the format already
follows — nested containers (`block`, `columns`) close with a pair; siblings in a sequence
(sections, mains) are delimited by a break.

The result is weaker than the format's other tests in one respect worth stating: the claim tested
was a model's prediction, not a measurement of real-world authoring. Six documents is enough to
refute a universal claim ("a model *will* write `mb:/main`"); it is not enough to prove that no
author ever will.
