/* LETHOMETRY click-to-load YouTube facade.
 * Shows a thumbnail + play button; only injects the youtube-nocookie iframe on click.
 * No YouTube JS runs until the user actually plays — keeps the page fast & GDPR-friendly.
 * Usage: <div class="yt-facade" data-vid="VIDEO_ID" data-label="optional a11y label">
 *         <div class="yt-facade-bg"></div>
 *         <button class="yt-facade-play" type="button" aria-label="Play video"></button>
 *       </div>
 */
(function () {
  var facades = document.querySelectorAll('.yt-facade');
  if (!facades.length) return;

  // Explicit consent handler — run once per video.
  function load(f) {
    var vid = f.getAttribute('data-vid');
    if (!vid || f.__loaded) return;
    f.__loaded = true;
    var label = f.getAttribute('data-label') || 'Play video';
    var iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube-nocookie.com/embed/' + vid + '?autoplay=1&rel=0&modestbranding=1';
    iframe.title = label;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('frameborder', '0');
    iframe.className = 'yt-facade-frame';
    // swap: clear children, inject iframe
    f.textContent = '';
    f.appendChild(iframe);
  }

  facades.forEach(function (f) {
    // Set the thumbnail as background once YouTube thumbnail host responds
    var vid = f.getAttribute('data-vid');
    if (vid) {
      f.classList.add('has-thumb');
      var img = new Image();
      img.onload = function () {
        f.style.backgroundImage = "url('https://i.ytimg.com/vi/" + vid + "/maxresdefault.jpg')";
        if (!img.naturalWidth || img.naturalWidth < 120) {
          f.style.backgroundImage = "url('https://i.ytimg.com/vi/" + vid + "/hqdefault.jpg')";
        }
      };
      img.src = 'https://i.ytimg.com/vi/' + vid + '/maxresdefault.jpg';
    }
    var btn = f.querySelector('.yt-facade-play');
    var target = btn || f;
    target.addEventListener('click', function (e) {
      e.preventDefault();
      load(f);
    });
  });
})();
