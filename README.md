# openwaldo.org

The OpenWALDO project website — https://openwaldo.org

> **Open Weights. Open Artifacts. Open Licenses. Open Data. Open Origins.**
> **OpenWALDO.**

Plain static HTML/CSS, no build step, no external dependencies. Served by
GitHub Pages from the `main` branch root (`CNAME` sets the custom domain;
`.nojekyll` disables Jekyll processing).

## Primary site

```
index.html          project thesis and live corpus record
corpus.html         live, searchable corpus explorer
using.html          model lifecycle and current implementation boundaries
contributing.html   corpus contribution workflow
posts/              generated Markdown archive and individual posts
about.html          project purpose and principles
assets/style.css    primary visual system
assets/main.js      corpus feed, explorer, and shared accessibility
```

The detailed walkthroughs and FAQ remain at their established URLs. They use
`assets/legacy.css` and `assets/legacy.js` until their content is folded into
the primary site. Keeping them separate prevents the production documentation
from breaking during the visual migration.

## The corpus counter

The front page corpus record and the corpus explorer load live
from the status feed the index repo publishes:
`https://openwaldo.github.io/waldo-index/status.json`. Nothing in this repo
generates those numbers — they update whenever the index does. Both pages ship
with a complete local snapshot, so the corpus remains useful if the live feed
is temporarily unavailable.

## Posts

Posts are markdown files in `posts/content/` named `YYYY-MM-DD-slug.md`,
with flat frontmatter (`title`, `type`, `author`, `description`, optional
`logo`). Publishing is just adding the file and pushing: the deploy
workflow (`.github/workflows/deploy.yml`) runs
`.scripts/build-posts-index.py` to generate `posts/index.json` — the
listing and search index — and ships it in the Pages artifact. The file is
gitignored; to test locally, run the script yourself, then serve:

```console
$ python3 .scripts/build-posts-index.py
wrote posts/index.json: 2 post(s)
$ python3 -m http.server -d . 8080
```

Note: deploys go through GitHub Actions now — the repo's Pages source must
be set to "GitHub Actions" (Settings → Pages → Source).

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
