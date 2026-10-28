// LETHOMETRY v4.0 — main.js
//
// Replaces the v3.6 script. Same feature set, minus the parts that either did
// nothing (the three.js starfield rendered behind an opaque body background, so
// 589KB produced zero visible pixels) or referenced markup the build no longer
// emits. Every init below guards on element existence, so one script safely
// serves the home page, the archive index and all 52 article pages.
'use strict';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ===== REVEAL ON SCROLL =====
function initReveal() {
  const els = document.querySelectorAll('.fu');
  if (!els.length) return;
  if (reduceMotion || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('v'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('v');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  els.forEach((el) => io.observe(el));
}

// ===== NAV: mobile toggle + scrolled state =====
function initNav() {
  const toggle = document.querySelector('.n-toggle');
  const links = document.querySelector('.n-links');
  if (toggle && links) {
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    links.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('click', (e) => {
      if (!links.contains(e.target) && !toggle.contains(e.target)) {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
}

// ===== GLITCH: occasional character corruption on the hero title =====
// A11y note: the title text is never actually replaced, only decorated via
// ::before/::after text-shadow layers, so screen readers get clean text.
function initGlitch() {
  const title = document.querySelector('.h-title');
  if (!title || reduceMotion) return;
  title.classList.add('glitch');
}

// ===== REALITY DISTORTION SLIDER =====
function initDistort() {
  const s = document.getElementById('distortion-slider');
  if (!s) return;
  s.addEventListener('input', (e) => {
    const d = parseFloat(e.target.value);
    document.body.style.filter =
      `hue-rotate(${d * 35}deg) saturate(${1 + d}) blur(${d * 1.5}px)`;
  });
}

// ===== 3D TILT ON CARDS =====
function initTilt() {
  if (reduceMotion || matchMedia('(hover: none)').matches) return;
  document.querySelectorAll('.cc, .ac').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      card.style.transform =
        `perspective(800px) rotateX(${(y - r.height / 2) / 18}deg) ` +
        `rotateY(${(r.width / 2 - x) / 18}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
}

// ===== ARCHIVE SEARCH (live filter + a11y announcements) =====
function initSearch() {
  const inp = document.getElementById('search-input');
  const grid = document.getElementById('archive');
  if (!inp || !grid) return;

  const live = document.createElement('div');
  live.id = 'search-status';
  live.setAttribute('role', 'status');
  live.setAttribute('aria-live', 'polite');
  live.className = 'sr-only';
  document.body.appendChild(live);

  const cards = Array.from(grid.querySelectorAll('.ac'));
  // Pre-lowercase once; doing it per keystroke on 52 nodes is wasteful.
  const hay = cards.map((c) => c.textContent.toLowerCase());

  // Support ?cat=ARCHIVE deep links from the home page category grid.
  // The category is a separate filter axis from the text query: typing in the box
  // replaces the box contents, so the category must NOT be inferred from the box
  // (doing so makes the two filters inseparable and a search that matches nothing
  // in the active category reports 0 with no way to recover).
  const params = new URLSearchParams(location.search);
  let cat = (params.get('cat') || '').toUpperCase();

  const apply = () => {
    const q = inp.value.trim().toLowerCase();
    // A ?cat= filter stays active until the visitor edits the box, at which point
    // the query takes over and the category is released.
    const textOk = (c, i) => !q || hay[i].includes(q);
    const catOk = (c) => !cat || c.dataset.cat === cat;
    let visible = 0;
    cards.forEach((c, i) => {
      const show = textOk(c, i) && catOk(c);
      c.style.display = show ? '' : 'none';
      if (show) visible++;
    });
    live.textContent = q
      ? `${visible} of ${cards.length} results`
      : cat
        ? `${visible} of ${cards.length} files in ${cat}`
        : `${cards.length} files`;
    return visible;
  };

  if (cat) {
    inp.value = cat;
    inp.setAttribute('aria-label', `Filtered by category ${cat}`);
  }
  apply();

  inp.addEventListener('input', () => {
    // The visitor is now searching, not browsing a category.
    if (inp.value.trim().toUpperCase() !== cat) cat = '';
    apply();
  });

  // A ?cat= link with no results (e.g. a typo'd query) should say so rather than
  // showing an empty grid with no explanation.
  if (cat && apply() === 0) {
    const note = document.createElement('p');
    note.className = 'no-results';
    note.textContent = `No files match "${cat}".`;
    grid.before(note);
  }
}

// ===== ARTICLE: reading progress =====
// A11y bug (fixed): this used to no-op under prefers-reduced-motion, so the
// progress bar stayed at 0% and the back-to-top button never appeared for
// visitors who have reduced motion enabled — the exact people least likely to
// want a janky animated bar. Reduced motion must suppress the *animation*, not
// the *function*: the bar still updates, it just does not transition.
function initProgress() {
  const bar = document.getElementById('rp');
  const body = document.querySelector('.ab');
  if (!bar || !body) return;
  let ticking = false;
  const update = () => {
    ticking = false;
    const r = body.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    if (total <= 0) { bar.style.width = '100%'; return; }
    const scrolled = Math.min(Math.max(-r.top, 0), total);
    bar.style.width = ((scrolled / total) * 100).toFixed(2) + '%';
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  update();
}

// ===== ARTICLE: table of contents from h2 =====
function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '').slice(0, 60) || 'section';
}

function initTOC() {
  const body = document.querySelector('.ab');
  if (!body) return;
  const h2s = Array.from(body.querySelectorAll('h2'));
  if (h2s.length < 2) return;
  h2s.forEach((h, i) => { if (!h.id) h.id = 'sec-' + (i + 1) + '-' + slugify(h.textContent); });

  const wrap = document.createElement('nav');
  wrap.className = 'toc';
  wrap.setAttribute('aria-label', 'Table of contents');
  const ol = document.createElement('ol');
  h2s.forEach((h) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#' + h.id;
    a.textContent = h.textContent;
    a.dataset.target = h.id;
    li.appendChild(a);
    ol.appendChild(li);
  });
  wrap.appendChild(ol);
  body.parentNode.insertBefore(wrap, body);

  const links = Array.from(wrap.querySelectorAll('a'));
  links.forEach((a) => {
    a.addEventListener('click', (e) => {
      const t = document.getElementById(a.dataset.target);
      if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', '#' + a.dataset.target);
    });
  });

  let ticking = false;
  const spy = () => {
    ticking = false;
    const y = window.scrollY + 140;
    let current = h2s[0].id;
    for (const h of h2s) { if (h.offsetTop <= y) current = h.id; else break; }
    links.forEach((a) => a.classList.toggle('active', a.dataset.target === current));
  };
  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(spy); }
  }, { passive: true });
  spy();
}

// ===== ARTICLE: header meta (category, filed date, read time, word count) =====
function initHeaderMeta() {
  const aw = document.querySelector('.aw');
  if (!aw) return;
  const h1 = aw.querySelector('.at');
  if (!h1) return;
  const body = aw.querySelector('.ab');
  if (!body) return;

  let words = 0;
  const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => {
      const tag = n.parentNode && n.parentNode.nodeName;
      if (tag === 'SCRIPT' || tag === 'STYLE') return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  let n;
  while ((n = walker.nextNode())) {
    const t = n.textContent.trim();
    if (t) words += t.split(/\s+/).length;
  }

  const mins = Math.max(1, Math.round(words / 230));
  const wc = words >= 1000
    ? (words / 1000).toFixed(1).replace(/\.0$/, '') + 'K WORDS'
    : words + ' WORDS';

  const meta = document.createElement('div');
  meta.className = 'at-meta';
  meta.textContent = `READ TIME ~${mins} MIN // ${wc}`;

  h1.parentNode.insertBefore(meta, h1);
  // The build renders the category/date into the .am strip already, so the
  // original badges stay visible and are not hidden like v3.6 did.
}

// ===== ARTICLE: back to top =====
// Same reduced-motion rule as initProgress: the button is a functional control,
// not decoration, so it must appear regardless of motion preference.
function initBackToTop() {
  if (!document.querySelector('.ab')) return;
  const btn = document.createElement('button');
  btn.className = 'btt';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Back to top');
  btn.innerHTML = '<span class="btt-arrow" aria-hidden="true">&#8593;</span>'
    + '<span class="btt-label">TOP</span>';
  document.body.appendChild(btn);
  let ticking = false;
  const update = () => {
    ticking = false;
    btn.classList.toggle('show', window.scrollY > window.innerHeight * 0.6);
  };
  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  btn.addEventListener('click', () =>
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
  update();
}

// ===== KONAMI EASTER EGG =====
function initKonami() {
  const seq = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft',
    'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let i = 0;
  addEventListener('keydown', (e) => {
    if (e.key === seq[i]) {
      i++;
      if (i === seq.length) { i = 0; showEgg(); }
    } else i = 0;
  });
}

function showEgg() {
  const lines = [
    '> KONAMI CODE ACCEPTED', '> ESTABLISHING HANDSHAKE...', '',
    '> LETHOMETRY v4.0', '> SIMULATION: ACTIVE', '> RENDER: CSS/SVG',
    '> THREE.JS: REMOVED (IT NEVER RENDERED)', '> PARTICLES: CSS',
    '> CONTENT: 52 FILES', '', '> THE ARCHIVE REMEMBERS.', '',
    '> [END TRANSMISSION]',
  ];
  const d = document.createElement('div');
  d.className = 'egg';
  d.setAttribute('role', 'dialog');
  d.setAttribute('aria-label', 'Terminal message');
  const pre = document.createElement('pre');
  pre.className = 'terminal';
  pre.textContent = lines.join('\n');
  d.appendChild(pre);
  d.addEventListener('click', () => d.remove());
  document.body.appendChild(d);
}

// ===== SIMULATION CALCULATOR (calculator.html) =====
function initCalc() {
  const calc = document.getElementById('sim-calc');
  if (!calc) return;
  const questions = Array.from(calc.querySelectorAll('.sim-q'));
  const result = document.getElementById('sim-result');
  let idx = 0;
  let score = 0;

  const activate = (i) => {
    questions.forEach((q, j) => {
      q.classList.toggle('active', j === i);
      q.hidden = j !== i;
    });
  };
  activate(0);

  calc.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-value]');
    if (!btn) return;
    score += parseInt(btn.dataset.value, 10) || 0;
    idx++;
    if (idx < questions.length) { activate(idx); return; }
    const pct = Math.min(97, Math.max(15, 48 + score * 6));
    if (result) {
      result.hidden = false;
      result.classList.add('show');
      const pctEl = result.querySelector('.pct');
      const msgEl = result.querySelector('.msg');
      if (pctEl) pctEl.textContent = pct + '%';
      if (msgEl) {
        msgEl.textContent = pct > 80
          ? 'HIGH: You are almost certainly in a simulation.'
          : pct > 60
            ? 'MODERATE-HIGH: The hypothesis is strongly supported.'
            : pct > 40
              ? 'MODERATE: You are questioning reality. That is the first step.'
              : 'LOW: You may be an NPC. Or not asking the right questions.';
      }
    }
  });
}

// ===== RED PILL reveals the category section =====
function initRedPill() {
  const btn = document.querySelector('.btn-rp');
  const cats = document.getElementById('categories');
  if (!btn || !cats) return;
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    cats.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  });
}

// ===== INIT =====
// Order matters. initTOC inserts a nav element directly above .ab, which shifts
// the article down the page. Anything that measures .ab's position must run
// AFTER that insertion or it caches a stale baseline — that is why the reading
// progress bar sat at 0% while the page was scrolled to the end.
document.addEventListener('DOMContentLoaded', () => {
  initReveal();
  initNav();
  initGlitch();
  initDistort();
  initTilt();
  initSearch();
  initRedPill();
  initCalc();
  initHeaderMeta();
  initTOC();          // inserts the TOC nav — do this before any position measuring
  initProgress();     // measures .ab, so it must follow initTOC
  initBackToTop();
  initKonami();
});

// Memory check quiz (mandela.html) — reveal answer on click, then lock buttons
(function(){
  document.querySelectorAll('.mco').forEach(function(quiz){
    var buttons = quiz.querySelectorAll('button');
    var box = quiz.closest('.mc');
    var answer = box ? box.querySelector('.mcf') : null;
    buttons.forEach(function(btn){
      btn.addEventListener('click', function(){
        if (answer) answer.classList.add('revealed');
        buttons.forEach(function(b){ b.disabled = true; });
        btn.classList.add('picked');
      });
    });
  });
})();
