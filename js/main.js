// LETHOMETRY 3.2 — Main JS
// v3.2: Removed three.js hero (replaced with pure CSS+SVG in index.html).
//        Saves ~145KB gzip on every page that loads main.js.
'use strict';

// ===== LOADER =====
function initLoader(){
  addEventListener('load',()=>{
    setTimeout(()=>{
      const l=document.getElementById('loader');
      if(l){l.classList.add('off');setTimeout(()=>l.remove(),600);}
      document.querySelectorAll('.fu').forEach(el=>el.classList.add('v'));
    },1800);
  });
}

// ===== PARTICLE RAIN =====
function initRain(){
  // Home-only: don't add 40 DOM divs to every article page.
  if(!document.querySelector('.h-title,#hero'))return;
  const c=document.createElement('div');c.className='rain';
  document.body.insertBefore(c,document.body.firstChild);
  for(let i=0;i<40;i++){const d=document.createElement('div');d.className='dr';d.style.left=Math.random()*100+'%';d.style.height=(Math.random()*25+8)+'px';d.style.animationDuration=(Math.random()*3+2)+'s';d.style.animationDelay=Math.random()*5+'s';d.style.opacity=Math.random()*.2+.08;c.appendChild(d);}
}

// ===== DISTORTION =====
function initDistort(){
  const s=document.getElementById('distortion-slider');
  if(!s)return;
  // v3.2: `distort` global removed (was three.js particle chaos). Now just CSS filter.
  s.addEventListener('input',e=>{const d=parseFloat(e.target.value);document.body.style.filter=`hue-rotate(${d*35}deg) saturate(${1+d}) blur(${d*1.5}px)`;});
}

// ===== KONAMI =====
let ki=0;const kc=['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
function initKonami(){
  addEventListener('keydown',e=>{
    if(e.key===kc[ki]){ki++;if(ki===kc.length){showEgg();ki=0;}}else{ki=0;}
  });
}
function showEgg(){
  const eg=document.getElementById('eg');if(!eg)return;
  eg.style.display='block';eg.setAttribute('aria-hidden','false');
  const c=eg.querySelector('.ec');c.innerHTML='';
  const lines=['> KONAMI CODE ACCEPTED','> ACCESSING BACKEND...','> WELCOME TO REALITY v3.1.0','','> SIMULATION: ACTIVE','> TIMELINE: 2026.38','> RENDER: 93B LY','> PARTICLES: 10^80','> GLITCHES: 68','> CERN: OPERATIONAL','> WATCHERS: CONFIRMED','','> "THE ONLY WAY TO DEAL WITH AN','>  UNFREE WORLD IS TO BECOME SO','>  ABSOLUTELY FREE THAT YOUR VERY','>  EXISTENCE IS AN ACT OF REBELLION."','>  — ALBERT CAMUS','','> REMEMBER: THE RIVER LETHE FORGETS.','> BUT WE DO NOT.','','> [END TRANSMISSION]'];
  let i=0;
  (function t(){if(i>=lines.length)return;const p=document.createElement('div');p.textContent=lines[i];c.appendChild(p);c.scrollTop=c.scrollHeight;i++;setTimeout(t,70+Math.random()*30);})();
}
function initEasterEgg(){
  const btn=document.getElementById('eg-close');
  if(btn)btn.addEventListener('click',()=>{
    const eg=document.getElementById('eg');if(eg){eg.style.display='none';eg.setAttribute('aria-hidden','true');}
  });
  const eg=document.getElementById('eg');
  if(eg)eg.addEventListener('keydown',e=>{if(e.key==='Escape'){eg.style.display='none';eg.setAttribute('aria-hidden','true');}});
}

// ===== RED PILL =====
function initRedPill(){
  const btn=document.getElementById('red-pill-btn');
  if(!btn)return;
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.hc').forEach(el=>{el.style.display='block';el.classList.add('v');});
    const cat=document.getElementById('categories');
    if(cat)setTimeout(()=>cat.scrollIntoView({behavior:'smooth'}),200);
  });
}

// ===== SIM CALC =====
function initSimCalc(){
  const calc=document.getElementById('sim-calc');
  if(!calc)return;
  const qs=calc.querySelectorAll('.sim-q');let cq=0,score=0;
  qs.forEach((q)=>{
    q.querySelectorAll('button').forEach(btn=>{
      btn.addEventListener('click',()=>{
        score+=parseInt(btn.dataset.value);
        q.classList.add('answered');cq++;
        const next=calc.querySelector(`.sim-q[data-q="${cq}"]`);
        if(next)next.classList.add('active');
        else{const sr=document.getElementById('sim-result');sr.classList.add('show');const pct=Math.min(97,Math.max(15,48+score*6));sr.querySelector('.pct').textContent=pct+'%';let m='';if(pct>80)m='HIGH: You are almost certainly in a simulation.';else if(pct>60)m='MODERATE-HIGH: The simulation hypothesis is strongly supported.';else if(pct>40)m='MODERATE: You are questioning reality. That is the first step.';else m='LOW: You may be an NPC. Or not asking the right questions.';sr.querySelector('.msg').textContent=m;}
      });
    });
  });
}

// ===== SCROLL ANIM =====
function initScroll(){
  const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('v');});},{threshold:.08,rootMargin:'0px 0px -40px 0px'});
  document.querySelectorAll('.fu').forEach(el=>obs.observe(el));
  const nav=document.querySelector('nav');
  if(nav)addEventListener('scroll',()=>{
    const sy=window.scrollY||window.pageYOffset;
    if(sy>40)nav.classList.add('scrolled');else nav.classList.remove('scrolled');
  },{passive:true});
}

// ===== GLITCH RANDOM =====
function initGlitch(){
  // Home-only: scope to the hero title/sub. Article h2s must stay readable.
  if(!document.querySelector('.h-title,.h-sub'))return;
  setInterval(()=>{
    const els=document.querySelectorAll('.h-title,.h-sub');
    if(!els.length)return;
    const el=els[Math.floor(Math.random()*els.length)],orig=el.textContent;
    el.textContent=orig.split('').map(c=>Math.random()<.06?'アイウエオカキクケコ0123456789@#$%&'[Math.floor(Math.random()*22)]:c).join('');
    setTimeout(()=>el.textContent=orig,120);
  },5000);
}

// ===== 3D CARDS =====
function init3DCards(){
  document.querySelectorAll('.cc,.ac').forEach(card=>{
    card.addEventListener('mousemove',e=>{
      const r=card.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,cx=r.width/2,cy=r.height/2;
      card.style.transform=`perspective(800px) rotateX(${(y-cy)/18}deg) rotateY(${(cx-x)/18}deg) translateY(-6px)`;
    });
    card.addEventListener('mouseleave',()=>card.style.transform='');
  });
}

// ===== SEARCH =====
function initSearch(){
  const inp=document.getElementById('search-input');
  if(!inp)return;
  // Add live region for results announcement (a11y)
  const live=document.createElement('div');
  live.id='search-status';
  live.setAttribute('role','status');
  live.setAttribute('aria-live','polite');
  live.style.cssText='position:absolute;left:-9999px;width:1px;height:1px;';
  inp.parentNode.appendChild(live);
  inp.addEventListener('input',e=>{
    const q=e.target.value.toLowerCase();
    let visible=0,total=0;
    document.querySelectorAll('.cc,.ac').forEach(card=>{
      total++;
      const match=card.textContent.toLowerCase().includes(q);
      card.style.display=match?'':'none';
      if(match)visible++;
    });
    live.textContent=q?`${visible} of ${total} results`:`${total} items`;
  });
}

// ===== MEMORY CHECK (event delegation) =====
function initMemoryChecks(){
  document.body.addEventListener('click',e=>{
    const btn=e.target.closest('.mco button');
    if(!btn)return;
    const fb=btn.closest('.mc')?.querySelector('.mcf');
    if(fb){fb.style.display='block';}
  });
}

// ===== MOBILE NAV =====
function initMobileNav(){
  const t=document.querySelector('.n-toggle'),l=document.querySelector('.n-links');
  if(!t||!l)return;
  t.addEventListener('click',e=>{e.stopPropagation();l.classList.toggle('open');});
  l.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>l.classList.remove('open')));
  addEventListener('click',e=>{if(!l.contains(e.target)&&!t.contains(e.target))l.classList.remove('open');});
}

// ===== CARD SCROLL =====
function initCardScroll(){
  document.querySelectorAll('[data-scrollto]').forEach(el=>{
    const handler=()=>{const t=document.getElementById(el.dataset.scrollto);if(t)t.scrollIntoView({behavior:'smooth'});};
    el.addEventListener('click',handler);
    el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();handler();}});
  });
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded',()=>{
  initLoader();initRain();initDistort();initKonami();initEasterEgg();
  initRedPill();initSimCalc();initScroll();initGlitch();init3DCards();
  initSearch();initMemoryChecks();initMobileNav();initCardScroll();
});
