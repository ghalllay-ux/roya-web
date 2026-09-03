// Premium cumulative visitor counter for Werd — v109
(function(){
  const VISITOR_KEY='werd_visitor_id_v1';
  const SESSION_KEY='werd_visit_registered_v1';
  const COUNT_CACHE='werd_visitor_count_cache_v2';
  const $=id=>document.getElementById(id);
  let lastUnique=0,lastVisits=0,animated=false;

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
    const home=$('home');if(!home)return false;
    if(!$('werdVisitorCounterStyle')){
      const style=document.createElement('style');
      style.id='werdVisitorCounterStyle';
      style.textContent=`
        .werd-visitors-footer{margin:34px 0 18px;padding-top:8px;position:relative;isolation:isolate}
        .werd-visitors-footer:before{content:"";position:absolute;inset:0 8% auto;height:1px;background:linear-gradient(90deg,transparent,rgba(178,148,81,.42),transparent)}
        .werd-visitors-card{position:relative;overflow:hidden;border:1px solid rgba(188,161,102,.28);border-radius:26px;padding:18px;background:linear-gradient(145deg,rgba(255,253,247,.94),rgba(239,245,237,.92));box-shadow:0 14px 34px rgba(16,76,57,.07),inset 0 1px 0 rgba(255,255,255,.8);display:grid;gap:15px}
        .werd-visitors-card:before{content:"";position:absolute;width:150px;height:150px;border-radius:50%;background:radial-gradient(circle,rgba(28,112,82,.10),transparent 68%);top:-85px;left:-48px;pointer-events:none}
        .werd-visitors-head{display:flex;align-items:center;justify-content:space-between;gap:12px;position:relative;z-index:1}
        .werd-visitors-brand{display:flex;align-items:center;gap:11px;min-width:0}
        .werd-visitors-icon{width:50px;height:50px;border-radius:17px;display:grid;place-items:center;flex:0 0 auto;color:#fff;font-size:23px;background:linear-gradient(145deg,#0f654b,#187d5d);box-shadow:0 9px 22px rgba(15,101,75,.19),inset 0 1px 0 rgba(255,255,255,.18)}
        .werd-visitors-title{display:grid;gap:2px}.werd-visitors-title b{font-size:15px;color:var(--green,#115d47);font-weight:800}.werd-visitors-title small{font-size:10.5px;color:var(--muted,#7e8983);line-height:1.5}
        .werd-visitors-live-note{font-size:9.5px;color:var(--muted,#7e8983);padding:6px 9px;border-radius:999px;border:1px solid rgba(17,93,71,.10);background:rgba(255,255,255,.45);white-space:nowrap}
        .werd-visitors-main{position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:end;padding:2px 2px 0}
        .werd-visitors-total{display:grid;gap:2px}.werd-visitors-total span{font-size:11px;color:var(--muted,#7e8983)}
        .werd-visitors-number{font-size:36px;line-height:1;font-weight:900;letter-spacing:-1.2px;color:var(--green,#115d47);font-variant-numeric:tabular-nums;font-feature-settings:'tnum'}
        .werd-visitors-unit{font-size:11px;font-weight:700;color:#927636;margin-inline-start:4px;letter-spacing:0}
        .werd-visitors-secondary{min-width:105px;text-align:center;padding:10px 12px;border-radius:17px;background:rgba(255,255,255,.52);border:1px solid rgba(17,93,71,.10);display:grid;gap:2px}
        .werd-visitors-secondary b{font-size:18px;color:var(--green,#115d47);font-variant-numeric:tabular-nums}.werd-visitors-secondary small{font-size:9.5px;color:var(--muted,#7e8983)}
        .werd-visitors-foot{position:relative;z-index:1;display:flex;align-items:center;gap:7px;padding-top:12px;border-top:1px solid rgba(188,161,102,.20);color:var(--muted,#7e8983);font-size:10px;line-height:1.6}
        .werd-visitors-dot{width:7px;height:7px;border-radius:50%;background:#1a7d5d;box-shadow:0 0 0 4px rgba(26,125,93,.09);flex:0 0 auto}
        body.dark .werd-visitors-card{background:linear-gradient(145deg,rgba(25,52,43,.96),rgba(31,65,53,.94));border-color:rgba(212,188,129,.18);box-shadow:0 14px 34px rgba(0,0,0,.18)}
        body.dark .werd-visitors-secondary,body.dark .werd-visitors-live-note{background:rgba(255,255,255,.045);border-color:rgba(255,255,255,.07)}
        @media(max-width:430px){.werd-visitors-footer{margin:28px 0 16px}.werd-visitors-card{border-radius:23px;padding:16px}.werd-visitors-icon{width:46px;height:46px;border-radius:15px}.werd-visitors-number{font-size:32px}.werd-visitors-main{gap:10px}.werd-visitors-secondary{min-width:96px;padding:9px 10px}.werd-visitors-live-note{display:none}}
      `;
      document.head.appendChild(style);
    }
    let box=$('werdVisitorCounter');
    if(!box){
      box=document.createElement('footer');
      box.id='werdVisitorCounter';box.className='werd-visitors-footer';box.setAttribute('aria-live','polite');
      box.innerHTML=`<div class="werd-visitors-card"><div class="werd-visitors-head"><div class="werd-visitors-brand"><div class="werd-visitors-icon">👥</div><div class="werd-visitors-title"><b>إجمالي زوار ورد</b><small>عداد تراكمي للزوار منذ بدء الإحصاء</small></div></div><div class="werd-visitors-live-note">ليس عدد المتصلين الآن</div></div><div class="werd-visitors-main"><div class="werd-visitors-total"><span>الزوار الفريدون</span><div><strong class="werd-visitors-number" id="werdVisitorCount">—</strong><span class="werd-visitors-unit">زائر</span></div></div><div class="werd-visitors-secondary"><b id="werdVisitCount">—</b><small>زيارة تراكمية</small></div></div><div class="werd-visitors-foot"><i class="werd-visitors-dot"></i><span>يزداد تلقائيًا مع الزوار والزيارات الجديدة، ولا يعتمد على تسجيل الدخول.</span></div></div>`;
    }
    if(box.parentElement!==home||home.lastElementChild!==box)home.appendChild(box);
    return true;
  }

  function animate(el,from,to,duration=650){
    if(!el)return;from=Math.max(0,Number(from)||0);to=Math.max(0,Number(to)||0);
    if(from===to){el.textContent=fmt(to);return}
    const start=performance.now();
    const tick=now=>{const p=Math.min(1,(now-start)/duration),ease=1-Math.pow(1-p,3),v=Math.round(from+(to-from)*ease);el.textContent=fmt(v);if(p<1)requestAnimationFrame(tick)};
    requestAnimationFrame(tick)
  }

  function showCount(unique,visits,doAnimate=true){
    inject();unique=Math.max(0,Number(unique)||0);visits=Math.max(0,Number(visits)||0);
    const u=$('werdVisitorCount'),v=$('werdVisitCount');
    if(doAnimate&&animated){animate(u,lastUnique,unique);animate(v,lastVisits,visits)}else{if(u)u.textContent=fmt(unique);if(v)v.textContent=fmt(visits)}
    lastUnique=unique;lastVisits=visits;animated=true;
    try{localStorage.setItem(COUNT_CACHE,JSON.stringify({unique,visits,at:Date.now()}))}catch(_){ }
  }

  function showCached(){
    inject();
    try{const raw=localStorage.getItem(COUNT_CACHE);if(!raw)return;const x=JSON.parse(raw);showCount(x?.unique,x?.visits,false)}catch(_){ }
  }

  async function load(){
    inject();showCached();
    if(typeof sb==='undefined'||!sb?.rpc)return;
    const registered=(()=>{try{return sessionStorage.getItem(SESSION_KEY)==='1'}catch(_){return false}})();
    try{
      const call=registered?sb.rpc('get_werd_visitor_count'):sb.rpc('register_werd_visit',{p_visitor_id:visitorId()});
      const {data,error}=await call;if(error)throw error;
      const row=Array.isArray(data)?data[0]:data;
      if(row&&row.unique_visitors!=null)showCount(row.unique_visitors,row.total_visits,true);
      if(!registered)try{sessionStorage.setItem(SESSION_KEY,'1')}catch(_){ }
    }catch(e){console.warn('Werd visitor counter',e)}
  }

  function ensureBottom(){if(inject())setTimeout(()=>{const home=$('home'),box=$('werdVisitorCounter');if(home&&box&&home.lastElementChild!==box)home.appendChild(box)},350)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(load,450));else setTimeout(load,450);
  window.addEventListener('pageshow',()=>setTimeout(()=>{ensureBottom();showCached()},160));
  setTimeout(ensureBottom,1200);
})();
