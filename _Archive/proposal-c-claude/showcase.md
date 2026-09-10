---
title: Aurora Desk
customer: Aurora Systems
year: 2026
tags: [Product, Interactive, Markdown]
cover: ../demo/images/hero.svg
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

In GitHub or VS Code this reads as an ordinary project page with horizontal rules between its parts. In
the enhanced renderer each rule is a section (or slide) boundary, and the same source gains columns, cards,
a gallery, and media players. The renderer never invents copy. Document-level data — title, tags, the
slideshow defaults — lives in the frontmatter above.

<!-- bm:block id=hero preset=hero focal={"x":0.5,"y":0.3} -->
![Illustration of the Aurora showroom experience](../demo/images/hero.svg)

**The starting point:** a quiet invitation to explore, not a screen full of instructions.
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

![Illustration of the product kiosk](../demo/images/kiosk.svg)

The image above is plain Markdown — no directive. The editor may show it as an image leaf; the format
only cares once someone gives it a preset or a caption.

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

The column region ended above. This paragraph is full-width flow again.

---

# A collection, not three separate images

A block that starts with a list of images is one gallery. An editor reorders its items without touching
the surrounding structure; a generic preview shows a list of images.

<!-- bm:block id=project-gallery preset=gallery label="Project image sequence" -->
- ![The showroom hero illustration](../demo/images/hero.svg)
- ![The kiosk detail illustration](../demo/images/kiosk.svg)
- ![The launch illustration](../demo/images/launch.svg)

**Three views of one experience.** This caption belongs to the whole collection; each image keeps its own
alternative text.
<!-- bm:/block -->

When one image needs its own caption or crop, give it its own block.

---

<!-- bm:section id=visitor-journey preset=dark label="Visitor journey slide" -->
<!-- bm:var name=seconds value=12 -->

# The visitor journey

Three steps, shown as cards in enhanced output. The `---` above opened this section; the directive on its
first line gives it an id and a dark preset, and `seconds` is this section's own data. A slideshow renderer
treats it as one slide.

<!-- bm:columns id=journey-steps label="Journey cards" -->
<!-- bm:col preset=card -->
## 1. Discover

![Illustration of a tour step](../demo/images/tour.svg)

A short overview makes the choices visible before committing to a path.

<!-- bm:col preset=card -->
## 2. Explore

![Illustration of the kiosk](../demo/images/kiosk.svg)

Details appear when they are useful. The overview stays one obvious action away.

<!-- bm:col preset=card -->
## 3. Continue

![Illustration of the launch](../demo/images/launch.svg)

The visitor leaves with a useful next step rather than an obligation to finish a form.
<!-- bm:/columns -->

> A good journey has an invitation, room to explore, and a clear way out.

---

# Media that travels

A fresh section. It inherits neither the dark preset nor `seconds`; the heading is just a heading.

The two resources below are public MDN sample assets used as fixtures. Their kind is read from the
destination — no `kind=` attribute needed.

## Video with a linked poster

<!-- bm:block id=sample-video label="Public video fixture" -->
[![Illustrative poster for the flower video sample](../demo/images/launch.svg)](https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4)

**Video fixture:** the MDN flower clip. Generic previews show a linked poster; enhanced output shows a
player with the same poster and source.
<!-- bm:/block -->

## Audio as a useful link

<!-- bm:block id=sample-audio label="Public audio fixture" -->
[Play the MDN dinosaur-roar audio sample](https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3)

**Audio fixture:** a short sample sound. The descriptive link stays useful without a player.
<!-- bm:/block -->

---

# Writing, notes, and deliberate boundaries

Ordinary Markdown for **strong**, *emphasis*, ~~revised wording~~, `inline code`, and a
[reference-style link to the spec][spec].

## A note is still content

<!-- bm:block id=editorial-note preset=note label="Editorial note" -->
### Note: content survives the theme

The word **Note** is authored here, not injected by the preset.

- In enhanced output the block gets a distinct treatment.
- In plain output its heading and text still say what it is.
  - Nested list indentation is Markdown and is preserved.

---

The rule above is *inside* a block, so it is an ordinary horizontal rule — not a section break.

> If the styling disappears, the message must not.
<!-- bm:/block -->

<!-- bm:block id=publication-warning preset=warning label="Publication warning" -->
### Warning: hidden does not mean private

Comments and vars are part of the source file. Do not put credentials or private customer information in
a document that will be distributed publicly.
<!-- bm:/block -->

## Two separately movable regions

<!-- bm:block id=decision label="The decision" -->
**Decision:** keep the overview visible while a visitor compares details.

This paragraph and the decision above are one movable block.
<!-- bm:/block -->

<!-- bm:block id=rationale label="The rationale" -->
**Rationale:** visitors should not have to remember the structure of the experience while exploring it.

A second block. Save and reload must never merge it with the first.
<!-- bm:/block -->

## An image that is *not* media

<!-- bm:block id=linked-illustration label="Explanation first, image second" -->
Because this block starts with a paragraph of text, it is a text block. The image below is inline
Markdown content, not a media leaf:

[![Kiosk illustration linked to the spec](../demo/images/kiosk.svg)](spec.md)
<!-- bm:/block -->

## Review checklist

- [x] Copy reads in source order.
- [x] Important messages have visible labels.
- [x] Images have authored alternative text.
- [ ] Validate the enhanced renderer at narrow widths.
- [ ] Verify visual and source editing preserve the same structure.

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

Named data has exactly two homes. Data about the **document** — title, tags, slideshow defaults — is
frontmatter. Data about **one section** is a `var` inside that section: small values inside the comment,
large ones as fenced payloads that stay readable in generic previews. This section's `seconds` is
independent of the visitor-journey section's `seconds`; nothing is inherited, nothing needs a scope flag.

## A structured section value

<!-- bm:var name=transition -->
```json
{
  "kind": "fade",
  "milliseconds": 400
}
```

## Presenter note

<!-- bm:var name=presenter-note -->
```text
Explain the idea before discussing the syntax.
The important distinction is content versus editing structure.
```

The presenter note is intentionally visible in basic previews. The page renderer does not insert it into
the body.

---

# Keep the source useful

Downloads are a block that starts with a list of file links:

<!-- bm:block id=source-downloads label="Source documents" -->
- [The format proposal](spec.md)
- [This showcase](showcase.md)
<!-- bm:/block -->

## Continue exploring

<!-- bm:block id=next-step preset=cta label="Next step" -->
**Prefer to inspect the rules?** [Read the format proposal](spec.md).

Link text and destination are authored. A renderer may emphasize the link; it must not replace the wording.
<!-- bm:/block -->

---

<!-- bm:section id=colophon label="Closing slide" -->

Nine sections, separated by eight rules; this closing one has no heading at all, which the `---` convention
allows for free. One themed section (**The visitor journey**); the next `---` resets it. Directives used:
`section` ×2, `block` ×13, `columns` ×2, `col` ×5, `var` ×4. Every heading, image, link, and caption is
ordinary Markdown; document data is frontmatter.

[spec]: spec.md "Blocks Markdown — minimal proposal"
