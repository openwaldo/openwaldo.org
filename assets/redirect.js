// Preserve query parameters and anchors when legacy page URLs move.
(() => {
  const target = document.currentScript?.dataset.redirect || '';
  if (!/^\/[a-z0-9/-]*\/$/i.test(target)) return;

  const destination = new URL(target, window.location.origin);
  destination.search = window.location.search;
  destination.hash = window.location.hash;
  window.location.replace(destination.href);
})();
