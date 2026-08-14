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

console.log('Content security regression tests passed.');
