# openwaldo.org

The OpenWALDO project website — https://openwaldo.org

> **Open Weights. Open Artifacts. Open Licenses. Open Data. Open Origins.**
> **OpenWALDO.**

Plain static HTML/CSS, no build step, no external dependencies. Served by
GitHub Pages from the `main` branch root (`CNAME` sets the custom domain;
`.nojekyll` disables Jekyll processing).

## Layout

```
index.html          home — the thesis, live corpus counter, WALDO checklist
how.html            the machinery: index, lookaside, CLI, license bar, ladder, examples
community.html      how to contribute, the roles, who's here, sponsors, badges
about.html          the case for open source AI, how the project runs, the founder
faq.html            questions answered, grouped by audience
404.html            not in the index
assets/style.css    the one shared stylesheet
assets/main.js      nav toggle, scroll reveal, hero glimmer, corpus counter
assets/favicon.svg  the stripes
assets/badges/      the Open Source AI — OpenWALDO badges
```

## The corpus counter

The front page's stats strip (tokens, documents, size, licenses) loads live
from the status feed the index repo publishes:
`https://openwaldo.github.io/waldo-index/status.json`. Nothing in this repo
generates or stores those numbers — they update whenever the index does. The
feed records the index commit and generation date, which the strip displays
as its provenance chip; the numbers count up on scroll, and the license
spectrum bar shows each license's share of tokens (hover for exact counts).

## Editing

Edit the HTML, push to `main`, GitHub Pages redeploys. To preview locally:

```console
$ python3 -m http.server -d . 8080
# → http://localhost:8080
```

Preview through the server, not `file://` — `404.html` uses absolute asset
paths (GitHub Pages serves it for missing URLs at any depth), so opening it
as a file renders unstyled.

The `www.openwaldo.org` repo holds the redirect from www to the apex domain.

Related repositories: [`openwaldo/waldo`](https://github.com/openwaldo/waldo)
(the toolchain) and
[`openwaldo/waldo-index`](https://github.com/openwaldo/waldo-index) (the data
tree).
