// LETHOMETRY v4.0 — youtube-facade.js
//
// Click-to-load YouTube embeds. The v3.6 markup was a static <div> facade plus a
// separate script; this version keeps the same privacy property (no request to
// youtube.com or ytimg.com is made until the visitor clicks) and adds keyboard
// support, which the v3.6 facade lacked entirely: it was a plain div, so it was
// unreachable by keyboard and invisible to assistive tech.
'use strict';

(function () {
  const FACADE_SELECTOR = '.yt-facade';

  function mount(facade) {
    if (facade.dataset.mounted === '1') return;
    facade.dataset.mounted = '1';

    const vid = facade.dataset.vid;
    if (!vid) return;

    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${vid}?autoplay=1&rel=0`;
    iframe.title = facade.getAttribute('aria-label') || 'YouTube video';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';

    facade.replaceChildren(iframe);
    iframe.focus();
  }

  function onClick(e) {
    const facade = e.target.closest(FACADE_SELECTOR);
    if (facade) mount(facade);
  }

  function onKey(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const facade = e.target.closest(FACADE_SELECTOR);
    if (!facade) return;
    e.preventDefault();
    mount(facade);
  }

  document.addEventListener('click', onClick);
  document.addEventListener('keydown', onKey);
})();
