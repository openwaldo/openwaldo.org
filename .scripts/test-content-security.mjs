import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

await import('../assets/security.js');

const { escapeAttribute, safeURL } = globalThis.OpenWALDOSecurity;

assert.equal(safeURL('https://example.org/a?x=1&y=2'), 'https://example.org/a?x=1&y=2');
assert.equal(safeURL('http://example.org/'), 'http://example.org/');
assert.equal(safeURL('mailto:security@example.org'), 'mailto:security@example.org');
assert.equal(safeURL('/posts/example'), 'https://openwaldo.org/posts/example');
assert.equal(safeURL('assets/logo.svg', 'image'), 'https://openwaldo.org/assets/logo.svg');
assert.equal(safeURL('https://openwaldo.org/assets/logo.svg', 'image'), 'https://openwaldo.org/assets/logo.svg');
assert.equal(safeURL('https://tracker.example/pixel.gif', 'image'), null);

for (const value of [
  'javascript:alert(1)',
  'JaVaScRiPt:alert(1)',
  'data:text/html,<script>alert(1)</script>',
  'vbscript:msgbox(1)',
  'file:///etc/passwd',
  'https://example.org/\nmalicious',
]) {
  assert.equal(safeURL(value), null, `expected unsafe URL to be rejected: ${value}`);
}
assert.equal(safeURL('mailto:security@example.org', 'image'), null);
assert.equal(
  escapeAttribute('" onmouseover="alert(1)<script>'),
  '&quot; onmouseover=&quot;alert(1)&lt;script&gt;',
);

const posts = await readFile(new URL('../assets/posts.js', import.meta.url), 'utf8');
assert.doesNotMatch(posts, /<a href="\$2">\$1<\/a>/);
assert.match(posts, /sanitizeRenderedHTML\(md2html\(body\)\)/);
assert.match(posts, /safeURL\(meta\.logo, 'image'\)/);

const corpus = await readFile(new URL('../assets/corpus-browser.js', import.meta.url), 'utf8');
assert.match(corpus, /applySafeLink\(link, source\.url/);
assert.match(corpus, /Object\.create\(null\)/);

const main = await readFile(new URL('../assets/main.js', import.meta.url), 'utf8');
assert.match(main, /\^\(\?:https\?:\)\?\\\/\\\//);
assert.match(main, /rel\.add\('noopener'\)/);
assert.match(main, /rel\.add\('noreferrer'\)/);
assert.match(main, /new MutationObserver/);

const publicPages = [
  '../404.html',
  '../about.html',
  '../browser.html',
  '../community.html',
  '../contributing.html',
  '../corpus.html',
  '../faq.html',
  '../index.html',
  '../posts/index.html',
  '../training.html',
];
for (const page of publicPages) {
  const html = await readFile(new URL(page, import.meta.url), 'utf8');
  assert.equal(
    html.match(/data-website-id="638523af-5c0d-4385-8448-54d3c52c79ac"/g)?.length,
    1,
    `${page} must contain exactly one Umami tracker`,
  );
  assert.match(html, /script-src 'self' https:\/\/cloud\.umami\.is/);
  assert.match(html, /connect-src 'self' https:\/\/cloud\.umami\.is/);
  assert.match(html, /connect-src[^\"]*https:\/\/gateway\.umami\.is/);
}

console.log('Content security regression tests passed.');
