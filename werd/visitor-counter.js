// Global anonymous visitor counter for Werd — v107
(function(){
  const VISITOR_KEY='werd_visitor_id_v1';
  const SESSION_KEY='werd_visit_registered_v1';
  const COUNT_CACHE='werd_visitor_count_cache_v1';
  const $=id=>document.getElementById(id);

  function visitorId(){
    let id='';
    try{id=localStorage.getItem(VISITOR_KEY)||''}catch(_){ }
    if(id)return id;
    try{id=crypto.randomUUID?crypto.randomUUID():`w-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`}catch(_){id=`w-${Date.now()}-${Math.random().toString(36).slice(2)}`}
    try{localStorage.setItem(VISITOR_KEY,id)}catch(_){ }
    return id;
  }

  function fmt(n){
    try{return new Intl.NumberFormat('ar-SA').format(Math.max(0,Number(n)||0))}catch(_){return String(Math.max(0,Number(n)||0))}
  }

  function inject(){
    if($('werdVisitorCounter'))return;
    const home=$('home'),hero=home?.querySelector('.hero');
    if(!home||!hero)return;
    const style=document.createElement('style');
    style.id='werdVisitorCounterStyle';
    style.textContent=`
      .werd-visitor-counter{margin:12px 0 2px;padding:12px 14px;border:1px solid var(--line);border-radius:18px;background:linear-gradient(135deg,rgba(255,255,255,.72),rgba(222,233,219,.72));display:flex;align-items:center;justify-content:space-between;gap:12px;box-shadow:0 8px 24px rgba(20,76,58,.06)}
      body.dark .werd-visitor-counter{background:linear-gradient(135deg,rgba(27,54,45,.86),rgba(37,68,57,.82))}
      .werd-visitor-main{display:flex;align-items:center;gap:10px;min-width:0}.werd-visitor-icon{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;background:var(--sage);font-size:21px}.werd-visitor-copy{display:grid;gap:1px}.werd-visitor-copy small,.werd-visitor-note{color:var(--muted);font-size:10px}.werd-visitor-copy b{font-size:20px;color:var(--green);font-variant-numeric:tabular-nums}.werd-visitor-note{white-space:nowrap}
      @media(max-width:430px){.werd-visitor-counter{padding:11px 12px}.werd-visitor-icon{width:38px;height:38px}.werd-visitor-copy b{font-size:18px}}
    `;
    document.head.appendChild(style);
    const box=document.createElement('div');
    box.id='werdVisitorCounter';box.className='werd-visitor-counter';box.setAttribute('aria-live','polite');
    box.innerHTML='<div class="werd-visitor-main"><div class="werd-visitor-icon">👥</div><div class="werd-visitor-copy"><small>زوار ورد</small><b id="werdVisitorCount">—</b></div></div><div class="werd-visitor-note">زائر</div>';
    hero.insertAdjacentElement('afterend',box);
  }

  function showCount(n){
    inject();const el=$('werdVisitorCount');if(el)el.textContent=fmt(n);
    try{localStorage.setItem(COUNT_CACHE,String(Math.max(0,Number(n)||0)))}catch(_){ }
  }

  function showCached(){
    inject();
    try{const n=localStorage.getItem(COUNT_CACHE);if(n!==null)showCount(n)}catch(_){ }
  }

  async function load(){
    inject();showCached();
    if(typeof sb==='undefined'||!sb?.rpc)return;
    const registered=(()=>{try{return sessionStorage.getItem(SESSION_KEY)==='1'}catch(_){return false}})();
    try{
      const call=registered?sb.rpc('get_werd_visitor_count'):sb.rpc('register_werd_visit',{p_visitor_id:visitorId()});
      const {data,error}=await call;
      if(error)throw error;
      const row=Array.isArray(data)?data[0]:data;
      if(row&&row.unique_visitors!=null)showCount(row.unique_visitors);
      if(!registered)try{sessionStorage.setItem(SESSION_KEY,'1')}catch(_){ }
    }catch(e){console.warn('Werd visitor counter',e)}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(load,250));else setTimeout(load,250);
  window.addEventListener('pageshow',()=>setTimeout(()=>{inject();showCached()},120));
})();
