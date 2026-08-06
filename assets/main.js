// OpenWALDO primary site — small shared behaviors, no dependencies.

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

// Update the Corpus page's inline scale sentence. The page remains complete
// with its checked-in snapshot when the public status feed is unavailable.
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

  fetch('https://openwaldo.github.io/waldo-index/status.json')
    .then((response) => { if (!response.ok) throw new Error('status unavailable'); return response.json(); })
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
    .catch(() => {});
})();

// Keep the homepage corpus record live from the same public status feed. The
// HTML snapshot remains visible if the network is unavailable.
(() => {
  const total = document.querySelector('[data-home-total]');
  if (!total) return;

  const compact = (number) => {
    if (number >= 1e9) return `${(number / 1e9).toFixed(number >= 1e11 ? 1 : 2)}`;
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

  fetch('https://openwaldo.github.io/waldo-index/status.json')
    .then((response) => { if (!response.ok) throw new Error('status unavailable'); return response.json(); })
    .then((status) => {
      if (!status || !Array.isArray(status.corpora) || !status.tokens) throw new Error('invalid status');
      total.textContent = compact(status.tokens);
      set('[data-home-docs]', compact(status.docs));
      set('[data-home-corpora]', status.corpora.length.toLocaleString());
      set('[data-home-shards]', Number(status.shards || 0).toLocaleString());
      set('[data-home-licenses]', Object.keys(status.licenses || {}).length.toLocaleString());
      set('[data-home-feed]', dateLabel(status.generated));

      const branches = new Map();
      status.corpora.forEach((corpus) => {
        const branch = corpus.path.split('/')[0];
        branches.set(branch, (branches.get(branch) || 0) + Number(corpus.tokens || 0));
      });
      document.querySelectorAll('[data-branch]').forEach((node) => {
        const tokens = branches.get(node.dataset.branch) || 0;
        const share = tokens / status.tokens * 100;
        node.style.setProperty('--branch-width', `${Math.max(share, .1)}%`);
        node.title = `${tokens.toLocaleString()} reference tokens`;
        const label = node.querySelector('b');
        if (label) label.textContent = `${share < .1 ? '<0.1' : share.toFixed(1)}%`;
      });
    })
    .catch(() => {});
})();
