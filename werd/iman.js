// Werd Hisn Muslim v83 — direct verified dataset, hard timeouts, no hanging screen.
(function(){
  const MIRRORS=[
    'https://raw.githubusercontent.com/SalehGNUTUX/GT_HISNMUSLIM/main/hisnmuslim.json',
    'https://cdn.jsdelivr.net/gh/SalehGNUTUX/GT_HISNMUSLIM@main/hisnmuslim.json'
  ];
  let all=[],cats=[],current=null,loading=null;
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function inject(){
    const main=document.querySelector('main'); if(!main)return null;
    let s=$('hisn');
    if(!s){s=document.createElement('section');s.id='hisn';s.className='page';s.innerHTML=`
      <div class="section-title"><h3>حصن المسلم</h3><button class="smallbtn" id="hisnBack">المزيد</button></div>
      <div class="card"><input id="hisnSearch" style="width:100%;box-sizing:border-box;padding:12px;border:1px solid var(--line);border-radius:14px;background:var(--card);color:var(--ink)" placeholder="ابحث في أبواب حصن المسلم"></div>
      <div class="section-title"><h3 id="hisnTitle">الأبواب</h3><span id="hisnStatus">جاهز</span></div>
      <div id="hisnBody"><div class="card loading">جاري تحميل حصن المسلم…</div></div>`;main.appendChild(s)}
    const back=$('hisnBack'),search=$('hisnSearch');
    if(back&&!back.dataset.bound){back.dataset.bound='1';back.onclick=()=>{if(current){current=null;render(search?.value||'')}else window.go?.('more')}}
    if(search&&!search.dataset.bound){search.dataset.bound='1';search.oninput=e=>{if(!current)render(e.target.value)}}
    return s;
  }
  async function fetchJson(url,ms=7000){
    const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);
    try{const r=await fetch(url,{cache:'no-store',signal:c.signal,headers:{Accept:'application/json'}});if(!r.ok)throw Error('http '+r.status);return await r.json()}finally{clearTimeout(t)}
  }
  function normalize(data){
    if(!Array.isArray(data)||!data.length)throw Error('empty');
    all=data.filter(x=>x&&Number(x.id)&&x.category&&Array.isArray(x.array));
    cats=all.map(x=>({ID:Number(x.id),TITLE:String(x.category),AUDIO_URL:x.audio||''}));
    if(!cats.length)throw Error('empty categories');
    try{localStorage.setItem('werd_hisn_cache_v83',JSON.stringify(all))}catch(_){ }
    return all;
  }
  async function loadData(force=false){
    if(all.length&&!force)return all;
    if(loading&&!force)return loading;
    loading=(async()=>{
      if(!force){try{const cached=JSON.parse(localStorage.getItem('werd_hisn_cache_v83')||'null');if(Array.isArray(cached)&&cached.length)return normalize(cached)}catch(_){}}
      let err;
      for(const u of MIRRORS){try{return normalize(await fetchJson(u,6500))}catch(e){err=e}}
      try{
        const j=await fetchJson('./api/hisn/index?v=83',7000);
        const arr=j?.data?.['العربية'];
        if(Array.isArray(arr)&&arr.length){cats=arr.map(x=>({ID:Number(x.ID),TITLE:String(x.TITLE||''),AUDIO_URL:x.AUDIO_URL||''})).filter(x=>x.ID&&x.TITLE);return []}
      }catch(e){err=e}
      throw err||Error('unavailable');
    })().finally(()=>loading=null);
    return loading;
  }
  function render(q=''){
    current=null; const title=$('hisnTitle'),body=$('hisnBody'),st=$('hisnStatus'); if(!title||!body)return;
    title.textContent='الأبواب'; q=String(q).trim();
    const list=cats.filter(x=>!q||x.TITLE.includes(q));
    if(st)st.textContent=cats.length?cats.length+' باب':'لا توجد أبواب';
    body.innerHTML=list.length?'<div class="card">'+list.map(x=>`<button type="button" class="list-item" data-h="${x.ID}" style="width:100%;border:0;background:transparent;color:inherit;text-align:right"><div><b>${esc(x.TITLE)}</b><small>باب رقم ${x.ID}</small></div><span>‹</span></button>`).join('')+'</div>':'<div class="card">لا توجد نتائج.</div>';
    body.querySelectorAll('[data-h]').forEach(n=>n.onclick=()=>door(Number(n.dataset.h)));
  }
  async function index(force=false){
    inject(); const body=$('hisnBody'),st=$('hisnStatus');
    if(cats.length&&!force){render($('hisnSearch')?.value||'');return}
    if(body)body.innerHTML='<div class="card loading">جاري تحميل حصن المسلم…</div>'; if(st)st.textContent='تحميل…';
    try{await loadData(force);render($('hisnSearch')?.value||'')}
    catch(e){if(st)st.textContent='تعذر التحميل';if(body)body.innerHTML='<div class="card" style="text-align:center;padding:28px">تعذر تحميل حصن المسلم.<br><button class="smallbtn" id="hisnRetry" style="margin-top:12px">إعادة المحاولة</button></div>';const r=$('hisnRetry');if(r)r.onclick=()=>index(true)}
  }
  async function door(id){
    const title=$('hisnTitle'),body=$('hisnBody'),st=$('hisnStatus'); current=cats.find(x=>x.ID===id); if(!current)return;
    if(title)title.textContent=current.TITLE; if(body)body.innerHTML='<div class="card loading">جاري تحميل الأذكار…</div>'; if(st)st.textContent='تحميل الباب…';
    try{
      if(!all.length)await loadData(false);
      const d=all.find(x=>Number(x.id)===id);
      let items=d?.array||[];
      if(!items.length){const j=await fetchJson('./api/hisn/'+id+'?v=83',7000),k=Object.keys(j?.data||{})[0];items=(j?.data?.[k]||[]).map(x=>({text:x.ARABIC_TEXT||'',count:x.REPEAT||1,audio:x.AUDIO||''}))}
      if(st)st.textContent=items.length+' ذكر/دعاء';
      if(body)body.innerHTML=items.length?items.map(x=>`<div class="card"><div style="font-size:20px;line-height:2.05">${esc(x.text||x.ARABIC_TEXT||'')}</div>${Number(x.count||x.REPEAT||1)>1?`<div class="badge" style="margin-top:10px">التكرار ${Number(x.count||x.REPEAT)}</div>`:''}<div class="muted" style="font-size:11px;margin-top:10px">المصدر: حصن المسلم من أذكار الكتاب والسنة</div></div>`).join(''):'<div class="card">لا توجد عناصر.</div>';
    }catch(e){if(st)st.textContent='تعذر التحميل';if(body)body.innerHTML='<div class="card" style="text-align:center;padding:28px">تعذر تحميل هذا الباب.<br><button class="smallbtn" id="doorRetry" style="margin-top:12px">إعادة المحاولة</button></div>';const r=$('doorRetry');if(r)r.onclick=()=>door(id)}
  }
  function activate(){inject();index(false)}
  inject();
  const priorGo=window.go;
  if(typeof priorGo==='function'){window.go=function(page){const out=priorGo.apply(this,arguments);if(page==='hisn')setTimeout(activate,0);return out};try{go=window.go}catch(_){}}
  window.openHisn=function(){if(typeof window.go==='function')window.go('hisn');setTimeout(activate,0)};
  document.addEventListener('click',e=>{if(e.target?.closest?.('[data-more-page="hisn"],[data-page="hisn"],[onclick*="hisn"]'))setTimeout(activate,0)},true);
  document.addEventListener('DOMContentLoaded',()=>{inject();if($('hisn')?.classList.contains('active'))activate()},{once:true});
})();