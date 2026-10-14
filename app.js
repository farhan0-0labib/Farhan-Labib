let siteData;
async function getData(){
  try {
    const response = await fetch('./site-data.json?updated=' + Date.now(), { cache: 'no-store' });
    if (!response.ok) throw new Error('Could not load site content');
    return await response.json();
  } catch (error) {
    return {
      name: 'Farhan Labib', tagline: 'My personal corner of the internet',
      aboutTitle: 'About Me', aboutText: 'Content is being prepared.',
      email: 'hello@example.com', location: 'Bangladesh', socials: [], posts: [], photo: ''
    };
  }
}
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[ch]));
function markdown(text) {
  let value = esc(text || '');
  value = value.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  value = value.replace(/^### (.+)$/gm, '<h3>$1</h3>')
               .replace(/^## (.+)$/gm, '<h2>$1</h2>')
               .replace(/^# (.+)$/gm, '<h1>$1</h1>')
               .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
               .replace(/\*(.+?)\*/g, '<em>$1</em>');
  return value.split(/\n{2,}/).map(block => {
    const trimmed = block.trim();
    if (!trimmed) return '';
    if (/^<h[1-3]>/.test(trimmed)) return trimmed.replace(/\n/g, '');
    return '<p>' + trimmed.replace(/\n/g, '<br>') + '</p>';
  }).join('');
}
function nav(){
  const current = location.pathname.split('/').pop() || 'index.html';
  const links = [['Home','index.html'],['About','about.html'],['Social Media','social.html'],['Blog','blog.html'],['Contact','contact.html']];
  return `<header><nav><a class="brand" href="index.html">${esc((siteData.name||'Farhan').split(' ')[0])}<span>.</span></a><div class="navlinks">${links.map(([label,url])=>`<a class="${current===url?'active':''}" href="${url}">${label}</a>`).join('')}</div></nav></header>`;
}
function footer(){ return `<footer>© ${new Date().getFullYear()} ${esc(siteData.name)} · Made with care</footer>`; }
function photo(){
  return siteData.photo
    ? `<img class="avatar" src="${esc(siteData.photo)}" alt="${esc(siteData.name)}">`
    : `<div class="avatar" aria-label="Profile placeholder">${esc((siteData.name||'F').trim().charAt(0).toUpperCase())}</div>`;
}
function postCard(post){
  const body = String(post.body || '').replace(/[#*_`\[\]()]/g,' ');
  return `<article class="card"><div class="post-date">${esc((post.date||'').slice(0,10))}</div><h3><a href="post.html?slug=${encodeURIComponent(post.slug||'')}">${esc(post.title||'Untitled')}</a></h3><p class="muted">${esc(body.slice(0,150))}${body.length>150?'…':''}</p><a href="post.html?slug=${encodeURIComponent(post.slug||'')}">Read post →</a></article>`;
}
function render(){
  const page = document.body.dataset.page;
  let content = '';
  if(page==='home'){
    content = `<section class="hero"><div><div class="eyebrow">Welcome to my personal website</div><h1>Hello, I’m <span class="gradient">${esc(siteData.name)}</span></h1><p class="lead">${esc(siteData.tagline)}</p><a class="button" href="about.html">More about me</a> <a class="button secondary" href="blog.html">Read my blog</a></div>${photo()}</section><section><h2 class="section-title">Latest from the blog</h2><div class="grid">${(siteData.posts||[]).slice(0,2).map(postCard).join('')||'<p class="muted">New posts will appear here.</p>'}</div></section>`;
  } else if(page==='about'){
    content = `<section class="page-head"><div class="eyebrow">A little introduction</div><h1>${esc(siteData.aboutTitle||'About Me')}</h1></section><section class="panel">${photo()}<div class="post-body">${markdown(siteData.aboutText||'')}</div><p class="muted">${esc(siteData.location||'')}</p></section>`;
  } else if(page==='social'){
    content = `<section class="page-head"><div class="eyebrow">Find me online</div><h1>Social media</h1><p class="lead">Connect with me across the web.</p></section><div class="grid">${(siteData.socials||[]).map(s=>`<article class="card"><h3>${esc(s.name)}</h3><p class="muted">${esc(s.label||'Connect with me')}</p><a class="button" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">Visit profile ↗</a></article>`).join('')||'<p class="muted">Social links coming soon.</p>'}</div>`;
  } else if(page==='blog'){
    content = `<section class="page-head"><div class="eyebrow">Notes, ideas & updates</div><h1>My blog</h1></section><div class="grid">${(siteData.posts||[]).map(postCard).join('')||'<p class="muted">No posts published yet.</p>'}</div>`;
  } else if(page==='post'){
    const slug = new URLSearchParams(location.search).get('slug');
    const post = (siteData.posts||[]).find(item=>item.slug===slug);
    content = post
      ? `<section class="page-head"><div class="post-date">${esc((post.date||'').slice(0,10))}</div><h1>${esc(post.title)}</h1></section><article class="panel post-body">${markdown(post.body)}</article><p><a href="blog.html">← Back to blog</a></p>`
      : `<h1>Post not found</h1><a href="blog.html">Back to blog</a>`;
  } else if(page==='contact'){
    content = `<section class="page-head"><div class="eyebrow">Get in touch</div><h1>Contact</h1><p class="lead">Have a question or want to say hello?</p></section><div class="panel"><p><strong>Email:</strong> <a href="mailto:${esc(siteData.email)}">${esc(siteData.email)}</a></p><p><strong>Location:</strong> ${esc(siteData.location||'')}</p><p class="hint">This static website does not store contact form submissions. Use the email link to contact me.</p></div>`;
  }
  document.getElementById('app').innerHTML = nav()+`<main class="wrap">${content}</main>`+footer();
}
(async()=>{siteData=await getData();render();})();
