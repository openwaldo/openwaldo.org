// Load analytics only on the public OpenWALDO site. Local previews and other
// hostnames must not enter the production dataset.
(() => {
  const productionHosts = new Set(['openwaldo.org', 'www.openwaldo.org']);
  if (!productionHosts.has(window.location.hostname)) return;

  const tracker = document.createElement('script');
  tracker.defer = true;
  tracker.src = 'https://cloud.umami.is/script.js';
  tracker.dataset.websiteId = '638523af-5c0d-4385-8448-54d3c52c79ac';
  document.head.append(tracker);
})();
