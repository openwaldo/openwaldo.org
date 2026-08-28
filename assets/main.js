// OpenWALDO primary site — small shared behaviors, no dependencies.

// Give important calls to action a consistent Umami event and enough context
// to compare the same action in different parts of the site.
(() => {
  const page = (() => {
    const path = window.location.pathname.replace(/\/$/, '');
    const name = path.split('/').pop() || 'home';
    return name.replace(/\.html$/, '') || 'home';
  })();

  const actionFor = (element) => {
    const href = element.getAttribute?.('href') || '';
    if (/join\.slack\.com/i.test(href)) return 'join-slack';
    if (/(?:^|\/)browser\.html(?:$|[?#])/i.test(href)) return 'browse-corpus';
    if (/(?:^|\/)training\.html(?:$|[?#])/i.test(href)) return 'explore-training';
    if (/(?:^|\/)contributing\.html(?:$|[?#])/i.test(href)) return 'contribute-data';
    if (/github\.com\/openwaldo/i.test(href)) return 'open-github';
    if (/x\.com\/openwaldo|huggingface\.co\/openwaldo/i.test(href)) return 'follow-project';
    if (/(?:^|\/)about\.html(?:$|[?#])/i.test(href)) return 'read-about';
    if (/linkedin\.com\/sharing|x\.com\/intent|bsky\.app\/intent|reddit\.com\/submit/i.test(href)) {
      return 'share-project';
    }
    if (element.matches?.('[data-share-community], [data-copy-community]')) return 'share-project';
    if (/community\.html(?:$|[?#])|^#(?:join|ways|corpus|project|spread)$/i.test(href)) {
      return 'explore-community';
    }
    return '';
  };

  const locationFor = (element) => {
    const section = element.closest?.('section, footer, header');
    if (!section) return page;
    if (section.id) return `${page}:${section.id}`;
    if (section.matches('footer')) return `${page}:footer`;
    if (section.matches('header')) return `${page}:header`;
    const sectionClass = [...section.classList].find(
      (name) => !['section', 'dark-section', 'light-section'].includes(name),
    );
    if (sectionClass) return `${page}:${sectionClass}`;
    return page;
  };

  const prepare = (root) => {
    const selector = [
      'a.button',
      'a.text-action',
      'a.door-card',
      '.footer-project-links a',
      '[data-share-community]',
      '[data-copy-community]',
    ].join(',');
    const elements = root.matches?.(selector) ? [root] : root.querySelectorAll?.(selector) || [];

    elements.forEach((element) => {
      const action = actionFor(element);
      if (!action) return;
      element.dataset.umamiEvent = 'cta-click';
      element.dataset.umamiEventAction = action;
      element.dataset.umamiEventLocation = locationFor(element);
      element.dataset.umamiEventLabel = (element.textContent || '').replace(/\s+/g, ' ').trim();
    });
  };

  prepare(document);
  new MutationObserver((changes) => {
    changes.forEach((change) => {
      change.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) prepare(node);
      });
    });
  }).observe(document.documentElement, { childList: true, subtree: true });
})();

// Keep navigation within OpenWALDO in the current tab while opening absolute
// web links separately. Observe additions because posts and corpus records are
// rendered after this script runs.
(() => {
  const isExternal = (href) => /^(?:https?:)?\/\//i.test(href.trim());
  const prepare = (root) => {
    const links = root.matches?.('a[href]') ? [root] : root.querySelectorAll?.('a[href]') || [];
    links.forEach((link) => {
      if (!isExternal(link.getAttribute('href') || '')) return;
      const rel = new Set((link.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
      rel.add('noopener');
      rel.add('noreferrer');
      link.target = '_blank';
      link.rel = [...rel].join(' ');
    });
  };

  prepare(document);
  new MutationObserver((changes) => {
    changes.forEach((change) => {
      if (change.type === 'attributes') prepare(change.target);
      change.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) prepare(node);
      });
    });
  }).observe(document.documentElement, {
    attributeFilter: ['href'],
    attributes: true,
    childList: true,
    subtree: true,
  });
})();

// Shared keyboard affordance for every static page using the primary theme.
const mainContent = document.querySelector('main');
if (mainContent) {
  mainContent.id ||= 'main-content';
  const skip = document.createElement('a');
  skip.className = 'skip-link';
  skip.href = '#main-content';
  skip.textContent = 'Skip to content';
  document.body.prepend(skip);
}

// Progressive mobile navigation. Without JavaScript the links remain visible;
// once enhanced, the button controls a compact full-width menu on small screens.
(() => {
  const header = document.querySelector('.site-header');
  const shell = header?.querySelector('.nav-shell');
  const nav = shell?.querySelector('nav');
  if (!header || !shell || !nav) return;

  nav.id ||= 'primary-navigation';
  const toggle = document.createElement('button');
  toggle.className = 'nav-toggle';
  toggle.type = 'button';
  toggle.setAttribute('aria-controls', nav.id);
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Open navigation');

  const label = document.createElement('span');
  label.textContent = 'Menu';
  const icon = document.createElement('i');
  icon.setAttribute('aria-hidden', 'true');
  toggle.append(label, icon);
  shell.insertBefore(toggle, nav);
  header.classList.add('nav-enhanced');

  const setOpen = (open) => {
    header.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  };

  toggle.addEventListener('click', () => setOpen(!header.classList.contains('nav-open')));
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && header.classList.contains('nav-open')) {
      setOpen(false);
      toggle.focus();
    }
  });
  window.matchMedia('(min-width: 701px)').addEventListener('change', (event) => {
    if (event.matches) setOpen(false);
  });
})();

// status.json is the canonical public aggregate feed. Keep stats.json as a
// compatibility fallback for older or alternate index publishers.
const fetchIndexStats = async () => {
  const feeds = [
    'https://openwaldo.github.io/waldo-index/status.json',
    'https://openwaldo.github.io/waldo-index/stats.json',
  ];
  for (const feed of feeds) {
    try {
      const response = await fetch(feed);
      if (response.ok) return await response.json();
    } catch (_) {
      // Try the compatibility feed before falling back to checked-in HTML.
    }
  }
  throw new Error('index statistics unavailable');
};

// FAQ accordion and durable deep links. Only one answer remains open, and the
// selected question is reflected in ?faq= so the exact state can be shared.
(() => {
  const items = [...document.querySelectorAll('.faq-item[data-faq]')];
  if (!items.length) return;

  const selectedKey = () => new URLSearchParams(window.location.search).get('faq');
  const updateUrl = (key) => {
    const url = new URL(window.location.href);
    if (key) url.searchParams.set('faq', key);
    else url.searchParams.delete('faq');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  };

  items.forEach((item) => {
    item.addEventListener('toggle', () => {
      if (item.open) {
        items.forEach((other) => { if (other !== item) other.open = false; });
        updateUrl(item.dataset.faq);
      } else if (selectedKey() === item.dataset.faq) {
        updateUrl(null);
      }
    });
  });

  const requested = selectedKey();
  const target = requested && items.find((item) => item.dataset.faq === requested);
  if (target) {
    target.open = true;
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
    });
  }
})();

// Community share helper. The social links work without JavaScript; this adds
// a convenient copy action with a visible success state.
(() => {
  const copyButton = document.querySelector('[data-copy-community]');
  const shareButton = document.querySelector('[data-share-community]');
  if (!copyButton && !shareButton) return;
  const status = document.querySelector('[data-copy-status]');
  copyButton?.addEventListener('click', () => {
    navigator.clipboard.writeText('https://openwaldo.org/').then(() => {
      if (status) status.textContent = 'Copied: https://openwaldo.org/';
    }).catch(() => {
      if (status) status.textContent = 'Copy failed — use https://openwaldo.org/';
    });
  });
  if (shareButton && navigator.share) {
    shareButton.hidden = false;
    shareButton.addEventListener('click', () => {
      navigator.share({
        title: 'Join the OpenWALDO AI community',
        text: 'AI is not open source without the source. Join the OpenWALDO AI community.',
        url: 'https://openwaldo.org/',
      }).catch(() => {});
    });
  }
})();

// Update the Corpus page's inline scale sentence. The page remains complete
// with its checked-in snapshot when the public statistics feed is unavailable.
(() => {
  const summary = document.querySelector('[data-corpus-summary]');
  if (!summary) return;

  const compact = (number) => {
    if (number >= 1e9) return `${(number / 1e9).toFixed(number >= 1e11 ? 1 : 2)}B`;
    if (number >= 1e6) return `${(number / 1e6).toFixed(1)}M`;
    return number.toLocaleString();
  };
  const gigabytes = (number) => `${(number / 1e9).toFixed(1)} GB`;
  const setAll = (key, value) => {
    document.querySelectorAll(`[data-total="${key}"]`).forEach((node) => {
      node.textContent = value;
    });
  };
  const setBom = (key, value) => {
    const node = document.querySelector(`[data-bom="${key}"]`);
    if (node) node.textContent = value;
    return node;
  };

  fetchIndexStats()
    .then((status) => {
      if (!status || !Array.isArray(status.corpora) || !Number.isFinite(status.tokens)
        || !Number.isFinite(status.docs) || !Number.isFinite(status.shards)
        || !Number.isFinite(status.bytes)) throw new Error('invalid status');
      const licenseCount = Object.keys(status.licenses || {}).length || new Set(
        status.corpora.flatMap((corpus) => Object.keys(corpus.licenses || {})),
      ).size;
      setAll('corpora', status.corpora.length.toLocaleString());
      setAll('shards', Number(status.shards || 0).toLocaleString());
      setAll('docs', compact(status.docs));
      setAll('tokens', compact(status.tokens));
      setAll('licenses', licenseCount.toLocaleString());

      const revision = status.index_commit || 'Unavailable';
      const revisionLink = setBom('revision', `${revision} ↗`);
      if (revisionLink && status.index_commit) revisionLink.href = `https://github.com/openwaldo/waldo-index/tree/${status.index_commit}`;
      setBom('selection', `${status.corpora.length.toLocaleString()} public corpora`);
      setBom('objects', `${Number(status.shards || 0).toLocaleString()} shards · ${gigabytes(status.bytes)}`);
      setBom('contents', `${compact(status.docs)} documents · ${compact(status.tokens)} tokens`);
      setBom('licenses', `${licenseCount.toLocaleString()} license identifiers`);
      const generated = new Date(status.generated);
      if (!Number.isNaN(generated.valueOf())) {
        setBom('generated', `Generated ${generated.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`);
      }
    })
    .catch(() => {
      setBom('revision', 'Unavailable');
      setBom('selection', 'Live index unavailable');
      setBom('generated', 'Live index unavailable');
    });
})();

// Keep the homepage corpus record live from the same public statistics feed. The
// HTML starts empty so a network failure never presents stale totals as current.
(() => {
  const total = document.querySelector('[data-home-total]');
  if (!total) return;

  const compact = (number) => {
    if (number >= 1e9) return `${(number / 1e9).toFixed(number >= 1e11 ? 1 : 2)}B`;
    if (number >= 1e6) return `${(number / 1e6).toFixed(1)}M`;
    return number.toLocaleString();
  };
  const set = (selector, value) => {
    const node = document.querySelector(selector);
    if (node) node.textContent = value;
  };
  const dateLabel = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.valueOf())
      ? 'Live public index'
      : `Live public index · ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  fetchIndexStats()
    .then((status) => {
      if (!status || !Array.isArray(status.corpora) || !status.tokens) throw new Error('invalid status');
      total.textContent = compact(status.tokens);
      set('[data-home-docs]', compact(status.docs));
      set('[data-home-corpora]', status.corpora.length.toLocaleString());
      set('[data-home-shards]', Number(status.shards || 0).toLocaleString());
      set('[data-home-licenses]', Object.keys(status.licenses || {}).length.toLocaleString());
      set('[data-home-feed]', dateLabel(status.generated));

      const branchMap = document.querySelector('[data-home-branches]');
      const branches = new Map();
      status.corpora.forEach((corpus) => {
        const branch = corpus.path.split('/')[0];
        branches.set(branch, (branches.get(branch) || 0) + Number(corpus.tokens || 0));
      });
      const ranked = [...branches.entries()].sort((a, b) => b[1] - a[1]);
      const displayed = ranked.slice(0, 4);
      displayed.push(['others', ranked.slice(4).reduce((sum, entry) => sum + entry[1], 0)]);
      if (branchMap) branchMap.replaceChildren(...displayed.map(([branch, tokens], index) => {
        const share = tokens / status.tokens * 100;
        const node = document.createElement('div');
        node.className = `branch ${branch === 'others' ? 'branch-others' : `branch-rank-${index + 1}`}`;
        node.style.setProperty('--branch-width', `${Math.max(share, .1)}%`);
        node.title = `${tokens.toLocaleString()} reference tokens`;
        const row = document.createElement('div');
        const name = document.createElement('span');
        const label = document.createElement('b');
        name.textContent = `${branch}/`;
        label.textContent = `${share > 0 && share < .1 ? '<0.1' : share.toFixed(1)}%`;
        row.append(name, label);
        node.append(row, document.createElement('i'));
        return node;
      }));
    })
    .catch(() => {
      set('[data-home-feed]', 'Live index unavailable');
      const branchMap = document.querySelector('[data-home-branches]');
      if (branchMap) branchMap.textContent = 'The live index could not be loaded.';
    });
})();
