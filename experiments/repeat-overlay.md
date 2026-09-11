<!-- EXPERIMENT — the OVERLAY case, NOT in spec v1.2.
     The useful overlay shape: a PLATE block defines the slot's extent, CONTENT blocks
     overlay on top of it. Source order = paint order, so the plate comes first.

     Compare with repeat-chrome.md: two content blocks in one slot collide, because the
     overlay fills the extent. Here the collision IS the design — text on a plate. -->

<!-- mb:block repeat=header preset=image:hero -->
![](../demo/images/hero.jpg)
<!-- mb:/block -->

<!-- mb:block repeat=header preset=cover -->
# Aurora Desk

Concept deck · 2026
<!-- mb:/block -->

---

The plate defines the slot's height; the title block paints on top of it. Swap the two
blocks and the title becomes the extent — the hero then scales over the title instead.

---

A second section still carries the same banner, cloned.

<!-- mb:block preset=card:note -->
Per-section opt-out is still an open question: a title slide usually wants no chrome at all.
<!-- mb:/block -->
