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
  const setAll = (key, value) => {
    document.querySelectorAll(`[data-total="${key}"]`).forEach((node) => {
      node.textContent = value;
    });
  };

  fetch('https://openwaldo.github.io/waldo-index/status.json')
    .then((response) => { if (!response.ok) throw new Error('status unavailable'); return response.json(); })
    .then((status) => {
      if (!status || !Array.isArray(status.corpora) || !status.tokens) throw new Error('invalid status');
      const licenseCount = Object.keys(status.licenses || {}).length || new Set(
        status.corpora.flatMap((corpus) => Object.keys(corpus.licenses || {})),
      ).size;
      setAll('corpora', status.corpora.length.toLocaleString());
      setAll('shards', Number(status.shards || 0).toLocaleString());
      setAll('docs', compact(status.docs));
      setAll('tokens', compact(status.tokens));
      setAll('licenses', licenseCount.toLocaleString());
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
