# openwaldo.org

The OpenWALDO project website — https://openwaldo.org

> **Open Weights. Open Artifacts. Open Licenses. Open Data. Open Origins.**
> **Open WALDO.**

Plain static HTML/CSS, no build step, no external dependencies. Served by
GitHub Pages from the `main` branch root (`CNAME` sets the custom domain;
`.nojekyll` disables Jekyll processing).

**Pre-launch staging:** the site currently lives under `kl24bg/` while the
root `index.html` shows a "coming soon" page — GitHub Pages has no
server-side auth, so the unpublished path is the gate. To launch: move
everything in `kl24bg/` back to the repo root (replacing the coming-soon
`index.html`) and push.

## Layout

```
index.html          coming soon (pre-launch placeholder)
kl24bg/            the actual site, pre-launch:
index.html          home — the thesis and the WALDO checklist
why.html            the case: open weights is not open source
how.html            the machinery: index, lookaside, CLI, license bar, ladder
use-cases.html      companies, institutions, builders
contribute.html     how to contribute: data, code, hosting, curation
about.html          the founder and the why
404.html            not in the index
assets/style.css    the one shared stylesheet
assets/main.js      nav toggle, scroll reveal, hero letter glow
assets/favicon.svg  the stripes
```

## The corpus counter

The front page's stats strip (tokens, documents, size, licenses) reads
`assets/stats.json`, which is generated — not hand-maintained — by walking a
`waldo-index` checkout's metadata (root `index.json` → directory indexes →
manifests → shards):

```console
$ python3 tools/corpus-stats.py ../waldo-index -o kl24bg/assets/stats.json
wrote kl24bg/assets/stats.json: 35,682,197 tokens, 106,262 docs, 7 licenses across 7 manifest(s)
```

Re-run it and commit whenever the index grows (a CI job or cron can do the
same). The JSON also records the index commit and generation date, which the
strip displays as its provenance line.

## Editing

Edit the HTML, push to `main`, GitHub Pages redeploys. To preview locally:

```console
$ python3 -m http.server -d . 8080
# → http://localhost:8080
```

The `www.openwaldo.org` repo holds the redirect from www to the apex domain.

Related repositories: [`openwaldo/waldo`](https://github.com/openwaldo/waldo)
(the toolchain) and
[`openwaldo/waldo-index`](https://github.com/openwaldo/waldo-index) (the data
tree).
