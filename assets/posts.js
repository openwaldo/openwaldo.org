// News: markdown posts with frontmatter, no build step, no dependencies.
//
//   posts/posts.txt         the listing — one filename per line, # comments
//   posts/content/*.md      posts: YYYY-MM-DD-slug.md with frontmatter
//                           (title, type, description, logo — all optional;
//                           date comes from the filename)
//
// Three render modes:
//   [data-posts]            the posts page — searchable, filterable,
//                           lazy-loading summary cards; ?p=slug shows one
//                           full post
//   [data-posts-latest]     homepage strip — the newest few, as cards
(async () => {
  const listEl = document.querySelector('[data-posts]');
  const latestEl = document.querySelector('[data-posts-latest]');
  if (!listEl && !latestEl) return;

  // base path from the homepage vs the posts page itself
  const BASE = latestEl && !listEl ? 'posts/' : '';
  const BATCH = 10;

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

  // frontmatter: a flat `key: value` block between --- fences
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
    if (!meta.description) {
      const p = md.replace(/^---[\s\S]*?---/, '').split(/\n\s*\n/).find((b) => b.trim() && !/^[#>\-*`]/.test(b.trim()));
      if (p) meta.description = p.trim().replace(/\s+/g, ' ').slice(0, 180);
    }
    return { meta, body: md };
  };

  const get = (url) => fetch(url).then((r) => (r.ok ? r.text() : Promise.reject(r.status)));

  const loadListing = async () => (await get(BASE + 'posts.txt')).split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => l.replace(/\.md$/, ''))
    .sort().reverse();

  const cache = new Map();
  const loadPost = async (slug) => {
    if (!cache.has(slug)) cache.set(slug, parsePost(slug, await get(BASE + 'content/' + slug + '.md')));
    return cache.get(slug);
  };

  const metaLine = (meta) => {
    let h = '<div class="post-meta"><span>' + esc(meta.date) + '</span>';
    if (meta.type) h += '<span class="type-chip">' + esc(meta.type) + '</span>';
    if (meta.author) h += '<span class="post-author">by ' + esc(meta.author) + '</span>';
    return h + '</div>';
  };

  const card = (meta) => {
    const href = BASE + '?p=' + encodeURIComponent(meta.slug);
    const a = document.createElement('article');
    a.className = 'post-card';
    a.innerHTML =
      (meta.logo ? '<img class="post-logo" src="' + esc(meta.logo) + '" alt="">' : '') +
      metaLine(meta) +
      '<h3><a href="' + href + '">' + esc(meta.title) + '</a></h3>' +
      (meta.description ? '<p>' + esc(meta.description) + '</p>' : '');
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
      metaLine(meta) +
      (meta.logo ? '<img class="post-logo" src="' + esc(meta.logo) + '" alt="">' : '') +
      '<h2>' + esc(meta.title) + '</h2>' +
      '<div class="prose post-body">' + md2html(body) + '</div>';
    return art;
  };

  // ---- homepage: the newest few, as cards ----
  if (latestEl && !listEl) {
    try {
      const slugs = (await loadListing()).slice(0, 3);
      if (!slugs.length) { latestEl.closest('section')?.remove(); return; }
      latestEl.innerHTML = '';
      for (const slug of slugs) latestEl.appendChild(card((await loadPost(slug)).meta));
    } catch (e) { latestEl.closest('section')?.remove(); }
    return;
  }

  // ---- the posts page ----
  const param = new URLSearchParams(location.search).get('p');
  try {
    if (param && /^[\w-]+$/.test(param)) {
      const post = await loadPost(param);
      // single-post view: the post IS the page — drop the listing hero
      document.querySelector('.page-hero')?.remove();
      const section = listEl.closest('section');
      if (section) section.style.paddingTop = '64px';
      document.title = post.meta.title + ' — OpenWALDO';
      listEl.innerHTML = '';
      listEl.insertAdjacentHTML('beforeend', '<p class="post-back"><a href="./">← all posts</a></p>');
      listEl.appendChild(fullPost(post));
      listEl.insertAdjacentHTML('beforeend', '<p class="post-back" style="margin-top:44px"><a href="./">← all posts</a></p>');
      return;
    }

    const slugs = await loadListing();
    listEl.innerHTML = '';
    if (!slugs.length) {
      listEl.innerHTML = '<p class="sub">Nothing on the record yet.</p>';
      return;
    }

    // toolbar: search + type filter chips (built from what's loaded)
    const toolbar = document.createElement('div');
    toolbar.className = 'post-toolbar';
    toolbar.innerHTML =
      '<input type="search" placeholder="Search the posts…" aria-label="Search the posts">' +
      '<div class="post-filters"></div>';
    const results = document.createElement('div');
    results.className = 'post-list';
    const sentinel = document.createElement('div');
    listEl.append(toolbar, results, sentinel);
    const input = toolbar.querySelector('input');
    const filtersEl = toolbar.querySelector('.post-filters');

    let loaded = 0, typeFilter = '', query = '';

    const ensure = async (n) => {
      while (loaded < Math.min(n, slugs.length)) await loadPost(slugs[loaded++]);
    };
    const ensureAll = () => ensure(slugs.length);

    const rebuildFilters = () => {
      const types = [...new Set(slugs.slice(0, loaded).map((s) => cache.get(s).meta.type).filter(Boolean))];
      filtersEl.innerHTML = '';
      if (!types.length) return;
      ['', ...types].forEach((t) => {
        const b = document.createElement('button');
        b.className = 'type-chip filter' + ((t === typeFilter) ? ' on' : '');
        b.textContent = t || 'all';
        b.addEventListener('click', async () => { typeFilter = t; await ensureAll(); render(); });
        filtersEl.appendChild(b);
      });
    };

    const matches = (meta) => {
      if (typeFilter && meta.type !== typeFilter) return false;
      if (!query) return true;
      return (meta.title + ' ' + meta.description + ' ' + meta.type + ' ' + meta.author + ' ' + meta.date)
        .toLowerCase().includes(query);
    };

    const render = () => {
      results.innerHTML = '';
      let shown = 0;
      for (const slug of slugs.slice(0, loaded)) {
        const { meta } = cache.get(slug);
        if (matches(meta)) { results.appendChild(card(meta)); shown++; }
      }
      if (!shown) results.innerHTML = '<p class="sub">No posts match.</p>';
      rebuildFilters();
    };

    let deb;
    input.addEventListener('input', () => {
      clearTimeout(deb);
      deb = setTimeout(async () => {
        query = input.value.trim().toLowerCase();
        if (query) await ensureAll();
        render();
      }, 150);
    });

    // lazy-load the next batch as the sentinel scrolls into view
    const io = new IntersectionObserver(async (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      if (loaded >= slugs.length) { io.disconnect(); return; }
      await ensure(loaded + BATCH);
      render();
    }, { rootMargin: '400px' });

    await ensure(BATCH);
    render();
    io.observe(sentinel);
  } catch (e) {
    listEl.innerHTML = '<p class="sub">Couldn’t load the posts right now — they live ' +
      '<a href="https://github.com/openwaldo/openwaldo.org/tree/main/posts/content">on GitHub</a> too.</p>';
  }
})();
