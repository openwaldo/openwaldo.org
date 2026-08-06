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

(() => {
  const explorer = document.querySelector('[data-corpus-explorer]');
  if (!explorer) return;

  const fallbackCorpora = [
    ['science/pes2o', 'Open-Access Papers', 39552347762, 6108982, 'CC-BY-4.0'],
    ['core/common-pile/stackexchange', 'Stack Exchange', 21812312528, 30987453, 'CC-BY-SA'],
    ['law/caselaw', 'United States Caselaw', 17426449985, 6918857, 'Public domain'],
    ['core/common-pile/wikimedia', 'Wikimedia', 14091099944, 16270398, 'CC-BY-SA-4.0'],
    ['government/usgpo', 'US Government Publishing Office', 7774131037, 2009402, 'Public domain'],
    ['core/books/gutenberg', 'Project Gutenberg', 5601863578, 61297, 'CC0-1.0'],
    ['core/common-pile/youtube', 'YouTube Transcripts', 4073362588, 986374, 'CC-BY-4.0'],
    ['core/common-pile/wikiteam', 'WikiTeam Archives', 2943095688, 10230106, 'CC-BY-SA-3.0'],
    ['core/books/doab', 'Directory of Open Access Books', 2804023659, 403917, 'Mixed Creative Commons'],
    ['science/plos', 'PLOS Articles', 2734709557, 391454, 'Mixed open licenses'],
    ['government/uk-hansard', 'UK Parliament Hansard', 2012229928, 47894, 'Open Parliament Licence'],
    ['core/common-pile/ubuntu-irc', 'Ubuntu IRC Logs', 1762060903, 214962, 'Public domain'],
    ['government/regulations', 'US Federal Rulemaking', 1280789827, 192436, 'Public domain'],
    ['post-train/sft/aya', 'Aya Dataset', 104293685, 193211, 'Apache-2.0'],
    ['core/common-pile/foodista', 'Foodista', 20967715, 65640, 'CC-BY-3.0'],
    ['post-train/sft/oasst2', 'OpenAssistant Conversations 2', 6156748, 13852, 'Apache-2.0'],
    ['post-train/sft/oasst1', 'OpenAssistant Conversations 1', 4075556, 10362, 'Apache-2.0'],
    ['post-train/sft/dolly', 'Databricks Dolly', 2647410, 14996, 'CC-BY-SA-3.0'],
    ['core/common-pile/python-enhancement-proposals', 'Python Enhancement Proposals', 2535956, 655, 'Public domain'],
    ['core/common-pile/public-domain-review', 'The Public Domain Review', 1508728, 1406, 'CC-BY-SA-4.0'],
  ].map(([path, title, tokens, docs, license]) => ({
    path, title, tokens, docs,
    description: 'An indexed corpus with attributable source and license metadata, canonical content-addressed shards, and exact counts.',
    licenses: { [license]: { tokens } },
  }));

  const fallback = {
    generated: '2026-08-06T14:20:58Z', tokens: 124010662782,
    docs: 75123654, bytes: 167759371114, shards: 1051,
    corpora: fallbackCorpora,
  };

  let status = fallback;
  let selectedPath = fallback.corpora[0].path;
  let query = '';
  const tree = explorer.querySelector('[data-corpus-tree]');
  const detail = explorer.querySelector('[data-corpus-detail]');
  const search = explorer.querySelector('#corpus-search');
  const feedState = explorer.querySelector('[data-feed-state]');
  const feedDot = explorer.querySelector('.snapshot-dot');

  const compact = (number) => {
    if (number >= 1e9) return `${(number / 1e9).toFixed(number >= 1e11 ? 1 : 2)}B`;
    if (number >= 1e6) return `${(number / 1e6).toFixed(1)}M`;
    return number.toLocaleString();
  };
  const byteSize = (number) => number ? `${(number / 1e9).toFixed(1)} GB` : '—';
  const add = (parent, tag, text, className) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    node.textContent = text;
    parent.appendChild(node);
    return node;
  };

  const updateTotals = () => {
    const licenseCount = Object.keys(status.licenses || {}).length || new Set(
      status.corpora.flatMap((corpus) => Object.keys(corpus.licenses || {})),
    ).size;
    const values = {
      tokens: compact(status.tokens), docs: compact(status.docs),
      corpora: String(status.corpora.length), bytes: `${(status.bytes / 1e9).toFixed(1)}GB`,
      shards: Number(status.shards || 0).toLocaleString(), licenses: licenseCount.toLocaleString(),
    };
    Object.entries(values).forEach(([key, value]) => {
      document.querySelectorAll(`[data-total="${key}"]`).forEach((target) => {
        target.textContent = value;
      });
    });
  };

  const renderDetail = (corpus) => {
    detail.replaceChildren();
    const licenses = Object.keys(corpus.licenses || {});
    const sources = Array.isArray(corpus.sources) ? corpus.sources : [];
    const encodedPath = corpus.path.split('/').map(encodeURIComponent).join('/');

    add(detail, 'p', corpus.path, 'detail-path');
    add(detail, 'h2', corpus.title || corpus.name || corpus.path);
    add(detail, 'p', corpus.description || 'An indexed corpus with attributable source and license metadata, canonical content-addressed shards, and exact counts.');

    const heading = add(detail, 'h3', 'Accountability record', 'record-heading');
    heading.id = 'accountability-record';
    const evidence = document.createElement('div');
    evidence.className = 'evidence-status';
    [
      ['Origin claim', sources.length ? 'Recorded' : 'Not exposed', Boolean(sources.length)],
      ['License assertion', licenses.length ? `${licenses.length} recorded` : 'Not exposed', Boolean(licenses.length)],
      ['Conversion identity', corpus.converted_by || corpus.format || 'Not exposed', Boolean(corpus.converted_by || corpus.format)],
      ['Object inventory', corpus.shards ? `${corpus.shards.toLocaleString()} shards` : 'Not exposed', Boolean(corpus.shards)],
      ['Exact counts', Number.isFinite(corpus.docs) && Number.isFinite(corpus.tokens) ? 'Recorded' : 'Not exposed', Number.isFinite(corpus.docs) && Number.isFinite(corpus.tokens)],
      ['Index revision', status.index_commit ? status.index_commit.slice(0, 12) : 'Inspectable', true],
    ].forEach(([label, value, present]) => {
      const row = document.createElement('div');
      row.className = present ? 'evidence-present' : 'evidence-missing';
      add(row, 'span', label);
      add(row, 'strong', value);
      evidence.appendChild(row);
    });
    detail.appendChild(evidence);

    const source = document.createElement('div');
    source.className = 'source-note';
    add(source, 'span', 'Recorded sources');
    if (sources.length) {
      sources.slice(0, 4).forEach((item) => {
        const value = item.origin || item.name || item.url || 'Recorded in manifest';
        const line = add(source, item.url ? 'a' : 'p', value);
        if (item.url) { line.href = item.url; line.rel = 'noopener'; }
      });
      if (sources.length > 4) add(source, 'p', `+ ${sources.length - 4} more in the public manifest`, 'more-sources');
    } else {
      add(source, 'p', 'Source evidence is not exposed in this status snapshot.', 'missing-copy');
    }
    detail.appendChild(source);

    const licenseBox = document.createElement('div');
    licenseBox.className = 'license-list';
    add(licenseBox, 'span', 'Asserted licenses');
    if (licenses.length) licenses.forEach((license) => add(licenseBox, 'b', license));
    else add(licenseBox, 'p', 'License assertions are not exposed in this status snapshot.', 'missing-copy');
    detail.appendChild(licenseBox);

    const list = document.createElement('dl');
    [
      ['Conversion', corpus.converted_by || '—'],
      ['Format', corpus.format || '—'],
      ['Reference tokens', corpus.tokens.toLocaleString()],
      ['Documents', corpus.docs.toLocaleString()],
      ['Canonical data', byteSize(corpus.bytes)],
      ['Shards', corpus.shards ? corpus.shards.toLocaleString() : '—'],
    ].forEach(([label, value]) => {
      const row = document.createElement('div');
      add(row, 'dt', label); add(row, 'dd', value); list.appendChild(row);
    });
    detail.appendChild(list);

    const links = document.createElement('div');
    links.className = 'record-links';
    const metadata = add(links, 'a', 'Inspect record ↗', 'text-action');
    metadata.href = `https://github.com/openwaldo/waldo-index/tree/main/${encodedPath}`;
    const history = add(links, 'a', 'View history ↗', 'text-action');
    history.href = `https://github.com/openwaldo/waldo-index/commits/main/${encodedPath}`;
    const correction = add(links, 'a', 'Question a claim ↗', 'text-action');
    correction.href = 'https://github.com/openwaldo/waldo-index/issues/new';
    detail.appendChild(links);
  };

  const render = () => {
    tree.replaceChildren();
    const visible = status.corpora.filter((corpus) =>
      `${corpus.path} ${corpus.title || corpus.name}`.toLowerCase().includes(query.toLowerCase()));
    const groups = new Map();
    visible.forEach((corpus) => {
      const branch = corpus.path.split('/')[0];
      if (!groups.has(branch)) groups.set(branch, []);
      groups.get(branch).push(corpus);
    });

    groups.forEach((corpora, branch) => {
      const section = document.createElement('section'); section.className = 'tree-branch';
      const heading = document.createElement('h2');
      add(heading, 'span', '▾'); heading.append(`${branch}/`);
      add(heading, 'b', `${corpora.length} ${corpora.length === 1 ? 'record' : 'records'}`);
      section.appendChild(heading);
      corpora.forEach((corpus) => {
        const button = document.createElement('button');
        button.type = 'button';
        if (corpus.path === selectedPath) button.className = 'active';
        const names = document.createElement('span');
        add(names, 'strong', corpus.title || corpus.name || corpus.path);
        add(names, 'small', corpus.path.split('/').slice(1).join('/'));
        button.appendChild(names); add(button, 'b', 'public record');
        const markers = document.createElement('small');
        markers.className = 'tree-evidence';
        const markerText = [
          corpus.sources?.length ? 'origin recorded' : 'origin not exposed',
          Object.keys(corpus.licenses || {}).length ? 'license recorded' : 'license not exposed',
          corpus.shards ? 'objects recorded' : 'objects not exposed',
        ];
        markers.textContent = markerText.join(' · ');
        button.appendChild(markers);
        button.addEventListener('click', () => { selectedPath = corpus.path; render(); renderDetail(corpus); });
        section.appendChild(button);
      });
      tree.appendChild(section);
    });

    if (!visible.length) add(tree, 'p', `No corpus matches “${query}”.`, 'empty-search');
    const selected = status.corpora.find((corpus) => corpus.path === selectedPath) || visible[0] || status.corpora[0];
    if (selected) renderDetail(selected);
  };

  search.addEventListener('input', () => { query = search.value.trim(); render(); });
  updateTotals(); render();

  fetch('https://openwaldo.github.io/waldo-index/status.json')
    .then((response) => { if (!response.ok) throw new Error('status unavailable'); return response.json(); })
    .then((liveStatus) => {
      if (!liveStatus || !Array.isArray(liveStatus.corpora)) throw new Error('invalid status');
      status = liveStatus;
      feedState.textContent = 'Live public index';
      feedDot.className = 'live-dot';
      updateTotals(); render();
    })
    .catch(() => {
      feedState.textContent = 'Verified local snapshot';
      feedDot.className = 'snapshot-dot';
    });
})();

// Keep the homepage corpus record live from the same public status feed as
// the explorer. The HTML remains a complete verified snapshot if the feed is
// unavailable, so a network failure never leaves an empty or broken section.
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
