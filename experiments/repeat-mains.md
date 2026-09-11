<!-- EXPERIMENT — chrome scopes. ADOPTED in spec v1.3 (§4.5, §4.6); kept as the working example.
     The reason a main level is needed at all: a deck's title slides carry no chrome,
     the content slides carry it, and the closing slide carries a different one.

     A MAIN is a chrome scope. The renderer fragments it into surfaces (slides, printed
     pages) and repeats its chrome onto each. The source never repeats anything.

     Settled since this file was written: a main marker is a BREAK, not an open/close pair
     (three-model authoring test, _Archive/test-runs/main-marker/), and `preset` on a main
     names the treatment of the surfaces it produces (§4.5.1).

     Top matter: the deck's opening slides have no chrome — so the FIRST main has none. -->

<!-- mb:main preset=cover -->

# Aurora Desk

Concept deck · 2026

---

Who we are, and why this room is empty of chairs.

<!-- mb:main -->

<!-- mb:block repeat=header preset=image:icon icon=../demo/images/abstract-1.jpg alt="Aurora" -->
**Aurora Desk** · Concept · 2026
<!-- mb:/block -->

<!-- mb:block repeat=footer -->
Aurora Systems — internal draft. [Imprint](https://aurora.example/imprint)
<!-- mb:/block -->

---

## Modularity without gravity

<!-- mb:columns weights=[2,1] -->
<!-- mb:col -->
Every surface reconfigures in seconds. The rail system carries power, light, and
data — accessories click in anywhere along it.
<!-- mb:col preset=card -->
**12 kg** per module, tool-free.
<!-- mb:/columns -->

---

<!-- mb:block preset=image:hero -->
![The Aurora Desk in band configuration](../demo/images/hero.jpg)

Prototype 4, band configuration with the low rail.
<!-- mb:/block -->

<!-- mb:main -->

<!-- mb:block repeat=footer -->
Aurora Systems · [aurora.example](https://aurora.example) · thank you
<!-- mb:/block -->

---

# Questions?

<!-- mb:block preset=card:note -->
Shipping spring 2027. Pricing follows the module count, not the desk size.
<!-- mb:/block -->
