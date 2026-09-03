// Cumulative anonymous visitor counter for Werd — v110
(function(){
  const VISITOR_KEY='werd_visitor_id_v1';
  const SESSION_KEY='werd_visit_registered_v2';
  const COUNT_CACHE='werd_visitor_count_cache_v2';
  const API='https://oajqczrxzurwvxjkbseq.supabase.co/rest/v1/rpc/';
  const APIKEY='sb_publishable_9LTupYVJR3kKTL4xqj3pdw_vA67W-o4';
  const $=id=>document.getElementById(id);

  function visitorId(){
    let id='';
    try{id=localStorage.getItem(VISITOR_KEY)||''}catch(_){ }
    if(id)return id;
    try{id=crypto.randomUUID?crypto.randomUUID():`w-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`}catch(_){id=`w-${Date.now()}-${Math.random().toString(36).slice(2)}`}
    try{localStorage.setItem(VISITOR_KEY,id)}catch(_){ }
    return id;
  }
  function fmt(n){try{return new Intl.NumberFormat('ar-SA').format(Math.max(0,Number(n)||0))}catch(_){return String(Math.max(0,Number(n)||0))}}
  function inject(){
    if($('werdVisitorCounter'))return;
    const home=$('home');if(!home)return;
    const style=document.createElement('style');style.id='werdVisitorCounterStyle';style.textContent=`
      .werd-visitor-counter{margin:26px 0 18px;padding:22px;border:1px solid rgba(20,96,72,.14);border-radius:28px;background:linear-gradient(145deg,rgba(255,255,255,.93),rgba(238,244,237,.9));box-shadow:0 16px 42px rgba(20,76,58,.08);position:relative;overflow:hidden}.werd-visitor-counter:before{content:'';position:absolute;inset:auto -38px -52px auto;width:150px;height:150px;border:1px solid rgba(18,103,76,.08);border-radius:42px;transform:rotate(24deg)}body.dark .werd-visitor-counter{background:linear-gradient(145deg,rgba(25,52,43,.96),rgba(34,66,55,.94))}.werd-visitor-head{display:flex;align-items:center;gap:13px;margin-bottom:20px}.werd-visitor-icon{width:58px;height:58px;border-radius:20px;display:grid;place-items:center;background:linear-gradient(145deg,#157657,#0f5b45);color:white;font-size:27px;box-shadow:0 10px 24px rgba(15,91,69,.22)}.werd-visitor-title{display:grid;gap:3px}.werd-visitor-title b{font-size:22px;color:var(--green)}.werd-visitor-title small{font-size:12px;color:var(--muted)}.werd-visitor-grid{display:grid;grid-template-columns:1.45fr 1fr;gap:12px}.werd-visitor-stat{padding:17px;border-radius:20px;background:rgba(255,255,255,.52);border:1px solid rgba(20,96,72,.1)}body.dark .werd-visitor-stat{background:rgba(255,255,255,.04)}.werd-visitor-stat small{display:block;color:var(--muted);font-size:12px;margin-bottom:7px}.werd-visitor-stat strong{display:block;color:var(--green);font-size:30px;line-height:1;font-variant-numeric:tabular-nums}.werd-visitor-stat span{display:block;color:var(--muted);font-size:11px;margin-top:6px}.werd-visitor-foot{margin-top:16px;padding-top:14px;border-top:1px solid rgba(20,96,72,.1);display:flex;align-items:center;gap:8px;color:var(--muted);font-size:11px}.werd-visitor-dot{width:9px;height:9px;border-radius:50%;background:#16845f;box-shadow:0 0 0 6px rgba(22,132,95,.09)}@media(max-width:430px){.werd-visitor-counter{padding:18px;border-radius:24px}.werd-visitor-title b{font-size:20px}.werd-visitor-grid{grid-template-columns:1.35fr 1fr}.werd-visitor-stat strong{font-size:27px}}
    `;document.head.appendChild(style);
    const box=document.createElement('div');box.id='werdVisitorCounter';box.className='werd-visitor-counter';box.setAttribute('aria-live','polite');box.innerHTML=`<div class="werd-visitor-head"><div class="werd-visitor-icon">👥</div><div class="werd-visitor-title"><b>إجمالي زوار ورد</b><small>عداد تراكمي منذ بدء الإحصاء</small></div></div><div class="werd-visitor-grid"><div class="werd-visitor-stat"><small>الزوار الفريدون</small><strong id="werdVisitorUnique">٠</strong><span>زائر</span></div><div class="werd-visitor-stat"><small>إجمالي الزيارات</small><strong id="werdVisitorVisits">٠</strong><span>زيارة تراكمية</span></div></div><div class="werd-visitor-foot"><i class="werd-visitor-dot"></i><span>يزداد تلقائيًا مع الزوار والزيارات الجديدة • ليس عدد المتصلين الآن</span></div>`;
    home.appendChild(box);
  }
  function show(unique=0,visits=0){inject();const u=$('werdVisitorUnique'),v=$('werdVisitorVisits');if(u)u.textContent=fmt(unique);if(v)v.textContent=fmt(visits);try{localStorage.setItem(COUNT_CACHE,JSON.stringify({unique:Number(unique)||0,visits:Number(visits)||0}))}catch(_){}}
  function showCached(){inject();try{const raw=localStorage.getItem(COUNT_CACHE);if(!raw)return show(0,0);const x=JSON.parse(raw);show(x.unique||0,x.visits||0)}catch(_){show(0,0)}}
  async function rpc(name,body){const res=await fetch(API+name,{method:'POST',headers:{apikey:APIKEY,'Content-Type':'application/json','Cache-Control':'no-store'},body:JSON.stringify(body||{})});const text=await res.text();let data=null;try{data=text?JSON.parse(text):null}catch(_){data=null}if(!res.ok)throw new Error(`RPC_${name}_${res.status}_${text.slice(0,160)}`);return data}
  async function load(){
    inject();showCached();
    const registered=(()=>{try{return sessionStorage.getItem(SESSION_KEY)==='1'}catch(_){return false}})();
    try{
      const data=registered?await rpc('get_werd_visitor_count',{}):await rpc('register_werd_visit',{p_visitor_id:visitorId()});
      const row=Array.isArray(data)?data[0]:data;
      if(row)show(row.unique_visitors??0,row.total_visits??0);
      if(!registered)try{sessionStorage.setItem(SESSION_KEY,'1')}catch(_){ }
    }catch(e){console.warn('Werd visitor counter REST',e);try{const data=await rpc('get_werd_visitor_count',{}),row=Array.isArray(data)?data[0]:data;if(row)show(row.unique_visitors??0,row.total_visits??0)}catch(err){console.warn('Werd visitor count fallback',err)}}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(load,180));else setTimeout(load,180);
  window.addEventListener('pageshow',()=>setTimeout(()=>{inject();showCached();load()},180));
})();
