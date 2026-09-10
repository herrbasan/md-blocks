---
title: Aurora Desk
customer: Aurora Systems
year: 2026
tags: [Product, Interactive, Markdown]
cover: images/hero.svg
status: concept
slideshow:
  autoplay: false
  loop: false
  defaultSeconds: 15
---

# Aurora Desk

<!-- bm:block id=opening preset=lead label="Opening statement" -->
A showroom experience that lets visitors explore at their own pace. One screen, a clear invitation,
and enough room to be curious.

This page is also a live sample of the format: every block boundary, image, and piece of data you see
is authored in plain Markdown.
<!-- bm:/block -->

In GitHub or VS Code this reads as an ordinary project page with horizontal rules between its parts.
In the enhanced renderer each rule is a section boundary, and the same source gains columns, cards,
a gallery, and media players. Document-level data — title, tags, slideshow defaults — lives in the
frontmatter above.

<!-- bm:block preset=hero focal={"x":0.5,"y":0.3} -->
![Illustration of the Aurora showroom experience](images/hero.svg)

**The starting point:** a quiet invitation to explore, not a screen full of instructions.
<!-- bm:/block -->

The block above is *hand-authored*: no `kind`, no `id`. A parser infers `kind=image` from its first
node. The block below is the same content **after one editor save** — the editor stamped the resolved
`kind` and a stable `id`. From then on, `kind` is authoritative: if the image stops being the first
node, validation fails loud instead of silently reclassifying the block as text.

<!-- bm:block id=hero-stamped kind=image preset=hero focal={"x":0.5,"y":0.3} label="Showroom hero" -->
![Illustration of the Aurora showroom experience](images/hero.svg)

**Stamped by the editor:** `kind=image` and `id=hero-stamped` were written by the tool, not the author.
<!-- bm:/block -->

<!-- Author note: this is an ordinary comment, not a directive. -->

## A small brief

- Welcome visitors without requiring staff assistance.
- Make the product understandable through direct exploration.
- Let interested visitors continue the conversation later.

> The interface should explain itself through what the visitor can do next.

---

# A useful split

The main story gets more space than the supporting facts. On a narrow screen the source order still
reads well: story first, facts second.

<!-- bm:columns id=product-split weights=[2,1] label="Story and facts" -->
<!-- bm:col label="The story" -->
## Explore without a script

Visitors move directly between features, compare options, and return to an overview whenever they want.
The interface supports exploration rather than forcing a single sequence.

1. Choose an area of interest.
2. Look closer at the details.
3. Save a useful next step.

![Illustration of the product kiosk](images/kiosk.svg)

The image above is plain Markdown — no directive, no block. It belongs to this column's implicit
Markdown run (§7.1): the same chunk boundaries on every parse, in every tool.

<!-- bm:col preset=card label="Project facts" -->
## At a glance

| Detail | Choice |
|---|---|
| Format | Interactive kiosk |
| Audience | Showroom visitors |
| Input | Touch |
| Year | 2026 |

**Constraint:** the essential journey must work without sound.
<!-- bm:/columns -->

The column region ended above. Together with the heading and intro paragraph, this trailing paragraph
is part of *this section's* implicit Markdown run — maximal consecutive ordinary nodes, flushed only
by the next directive or section break.

---

# A collection, not three separate images

A block that starts with a list of images is one gallery. An editor reorders its items without touching
the surrounding structure; a generic preview shows a list of images.

<!-- bm:block id=project-gallery kind=image preset=gallery label="Project image sequence" -->
- ![The showroom hero illustration](images/hero.svg)
- ![The kiosk detail illustration](images/kiosk.svg)
- ![The launch illustration](images/launch.svg)

**Three views of one experience.** This caption belongs to the whole collection; each image keeps its
own alternative text.
<!-- bm:/block -->

When one image needs its own caption or crop, give it its own block.

---

<!-- bm:section id=visitor-journey preset=dark label="Visitor journey slide" -->
<!-- bm:var name=seconds value=12 -->

# The visitor journey

Three steps, shown as cards in enhanced output. The `---` above opened this section; the directive on
its first line gives it an id and a dark preset, and `seconds` is this section's own data.

<!-- bm:columns id=journey-steps label="Journey cards" -->
<!-- bm:col preset=card -->
## 1. Discover

![Illustration of a tour step](images/tour.svg)

A short overview makes the choices visible before committing to a path.

<!-- bm:col preset=card -->
## 2. Explore

![Illustration of the kiosk](images/kiosk.svg)

Details appear when they are useful. The overview stays one obvious action away.

<!-- bm:col preset=card -->
## 3. Continue

![Illustration of the launch](images/launch.svg)

The visitor leaves with a useful next step rather than an obligation to finish a form.
<!-- bm:/columns -->

> A good journey has an invitation, room to explore, and a clear way out.

---

# Notes and deliberate boundaries

## A note is still content

<!-- bm:block id=editorial-note preset=note label="Editorial note" -->
### Note: content survives the theme

The word **Note** is authored here, not injected by the preset. If the styling disappears, the message
must not.
<!-- bm:/block -->

<!-- bm:block id=publication-warning preset=warning label="Publication warning" -->
### Warning: hidden does not mean private

Comments and vars are part of the source file. Do not put credentials or private customer information
in a document that will be distributed publicly.
<!-- bm:/block -->

## Two separately movable regions

<!-- bm:block id=decision label="The decision" -->
**Decision:** keep the overview visible while a visitor compares details.
<!-- bm:/block -->

<!-- bm:block id=rationale label="The rationale" -->
**Rationale:** visitors should not have to remember the structure of the experience.

A second block. Save and reload must never merge it with the first.
<!-- bm:/block -->

## An image that is *not* media

<!-- bm:block id=linked-illustration label="Explanation first, image second" -->
Because this block starts with a paragraph of text, it is a text block. The image below is inline
Markdown content, not a media leaf:

[![Kiosk illustration linked to the spec](images/kiosk.svg)](spec.md)
<!-- bm:/block -->

## Code remains code

<!-- bm:block id=literal-syntax label="Literal directive examples" -->
An example, not a nested block. Even the apparent closing marker inside the fence stays literal:

````md
<!-- bm:block id=example preset=note -->
### This belongs to an example

```js
const content = 'Markdown, not an executable template';
```

<!-- bm:/block -->
````

This paragraph still belongs to the outer block. Only the real close below ends it.
<!-- bm:/block -->

---

<!-- bm:var name=seconds value=20 -->

# Data with an explicit home

Named data has exactly two homes. Data about the **document** is frontmatter. Data about **one section**
is a `var` inside that section. This section's `seconds` is independent of the visitor-journey section's
`seconds`; nothing is inherited, nothing needs a scope flag.

## A structured section value

<!-- bm:var name=transition -->
```json
{
  "type": "fade",
  "seconds": 0.6
}
```

A var and its fence are **one lexical unit** — nothing may come between them, and the editor moves
them together.

## A readable note for a presenter

<!-- bm:var name=presenter-note -->
```text
Explain the idea before discussing the syntax.
The important contrast is content versus editing structure.
```

---

<!-- bm:section id=colophon label="Closing slide" -->

This closing section has no heading, which the `---` convention allows for free. One themed section
(**The visitor journey**); the next `---` resets it. Every heading, image, link, and caption is ordinary
Markdown; document data is frontmatter; section data is `var`; structure is five directives and one rule.
