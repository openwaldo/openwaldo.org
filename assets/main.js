// OpenWALDO site — small shared behaviors. No dependencies.

// Shared keyboard affordance. It is injected here so every static page gets
// the same target without duplicating structural markup.
const mainContent = document.querySelector('main');
if (mainContent) {
  mainContent.id ||= 'main-content';
  const skip = document.createElement('a');
  skip.className = 'skip-link';
  skip.href = '#main-content';
  skip.textContent = 'Skip to content';
  document.body.prepend(skip);
}

// Mobile nav toggle
const menuBtn = document.getElementById('menu-btn');
if (menuBtn) {
  const menu = document.querySelector('nav.links');
  menu.id ||= 'site-menu';
  menuBtn.setAttribute('aria-controls', menu.id);
  menuBtn.setAttribute('aria-expanded', 'false');
  const closeMenu = () => {
    menu.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
  };
  menuBtn.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.classList.contains('open')) {
      closeMenu();
      menuBtn.focus();
    }
  });
}

// Scroll-reveal
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

// Hero glimmer alignment: the red initials' shine is positioned in pixels
// so it lines up with the band sweeping the whole title. Measure the title
// width and each letter's offset into it; re-measure on load and resize.
const heroTitle = document.querySelector('h1.title');
if (heroTitle) {
  const layoutGlimmer = () => {
    heroTitle.style.setProperty('--hw', heroTitle.clientWidth + 'px');
    const left = heroTitle.getBoundingClientRect().left;
    heroTitle.querySelectorAll('.k').forEach((k) => {
      k.style.setProperty('--kl', (k.getBoundingClientRect().left - left) + 'px');
    });
  };
  layoutGlimmer();
  window.addEventListener('load', layoutGlimmer);
  window.addEventListener('resize', layoutGlimmer);
}

// Corpus counter: fill the front-page stats strip live from the status
// feed the index repo publishes. Numbers count up when the strip scrolls
// into view; the license bar is a token-share spectrum from the same data;
// the corpus cloud is a physics playground of glassy spheres, one per
// corpus, area proportional to tokens.
const STATS_URL = 'https://openwaldo.github.io/waldo-index/status.json';
const statsBox = document.querySelector('[data-stats]');
if (statsBox) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NUM = [[1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K'], [1, '']];
  const SIZE = [[1e12, ' TB'], [1e9, ' GB'], [1e6, ' MB'], [1e3, ' KB'], [1, ' B']];
  const split = (n, units) => {
    for (const [v, u] of units) if (n >= v || v === 1) return [n / v, u];
  };
  const fmt = (x, target) =>
    target >= 100 || Number.isInteger(target)
      ? String(Math.round(x))
      : x.toFixed(1).replace(/\.0$/, target >= 10 ? '' : '.0');

  const pending = [];
  const setStat = (key, n, units, title) => {
    const box = statsBox.querySelector(`[data-stat="${key}"]`);
    if (!box) return;
    const [value, unit] = units ? split(n, units) : [n, ''];
    box.querySelector('.u').textContent = unit;
    if (title) box.title = title;
    const v = box.querySelector('.v');
    if (reduced) { v.textContent = fmt(value, value); return; }
    pending.push({ el: v, value });
  };

  const runCountUp = () => {
    const t0 = performance.now(), dur = 1600;
    const tick = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      for (const s of pending) s.el.textContent = fmt(s.value * ease, s.value);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const PALETTE = ['#ff4a3d', '#ddd2ba', '#ff8a5c', '#8fa0bd', '#ffb454',
                   '#d92e23', '#c9b8a0', '#7d8aa5', '#ffd9d5', '#58627a'];

  fetch(STATS_URL)
    .then((r) => {
      if (!r.ok) throw new Error('status feed unavailable');
      return r.json();
    })
    .then((s) => {
      const licenses = Object.entries(s.licenses || {})
        .sort((a, b) => b[1].tokens - a[1].tokens);

      setStat('tokens', s.tokens, NUM, s.tokens.toLocaleString() + ' tokens');
      setStat('docs', s.docs, NUM, s.docs.toLocaleString() + ' documents');
      setStat('bytes', s.bytes, SIZE,
        s.bytes.toLocaleString() + ' bytes across ' + s.shards + ' shard(s)');
      setStat('licenses', licenses.length, null,
        licenses.map(([name]) => name).join(', '));

      // license → color for the spectrum bar (and the modal's mini-bar)
      const licColor = {};
      licenses.forEach(([name], i) => { licColor[name] = PALETTE[i % PALETTE.length]; });
      const pctLabel = (p) => (p >= 10 ? String(Math.round(p)) : p >= 1 ? p.toFixed(1) : '<1');
      const numFmt = (n) => {
        const [v, u] = split(n, NUM);
        return fmt(v, v) + u;
      };
      const sizeFmt = (n) => {
        const [v, u] = split(n, SIZE);
        return fmt(v, v) + u;
      };

      // Custom hover tooltip, shared (native title tips are too slow)
      const tip = document.createElement('div');
      tip.className = 'bar-tip';
      document.body.appendChild(tip);
      const attachTip = (host) => {
        host.addEventListener('mousemove', (e) => {
          const seg = e.target.closest('[data-tip-head]');
          if (!seg) { tip.classList.remove('show'); return; }
          tip.innerHTML = '';
          const head = document.createElement('b');
          head.textContent = seg.dataset.tipHead;
          tip.append(head, seg.dataset.tipBody || '');
          // clamp horizontally so the box slides inward at the viewport
          // edges instead of getting cut off (content is set, so the
          // measured width is its natural, un-squashed width)
          const half = tip.offsetWidth / 2;
          tip.style.left = Math.min(
            Math.max(e.clientX, half + 10),
            window.innerWidth - half - 10) + 'px';
          tip.style.top = e.clientY + 'px';
          tip.classList.add('show');
        });
        host.addEventListener('mouseleave', () => tip.classList.remove('show'));
      };

      const fillLicenseBar = (barEl, licEntries, total) => {
        licEntries.forEach(([name, info]) => {
          const p = pctLabel((info.tokens / total) * 100) + '%';
          const seg = document.createElement('span');
          seg.style.flexGrow = info.tokens;
          seg.style.background = licColor[name] || '#58627a';
          seg.dataset.tipHead = name;
          seg.dataset.tipBody = p + ' · ' + info.tokens.toLocaleString() + ' tokens';
          seg.setAttribute('aria-label', name + ' — ' + p);
          barEl.appendChild(seg);
        });
      };

      // ---- the corpus map: a treemap of the index tree ----
      // The corpus IS a tree (core/…, science/…, post-train/…), so draw it
      // as one: rectangles tiled edge to edge, area proportional to tokens,
      // colored by top-level branch. A du(1) of the commons.
      const map = statsBox.querySelector('[data-stat="map"]');
      const corpora = (s.corpora || []).slice().sort((a, b) => b.tokens - a.tokens);
      if (map && corpora.length && s.tokens > 0) {
        const modal = document.querySelector('[data-stat="modal"]');
        const list = statsBox.querySelector('[data-stat="list"]');
        let modalReturnFocus = null;
        // tiles wear their dominant license's color — the same palette as
        // the spectrum bar above, so the bar doubles as the map's legend
        const hexToRgb = (hex) => {
          const n = parseInt(hex.slice(1), 16);
          return (n >> 16) + ', ' + ((n >> 8) & 255) + ', ' + (n & 255);
        };
        // the license with the most tokens; "mostly" only when it isn't
        // the whole corpus
        const dominantLicense = (c) => {
          const ls = Object.entries(c.licenses || {})
            .sort((a, b) => (b[1].tokens || 0) - (a[1].tokens || 0));
          if (!ls.length) return null;
          const total = ls.reduce((t, [, v]) => t + (v.tokens || 0), 0);
          const sole = (ls[0][1].tokens || 0) === total;
          return { name: ls[0][0], label: sole ? ls[0][0] : 'mostly ' + ls[0][0] };
        };

        // squarified treemap: lay rows along the shorter side, growing each
        // row while it improves the worst tile aspect ratio
        const squarify = (values, x, y, w, h) => {
          const rects = [];
          let items = values.slice();
          while (items.length) {
            const vertical = w < h;
            const side = vertical ? w : h;
            const worst = (row) => {
              const sum = row.reduce((t, v) => t + v.a, 0);
              const thick = sum / side;
              return Math.max(...row.map((v) => {
                const len = v.a / thick;
                return Math.max(len / thick, thick / len);
              }));
            };
            let row = [items[0]], rest = items.slice(1);
            while (rest.length && worst(row.concat(rest[0])) <= worst(row)) {
              row.push(rest[0]);
              rest = rest.slice(1);
            }
            const thick = row.reduce((t, v) => t + v.a, 0) / side;
            let off = 0;
            row.forEach((v) => {
              const len = v.a / thick;
              rects.push(vertical
                ? { v, x: x + off, y, w: len, h: thick }
                : { v, x, y: y + off, w: thick, h: len });
              off += len;
            });
            if (vertical) { y += thick; h -= thick; } else { x += thick; w -= thick; }
            items = rest;
          }
          return rects;
        };

        const openModal = (c) => {
          if (!modal) return;
          const put = (key, fill) => {
            const el = modal.querySelector(`[data-m="${key}"]`);
            if (el) { el.innerHTML = ''; fill(el); }
          };
          put('path', (el) => { el.textContent = c.path; });
          put('name', (el) => { el.textContent = c.title || c.name; });
          put('desc', (el) => {
            el.textContent = c.description || '';
            el.hidden = !c.description;
          });
          put('stats', (el) => {
            [[numFmt(c.tokens), 'tokens', c.tokens], [numFmt(c.docs), 'documents', c.docs],
             [sizeFmt(c.bytes), 'of data', c.bytes], [String(c.shards), 'shards', c.shards]]
              .forEach(([n, l, exact]) => {
                const d = document.createElement('div');
                d.title = exact.toLocaleString();
                d.innerHTML = '<div class="n"></div><div class="l"></div>';
                d.querySelector('.n').textContent = n;
                d.querySelector('.l').textContent = l;
                el.appendChild(d);
              });
          });
          const licEntries = Object.entries(c.licenses || {})
            .sort((a, b) => (b[1].tokens || 0) - (a[1].tokens || 0));
          put('bar', (el) => { fillLicenseBar(el, licEntries, c.tokens); attachTip(el); });
          put('lics', (el) => {
            licEntries.forEach(([name, info]) => {
              const chip = document.createElement('span');
              const dot = document.createElement('i');
              dot.style.background = licColor[name] || '#58627a';
              chip.append(dot, name + ' ' + pctLabel((info.tokens / c.tokens) * 100) + '%');
              el.appendChild(chip);
            });
          });
          put('sources', (el) => {
            (c.sources || []).forEach((src) => {
              const d = document.createElement('div');
              d.className = 'src';
              if (src.url) {
                const a = document.createElement('a');
                a.href = src.url;
                a.textContent = src.name || src.url;
                d.appendChild(a);
              } else {
                d.textContent = src.name || '';
              }
              const rest = [src.origin, src.version].filter(Boolean).join(' · ');
              if (rest) d.append(' — ' + rest);
              el.appendChild(d);
            });
            if (c.converted_by) {
              const d = document.createElement('div');
              d.className = 'src';
              d.textContent = 'converted by ' + c.converted_by;
              el.appendChild(d);
            }
          });
          modal.hidden = false;
          document.body.style.overflow = 'hidden';
          modalReturnFocus = document.activeElement;
          modal.querySelector('.corpus-modal-close')?.focus();
        };
        const closeModal = () => {
          if (modal && !modal.hidden) {
            modal.hidden = true;
            document.body.style.overflow = '';
            modalReturnFocus?.focus();
          }
        };
        if (modal) {
          modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.closest('.corpus-modal-close')) closeModal();
          });
          document.addEventListener('keydown', (e) => {
            if (modal.hidden) return;
            if (e.key === 'Escape') closeModal();
            if (e.key === 'Tab') {
              const focusable = [...modal.querySelectorAll('a[href], button, [tabindex]:not([tabindex="-1"])')]
                .filter((el) => !el.hidden && el.offsetParent !== null);
              if (!focusable.length) return;
              const first = focusable[0], last = focusable[focusable.length - 1];
              if (e.shiftKey && document.activeElement === first) {
                e.preventDefault(); last.focus();
              } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault(); first.focus();
              }
            }
          });
        }

        let firstBuild = true;
        const buildMap = () => {
          map.innerHTML = '';
          const W = map.clientWidth;
          if (!W) return;
          const H = Math.max(280, Math.min(460, Math.round(W * 0.4)));
          map.style.height = H + 'px';
          // honest areas, with a visibility floor: every corpus gets at
          // least ~0.6% of the map so the long tail never vanishes; floored
          // tiles say so in their tooltip
          const area = W * H;
          const floorA = area * 0.006;
          let raw = corpora.map((c) => (c.tokens / s.tokens) * area);
          raw = raw.map((a) => Math.max(a, floorA));
          const k = area / raw.reduce((t2, a) => t2 + a, 0);
          const values = corpora.map((c, i) => ({
            c, a: raw[i] * k,
            floored: (c.tokens / s.tokens) * area < floorA,
          }));
          squarify(values, 0, 0, W, H).forEach(({ v, x, y, w, h }, i) => {
            const c = v.c;
            const disp = c.title || c.name;
            const dom = dominantLicense(c);
            const el = document.createElement('div');
            el.className = 'tile';
            el.style.left = (x + 1) + 'px';
            el.style.top = (y + 1) + 'px';
            el.style.width = Math.max(3, w - 2) + 'px';
            el.style.height = Math.max(3, h - 2) + 'px';
            el.style.setProperty('--tint', hexToRgb((dom && licColor[dom.name]) || '#58627a'));
            el.style.setProperty('--in-delay', (firstBuild ? i * 0.035 : 0) + 's');
            if (w > 30 && h > 17) {
              // name scales with the box: as big as fits the width (mono
              // chars are ~0.62em wide), capped by height and at 34px
              const nameSize = Math.max(8, Math.min(
                22, (w - 18) / (disp.length * 0.9), h * 0.16));
              const subSize = Math.max(9, Math.min(13, nameSize * 0.55));
              const label = document.createElement('b');
              label.textContent = disp;
              label.style.fontSize = nameSize + 'px';
              el.appendChild(label);
              const addSub = (text) => {
                const sub = document.createElement('small');
                sub.textContent = text;
                sub.style.fontSize = subSize + 'px';
                sub.style.lineHeight = '1.5';
                el.appendChild(sub);
              };
              if (c.description && h > 170 && w > 260) {
                const d = document.createElement('span');
                d.className = 'tile-desc';
                d.textContent = c.description;
                d.style.fontSize = Math.max(10, subSize) + 'px';
                el.appendChild(d);
              }
              if (h > 54 && w > 90) addSub(numFmt(c.tokens) + ' tokens');
              if (h > 140 && w > 190) {
                addSub(numFmt(c.docs) + ' docs · ' + sizeFmt(c.bytes));
                if (dom) addSub(dom.label);
              }
            }
            el.dataset.tipHead = disp;
            const shortDesc = (c.description || '').length > 110
              ? c.description.slice(0, 109).trimEnd() + '…' : (c.description || '');
            el.dataset.tipBody = (shortDesc ? shortDesc + '\n' : '') +
              c.path + '\n' +
              numFmt(c.tokens) + ' tokens · ' + numFmt(c.docs) +
              ' docs · ' + sizeFmt(c.bytes) +
              (dom ? '\n' + dom.label : '') +
              (v.floored ? '\n(tile enlarged to stay visible)' : '') +
              '\nclick for details';
            el.setAttribute('role', 'button');
            el.setAttribute('tabindex', '0');
            el.setAttribute('aria-label', disp + ' — ' + numFmt(c.tokens) + ' tokens');
            const open = () => openModal(c);
            el.addEventListener('click', open);
            el.addEventListener('keydown', (e) => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
            });
            map.appendChild(el);
          });
          firstBuild = false;
        };

        buildMap();
        attachTip(map);
        if (list) {
          list.innerHTML = '';
          corpora.slice(0, 7).forEach((c) => {
            const button = document.createElement('button');
            button.type = 'button';
            const name = document.createElement('strong');
            name.textContent = c.title || c.name;
            const path = document.createElement('small');
            path.textContent = c.path;
            const count = document.createElement('span');
            count.className = 'corpus-list-count';
            count.textContent = numFmt(c.tokens) + ' tokens';
            button.append(name, path, count);
            button.addEventListener('click', () => openModal(c));
            list.appendChild(button);
          });
        }
        let resizeTimer;
        window.addEventListener('resize', () => {
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(buildMap, 150);
        });
      }

      const note = statsBox.querySelector('[data-stat="note"]');
      if (note) {
        const when = (s.generated || '').slice(0, 10);
        note.textContent = (s.index_commit ? 'waldo-index@' + s.index_commit : 'the public index') +
          (when ? ' · ' + when : '') + ' · verifiable shard by shard ↗';
      }

      if (!reduced && pending.length) {
        const io2 = new IntersectionObserver((entries) => {
          if (entries.some((e) => e.isIntersecting)) { io2.disconnect(); runCountUp(); }
        }, { threshold: 0.35 });
        io2.observe(statsBox);
      }
    })
    .catch(() => {
      statsBox.classList.add('stats-unavailable');
      const note = statsBox.querySelector('[data-stat="note"]');
      if (note) {
        note.textContent = 'Live index statistics are temporarily unavailable · open the public index ↗';
      }
      statsBox.querySelectorAll('.count-stat .v').forEach((value) => {
        value.textContent = '—';
      });
      const map = statsBox.querySelector('[data-stat="map"]');
      if (map) {
        map.classList.add('map-unavailable');
        map.textContent = 'The corpus map will return with the live index feed.';
      }
      const list = statsBox.querySelector('[data-stat="list"]');
      if (list) list.textContent = 'Live corpus details are temporarily unavailable.';
    });
}
