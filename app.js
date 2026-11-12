let siteData;
const DEFAULTS={name:'Farhan Labib',tagline:'My personal corner of the internet',aboutTitle:'About Me',aboutText:'',email:'',location:'',socials:[],posts:[],photo:'',accent:'#8b5cf6',roles:[],stats:[],skills:[],projects:[],timeline:[],announcement:'',announcementLink:''};
async function getData(){
  try{const r=await fetch('./site-data.json?updated='+Date.now(),{cache:'no-store'});if(!r.ok)throw 0;return {...DEFAULTS,...await r.json()};}
  catch(e){return {...DEFAULTS};}
}
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=u=>/^(https?:\/\/|\/|mailto:)/.test(u)?u:'#';
function markdown(text){
  let v=esc(text||'');
  v=v.replace(/```([\s\S]*?)```/g,(m,c)=>`<pre><code>${c.trim()}</code></pre>`)
   .replace(/!\[([^\]]*)\]\(((?:https?:\/\/|\/)[^)\s]+)\)/g,'<img src="$2" alt="$1" loading="lazy">')
   .replace(/\[([^\]]+)\]\(((?:https?:\/\/|mailto:)[^)\s]+)\)/g,'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
   .replace(/^### (.+)$/gm,'<h3>$1</h3>').replace(/^## (.+)$/gm,'<h2>$1</h2>').replace(/^# (.+)$/gm,'<h1>$1</h1>')
   .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>').replace(/`([^`\n]+)`/g,'<code>$1</code>');
  return v.split(/\n{2,}/).map(b=>{
    b=b.trim();if(!b)return '';
    if(/^<(h[1-3]|pre|img)/.test(b))return b.replace(/\n/g,'');
    const L=b.split('\n');
    if(L.every(l=>/^- /.test(l)))return '<ul>'+L.map(l=>`<li>${l.slice(2)}</li>`).join('')+'</ul>';
    if(L.every(l=>/^&gt; ?/.test(l)))return '<blockquote>'+L.map(l=>l.replace(/^&gt; ?/,'')).join('<br>')+'</blockquote>';
    return '<p>'+b.replace(/\n/g,'<br>')+'</p>';
  }).join('');
}
const plain=t=>String(t||'').replace(/!\[[^\]]*\]\([^)]*\)/g,'').replace(/[#*_`>\[\]()]/g,' ').replace(/\s+/g,' ').trim();
const readTime=t=>Math.max(1,Math.ceil(plain(t).split(' ').length/200));
const tagChips=tags=>(tags||[]).map(t=>`<span class="chip">${esc(t)}</span>`).join('');
const sortedPosts=()=>[...(siteData.posts||[])].sort((a,b)=>String(b.date).localeCompare(String(a.date)));

function nav(){
  const cur=location.pathname.split('/').pop()||'index.html';
  const links=[['Home','index.html'],['About','about.html'],['Projects','projects.html'],['Blog','blog.html'],['Social','social.html'],['Routine','routine.html'],['Contact','contact.html']];
  return `${siteData.announcement?`<div class="banner">${esc(siteData.announcement)} ${siteData.announcementLink?`<a href="${esc(safeUrl(siteData.announcementLink))}">Learn more →</a>`:''}</div>`:''}
  <header><nav><a class="brand" href="index.html">${esc((siteData.name||'Farhan').split(' ')[0])}<span>.</span></a>
  <button class="icon-btn menu-btn" aria-label="Menu" onclick="document.querySelector('.navlinks').classList.toggle('open')">☰</button>
  <div class="navlinks">${links.map(([l,u])=>`<a class="${cur===u?'active':''}" href="${u}">${l}</a>`).join('')}</div>
  <button class="icon-btn" id="theme" aria-label="Toggle theme">◐</button><a class="admin-btn" href="admin/">⚙ Admin</a></nav></header>`;
}
const footer=()=>`<footer><div>© ${new Date().getFullYear()} ${esc(siteData.name)} · Made with care</div><div class="foot-links">${(siteData.socials||[]).map(s=>`<a href="${esc(safeUrl(s.url))}" target="_blank" rel="noopener noreferrer">${esc(s.name)}</a>`).join('')}<a href="admin/">Admin</a></div></footer><div id="progress"></div><button id="top" aria-label="Back to top">↑</button>`;
const photo=()=>siteData.photo?`<img class="avatar" src="${esc(siteData.photo)}" alt="${esc(siteData.name)}">`:`<div class="avatar">${esc((siteData.name||'F').trim().charAt(0).toUpperCase())}</div>`;

function postCard(p){
  const url=`post.html?slug=${encodeURIComponent(p.slug||'')}`,t=plain(p.body);
  return `<article class="card reveal post-card">${p.cover?`<img class="cover" src="${esc(p.cover)}" alt="" loading="lazy">`:''}<div class="post-date">${esc((p.date||'').slice(0,10))} · ${readTime(p.body)} min read</div><h3><a href="${url}">${esc(p.title||'Untitled')}</a></h3><p class="muted">${esc(t.slice(0,150))}${t.length>150?'…':''}</p><div>${tagChips(p.tags)}</div><a href="${url}">Read post →</a></article>`;
}
const projectCard=p=>`<article class="card reveal proj">${p.image?`<img class="cover" src="${esc(p.image)}" alt="" loading="lazy">`:''}<h3>${esc(p.title)}</h3><p class="muted">${esc(p.description||'')}</p><div>${tagChips(p.tags)}</div>${p.link?`<a class="button" href="${esc(safeUrl(p.link))}" target="_blank" rel="noopener noreferrer">View project ↗</a>`:''}</article>`;
const statsBlock=()=>{
  const all=[{value:(siteData.posts||[]).length,label:'Blog posts'},{value:(siteData.socials||[]).length,label:'Social links'},...(siteData.stats||[])];
  return `<section class="stats reveal">${all.map(s=>`<div class="stat"><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join('')}</section>`;
};
const skillsBlock=()=>(siteData.skills||[]).length?`<section class="reveal"><h2 class="section-title">Skills</h2><div class="panel">${siteData.skills.map(s=>`<div class="skill"><div><span>${esc(s.name)}</span><span>${esc(s.level)}%</span></div><div class="bar"><i style="--w:${Math.min(100,+s.level||0)}%"></i></div></div>`).join('')}</div></section>`:'';
const timelineBlock=()=>(siteData.timeline||[]).length?`<section class="reveal"><h2 class="section-title">Journey</h2><div class="timeline">${siteData.timeline.map(t=>`<div class="t-item"><div class="post-date">${esc(t.year)}</div><h3>${esc(t.title)}</h3><p class="muted">${esc(t.text||'')}</p></div>`).join('')}</div></section>`:'';
const empty=m=>`<p class="muted">${m}</p>`;

function render(){
  const page=document.body.dataset.page,posts=sortedPosts();let c='';
  if(page==='home'){
    c=`<section class="hero"><div><div class="eyebrow">Welcome to my personal website</div><h1>Hello, I’m <span class="gradient">${esc(siteData.name)}</span></h1><p class="typed"><span id="type"></span><i class="caret"></i></p><p class="lead">${esc(siteData.tagline)}</p><a class="button" href="about.html">More about me</a> <a class="button secondary" href="blog.html">Read my blog</a></div>${photo()}</section>${statsBlock()}
    ${(siteData.projects||[]).length?`<section><h2 class="section-title">Featured projects</h2><div class="grid">${siteData.projects.slice(0,2).map(projectCard).join('')}</div><p><a href="projects.html">All projects →</a></p></section>`:''}
    ${skillsBlock()}<section><h2 class="section-title">Latest from the blog</h2><div class="grid">${posts.slice(0,2).map(postCard).join('')||empty('New posts will appear here.')}</div></section>`;
  }else if(page==='about'){
    c=`<section class="page-head"><div class="eyebrow">A little introduction</div><h1>${esc(siteData.aboutTitle||'About Me')}</h1></section><section class="panel about">${photo()}<div class="post-body">${markdown(siteData.aboutText)}</div><p class="muted">📍 ${esc(siteData.location||'')}</p></section>${timelineBlock()}${skillsBlock()}`;
  }else if(page==='projects'){
    c=`<section class="page-head"><div class="eyebrow">Things I build</div><h1>Projects</h1></section><div class="grid">${(siteData.projects||[]).map(projectCard).join('')||empty('Projects coming soon.')}</div>`;
  }else if(page==='social'){
    c=`<section class="page-head"><div class="eyebrow">Find me online</div><h1>Social media</h1><p class="lead">Connect with me across the web.</p></section><div class="grid">${(siteData.socials||[]).map(s=>`<article class="card reveal"><h3>${esc(s.name)}</h3><p class="muted">${esc(s.label||'Connect with me')}</p><a class="button" href="${esc(safeUrl(s.url))}" target="_blank" rel="noopener noreferrer">Visit profile ↗</a></article>`).join('')||empty('Social links coming soon.')}</div>`;
  }else if(page==='blog'){
    const tags=[...new Set(posts.flatMap(p=>p.tags||[]))];
    c=`<section class="page-head"><div class="eyebrow">Notes, ideas & updates</div><h1>My blog</h1></section><input id="q" type="search" placeholder="Search posts…"><div class="chips" id="tags">${tags.map(t=>`<button class="chip" data-t="${esc(t)}">${esc(t)}</button>`).join('')}</div><div class="grid" id="plist"></div>`;
  }else if(page==='post'){
    const slug=new URLSearchParams(location.search).get('slug'),i=posts.findIndex(p=>p.slug===slug),p=posts[i];
    c=p?`<section class="page-head"><div class="post-date">${esc((p.date||'').slice(0,10))} · ${readTime(p.body)} min read</div><h1>${esc(p.title)}</h1><div>${tagChips(p.tags)}</div></section>${p.cover?`<img class="cover big" src="${esc(p.cover)}" alt="">`:''}<article class="panel post-body">${markdown(p.body)}</article><p><button class="button secondary" id="share">🔗 Share</button></p><div class="pn">${posts[i+1]?`<a href="post.html?slug=${encodeURIComponent(posts[i+1].slug)}">← ${esc(posts[i+1].title)}</a>`:'<span></span>'}${posts[i-1]?`<a href="post.html?slug=${encodeURIComponent(posts[i-1].slug)}">${esc(posts[i-1].title)} →</a>`:''}</div><p><a href="blog.html">← Back to blog</a></p>`:`<h1>Post not found</h1><a href="blog.html">Back to blog</a>`;
  }else if(page==='contact'){
    c=`<section class="page-head"><div class="eyebrow">Get in touch</div><h1>Contact</h1><p class="lead">Have a question or want to say hello?</p></section><div class="panel"><p><strong>Email:</strong> <a href="mailto:${esc(siteData.email)}">${esc(siteData.email)}</a> <button class="button secondary" id="copy">Copy</button></p><p><strong>Location:</strong> ${esc(siteData.location||'')}</p><p>${(siteData.socials||[]).map(s=>`<a class="pill" href="${esc(safeUrl(s.url))}" target="_blank" rel="noopener noreferrer">${esc(s.name)}</a>`).join('')}</p></div>`;
  }
  document.getElementById('app').innerHTML=nav()+`<main class="wrap">${c}</main>`+footer();
  if(page==='blog')blogFilter(posts);
  wire();
}
function blogFilter(posts){
  let tag='';const q=document.getElementById('q'),box=document.getElementById('plist');
  const draw=()=>{const s=q.value.toLowerCase();const r=posts.filter(p=>(!tag||(p.tags||[]).includes(tag))&&(p.title+' '+plain(p.body)).toLowerCase().includes(s));box.innerHTML=r.map(postCard).join('')||empty('No posts found.');reveal();};
  q.oninput=draw;
  document.getElementById('tags').onclick=e=>{const b=e.target.closest('[data-t]');if(!b)return;tag=tag===b.dataset.t?'':b.dataset.t;document.querySelectorAll('#tags .chip').forEach(x=>x.classList.toggle('on',x.dataset.t===tag));draw();};
  draw();
}
function reveal(){
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{threshold:.12});
  document.querySelectorAll('.reveal:not(.in)').forEach(el=>io.observe(el));
}
function typer(){
  const el=document.getElementById('type'),r=siteData.roles||[];if(!el||!r.length)return;let i=0,j=0,d=false;
  (function tick(){const w=r[i];el.textContent=w.slice(0,j);if(!d&&j===w.length){d=true;return setTimeout(tick,1400);}if(d&&j===0){d=false;i=(i+1)%r.length;}j+=d?-1:1;setTimeout(tick,d?35:75);})();
}
function wire(){
  reveal();typer();
  const th=document.getElementById('theme');if(th)th.onclick=()=>{const t=document.documentElement.dataset.theme==='light'?'dark':'light';document.documentElement.dataset.theme=t;try{localStorage.setItem('theme',t);}catch(e){}};
  const top=document.getElementById('top'),bar=document.getElementById('progress');
  top.onclick=()=>scrollTo({top:0,behavior:'smooth'});
  onscroll=()=>{const h=document.documentElement,p=h.scrollTop/((h.scrollHeight-h.clientHeight)||1);bar.style.width=(p*100)+'%';top.classList.toggle('show',h.scrollTop>400);};
  const sh=document.getElementById('share');if(sh)sh.onclick=async()=>{try{navigator.share?await navigator.share({title:document.title,url:location.href}):(await navigator.clipboard.writeText(location.href),sh.textContent='✓ Link copied');}catch(e){}};
  const cp=document.getElementById('copy');if(cp)cp.onclick=async()=>{try{await navigator.clipboard.writeText(siteData.email);cp.textContent='Copied ✓';}catch(e){}};
}
(async()=>{
  try{document.documentElement.dataset.theme=localStorage.getItem('theme')||'dark';}catch(e){document.documentElement.dataset.theme='dark';}
  siteData=await getData();
  document.documentElement.style.setProperty('--accent',siteData.accent||'#8b5cf6');
  render();
})();
