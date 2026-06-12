// LETHOMETRY 3.1 — Main JS
'use strict';

// ===== THREE.JS HERO =====
let scene,camera,renderer,clock,particles,rings,textSprites;
let mouse={x:0,y:0,tx:0,ty:0},distort=0;

function init3D(){
  const c=document.getElementById('hero-canvas');
  if(!c||typeof THREE==='undefined'){
    // Three.js may still be loading (lazy). Poll for it briefly.
    if(c && typeof THREE==='undefined'){
      let tries=0;
      const poll=setInterval(()=>{
        if(typeof THREE!=='undefined'){clearInterval(poll);init3D();}
        else if(++tries>60){clearInterval(poll);} // give up after ~6s
      },100);
    }
    return;
  }
  clock=new THREE.Clock();
  scene=new THREE.Scene();
  scene.fog=new THREE.FogExp2(0x050508,.007);
  camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.1,400);
  camera.position.set(0,0,35);
  renderer=new THREE.WebGLRenderer({canvas:c,antialias:true,alpha:true});
  renderer.setSize(innerWidth,innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));

  // Particles
  const n=4000,pos=new Float32Array(n*3),col=new Float32Array(n*3),vel=new Float32Array(n*3);
  for(let i=0;i<n;i++){
    const i3=i*3;
    pos[i3]=(Math.random()-.5)*140;pos[i3+1]=(Math.random()-.5)*140;pos[i3+2]=(Math.random()-.5)*70;
    const t=Math.random();
    col[i3]=0;col[i3+1]=.5+t*.5;col[i3+2]=t;
    vel[i3]=(Math.random()-.5)*.015;vel[i3+1]=(Math.random()-.5)*.015;vel[i3+2]=(Math.random()-.5)*.008;
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  geo.setAttribute('color',new THREE.BufferAttribute(col,3));
  geo.userData.vel=vel;
  particles=new THREE.Points(geo,new THREE.PointsMaterial({size:.7,vertexColors:true,transparent:true,opacity:.6,blending:THREE.AdditiveBlending,sizeAttenuation:true,depthWrite:false}));
  scene.add(particles);

  // Grid
  const g1=new THREE.GridHelper(180,36,0x00ff41,0x002200);
  g1.position.y=-28;g1.material.transparent=true;g1.material.opacity=.12;scene.add(g1);
  const g2=new THREE.GridHelper(180,36,0x00e5ff,0x002222);
  g2.position.y=-28;g2.rotation.x=Math.PI/2;g2.position.z=-18;g2.material.transparent=true;g2.material.opacity=.06;scene.add(g2);

  // Rings
  rings=new THREE.Group();
  for(let i=0;i<5;i++){
    const r=new THREE.Mesh(new THREE.TorusGeometry(7+i*3,.04,8,64),new THREE.MeshBasicMaterial({color:i%2?0x00e5ff:0x00ff41,transparent:true,opacity:.25-i*.03,wireframe:true}));
    r.rotation.x=Math.PI/2+(Math.random()-.5)*.4;r.rotation.y=(Math.random()-.5)*.4;
    r.position.set((Math.random()-.5)*25,(Math.random()-.5)*15,-8-i*4);
    r.userData={rsx:(Math.random()-.5)*.004,rsy:(Math.random()-.5)*.006,fs:Math.random()*.4+.4,fo:Math.random()*Math.PI*2};
    rings.add(r);
  }
  scene.add(rings);

  // Floating text
  textSprites=new THREE.Group();
  const words=['BERENSTEIN','SHAZAAM','CORNUCOPIA','1939','BARON TRUMP','MKULTRA','NORTHWOODS','TUNGUSKA','GÖBEKLI TEPE','SIRIUS','CERN','PLANCK','SIMULATION','LETHE','MEMORY','DECLASSIFIED','TESLA','HAARP','UFO','NEXUS'];
  const colors=[0x00ff41,0x00e5ff,0xffaa00,0xaa00ff,0xff1744];
  words.forEach((w,i)=>{
    const cv=document.createElement('canvas');cv.width=512;cv.height=64;
    const cx=cv.getContext('2d');cx.fillStyle='#'+colors[i%5].toString(16).padStart(6,'0');
    cx.font='bold 32px monospace';cx.textAlign='center';cx.textBaseline='middle';cx.fillText(w,256,32);
    const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(cv),transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false}));
    s.position.set((Math.random()-.5)*110,(Math.random()-.5)*50,-5-Math.random()*35);
    const sc=7+Math.random()*5;s.scale.set(sc,sc*.15,1);
    s.userData={vx:(Math.random()-.5)*.012,vy:(Math.random()-.5)*.008,vr:(Math.random()-.5)*.002};
    textSprites.add(s);
  });
  scene.add(textSprites);

  // Orb
  const orb=new THREE.Mesh(new THREE.SphereGeometry(2.5,32,32),new THREE.MeshBasicMaterial({color:0x00ff41,transparent:true,opacity:.12}));
  orb.position.set(0,0,-12);orb.userData.orb=true;scene.add(orb);

  addEventListener('resize',onResize);
  addEventListener('mousemove',onMM);
  requestAnimationFrame(anim);
}

function anim(){
  requestAnimationFrame(anim);
  const t=clock.getElapsedTime();
  mouse.x+=(mouse.tx-mouse.x)*.05;mouse.y+=(mouse.ty-mouse.y)*.05;

  if(particles){
    const p=particles.geometry.attributes.position.array,v=particles.geometry.userData.vel;
    for(let i=0;i<p.length;i+=3){p[i]+=v[i];p[i+1]+=v[i+1];p[i+2]+=v[i+2];if(p[i]>70)p[i]=-70;if(p[i]<-70)p[i]=70;if(p[i+1]>70)p[i+1]=-70;if(p[i+1]<-70)p[i+1]=70;}
    particles.geometry.attributes.position.needsUpdate=true;
    particles.rotation.y=t*.015+mouse.x*.08;particles.rotation.x=mouse.y*.04;
    if(distort>0){for(let i=0;i<p.length;i+=3){p[i]+=(Math.random()-.5)*distort*.04;p[i+1]+=(Math.random()-.5)*distort*.04;}particles.geometry.attributes.position.needsUpdate=true;}
  }
  if(rings)rings.children.forEach(r=>{r.rotation.x+=r.userData.rsx;r.rotation.y+=r.userData.rsy;r.position.y+=Math.sin(t*r.userData.fs+r.userData.fo)*.008;});
  if(textSprites)textSprites.children.forEach(s=>{s.position.x+=s.userData.vx;s.position.y+=s.userData.vy;s.rotation.z+=s.userData.vr;if(s.position.x>65)s.position.x=-65;if(s.position.x<-65)s.position.x=65;if(s.position.y>35)s.position.y=-35;if(s.position.y<-35)s.position.y=35;});
  scene.children.forEach(c=>{if(c.userData.orb){const sc=1+Math.sin(t*2)*.08;c.scale.set(sc,sc,sc);}});
  camera.position.x=mouse.x*2.5;camera.position.y=-mouse.y*1.5;camera.lookAt(0,0,0);
  if(renderer&&scene&&camera)renderer.render(scene,camera);
}
function onResize(){if(!camera||!renderer)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);}
function onMM(e){mouse.tx=(e.clientX/innerWidth)*2-1;mouse.ty=-(e.clientY/innerHeight)*2+1;}

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
  const c=document.createElement('div');c.className='rain';
  document.body.insertBefore(c,document.body.firstChild);
  for(let i=0;i<40;i++){const d=document.createElement('div');d.className='dr';d.style.left=Math.random()*100+'%';d.style.height=(Math.random()*25+8)+'px';d.style.animationDuration=(Math.random()*3+2)+'s';d.style.animationDelay=Math.random()*5+'s';d.style.opacity=Math.random()*.2+.08;c.appendChild(d);}
}

// ===== DISTORTION =====
function initDistort(){
  const s=document.getElementById('distortion-slider');
  if(!s)return;
  s.addEventListener('input',e=>{distort=parseFloat(e.target.value);document.body.style.filter=`hue-rotate(${distort*35}deg) saturate(${1+distort}) blur(${distort*1.5}px)`;});
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
  setInterval(()=>{
    const els=document.querySelectorAll('.h-title,.h-sub,h2');
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
  initLoader();init3D();initRain();initDistort();initKonami();initEasterEgg();
  initRedPill();initSimCalc();initScroll();initGlitch();init3DCards();
  initSearch();initMemoryChecks();initMobileNav();initCardScroll();
});
