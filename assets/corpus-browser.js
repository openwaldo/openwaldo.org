// OpenWALDO corpus browser — status.json drives the table; the selected
// manifest is loaded from the exact public index revision on demand.
(() => {
  'use strict';
  const browser = document.querySelector('[data-corpus-browser]');
  if (!browser) return;

  const security = globalThis.OpenWALDOSecurity;
  if (!security) throw new Error('OpenWALDO security helpers did not load');
  const { applySafeLink } = security;

  const feed = 'https://openwaldo.github.io/waldo-index/status.json';
  const pageSize = 15;
  const manifestCache = new Map();
  const elements = {
    search: browser.querySelector('[data-browser-search]'),
    section: browser.querySelector('[data-browser-section]'),
    license: browser.querySelector('[data-browser-license]'),
    language: browser.querySelector('[data-browser-language]'),
    programmingLanguage: browser.querySelector('[data-browser-programming-language]'),
    sort: browser.querySelector('[data-browser-sort]'),
    reset: browser.querySelector('[data-browser-reset]'),
    rows: browser.querySelector('[data-browser-rows]'),
    pagination: browser.querySelector('[data-browser-pagination]'),
    count: browser.querySelector('[data-browser-result-count]'),
    feed: browser.querySelector('[data-browser-feed]'),
    dot: browser.querySelector('[data-browser-dot]'),
    summary: browser.querySelector('[data-browser-summary]'),
    dialog: document.querySelector('[data-corpus-dialog]'),
    dialogTitle: document.querySelector('[data-dialog-title]'),
    dialogPath: document.querySelector('[data-dialog-path]'),
    dialogLicenses: document.querySelector('[data-dialog-licenses]'),
    dialogContent: document.querySelector('[data-dialog-content]'),
    dialogTabs: document.querySelector('[data-dialog-tabs]'),
    dialogClose: document.querySelector('[data-dialog-close]'),
  };

  const state = {
    status: null,
    corpora: [],
    visible: [],
    page: 1,
    selected: null,
    manifest: null,
    tab: 'overview',
    closingFromHistory: false,
  };

  const add = (parent, tag, text, className) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    parent.appendChild(node);
    return node;
  };
  const number = (value) => Number(value || 0);
  const compact = (value) => {
    const numeric = number(value);
    if (numeric >= 1e9) return `${(numeric / 1e9).toFixed(numeric >= 1e11 ? 1 : 2)}B`;
    if (numeric >= 1e6) return `${(numeric / 1e6).toFixed(1)}M`;
    if (numeric >= 1e3) return `${(numeric / 1e3).toFixed(1)}K`;
    return numeric.toLocaleString();
  };
  const bytes = (value) => {
    const numeric = number(value);
    if (numeric >= 1e9) return `${(numeric / 1e9).toFixed(1)} GB`;
    if (numeric >= 1e6) return `${(numeric / 1e6).toFixed(1)} MB`;
    if (numeric >= 1e3) return `${(numeric / 1e3).toFixed(1)} KB`;
    return `${numeric.toLocaleString()} bytes`;
  };
  const list = (value) => Array.isArray(value) ? value : [];
  const licenses = (corpus) => Object.keys(corpus.licenses || {});
  const languages = (corpus) => list(corpus.languages);
  const programmingLanguages = (corpus) => list(corpus.programming_languages);
  const inputFormats = (corpus, manifest = {}) => [...new Set([
    ...list(corpus.input_formats),
    ...list(manifest.sources).flatMap((source) => list(source.input_formats)),
  ])].sort();
  const section = (corpus) => String(corpus.path || '').split('/')[0] || 'root';
  const corpusText = (corpus) => [
    corpus.title, corpus.name, corpus.path, corpus.description,
    ...list(corpus.sources).flatMap((source) => [source.name, source.origin, source.url]),
    ...licenses(corpus),
    ...languages(corpus),
    ...programmingLanguages(corpus),
    ...inputFormats(corpus),
  ].filter(Boolean).join(' ').toLowerCase();

  // The public manifests use a deliberately small YAML subset: mappings,
  // sequences, scalars, and nested combinations of those forms. Keeping this
  // parser local makes the browser independent of a third-party runtime.
  const parseManifestYaml = (text) => {
    const lines = text.split(/\r?\n/).map((raw) => ({
      indent: raw.match(/^ */)[0].length,
      text: raw.trim(),
    })).filter((line) => line.text && !line.text.startsWith('#'));

    const scalar = (value) => {
      const trimmed = value.trim();
      if ((trimmed.startsWith('"') && trimmed.endsWith('"'))
        || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
        return trimmed.slice(1, -1);
      }
      if (trimmed === 'null' || trimmed === '~') return null;
      if (trimmed === 'true') return true;
      if (trimmed === 'false') return false;
      if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) return Number(trimmed);
      if (trimmed === '[]') return [];
      if (trimmed === '{}') return Object.create(null);
      return trimmed;
    };
    const pair = (value) => {
      const split = value.indexOf(':');
      if (split < 0) return [null, value];
      return [value.slice(0, split).trim(), value.slice(split + 1).trim()];
    };

    const parseBlock = (start, indent) => {
      const array = lines[start]?.indent === indent && lines[start].text.startsWith('-');
      const output = array ? [] : Object.create(null);
      let index = start;
      while (index < lines.length) {
        const line = lines[index];
        if (line.indent < indent || line.indent === indent && line.text.startsWith('-') !== array) break;
        if (line.indent > indent) break;
        if (array) {
          const remainder = line.text.slice(1).trim();
          const [key, value] = pair(remainder);
          if (key === null) {
            output.push(scalar(value));
            index += 1;
            continue;
          }
          const item = Object.create(null);
          if (value) item[key] = scalar(value);
          else if (lines[index + 1]?.indent > indent) {
            const child = parseBlock(index + 1, lines[index + 1].indent);
            item[key] = child.value;
            index = child.index - 1;
          } else item[key] = Object.create(null);
          index += 1;
          if (lines[index]?.indent > indent) {
            const rest = parseBlock(index, lines[index].indent);
            if (rest.value && !Array.isArray(rest.value)) Object.assign(item, rest.value);
            index = rest.index;
          }
          output.push(item);
        } else {
          const [key, value] = pair(line.text);
          if (key === null) throw new Error(`unsupported manifest line: ${line.text}`);
          if (value) {
            output[key] = scalar(value);
            index += 1;
          } else if (lines[index + 1]?.indent > indent) {
            const child = parseBlock(index + 1, lines[index + 1].indent);
            output[key] = child.value;
            index = child.index;
          } else {
            output[key] = Object.create(null);
            index += 1;
          }
        }
      }
      return { value: output, index };
    };

    if (!lines.length) throw new Error('empty manifest');
    return parseBlock(0, lines[0].indent).value;
  };

  const setUrl = (changes, mode = 'replace') => {
    const url = new URL(window.location.href);
    Object.entries(changes).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined || value === 1) {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, String(value));
      }
    });
    window.history[`${mode}State`]({}, '', `${url.pathname}${url.search}${url.hash}`);
  };

  const populateFilters = () => {
    const sections = [...new Set(state.corpora.map(section))].sort();
    const licenseNames = [...new Set(state.corpora.flatMap(licenses))].sort();
    const languageNames = [...new Set(state.corpora.flatMap(languages))].sort();
    const programmingLanguageNames = [
      ...new Set(state.corpora.flatMap(programmingLanguages)),
    ].sort();
    sections.forEach((value) => {
      const option = add(elements.section, 'option', `${value}/`);
      option.value = value;
    });
    licenseNames.forEach((value) => {
      const option = add(elements.license, 'option', value);
      option.value = value;
    });
    languageNames.forEach((value) => {
      const option = add(elements.language, 'option', value);
      option.value = value;
    });
    programmingLanguageNames.forEach((value) => {
      const option = add(elements.programmingLanguage, 'option', value);
      option.value = value;
    });
  };

  const readUrl = () => {
    const params = new URLSearchParams(window.location.search);
    elements.search.value = params.get('q') || '';
    elements.section.value = params.get('section') || '';
    elements.license.value = params.get('license') || '';
    elements.language.value = params.get('language') || '';
    elements.programmingLanguage.value = params.get('programming-language') || '';
    elements.sort.value = params.get('sort') || 'tokens-desc';
    state.page = Math.max(1, Number.parseInt(params.get('page') || '1', 10) || 1);
    return params.get('corpus');
  };

  const filterCorpora = () => {
    const query = elements.search.value.trim().toLowerCase();
    const selectedSection = elements.section.value;
    const selectedLicense = elements.license.value;
    const selectedLanguage = elements.language.value;
    const selectedProgrammingLanguage = elements.programmingLanguage.value;
    state.visible = state.corpora.filter((corpus) =>
      (!query || corpusText(corpus).includes(query))
      && (!selectedSection || section(corpus) === selectedSection)
      && (!selectedLicense || licenses(corpus).includes(selectedLicense))
      && (!selectedLanguage || languages(corpus).includes(selectedLanguage))
      && (!selectedProgrammingLanguage
        || programmingLanguages(corpus).includes(selectedProgrammingLanguage)));

    const sorts = {
      'tokens-desc': (a, b) => number(b.tokens) - number(a.tokens),
      'docs-desc': (a, b) => number(b.docs) - number(a.docs),
      'shards-desc': (a, b) => number(b.shards) - number(a.shards),
      'name-asc': (a, b) => String(a.title || a.name).localeCompare(String(b.title || b.name)),
    };
    state.visible.sort(sorts[elements.sort.value] || sorts['tokens-desc']);
    const pages = Math.max(1, Math.ceil(state.visible.length / pageSize));
    state.page = Math.min(state.page, pages);
  };

  const renderLicenses = (parent, corpus, limit = 2) => {
    const names = licenses(corpus);
    if (!names.length) {
      add(parent, 'span', 'None declared', 'table-muted');
      return;
    }
    names.slice(0, limit).forEach((name) => add(parent, 'span', name, 'table-license'));
    if (names.length > limit) add(parent, 'span', `+${names.length - limit}`, 'table-more');
  };

  const renderLanguages = (parent, corpus) => {
    const human = languages(corpus);
    const programming = programmingLanguages(corpus);
    if (!human.length && !programming.length) {
      add(parent, 'span', 'Not declared', 'table-muted');
      return;
    }
    if (human.length) add(parent, 'span', human.join(' · '), 'table-language');
    if (programming.length) {
      add(parent, 'small', `Code: ${programming.join(' · ')}`, 'table-programming-language');
    }
  };

  const renderRows = () => {
    elements.rows.replaceChildren();
    const start = (state.page - 1) * pageSize;
    const page = state.visible.slice(start, start + pageSize);
    if (!page.length) {
      const row = document.createElement('tr');
      const cell = add(row, 'td', 'No corpus records match these filters.', 'browser-empty');
      cell.colSpan = 8;
      elements.rows.appendChild(row);
      return;
    }

    page.forEach((corpus) => {
      const row = document.createElement('tr');
      row.dataset.corpusPath = corpus.path;
      row.title = `Inspect ${corpus.title || corpus.name}`;
      const nameCell = add(row, 'td');
      const open = add(nameCell, 'button', undefined, 'corpus-row-open');
      add(open, 'strong', corpus.title || corpus.name || corpus.path);
      add(open, 'small', corpus.path);
      open.type = 'button';
      open.addEventListener('click', () => openCorpus(corpus, true));

      add(row, 'td', `${section(corpus)}/`, 'table-section');
      const sourceCell = add(row, 'td', undefined, 'table-sources');
      const sourceNames = list(corpus.sources).map((source) => source.name || source.origin).filter(Boolean);
      sourceCell.textContent = sourceNames[0] || 'Not exposed';
      if (sourceNames.length > 1) add(sourceCell, 'small', `+${sourceNames.length - 1} more`);
      const licenseCell = add(row, 'td', undefined, 'table-licenses');
      renderLicenses(licenseCell, corpus);
      const languageCell = add(row, 'td', undefined, 'table-languages');
      renderLanguages(languageCell, corpus);
      add(row, 'td', number(corpus.docs).toLocaleString(), 'table-number');
      add(row, 'td', compact(corpus.tokens), 'table-number');
      add(row, 'td', number(corpus.shards).toLocaleString(), 'table-number');
      row.addEventListener('click', (event) => {
        if (event.target.closest('button, a')) return;
        openCorpus(corpus, true);
      });
      elements.rows.appendChild(row);
    });
  };

  const renderPagination = () => {
    elements.pagination.replaceChildren();
    const pages = Math.max(1, Math.ceil(state.visible.length / pageSize));
    if (pages <= 1) return;
    const button = (label, page, current = false) => {
      const node = add(elements.pagination, current ? 'span' : 'button', label);
      if (!current) {
        node.type = 'button';
        node.addEventListener('click', () => {
          state.page = page;
          setUrl({ page });
          render();
          browser.scrollIntoView({ block: 'start' });
        });
      } else {
        node.setAttribute('aria-current', 'page');
      }
      return node;
    };
    button('← Previous', Math.max(1, state.page - 1)).disabled = state.page === 1;
    add(elements.pagination, 'span', `Page ${state.page} of ${pages}`, 'pagination-status');
    button('Next →', Math.min(pages, state.page + 1)).disabled = state.page === pages;
  };

  const render = () => {
    filterCorpora();
    const first = state.visible.length ? (state.page - 1) * pageSize + 1 : 0;
    const last = Math.min(state.page * pageSize, state.visible.length);
    elements.count.textContent = `${state.visible.length.toLocaleString()} matching corpora · showing ${first}–${last}`;
    renderRows();
    renderPagination();
  };

  const metricGrid = (items) => {
    const grid = document.createElement('dl');
    grid.className = 'dialog-metrics';
    items.forEach(([label, value]) => {
      const item = document.createElement('div');
      add(item, 'dt', label);
      add(item, 'dd', value);
      grid.appendChild(item);
    });
    return grid;
  };

  const renderOverview = () => {
    const corpus = state.selected;
    const manifest = state.manifest || {};
    add(elements.dialogContent, 'p', corpus.description || 'No description is exposed.', 'dialog-lede');
    elements.dialogContent.appendChild(metricGrid([
      ['Documents', number(corpus.docs).toLocaleString()],
      ['Reference tokens', number(corpus.tokens).toLocaleString()],
      ['Canonical shards', number(corpus.shards).toLocaleString()],
      ['Encoded size', bytes(corpus.bytes)],
      ['Source format', inputFormats(corpus, manifest).join(' · ') || 'Not declared'],
      ['Record schema', String(manifest.record_schema || 'Not exposed')],
      ['Human languages', languages(corpus).join(' · ') || 'Not declared'],
      ['Programming languages', programmingLanguages(corpus).join(' · ') || 'None declared'],
    ]));
    const section = add(elements.dialogContent, 'section', undefined, 'dialog-section');
    add(section, 'h3', 'Conversion identity');
    const converted = manifest.converted_by || corpus.converted_by;
    if (converted && typeof converted === 'object') {
      section.appendChild(metricGrid([
        ['Tool', converted.tool || 'Not exposed'],
        ['Version', converted.version || 'Not exposed'],
        ['Profile', converted.profile || 'Not exposed'],
        ['Recipe', converted.recipe || 'Not exposed'],
      ]));
    } else {
      add(section, 'p', converted || 'Conversion identity is not exposed in this record.');
    }
  };

  const renderSources = () => {
    const sources = list(state.manifest?.sources).length
      ? list(state.manifest.sources) : list(state.selected.sources);
    if (!sources.length) {
      add(elements.dialogContent, 'p', 'No source records are exposed for this corpus.', 'dialog-empty');
      return;
    }
    sources.forEach((source) => {
      const article = add(elements.dialogContent, 'article', undefined, 'source-record');
      const heading = add(article, 'div', undefined, 'source-record-head');
      add(heading, 'h3', source.name || source.source || source.origin || 'Recorded source');
      add(heading, 'span', source.version || 'Version not exposed');
      if (source.url) {
        const link = add(article, 'a', 'Open upstream source ↗', 'text-action');
        if (!applySafeLink(link, source.url, { newTab: true })) link.remove();
      }
      article.appendChild(metricGrid([
        ['License assertion', source.license || state.manifest?.license || 'None declared'],
        ['Category', source.category || 'Not exposed'],
        ['Source format', list(source.input_formats).join(' · ') || 'Not declared'],
        ['Source identity', source.sha256 || 'Not exposed'],
      ]));
      if (source.license_evidence?.declaration) {
        const evidence = add(article, 'div', undefined, 'source-evidence');
        add(evidence, 'span', 'License evidence');
        add(evidence, 'p', source.license_evidence.declaration);
        if (source.license_evidence.url) {
          const link = add(evidence, 'a', 'Inspect evidence ↗');
          if (!applySafeLink(link, source.license_evidence.url, { newTab: true })) link.remove();
        }
      }
      const content = source.content || {};
      const facts = [
        ['Types', list(content.types).join(' · ')],
        ['Languages', list(content.languages).join(' · ')],
        ['Programming languages', list(content.programming_languages).join(' · ')],
        ['Coverage', [content.from, content.to].filter(Boolean).join(' → ')],
        ['Selection', content.selection],
      ].filter(([, value]) => value);
      if (facts.length) article.appendChild(metricGrid(facts));
    });
  };

  const renderShards = () => {
    const shards = list(state.manifest?.shards);
    if (!shards.length) {
      add(elements.dialogContent, 'p', 'The aggregate feed records shard totals, but the pinned manifest could not be loaded.', 'dialog-empty');
      return;
    }
    add(
      elements.dialogContent,
      'p',
      `${shards.length.toLocaleString()} content-addressed objects`,
      'dialog-record-count',
    );
    const wrap = add(elements.dialogContent, 'div', undefined, 'shard-table-wrap');
    const table = add(wrap, 'table', undefined, 'shard-table');
    const head = table.createTHead().insertRow();
    ['Object SHA-256', 'Sources', 'License', 'Documents', 'Tokens', 'Bytes'].forEach((label) => add(head, 'th', label).scope = 'col');
    const body = table.createTBody();
    const resolveShardLicenses = (shard) => {
      const direct = [...list(shard.licenses), shard.license].filter(Boolean);
      if (direct.length) return { names: [...new Set(direct)], scope: 'Shard-level assertion' };

      const shardSources = new Set(list(shard.sources));
      const sourceAssertions = list(state.manifest.sources)
        .filter((source) => shardSources.has(source.name)
          || shardSources.has(source.source)
          || shardSources.has(source.origin))
        .map((source) => source.license)
        .filter(Boolean);
      if (sourceAssertions.length) {
        return { names: [...new Set(sourceAssertions)], scope: 'Source-level assertion' };
      }

      const manifestLicenses = Array.isArray(state.manifest.licenses)
        ? state.manifest.licenses
        : Object.keys(state.manifest.licenses || {});
      const corpusAssertions = [
        ...manifestLicenses,
        state.manifest.license,
        ...licenses(state.selected).filter((license) => license !== '(none declared)'),
      ].filter(Boolean);
      return {
        names: [...new Set(corpusAssertions)],
        scope: corpusAssertions.length ? 'Corpus-level assertion' : 'No assertion recorded',
      };
    };
    shards.forEach((shard) => {
      const row = body.insertRow();
      const hashCell = row.insertCell();
      add(hashCell, 'code', shard.sha256 || 'Not exposed');
      const sourceCell = row.insertCell();
      sourceCell.textContent = list(shard.sources).join(', ') || 'Not exposed';
      const licenseCell = row.insertCell();
      const shardLicenses = resolveShardLicenses(shard);
      licenseCell.textContent = shardLicenses.names.join(' · ') || 'Not declared';
      licenseCell.title = shardLicenses.scope;
      row.insertCell().textContent = number(shard.docs).toLocaleString();
      row.insertCell().textContent = number(shard.tokens).toLocaleString();
      row.insertCell().textContent = bytes(shard.bytes);
    });
  };

  const renderHistory = () => {
    const revision = state.status.index_commit;
    const path = state.selected.path.split('/').map(encodeURIComponent).join('/');
    const file = encodeURIComponent(`${state.selected.name}.yaml`);
    add(elements.dialogContent, 'p', 'This record is pinned to the same public Git revision as the aggregate index feed.', 'dialog-lede');
    elements.dialogContent.appendChild(metricGrid([
      ['Index revision', revision || 'Not exposed'],
      ['Generated', new Date(state.status.generated).toLocaleString()],
      ['Manifest path', `${state.selected.path}/${state.selected.name}.yaml`],
    ]));
    const actions = add(elements.dialogContent, 'div', undefined, 'dialog-actions');
    const links = [
      ['Inspect pinned manifest ↗', `https://github.com/openwaldo/waldo-index/blob/${revision}/${path}/${file}`],
      ['View manifest history ↗', `https://github.com/openwaldo/waldo-index/commits/main/${path}/${file}`],
      ['Question a claim ↗', 'https://github.com/openwaldo/waldo-index/issues/new'],
    ];
    links.forEach(([label, href], index) => {
      const link = add(actions, 'a', label, `button ${index === 0 ? 'primary' : 'inverse-dark'}`);
      link.href = href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    });
  };

  const renderDialogTab = () => {
    elements.dialogContent.replaceChildren();
    elements.dialogTabs.querySelectorAll('button').forEach((button) => {
      button.setAttribute('aria-selected', String(button.dataset.tab === state.tab));
    });
    if (!state.selected) return;
    if (state.tab === 'overview') renderOverview();
    else if (state.tab === 'sources') renderSources();
    else if (state.tab === 'shards') renderShards();
    else renderHistory();
  };

  const manifestUrl = (corpus) => {
    const revision = encodeURIComponent(state.status.index_commit);
    const path = corpus.path.split('/').map(encodeURIComponent).join('/');
    const file = encodeURIComponent(`${corpus.name}.yaml`);
    return `https://raw.githubusercontent.com/openwaldo/waldo-index/${revision}/${path}/${file}`;
  };

  const loadManifest = async (corpus) => {
    const key = `${state.status.index_commit}:${corpus.path}:${corpus.name}`;
    if (manifestCache.has(key)) return manifestCache.get(key);
    const response = await fetch(manifestUrl(corpus));
    if (!response.ok) throw new Error(`manifest returned ${response.status}`);
    const manifest = parseManifestYaml(await response.text());
    manifestCache.set(key, manifest);
    return manifest;
  };

  const openCorpus = async (corpus, updateHistory) => {
    state.selected = corpus;
    state.manifest = null;
    state.tab = 'overview';
    elements.dialogTitle.textContent = corpus.title || corpus.name || corpus.path;
    elements.dialogPath.textContent = corpus.path;
    const assertedLicenses = licenses(corpus);
    const declaredLicenses = assertedLicenses.filter((license) => license !== '(none declared)');
    const partlyUndeclared = assertedLicenses.includes('(none declared)') && declaredLicenses.length;
    elements.dialogLicenses.textContent = [
      `Asserted licenses / ${declaredLicenses.join(' · ') || 'None declared'}`,
      partlyUndeclared ? 'Some sources undeclared' : '',
    ].filter(Boolean).join(' · ');
    renderDialogTab();
    if (!elements.dialog.open) elements.dialog.showModal();
    document.body.classList.add('dialog-open');
    if (updateHistory) setUrl({ corpus: corpus.path }, 'push');
    try {
      state.manifest = await loadManifest(corpus);
      renderDialogTab();
    } catch (_) {
      state.manifest = null;
      renderDialogTab();
      const warning = add(elements.dialogContent, 'p', 'The aggregate record is available, but the pinned manifest could not be loaded. Try the Git history link or refresh this page.', 'dialog-warning');
      elements.dialogContent.prepend(warning);
    }
  };

  const closeDialog = (updateHistory = true) => {
    if (elements.dialog.open) elements.dialog.close();
    document.body.classList.remove('dialog-open');
    state.selected = null;
    state.manifest = null;
    if (updateHistory) setUrl({ corpus: null }, 'push');
  };

  elements.dialogClose.addEventListener('click', () => closeDialog(true));
  elements.dialog.addEventListener('click', (event) => {
    if (event.target === elements.dialog) closeDialog(true);
  });
  elements.dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeDialog(true);
  });
  elements.dialogTabs.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-tab]');
    if (!button) return;
    state.tab = button.dataset.tab;
    renderDialogTab();
  });

  const updateFilters = () => {
    state.page = 1;
    setUrl({
      q: elements.search.value.trim(),
      section: elements.section.value,
      license: elements.license.value,
      language: elements.language.value,
      'programming-language': elements.programmingLanguage.value,
      sort: elements.sort.value === 'tokens-desc' ? null : elements.sort.value,
      page: null,
    });
    render();
  };
  elements.search.form.addEventListener('submit', (event) => event.preventDefault());
  elements.search.addEventListener('input', updateFilters);
  [elements.section, elements.license, elements.language, elements.programmingLanguage, elements.sort]
    .forEach((control) => control.addEventListener('change', updateFilters));
  elements.reset.addEventListener('click', () => {
    elements.search.value = '';
    elements.section.value = '';
    elements.license.value = '';
    elements.language.value = '';
    elements.programmingLanguage.value = '';
    elements.sort.value = 'tokens-desc';
    updateFilters();
  });

  window.addEventListener('popstate', () => {
    const requested = readUrl();
    render();
    const corpus = requested && state.corpora.find((item) => item.path === requested);
    if (corpus) openCorpus(corpus, false);
    else if (elements.dialog.open) closeDialog(false);
  });

  fetch(feed)
    .then((response) => {
      if (!response.ok) throw new Error(`status returned ${response.status}`);
      return response.json();
    })
    .then((status) => {
      if (!status || !Array.isArray(status.corpora)) throw new Error('invalid status');
      state.status = status;
      state.corpora = status.corpora.slice();
      populateFilters();
      const requested = readUrl();
      elements.dot.className = 'live-dot';
      elements.feed.textContent = 'Live public index';
      const generated = new Date(status.generated);
      elements.summary.textContent = `${state.corpora.length.toLocaleString()} corpora · ${number(status.shards).toLocaleString()} canonical shards · revision ${status.index_commit}${Number.isNaN(generated.valueOf()) ? '' : ` · ${generated.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}`;
      render();
      const corpus = requested && state.corpora.find((item) => item.path === requested);
      if (corpus) openCorpus(corpus, false);
    })
    .catch(() => {
      elements.feed.textContent = 'Index unavailable';
      elements.summary.textContent = 'The public status feed could not be loaded. Please try again shortly.';
      elements.rows.replaceChildren();
      const row = document.createElement('tr');
      const cell = add(row, 'td', 'The live public index is temporarily unavailable.', 'browser-empty');
      cell.colSpan = 8;
      elements.rows.appendChild(row);
      elements.count.textContent = 'No live results';
    });
})();
