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

// ===== ARTICLE PAGE UX (v3.6) =====
// Detects article pages and wires up: reading progress, back-to-top, table of contents,
// header meta (word count + read time), and share buttons.
// Marked by presence of <main><div class="aw"> on the page.
function isArticlePage(){return !!document.querySelector('main .aw');}

// 1) READING PROGRESS BAR — fills as user scrolls the article area.
function initReadingProgress(){
  if(!isArticlePage())return;
  // Element is rendered inline in each article; if missing (older pages), skip.
  const bar=document.getElementById('rp');
  if(!bar)return;
  // Prefer measuring the article container so the % matches actual reading progress,
  // not the whole page (which includes the related block + footer at 100%).
  const aw=document.querySelector('main .aw');
  const target=aw||document.body;
  let ticking=false;
  const update=()=>{
    ticking=false;
    const rect=target.getBoundingClientRect();
    const total=rect.height-window.innerHeight;
    if(total<=0){bar.style.width='100%';return;}
    const scrolled=Math.min(Math.max(-rect.top,0),total);
    const pct=(scrolled/total)*100;
    bar.style.width=pct.toFixed(2)+'%';
  };
  const onScroll=()=>{if(!ticking){ticking=true;requestAnimationFrame(update);}};
  addEventListener('scroll',onScroll,{passive:true});
  addEventListener('resize',onScroll,{passive:true});
  update();
}

// 2) BACK-TO-TOP BUTTON — fixed bottom-right, mint border, ↑ icon. Shows past 30% scroll.
function initBackToTop(){
  if(!isArticlePage())return;
  const btn=document.getElementById('btt');
  if(!btn)return;
  let ticking=false;
  const update=()=>{
    ticking=false;
    const aw=document.querySelector('main .aw');
    const target=aw||document.body;
    const rect=target.getBoundingClientRect();
    const total=rect.height-window.innerHeight;
    const scrolled=Math.min(Math.max(-rect.top,0),Math.max(total,1));
    const pct=total>0?(scrolled/total)*100:0;
    btn.classList.toggle('show',pct>30);
  };
  const onScroll=()=>{if(!ticking){ticking=true;requestAnimationFrame(update);}};
  addEventListener('scroll',onScroll,{passive:true});
  btn.addEventListener('click',()=>{
    // Respect reduced motion: jump rather than smooth-scroll.
    const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({top:0,behavior:reduce?'auto':'smooth'});
  });
  update();
}

// 3) TABLE OF CONTENTS — auto-built from <h2> in .ab. Desktop: sticky sidebar.
//    Mobile: collapsible accordion above the article body.
function initTOC(){
  if(!isArticlePage())return;
  const side=document.getElementById('toc-side');
  const mob=document.getElementById('toc-mob');
  const mobBtn=document.getElementById('toc-mob-btn');
  const aw=document.querySelector('main .aw');
  const body=aw?aw.querySelector('.ab'):null;
  if(!body)return;
  // Pull h2 elements out of the body and ensure each has a stable id we can link to.
  const h2s=Array.from(body.querySelectorAll('h2'));
  if(h2s.length<2)return; // Not worth a TOC for one section.
  h2s.forEach((h,i)=>{
    if(!h.id)h.id='sec-'+(i+1)+'-'+slugify(h.textContent);
  });
  // Build sidebar (desktop).
  if(side){
    const ol=document.createElement('ol');
    h2s.forEach(h=>{
      const li=document.createElement('li');
      const a=document.createElement('a');
      a.href='#'+h.id;
      a.textContent=h.textContent;
      a.dataset.target=h.id;
      li.appendChild(a);
      ol.appendChild(li);
    });
    side.appendChild(ol);
    if(aw)aw.classList.add('toc-on');
    // Insert sidebar as the FIRST child so it sits to the left of the article body
    // in the flex row.
    if(aw)aw.insertBefore(side,aw.firstChild);
  }
  // Build mobile accordion.
  if(mob){
    const ol=document.createElement('ol');
    h2s.forEach(h=>{
      const li=document.createElement('li');
      const a=document.createElement('a');
      a.href='#'+h.id;
      a.textContent=h.textContent;
      a.dataset.target=h.id;
      li.appendChild(a);
      ol.appendChild(li);
    });
    mob.appendChild(ol);
    if(mobBtn){
      mobBtn.addEventListener('click',()=>{
        const open=mob.classList.toggle('open');
        mobBtn.classList.toggle('open',open);
        mobBtn.setAttribute('aria-expanded',String(open));
      });
    }
    // Insert mobile button + accordion right after the back-to-archive link.
    const bta=aw?aw.querySelector('.bta'):null;
    if(bta&&bta.parentNode){
      bta.parentNode.insertBefore(mobBtn,bta.nextSibling);
      bta.parentNode.insertBefore(mob,bta.nextSibling);
    }
  }
  // Scroll-spy — highlight the section currently in view in both sidebars.
  const links=Array.from(document.querySelectorAll('#toc-side a, #toc-mob a'));
  if(!links.length)return;
  const setActive=(id)=>{
    links.forEach(a=>{
      if(a.dataset.target===id)a.classList.add('active');
      else a.classList.remove('active');
    });
  };
  let spyTicking=false;
  const spy=()=>{
    spyTicking=false;
    const y=window.scrollY+120;
    let current=h2s[0].id;
    for(const h of h2s){
      if(h.offsetTop<=y)current=h.id;else break;
    }
    setActive(current);
  };
  const onSpy=()=>{if(!spyTicking){spyTicking=true;requestAnimationFrame(spy);}};
  addEventListener('scroll',onSpy,{passive:true});
  // Smooth-scroll for TOC links (respects reduced motion via global html rule).
  links.forEach(a=>{
    a.addEventListener('click',(e)=>{
      const id=a.dataset.target;
      const t=document.getElementById(id);
      if(!t)return;
      e.preventDefault();
      const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
      t.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});
      history.replaceState(null,'','#'+id);
    });
  });
  spy();
}
function slugify(s){return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60)||'section';}

// 4) ARTICLE HEADER META — surface word count + read time, format the category badge,
//    and inject a prominent "FILED" date derived from the existing adt field.
function initHeaderMeta(){
  if(!isArticlePage())return;
  const aw=document.querySelector('main .aw');
  if(!aw)return;
  const h1=aw.querySelector('.at');
  if(!h1)return;
  // Compute word count from the article body.
  const body=aw.querySelector('.ab');
  let words=0;
  if(body){
    // Walk text nodes (skipping <script>/<style>) so tables/code don't inflate count.
    const walker=document.createTreeWalker(body,NodeFilter.SHOW_TEXT,{
      acceptNode:(n)=>{
        const p=n.parentNode;
        if(!p)return NodeFilter.FILTER_REJECT;
        const tag=p.nodeName;
        if(tag==='SCRIPT'||tag==='STYLE')return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    let n;
    while((n=walker.nextNode())){
      const t=n.textContent.trim();
      if(!t)continue;
      words+=t.split(/\s+/).length;
    }
  }
  // Read time at 230 wpm (long-form reading speed for engaged readers).
  const wpm=230;
  const mins=Math.max(1,Math.round(words/wpm));
  // Category from .acls, FILED date from .adt (best-effort: pull any 4-digit year plus optional -MM-DD).
  const acls=aw.querySelector('.acls');
  const adt=aw.querySelector('.adt');
  const cat=acls?acls.textContent.trim():'';
  let filed='';
  if(adt){
    // Prefer a YYYY-MM-DD or YYYY-MM pattern. Fall back to any 4-digit year.
    const iso=adt.textContent.match(/(\d{4}-\d{2}-\d{2})/);
    const ym=adt.textContent.match(/(\d{4}-\d{2})/);
    const yr=adt.textContent.match(/(\d{4})/);
    if(iso)filed='FILED '+iso[1];
    else if(ym)filed='FILED '+ym[1];
    else if(yr)filed='FILED '+yr[1];
  }
  // Format word count compactly.
  let wcLabel;
  if(words>=1000)wcLabel=(words/1000).toFixed(1).replace(/\.0$/,'')+'K WORDS';
  else wcLabel=words+' WORDS';
  // Build the meta strip.
  const meta=document.createElement('div');
  meta.className='at-meta';
  meta.innerHTML=
    (cat?`<span class="at-cat">${escapeHtml(cat)}</span>`:'')+
    (filed?`<span class="at-filed">${escapeHtml(filed)}</span>`:'')+
    (cat||filed?'<span class="at-sep">//</span>':'')+
    `<span class="at-stat">READ TIME: <b>~${mins} MIN</b></span>`+
    `<span class="at-sep">//</span>`+
    `<span class="at-stat">${escapeHtml(wcLabel)}</span>`;
  h1.parentNode.insertBefore(meta,h1);
  // Also enhance the existing .acls/.adt row: make the category badge more prominent
  // by adding the at-cat class (the strip above already does this; we just hide the
  // original small badge to avoid duplication).
  if(acls)acls.style.display='none';
  if(adt)adt.style.display='none';
  // Store on the element for share buttons / debug.
  aw.dataset.words=String(words);
  aw.dataset.readMins=String(mins);
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);}

// 5) SHARE BUTTONS — wire up the inline share block. No external scripts.
function initShare(){
  if(!isArticlePage())return;
  const block=document.querySelector('.share-block');
  if(!block)return;
  const url=encodeURIComponent(location.href);
  const title=encodeURIComponent(document.title);
  const tw=block.querySelector('[data-share="twitter"]');
  const fb=block.querySelector('[data-share="facebook"]');
  const ln=block.querySelector('[data-share="linkedin"]');
  const cp=block.querySelector('[data-share="copy"]');
  if(tw)tw.href=`https://twitter.com/intent/tweet?url=${url}&text=${title}`;
  if(fb)fb.href=`https://www.facebook.com/sharer/sharer.php?u=${url}`;
  if(ln)ln.href=`https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
  if(cp)cp.addEventListener('click',async()=>{
    let ok=false;
    try{
      if(navigator.clipboard&&navigator.clipboard.writeText){
        await navigator.clipboard.writeText(location.href);
        ok=true;
      }else{
        // Fallback for older browsers / non-secure contexts.
        const ta=document.createElement('textarea');
        ta.value=location.href;ta.setAttribute('readonly','');
        ta.style.position='fixed';ta.style.opacity='0';
        document.body.appendChild(ta);ta.select();
        ok=document.execCommand('copy');document.body.removeChild(ta);
      }
    }catch(e){ok=false;}
    const orig=cp.innerHTML;
    cp.classList.add('share-copied');
    cp.innerHTML=ok?'<span class="share-icon">✓</span> COPIED':'<span class="share-icon">✗</span> COPY FAILED';
    setTimeout(()=>{cp.classList.remove('share-copied');cp.innerHTML=orig;},1800);
  });
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded',()=>{
  initLoader();initRain();initDistort();initKonami();initEasterEgg();
  initRedPill();initSimCalc();initScroll();initGlitch();init3DCards();
  initSearch();initMemoryChecks();initMobileNav();initCardScroll();
  initReadingProgress();initBackToTop();initHeaderMeta();initTOC();initShare();
});
