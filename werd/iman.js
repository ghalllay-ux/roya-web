// Werd Hisn Muslim v89 — single instance, local index + local doors first.
(function(){
  if(window.__WERD_HISN_BOOTED)return;
  window.__WERD_HISN_BOOTED=true;
  window.__werdHisnVersion='89';

  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let cats=[],current=null,loadingIndex=null;

  function inject(){
    const main=document.querySelector('main');
    if(!main)return null;
    let s=$('hisn');
    if(!s){
      s=document.createElement('section');
      s.id='hisn';s.className='page';
      s.innerHTML='<div class="section-title"><h3>حصن المسلم</h3><button class="smallbtn" id="hisnBack">المزيد</button></div><div class="card"><input id="hisnSearch" style="width:100%;box-sizing:border-box;padding:12px;border:1px solid var(--line);border-radius:14px;background:var(--card);color:var(--ink)" placeholder="ابحث في أبواب حصن المسلم"></div><div class="section-title"><h3 id="hisnTitle">الأبواب</h3><span id="hisnStatus">جاهز</span></div><div id="hisnBody"><div class="card">افتح حصن المسلم لعرض الأبواب.</div></div>';
      main.appendChild(s);
    }
    const back=$('hisnBack'),search=$('hisnSearch');
    if(back&&!back.dataset.hisnBound){
      back.dataset.hisnBound='1';
      back.onclick=()=>{if(current){current=null;render(search?.value||'')}else window.go?.('more')};
    }
    if(search&&!search.dataset.hisnBound){
      search.dataset.hisnBound='1';
      search.oninput=e=>{if(!current)render(e.target.value)};
    }
    return s;
  }

  async function get(url,ms=6000){
    const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);
    try{
      const r=await fetch(url,{cache:'no-store',signal:c.signal,headers:{Accept:'application/json'}});
      if(!r.ok)throw Error('HTTP '+r.status);
      return await r.json();
    }finally{clearTimeout(t)}
  }

  function render(q=''){
    current=null;
    const b=$('hisnBody'),st=$('hisnStatus'),title=$('hisnTitle');
    if(!b||!st||!title)return;
    title.textContent='الأبواب';
    q=String(q).trim();
    const a=cats.filter(x=>!q||String(x.category).includes(q));
    st.textContent=cats.length?cats.length+' باب':'لا توجد أبواب';
    if(!a.length){b.innerHTML='<div class="card" style="text-align:center">لا توجد نتائج.</div>';return}
    b.innerHTML='<div class="card">'+a.map(x=>'<button type="button" class="list-item" data-h="'+Number(x.id)+'" style="width:100%;border:0;background:transparent;color:inherit;text-align:right"><div><b>'+esc(x.category)+'</b><small>'+Number(x.count||0)+' ذكر/دعاء</small></div><span>‹</span></button>').join('')+'</div>';
    b.querySelectorAll('[data-h]').forEach(n=>n.onclick=()=>door(Number(n.dataset.h)));
  }

  async function loadIndex(force=false){
    inject();
    const b=$('hisnBody'),st=$('hisnStatus');
    if(cats.length&&!force){render($('hisnSearch')?.value||'');return true}
    if(loadingIndex&&!force)return loadingIndex;
    if(b)b.innerHTML='<div class="card loading">جاري فتح حصن المسلم…</div>';
    if(st)st.textContent='تحميل…';
    loadingIndex=(async()=>{
      try{
        const j=await get('./hisn-index.json?v=89',4500);
        const list=Array.isArray(j?.categories)?j.categories:[];
        if(list.length!==132)throw Error('INDEX_INCOMPLETE');
        cats=list.map(x=>({id:Number(x.id),category:String(x.category||''),file:String(x.file||String(x.id).padStart(3,'0')+'.json'),count:Number(x.count)||0})).filter(x=>x.id&&x.category);
        if(cats.length!==132)throw Error('INDEX_INVALID');
        render($('hisnSearch')?.value||'');
        return true;
      }catch(e){
        console.error('Hisn index',e);
        if(st)st.textContent='تعذر التحميل';
        if(b)b.innerHTML='<div class="card" style="text-align:center;padding:26px">تعذر فتح حصن المسلم.<br><button class="smallbtn" id="hisnRetry" style="margin-top:12px">إعادة المحاولة</button></div>';
        const r=$('hisnRetry');if(r)r.onclick=()=>loadIndex(true);
        return false;
      }finally{loadingIndex=null}
    })();
    return loadingIndex;
  }

  function normalizeItems(j){
    if(Array.isArray(j))return j;
    if(Array.isArray(j?.array))return j.array;
    if(Array.isArray(j?.items))return j.items;
    const raw=j?.data||j;
    if(raw&&typeof raw==='object'){
      for(const v of Object.values(raw))if(Array.isArray(v))return v;
    }
    return [];
  }

  async function firstSuccess(loaders){
    let last;
    for(const fn of loaders){try{return await fn()}catch(e){last=e}}
    throw last||Error('NO_SOURCE');
  }

  async function door(id){
    if(!cats.length){const ok=await loadIndex();if(!ok)return}
    current=cats.find(x=>Number(x.id)===Number(id));
    if(!current)return;
    const b=$('hisnBody'),st=$('hisnStatus'),title=$('hisnTitle');
    if(title)title.textContent=current.category;
    if(st)st.textContent='تحميل الباب…';
    if(b)b.innerHTML='<div class="card loading">جاري تحميل الأذكار…</div>';
    const n=String(id).padStart(3,'0');
    try{
      const j=await firstSuccess([
        ()=>get('./hisn/'+n+'.json?v=89',4500),
        ()=>get('./api/hisn/'+id+'?v=89',5500),
        ()=>get('https://cdn.jsdelivr.net/gh/SalehGNUTUX/GT_HISNMUSLIM@main/assets/data/categories/'+n+'.json',6000),
        ()=>get('https://raw.githubusercontent.com/SalehGNUTUX/GT_HISNMUSLIM/main/assets/data/categories/'+n+'.json',6000)
      ]);
      const items=normalizeItems(j);
      if(!items.length)throw Error('EMPTY_DOOR');
      if(st)st.textContent=items.length+' ذكر/دعاء';
      if(b)b.innerHTML=items.map(x=>{
        const text=x.text||x.ARABIC_TEXT||'';
        const repeat=Number(x.count||x.REPEAT||1)||1;
        return '<div class="card"><div style="font-size:20px;line-height:2.05">'+esc(text)+'</div>'+(repeat>1?'<div class="badge" style="margin-top:10px">التكرار '+repeat+'</div>':'')+'<div class="muted" style="font-size:11px;margin-top:10px">المصدر: حصن المسلم من أذكار الكتاب والسنة</div></div>';
      }).join('');
    }catch(e){
      console.error('Hisn door',id,e);
      if(st)st.textContent='تعذر التحميل';
      if(b)b.innerHTML='<div class="card" style="text-align:center;padding:26px">تعذر تحميل هذا الباب.<br><button class="smallbtn" id="doorRetry" style="margin-top:12px">إعادة المحاولة</button></div>';
      const r=$('doorRetry');if(r)r.onclick=()=>door(id);
    }
  }

  function open(){
    inject();
    window.go?.('hisn');
    setTimeout(()=>loadIndex(false),0);
  }

  inject();
  window.openHisn=open;
  window.__werdHisn={open,reload:()=>loadIndex(true),version:'89'};
  document.addEventListener('click',e=>{
    if(e.target?.closest?.('[data-more-page="hisn"],[data-page="hisn"],[onclick*="openHisn"]'))setTimeout(()=>loadIndex(false),0);
  },true);
})();