// Shared browser-side security helpers for content that comes from Markdown,
// frontmatter, or the public corpus index.
(() => {
  'use strict';

  const escapeHTML = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const safeURL = (value, kind = 'link') => {
    const raw = String(value ?? '').trim();
    if (!raw || /[\u0000-\u001f\u007f]/.test(raw)) return null;

    try {
      const base = globalThis.document?.baseURI || 'https://openwaldo.org/';
      const parsed = new URL(raw, base);
      if (kind === 'image') {
        const baseOrigin = new URL(base).origin;
        const allowedOrigin = parsed.origin === baseOrigin
          || parsed.origin === 'https://openwaldo.org';
        return allowedOrigin && ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : null;
      }
      return ['http:', 'https:', 'mailto:'].includes(parsed.protocol) ? parsed.href : null;
    } catch (_) {
      return null;
    }
  };

  const applySafeLink = (anchor, value, { newTab = false } = {}) => {
    const href = safeURL(value, 'link');
    if (!href) return false;
    anchor.href = href;
    if (newTab) {
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
    }
    return true;
  };

  // This is deliberately narrower than HTML sanitizers intended for general
  // rich text: it permits only the elements emitted by our Markdown subset.
  const sanitizeRenderedHTML = (html) => {
    if (!globalThis.document) throw new Error('HTML sanitization requires a document');
    const allowed = new Set([
      'A', 'BLOCKQUOTE', 'CODE', 'EM', 'H3', 'H4', 'H5', 'H6',
      'HR', 'LI', 'OL', 'P', 'PRE', 'STRONG', 'UL',
    ]);
    const template = document.createElement('template');
    template.innerHTML = String(html ?? '');

    Array.from(template.content.querySelectorAll('*')).forEach((element) => {
      if (!allowed.has(element.tagName)) {
        element.replaceWith(document.createTextNode(element.textContent || ''));
        return;
      }

      const href = element.tagName === 'A'
        ? safeURL(element.getAttribute('href'), 'link')
        : null;
      Array.from(element.attributes).forEach((attribute) => element.removeAttribute(attribute.name));
      if (href) element.setAttribute('href', href);
      else if (element.tagName === 'A') element.replaceWith(...element.childNodes);
    });
    return template.innerHTML;
  };

  globalThis.OpenWALDOSecurity = Object.freeze({
    applySafeLink,
    escapeAttribute: escapeHTML,
    escapeHTML,
    safeURL,
    sanitizeRenderedHTML,
  });
})();
