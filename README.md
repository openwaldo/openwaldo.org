# openwaldo.org

The OpenWALDO project website — https://openwaldo.org

> **Open Weights. Open Artifacts. Open Licenses. Open Data. Open Origins.**
> **Open WALDO.**

Plain static HTML/CSS, no build step, no external dependencies. Served by
GitHub Pages from the `main` branch root (`CNAME` sets the custom domain;
`.nojekyll` disables Jekyll processing).

## Layout

```
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
