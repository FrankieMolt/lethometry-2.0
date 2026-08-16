/* LETHOMETRY three.js particle field
 * Subtle brutalist sci-fi starfield: slow-drifting constellation of points
 * in green/cyan/magenta against the dark background.
 * - Autobiographical guard: prefers-reduced-motion => off
 * - WebGL support check => silently no-op (existing CSS/SVG hero remains)
 * - Pauses when tab hidden; DPR-capped; bounded particle count for perf
 * Loaded lazily only when THREE global is available.
 */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  var THREE_READY = (typeof THREE !== 'undefined');
  if (!THREE_READY) return;

  var canvas = document.createElement('canvas');
  canvas.id = 'stars3d';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;pointer-events:none;opacity:.55;';
  document.body.insertBefore(canvas, document.body.firstChild);

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
  } catch (e) {
    canvas.remove();
    return;
  }

  var W, H, dpr = 1;
  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(dpr);
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
  }

  var camera = new THREE.PerspectiveCamera(60, W || 1, 0.1, 2000);
  camera.position.z = 300;

  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050508, 0.0009);

  // particle count scales with surface area, bounded for perf
  var count = Math.min(Math.floor((W || 1200) * (H || 800) / 2600), 1100);
  if (count < 120) count = 120;

  var positions = new Float32Array(count * 3);
  var colors = new Float32Array(count * 3);
  var palette = [ new THREE.Color(0x00ff41), new THREE.Color(0x00e5ff), new THREE.Color(0xaa00ff), new THREE.Color(0x00ff9d), new THREE.Color(0xffffff) ];
  var i3, x, y, z, c;
  for (var i = 0; i < count; i++) {
    i3 = i * 3;
    z = -1200 + Math.random() * 1200;
    x = (Math.random() - 0.5) * 2400;
    y = (Math.random() - 0.5) * 1600;
    positions[i3] = x; positions[i3 + 1] = y; positions[i3 + 2] = z;
    c = palette[Math.floor(Math.random() * palette.length)];
    colors[i3] = c.r; colors[i3 + 1] = c.g; colors[i3 + 2] = c.b;
  }

  var geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  var sprite = (function () {
    var cv = document.createElement('canvas'); cv.width = cv.height = 16;
    var ctx = cv.getContext('2d');
    var g = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.5, 'rgba(180,255,220,.5)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 16, 16);
    return new THREE.CanvasTexture(cv);
  })();

  var mat = new THREE.PointsMaterial({
    size: 1.6, map: sprite, vertexColors: true,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
  });
  var points = new THREE.Points(geo, mat);
  scene.add(points);

  resize();
  window.addEventListener('resize', resize);

  var rotY = 0, rotX = 0.1;
  var raf = null, running = true;

  function tick() {
    raf = requestAnimationFrame(tick);
    if (!running) return;
    rotY += 0.00025;
    points.rotation.y = rotY;
    points.rotation.x = rotX + Math.sin(rotY * 0.6) * 0.04;
    renderer.render(scene, camera);
  }

  document.addEventListener('visibilitychange', function () {
    var hidden = document.hidden;
    running = !hidden;
    if (hidden) { if (raf) { cancelAnimationFrame(raf); raf = null; } }
    else if (!raf) { raf = requestAnimationFrame(tick); }
  });

  tick();
})();
