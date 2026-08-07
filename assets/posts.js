// Posts: markdown entries with frontmatter, no build step in the browser
// and no dependencies.
//
//   posts/content/*.md      posts: YYYY-MM-DD-slug.md with frontmatter
//                           (title, type, author, description, logo — all
//                           optional; date comes from the filename)
//   posts/index.json        the listing and search index — generated from
//                           the frontmatter by .scripts/build-posts-index.py
//                           (CI runs it at deploy time; gitignored locally)
//
// The metadata index loads in one fetch, so cards, search, filters, and
// pagination work entirely in memory. A post's markdown is fetched only
// when it is opened. At very large archive sizes, the generated index can
// be split into static pages without changing the post format.
//
// Render modes:
//   [data-posts]            the posts page — searchable, filterable cards;
//                           ?p=slug shows one full post
//   [data-posts-latest]     homepage strip — the newest few, as cards
(async () => {
  const listEl = document.querySelector('[data-posts]');
  const latestEl = document.querySelector('[data-posts-latest]');
  if (!listEl && !latestEl) return;

  // base path from the homepage vs the posts page itself
  const BASE = latestEl && !listEl ? 'posts/' : '';

  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const inline = (s) => {
    const codes = [];
    s = s.replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return '\x00' + (codes.length - 1) + '\x00'; });
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
    return s.replace(/\x00(\d+)\x00/g, (_, i) => '<code>' + codes[+i] + '</code>');
  };

  // a deliberate markdown subset: headings, paragraphs, lists, quotes,
  // fenced code, hr, bold/italic/code/links — announcement-grade
  const md2html = (md) => {
    const out = [], lines = md.replace(/\r/g, '').split('\n');
    let i = 0, para = [], list = null;
    const flushP = () => { if (para.length) { out.push('<p>' + inline(esc(para.join(' '))) + '</p>'); para = []; } };
    const flushL = () => {
      if (list) {
        out.push('<' + list.tag + '>' + list.items.map((it) => '<li>' + inline(esc(it)) + '</li>').join('') + '</' + list.tag + '>');
        list = null;
      }
    };
    while (i < lines.length) {
      const l = lines[i];
      if (/^```/.test(l)) {
        flushP(); flushL();
        const buf = []; i++;
        while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
        out.push('<pre><code>' + esc(buf.join('\n')) + '</code></pre>'); i++;
        continue;
      }
      const h = l.match(/^(#{1,6})\s+(.*)/);
      if (h) {
        flushP(); flushL();
        const lv = Math.min(h[1].length + 2, 6);   // post h1 -> page h3
        out.push('<h' + lv + '>' + inline(esc(h[2])) + '</h' + lv + '>'); i++;
        continue;
      }
      if (/^(-{3,}|\*{3,})\s*$/.test(l)) { flushP(); flushL(); out.push('<hr>'); i++; continue; }
      if (/^>\s?/.test(l)) {
        flushP(); flushL();
        const buf = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
        out.push('<blockquote>' + inline(esc(buf.join(' '))) + '</blockquote>');
        continue;
      }
      const li = l.match(/^[-*]\s+(.*)/), oli = l.match(/^\d+\.\s+(.*)/);
      if (li || oli) {
        flushP();
        const tag = li ? 'ul' : 'ol';
        if (!list || list.tag !== tag) { flushL(); list = { tag, items: [] }; }
        list.items.push((li || oli)[1]); i++;
        continue;
      }
      // indented continuation of the previous list item
      if (list && /^\s+\S/.test(l)) {
        list.items[list.items.length - 1] += ' ' + l.trim(); i++;
        continue;
      }
      if (/^\s*$/.test(l)) { flushP(); flushL(); i++; continue; }
      para.push(l.trim()); i++;
    }
    flushP(); flushL();
    return out.join('\n');
  };

  // frontmatter: a flat `key: value` block between --- fences (used for the
  // single-post view; the listing's metadata comes from index.json)
  const parsePost = (slug, md) => {
    const meta = {
      slug,
      date: (slug.match(/^(\d{4}-\d{2}-\d{2})/) || [, ''])[1],
      title: slug.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/-/g, ' '),
      type: '', description: '', logo: '', author: '',
    };
    const fm = md.match(/^---\n([\s\S]*?)\n---\n?/);
    if (fm) {
      fm[1].split('\n').forEach((line) => {
        const kv = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
        if (kv) meta[kv[1].toLowerCase()] = kv[2].trim();
      });
      md = md.slice(fm[0].length);
    }
    // a leading heading is the title if frontmatter didn't set one;
    // only strip it when it serves as (or duplicates) the title — an
    // ordinary first section header stays in the body
    const h1 = md.match(/^\s*#\s+(.+?)\s*$/m);
    if (h1) {
      const fmTitle = fm && /^title:/mi.test(fm[1]);
      if (!fmTitle) {
        meta.title = h1[1];
        md = md.replace(h1[0], '');
      } else if (h1[1].trim().toLowerCase() === meta.title.trim().toLowerCase()) {
        md = md.replace(h1[0], '');
      }
    }
    return { meta, body: md };
  };

  const get = (url) => fetch(url).then((r) => (r.ok ? r.text() : Promise.reject(r.status)));

  // the whole archive, one fetch, in memory
  const loadIndex = async () => {
    const posts = JSON.parse(await get(BASE + 'index.json'));
    return posts.sort((a, b) => (a.slug < b.slug ? 1 : -1));
  };

  const metaLine = (meta) => {
    let h = '<dl class="post-meta"><div><dt>Published</dt><dd>' + esc(meta.date) + '</dd></div>';
    if (meta.type) h += '<div><dt>Filed under</dt><dd>' + esc(meta.type) + '</dd></div>';
    if (meta.author) h += '<div><dt>Written by</dt><dd>' + esc(meta.author) + '</dd></div>';
    return h + '</dl>';
  };

  const card = (meta) => {
    const href = BASE + '?p=' + encodeURIComponent(meta.slug);
    const a = document.createElement('article');
    a.className = 'post-card';
    a.innerHTML =
      '<div class="post-card-index"><span>' + esc(meta.date) + '</span>' +
      (meta.type ? '<b>' + esc(meta.type) + '</b>' : '') + '</div>' +
      '<div class="post-card-copy">' +
      (meta.logo ? '<img class="post-logo" src="' + esc(meta.logo) + '" alt="">' : '') +
      '<h3><a href="' + href + '">' + esc(meta.title) + '</a></h3>' +
      (meta.description ? '<p>' + esc(meta.description) + '</p>' : '') + '</div>' +
      '<div class="post-card-author">' +
      (meta.author ? '<span>By</span><b>' + esc(meta.author) + '</b>' : '') + '</div>' +
      '<span class="post-card-action">Read ↗</span>';
    // the whole tile navigates; inner links (the title) still win
    a.addEventListener('click', (e) => {
      if (!e.target.closest('a')) location.href = href;
    });
    return a;
  };

  const fullPost = ({ meta, body }) => {
    const art = document.createElement('article');
    art.className = 'post';
    art.id = meta.slug;
    art.innerHTML =
      (meta.logo ? '<img class="post-logo" src="' + esc(meta.logo) + '" alt="">' : '') +
      '<h2>' + esc(meta.title) + '</h2>' +
      metaLine(meta) +
      '<div class="prose post-body">' + md2html(body) + '</div>';
    return art;
  };

  const returnLink = () =>
    '<div class="post-return-wrap"><a class="post-return" href="./">' +
    '<span aria-hidden="true">←</span><strong>Back to all posts</strong></a></div>';

  // share links always point at the live site, so they work even when the
  // page is being previewed over file:// or a local server; brand logos are
  // inlined as SVG paths (simple-icons) — no external assets
  const ICON = {
    linkedin: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
    x: 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z',
    bluesky: 'M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8Z',
    hackernews: 'M0 24V0h24v24H0zM6.951 5.896l4.112 7.708v5.064h1.583v-4.972l4.148-7.799h-1.749l-2.457 4.875c-.372.745-.688 1.434-.688 1.434s-.297-.708-.651-1.434L8.831 5.896h-1.88z',
    reddit: 'M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z',
    facebook: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
    link: 'M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z',
    check: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
  };
  const svg = (name) =>
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + ICON[name] + '"/></svg>';

  const shareRow = (meta) => {
    const url = 'https://openwaldo.org/posts/?p=' + encodeURIComponent(meta.slug);
    // prefill: "From OpenWALDO..." + title: description where the platform
    // takes free text (X gets the @ mention); title alone where it's a
    // submission title (HN, Reddit)
    const blurb = (from) => from + '...\n\n' +
      meta.title + (meta.description ? ': ' + meta.description : '');
    const u = encodeURIComponent(url);
    const t = encodeURIComponent(blurb('From OpenWALDO'));
    const tx = encodeURIComponent(blurb('From @OpenWALDO'));
    const title = encodeURIComponent(meta.title);
    const links = [
      // share-offsite ignores text, so open the feed composer prefilled
      ['LinkedIn', 'linkedin', 'https://www.linkedin.com/feed/?shareActive=true&text=' + t + '%0A' + u],
      ['X', 'x', 'https://x.com/intent/post?url=' + u + '&text=' + tx],
      ['Bluesky', 'bluesky', 'https://bsky.app/intent/compose?text=' + t + '%0A' + u],
      ['Hacker News', 'hackernews', 'https://news.ycombinator.com/submitlink?u=' + u + '&t=' + title],
      ['Reddit', 'reddit', 'https://www.reddit.com/submit?url=' + u + '&title=' + title],
      ['Facebook', 'facebook', 'https://www.facebook.com/sharer/sharer.php?u=' + u + '&quote=' + t],
    ];
    const div = document.createElement('div');
    div.className = 'post-share';
    div.innerHTML = '<span class="share-label">Share on:</span>' +
      links.map(([name, ic, href]) =>
        '<a class="share-chip" href="' + href + '" target="_blank" rel="noopener"' +
        ' title="Share on ' + name + '" aria-label="Share on ' + name + '">' +
        svg(ic) + '</a>').join('');
    const copy = document.createElement('button');
    copy.className = 'share-chip';
    copy.title = 'Copy link';
    copy.setAttribute('aria-label', 'Copy link');
    copy.innerHTML = svg('link');
    copy.addEventListener('click', () => {
      navigator.clipboard.writeText(url).then(() => {
        copy.innerHTML = svg('check');
        setTimeout(() => { copy.innerHTML = svg('link'); }, 1500);
      });
    });
    div.appendChild(copy);
    return div;
  };

  // ---- homepage: the newest few, as cards ----
  if (latestEl && !listEl) {
    try {
      const posts = (await loadIndex()).slice(0, 3);
      if (!posts.length) { latestEl.closest('section')?.remove(); return; }
      latestEl.innerHTML = '';
      posts.forEach((meta) => latestEl.appendChild(card(meta)));
    } catch (e) { latestEl.closest('section')?.remove(); }
    return;
  }

  // ---- the posts page ----
  const param = new URLSearchParams(location.search).get('p');
  try {
    if (param && /^[\w-]+$/.test(param)) {
      const post = parsePost(param, await get('content/' + param + '.md'));
      // Keep only a compact dark masthead above the light editorial page.
      document.body.classList.add('single-post-page');
      document.title = post.meta.title + ' — OpenWALDO';
      listEl.innerHTML = '';
      listEl.insertAdjacentHTML('beforeend', returnLink());
      listEl.appendChild(fullPost(post));
      listEl.appendChild(shareRow(post.meta));
      listEl.insertAdjacentHTML('beforeend', returnLink());
      return;
    }

    const posts = await loadIndex();
    listEl.innerHTML = '';
    if (!posts.length) {
      listEl.innerHTML = '<p class="sub">Nothing on the record yet.</p>';
      return;
    }

    // toolbar: search + type filter chips over the generated metadata index
    const toolbar = document.createElement('div');
    toolbar.className = 'post-toolbar';
    toolbar.innerHTML =
      '<label><span>Find a post</span><input type="search" placeholder="Search title, author, or topic…" aria-label="Find a post"></label>' +
      '<div class="post-filters" aria-label="Filter posts by type"></div>';
    const results = document.createElement('div');
    results.className = 'post-list';
    const pager = document.createElement('div');
    pager.className = 'post-pager';
    listEl.append(toolbar, results, pager);
    const input = toolbar.querySelector('input');
    const filtersEl = toolbar.querySelector('.post-filters');

    const PAGE_SIZE = 12;
    const readState = () => {
      const state = new URLSearchParams(location.search);
      return {
        type: state.get('type') || '',
        query: (state.get('q') || '').trim().toLowerCase(),
        page: Math.max(1, parseInt(state.get('page') || '1', 10) || 1),
      };
    };
    let initial = readState();
    let typeFilter = initial.type, query = initial.query, page = initial.page;
    input.value = query;

    const stateUrl = (targetPage = page) => {
      const url = new URL(location.href);
      url.search = '';
      if (query) url.searchParams.set('q', query);
      if (typeFilter) url.searchParams.set('type', typeFilter);
      if (targetPage > 1) url.searchParams.set('page', targetPage);
      return url;
    };

    const syncState = (mode = 'replace') => {
      history[mode + 'State']({}, '', stateUrl());
    };

    const types = [...new Set(posts.map((p) => p.type).filter(Boolean))].sort();
    if (typeFilter && !types.includes(typeFilter)) typeFilter = '';

    const filterButtons = new Map();
    const buildFilters = () => {
      filtersEl.innerHTML = '';
      if (!types.length) return;
      ['', ...types].forEach((t) => {
        const b = document.createElement('button');
        b.className = 'type-chip filter' + ((t === typeFilter) ? ' on' : '');
        b.textContent = t || 'all';
        b.setAttribute('aria-pressed', String(t === typeFilter));
        b.addEventListener('click', () => {
          typeFilter = t;
          page = 1;
          syncState('push');
          render();
        });
        filterButtons.set(t, b);
        filtersEl.appendChild(b);
      });
    };

    const updateFilters = () => filterButtons.forEach((button, type) => {
      button.classList.toggle('on', type === typeFilter);
      button.setAttribute('aria-pressed', String(type === typeFilter));
    });

    const matches = (meta) =>
      (!typeFilter || meta.type === typeFilter) &&
      (!query || (meta.title + ' ' + meta.description + ' ' + meta.type + ' ' +
        meta.author + ' ' + meta.date).toLowerCase().includes(query));

    const render = () => {
      const hits = posts.filter(matches);
      const pages = Math.max(1, Math.ceil(hits.length / PAGE_SIZE));
      const requestedPage = page;
      page = Math.min(Math.max(1, page), pages);
      if (requestedPage !== page) syncState('replace');
      results.innerHTML = '';
      hits.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
        .forEach((meta) => results.appendChild(card(meta)));
      if (!hits.length) results.innerHTML = '<p class="sub">No posts match.</p>';
      updateFilters();

      // Result count plus compact, shareable numbered pagination.
      pager.innerHTML = '';
      const first = hits.length ? ((page - 1) * PAGE_SIZE) + 1 : 0;
      const last = Math.min(page * PAGE_SIZE, hits.length);
      const summary = document.createElement('span');
      summary.className = 'pager-summary';
      summary.textContent = hits.length ? first + '–' + last + ' of ' + hits.length + ' posts' : '0 posts';
      pager.appendChild(summary);

      if (pages > 1) {
        const controls = document.createElement('div');
        controls.className = 'pager-controls';
        const link = (label, target, current = false) => {
          const b = document.createElement(current ? 'span' : 'a');
          b.className = 'pager-btn' + (current ? ' current' : '');
          b.textContent = label;
          if (!current) {
            b.href = stateUrl(target);
            b.addEventListener('click', (event) => {
              event.preventDefault();
              page = target;
              syncState('push');
              render();
              toolbar.scrollIntoView({ block: 'start' });
            });
          } else {
            b.setAttribute('aria-current', 'page');
          }
          return b;
        };
        const gap = () => {
          const s = document.createElement('span');
          s.className = 'pager-gap';
          s.textContent = '…';
          return s;
        };
        if (page > 1) controls.appendChild(link('← Newer', page - 1));
        const visible = [...new Set([1, page - 2, page - 1, page, page + 1, page + 2, pages])]
          .filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
        visible.forEach((n, i) => {
          if (i && n - visible[i - 1] > 1) controls.appendChild(gap());
          controls.appendChild(link(String(n), n, n === page));
        });
        if (page < pages) controls.appendChild(link('Older →', page + 1));
        pager.appendChild(controls);
      }
    };

    let deb;
    input.addEventListener('input', () => {
      clearTimeout(deb);
      deb = setTimeout(() => {
        query = input.value.trim().toLowerCase();
        page = 1;
        syncState('replace');
        render();
      }, 120);
    });

    addEventListener('popstate', () => {
      const state = readState();
      typeFilter = types.includes(state.type) ? state.type : '';
      query = state.query;
      page = state.page;
      input.value = query;
      render();
    });

    buildFilters();
    syncState('replace');
    render();
  } catch (e) {
    listEl.innerHTML = '<p class="sub">Couldn’t load the posts right now — they live ' +
      '<a href="https://github.com/openwaldo/openwaldo.org/tree/main/posts/content">on GitHub</a> too.</p>';
  }
})();
