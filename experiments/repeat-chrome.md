---
title: Aurora Desk — Concept Deck
year: 2026
---

<!-- EXPERIMENT — candidate syntax, NOT in spec v1.2.
     Question: how does chrome-as-authored-blocks feel?
     Rules assumed here:
       - `repeat=header|footer` on an ordinary block; chrome belongs to the MAIN (chrome
         scope) and a renderer repeats it per surface (each slide, each printed page).
       - Multiple blocks may share a slot; stacking order = source order (implicit).
       - The FIRST block in a slot establishes the strip's extent; every further block
         overlays within that extent, in source order. (Renderer maps this — grid stack
         or absolute — format law only fixes extent + order semantics.)
       - Chrome blocks leave the section flow — they never render inline.
       - Canonical position: top of the main, before the first content.
     Finding (2026-09-11, first render): two CONTENT blocks in one slot collide — the overlay
       covers the extent-definer. Overlay is for a plate + content (see repeat-overlay.md),
       not for two text/icon elements; for badge + kicker a single block with `icon=` is the
       right tool.
     Finding (2026-09-11, main model): a section holding nothing but chrome templates is not a
       surface — chrome is not content — or the canonical "chrome at the top of the main"
       placement would put a blank slide in front of every deck.
     Open: should a main be open/close or a single break marker? Does `preset` on a main mean
           anything (in a slide profile it is inherited by its surfaces) or is layout its bolt?
           Overlay larger than the extent: clip/expand/shrink — renderer profile's call? -->

<!-- mb:block repeat=header preset=image:icon icon=../demo/images/abstract-1.jpg alt="Aurora" -->
**Aurora Desk** · Concept · 2026
<!-- mb:/block -->

<!-- mb:block repeat=footer -->
Aurora Systems — internal draft. [Imprint](https://aurora.example/imprint)
<!-- mb:/block -->

# A desk that thinks in surfaces

Plain Markdown slide. No markup needed — the chrome above should appear here
without being part of this sentence's flow.

<!-- mb:var name=seconds value=12 -->

---

<!-- mb:section preset=band -->

## Modularity without gravity

<!-- mb:columns weights=[2,1] -->
<!-- mb:col -->
Every surface reconfigures in seconds. The rail system carries power, light,
and data — accessories click in anywhere along it.
<!-- mb:col preset=card -->
**12 kg** per module, tool-free.
<!-- mb:/columns -->

---

<!-- mb:block preset=image:hero -->
![The Aurora Desk in band configuration](../demo/images/hero.jpg)

Prototype 4, band configuration with the low rail.
<!-- mb:/block -->

<!-- mb:block preset=card:note -->
Shipping spring 2027. Pricing follows the module count, not the desk size.
<!-- mb:/block -->
