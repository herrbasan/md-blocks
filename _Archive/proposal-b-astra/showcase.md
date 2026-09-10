<!-- bm:document
  version: 1
  data: {"title":"Aurora Desk — a Blocks Markdown showcase","customer":"Aurora Systems","year":2026,"tags":["Product","Interactive","Markdown"],"status":"concept"}
-->

<!-- bm:var name=autoplay scope=document value=false -->

# Aurora Desk

<!-- bm:block id=opening preset=lead label="Opening statement" -->
A showroom experience that lets visitors explore at their own pace. One screen, a clear invitation,
and enough room to be curious.

This fictional project is also a live-format sample: the text you are reading, its media references,
and its block boundaries are all authored in Markdown.
<!-- bm:/block -->

In an ordinary preview, this is a readable project page. In an enhanced renderer, the same source adds
columns, grouped cards, a gallery, and media players. The renderer does not invent the copy.

<!-- bm:media id=hero kind=image preset=hero focal={"x":0.5,"y":0.3} caption=true -->
![Illustration of the Aurora showroom experience](../demo/images/hero.svg)

**The starting point:** a quiet invitation to explore, not a screen full of instructions.

<!-- Author note: this is ordinary editorial commentary, not a Blocks Markdown directive. -->

## A small brief

- Welcome visitors without requiring staff assistance.
- Make the product understandable through direct exploration.
- Let interested visitors continue the conversation later.

> The interface should explain itself through what the visitor can do next.

# A useful split

The main story gets more space than the supporting facts. On a narrow screen, the same source order
remains useful: story first, facts second.

<!-- bm:columns id=product-split count=2 weights=[2,1] label="Story and supporting facts" -->
<!-- bm:col id=product-story label="The story" -->
## Explore without a script

Visitors can move directly between features, compare options, and return to an overview whenever they
want. The interface supports exploration rather than forcing a single sequence.

1. Choose an area of interest.
2. Look closer at the details.
3. Save a useful next step.

![Illustration of the product kiosk](../demo/images/kiosk.svg)

This image needs no directive: a standalone image in column flow is an implicit media leaf. The
paragraph after it is a new Markdown leaf. Those editing rules do not affect ordinary preview readability.

<!-- bm:col id=product-facts preset=card label="Project facts" -->
## At a glance

| Detail | Choice |
|---|---|
| Format | Interactive kiosk |
| Audience | Showroom visitors |
| Input | Touch |
| Year | 2026 |

**Constraint:** the essential journey must work without sound.

<!-- bm:/columns -->

The column region ends here. This paragraph is full-width flow again, not an accidental continuation
of the fact box.

# A collection, not three separate blocks

The following list is one explicitly grouped media block. An editor can reorder its items without
changing the surrounding page structure. A generic preview simply presents a list of images.

<!-- bm:media id=project-gallery kind=image preset=gallery caption=true label="Project image sequence" -->
- ![The showroom hero illustration](../demo/images/hero.svg)
- ![The kiosk detail illustration](../demo/images/kiosk.svg)
- ![The launch illustration](../demo/images/launch.svg)

**Three views of one experience.** This is a caption for the whole collection; each image keeps its own
alternative description.

When an image needs its own caption or crop, give it its own media block. A gallery does not guess
which neighbouring sentence belongs to which item.

<!-- bm:section id=visitor-journey preset=dark label="Visitor journey slide" -->
# The visitor journey

<!-- bm:var name=seconds scope=section value=12 -->

Three steps, arranged as cards in enhanced output. This heading and the preceding section directive
belong to one section, not two. A slideshow renderer can use this section as one slide.

<!-- bm:columns id=journey-steps count=3 label="Journey cards" -->
<!-- bm:col id=step-discover preset=card label="Discovery card" -->
## 1. Discover

![Illustration of a tour step](../demo/images/tour.svg)

A short overview makes the choices visible. Visitors can see what there is to explore before committing
to a path.

<!-- bm:col id=step-explore preset=card label="Exploration card" -->
## 2. Explore

![Illustration of the kiosk](../demo/images/kiosk.svg)

Details appear when they are useful. The overview remains one obvious action away.

<!-- bm:col id=step-continue preset=card label="Continuation card" -->
## 3. Continue

![Illustration of the launch](../demo/images/launch.svg)

The visitor leaves with a useful next step rather than an obligation to finish a form.

<!-- bm:/columns -->

> A good journey has an invitation, room to explore, and a clear way out.

# Media that travels

This plain heading starts a fresh section. It does **not** inherit the previous section's dark preset
or its section-scoped timing value.

The next two resources are public MDN sample assets, not Aurora project footage or sound. The image
is an illustrative poster. They demonstrate that enhanced playback does not require broken fallback
markup or opaque database IDs.

## Video with a linked poster

<!-- bm:media id=sample-video kind=video caption=true label="Public video fixture" -->
[![Illustrative poster; follow the link to the flower video sample](../demo/images/launch.svg)](https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4)

**Video fixture:** the MDN flower clip. Ordinary previews offer a linked image; enhanced output can
provide a video player using the same target and poster.

## Audio as a useful link

<!-- bm:media id=sample-audio kind=audio caption=true label="Public audio fixture" -->
[Play the MDN dinosaur-roar audio sample](https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3)

**Audio fixture:** a short sample sound, not narration for this project. Playback is a renderer behavior;
the descriptive link remains useful without a player.

Playback URLs were checked while this proposal was authored. They remain external resources and require
network access. Neither parsing the format nor rendering ordinary text requires fetching them first.

# Writing, notes, and deliberate boundaries

This section uses ordinary Markdown for **strong emphasis**, *emphasis*, ~~revised wording~~, `inline code`,
and a [reference-style link to the format specification][format-spec].

## A note is still content

<!-- bm:block id=editorial-note preset=note label="Editorial note" -->
### Note: content survives the theme

The word **Note** is authored here. It is not secretly injected by the presentation preset.

- In enhanced output, the block can receive a distinct visual treatment.
- In ordinary output, its heading and text still communicate its purpose.
  - Nested list indentation is meaningful Markdown and must be preserved.

> If the styling disappears, the essential message should not disappear with it.
<!-- bm:/block -->

<!-- bm:block id=publication-warning preset=warning label="Publication warning" -->
### Warning: hidden does not mean private

Comments and variables remain part of the source file. Do not put credentials or private customer
information in a document that will be distributed publicly.
<!-- bm:/block -->

## Two separately movable text regions

<!-- bm:block id=decision label="The decision" -->
**Decision:** keep the overview visible while a visitor compares details.

This paragraph and its preceding decision belong to one movable editor block.
<!-- bm:/block -->

<!-- bm:block id=rationale label="The rationale" -->
**Rationale:** visitors should not have to remember the structure of the experience while exploring it.

This is a second block. Saving and reloading must not merge it with the first merely because both contain
Markdown paragraphs.
<!-- bm:/block -->

## A linked image inside a content block

<!-- bm:block id=linked-illustration label="Image and explanation kept together" -->
[![Kiosk illustration linked to the format specification](../demo/images/kiosk.svg)](spec.md)

The image and this explanation are one Markdown block. Inside an explicit content block, images do not
get extracted into independently movable media leaves.
<!-- bm:/block -->

## Review checklist

- [x] Copy reads in source order.
- [x] Important messages have visible labels.
- [x] Images have authored alternative descriptions.
- [ ] Validate the future enhanced renderer at narrow widths.
- [ ] Verify visual editing and source editing preserve the same structure.

## Code remains code

<!-- bm:block id=literal-syntax label="Literal directive examples" -->
The following is an example, not a real nested block. Even the apparent closing marker inside the fence
must remain literal text:

````md
<!-- bm:block id=example preset=note -->
### This belongs to an example

```js
const content = 'Markdown, not an executable template';
```

<!-- bm:/block -->
````

This paragraph still belongs to the outer example block. Only the following actual closing marker ends it.
<!-- bm:/block -->

# Data with an explicit home

Named data is separate from page content. Small values can live entirely inside comments; larger values
can be ordinary fenced payloads, visible in generic previews and consumed as data by the enhanced parser.

<!-- bm:var name=seconds scope=section value=20 -->

This section's `seconds` value is independent of the visitor-journey section's value. A consumer must
ask for the appropriate scope; the format does not perform hidden inheritance.

## Example slideshow configuration

<!-- bm:var name=slideshow scope=document -->
```json
{
  "loop": false,
  "defaultSeconds": 15,
  "navigation": "manual"
}
```

The fence above is a data payload, not code to run. In an ordinary Markdown preview it is still readable.
Those field names belong to an example consuming application, not to the core format grammar.

## Presenter note

<!-- bm:var name=presenter-note scope=section -->
```text
Explain the idea before discussing the syntax.
The important distinction is content versus editing structure.
```

The presenter note is intentionally visible in basic previews. It is not confidential, and the enhanced
page renderer does not insert it into the body automatically.

# Keep the source useful

The format and this sample are ordinary files. Downloads do not need a special element vocabulary:
one explicit file block can group ordinary links.

<!-- bm:media id=source-downloads kind=file label="Source documents" -->
- [Read or save the proposed format specification](spec.md)
- [Read or save this Markdown showcase](showcase.md)

## Continue exploring

<!-- bm:block id=next-step preset=cta label="Next-step link" -->
**Prefer to inspect the rules?** [Read the format proposal](spec.md).

The link text and destination are authored content. A renderer may emphasize the link, but it must not
replace the wording with a generated button label.
<!-- bm:/block -->

---

This showcase is a source-format proposal, not output from an implemented `nui-blocks` renderer. It has
eight sections. The only explicitly themed section is **The visitor journey**; the next H1 resets it.

The companion [specification][format-spec] includes validation rules, round-trip requirements, and cases
that belong in a future conformance suite. It also calls out features intentionally left out of this revision.

[format-spec]: spec.md "Blocks Markdown — editor-oriented proposal"