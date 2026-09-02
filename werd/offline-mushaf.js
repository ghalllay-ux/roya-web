// Offline Mushaf download manager for Werd
(function(){
  const CACHE_NAME='werd-mushaf-offline-v1';
  const MANIFEST_KEY='werd_mushaf_offline_manifest_v1';
  const JUZ_MAP_KEY='werd_mushaf_juz_map_v1';
  const EDITION='quran-uthmani';
  const TOTAL_PAGES=604;
  let selected=new Set(),busy=false,cancelRequested=false;

  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function readJSON(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'null')||fallback}catch(e){return fallback}}
  function writeJSON(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch(e){}}
  function manifest(){const m=readJSON(MANIFEST_KEY,{version:1,juzs:{},pageSizes:{},updatedAt:null});m.juzs=m.juzs||{};m.pageSizes=m.pageSizes||{};return m}
  function saveManifest(m){m.updatedAt=new Date().toISOString();writeJSON(MANIFEST_KEY,m)}
  function juzMap(){return readJSON(JUZ_MAP_KEY,{})}
  function saveJuzMap(m){writeJSON(JUZ_MAP_KEY,m)}
  function pageURL(page){return `${API_QURAN}/page/${page}/${encodeURIComponent(EDITION)}`}
  function juzURL(juz){return `${API_QURAN}/juz/${juz}/${encodeURIComponent(EDITION)}`}
  function formatBytes(bytes){bytes=Math.max(0,Number(bytes)||0);if(bytes<1024)return`${bytes} B`;if(bytes<1024*1024)return`${(bytes/1024).toFixed(1)} KB`;return`${(bytes/1024/1024).toFixed(1)} MB`}
  function downloadedJuzCount(m=manifest()){return Object.keys(m.juzs).filter(k=>Array.isArray(m.juzs[k]?.pages)&&m.juzs[k].pages.length).length}
  function retainedPages(m=manifest()){const s=new Set();Object.values(m.juzs).forEach(x=>(x?.pages||[]).forEach(p=>s.add(Number(p))));return s}
  function retainedBytes(m=manifest()){let n=0;retainedPages(m).forEach(p=>n+=Number(m.pageSizes?.[p])||0);return n}

  function injectStyles(){
    if(document.getElementById('werdOfflineMushafStyle'))return;
    const s=document.createElement('style');s.id='werdOfflineMushafStyle';s.textContent=`
      .offline-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.offline-stat{border:1px solid var(--line);background:var(--card);border-radius:18px;padding:13px;text-align:center}.offline-stat b{display:block;font-size:22px;color:var(--green)}.offline-stat small{color:var(--muted);font-size:10px}
      .offline-juz-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.offline-juz{border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:16px;padding:11px 8px;text-align:center;font-weight:800;position:relative}.offline-juz.selected{outline:2px solid var(--green);background:var(--sage)}.offline-juz.downloaded:after{content:'✓';position:absolute;top:5px;left:7px;color:var(--green);font-weight:900}.offline-juz small{display:block;color:var(--muted);font-size:9px;margin-top:3px;font-weight:600}
      .offline-progress{height:10px;border-radius:99px;background:var(--sage);overflow:hidden;margin-top:11px}.offline-progress span{display:block;height:100%;width:0;background:var(--green);transition:width .2s ease}.offline-progress-text{display:flex;justify-content:space-between;gap:8px;font-size:11px;color:var(--muted);margin-top:7px}.offline-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.offline-actions .primary,.offline-actions .secondary{margin:0}.offline-note{font-size:11px;line-height:1.8;color:var(--muted);margin-top:10px}.offline-manage{display:flex;gap:8px;flex-wrap:wrap;margin-top:9px}.offline-storage{font-size:11px;color:var(--muted);margin-top:6px}
      @media(min-width:470px){.offline-juz-grid{grid-template-columns:repeat(5,1fr)}}@media(max-width:360px){.offline-juz-grid{grid-template-columns:repeat(2,1fr)}.offline-summary{grid-template-columns:1fr}}
    `;document.head.appendChild(s);
  }

  function injectPage(){
    injectStyles();const main=document.querySelector('main');if(!main)return;
    if(!document.getElementById('offlineMushaf')){
      const sec=document.createElement('section');sec.className='page';sec.id='offlineMushaf';sec.innerHTML=`
        <div class="section-title"><h3>المصحف دون إنترنت</h3><button class="smallbtn" id="offlineMushafBack">المصحف</button></div>
        <div class="card"><div class="row"><div><b>نزّل ما تحتاجه على جهازك</b><div class="muted">اختر جزءًا أو عدة أجزاء واقرأها لاحقًا دون اتصال.</div></div><span class="badge" id="offlineNetBadge">${navigator.onLine?'متصل':'دون اتصال'}</span></div></div>
        <div class="section-title"><h3>المحفوظ على الجهاز</h3><span id="offlineSavedLabel">—</span></div>
        <div class="offline-summary"><div class="offline-stat"><b id="offlineJuzCount">0</b><small>أجزاء محفوظة</small></div><div class="offline-stat"><b id="offlinePageCount">0</b><small>صفحات محفوظة</small></div><div class="offline-stat"><b id="offlineSize">0 MB</b><small>حجم بيانات المصحف</small></div></div>
        <div class="card" style="margin-top:10px"><div class="row"><b>اختيار الأجزاء</b><div class="offline-manage"><button class="smallbtn" id="offlineSelectAll">الكل</button><button class="smallbtn" id="offlineClearSelection">إلغاء التحديد</button></div></div><div class="offline-juz-grid" id="offlineJuzGrid" style="margin-top:12px"></div></div>
        <div class="card" style="margin-top:10px"><div class="offline-actions"><button class="primary" id="offlineDownloadBtn">⇩ تنزيل المحدد</button><button class="secondary" id="offlineDeleteSelected">حذف المحدد</button></div><div class="offline-progress"><span id="offlineProgressBar"></span></div><div class="offline-progress-text"><span id="offlineProgressText">جاهز للتنزيل</span><span id="offlineProgressSize">0 B</span></div><button class="smallbtn" id="offlineCancelBtn" style="display:none;margin-top:9px">إيقاف التنزيل</button><div class="offline-storage" id="offlineStorageEstimate"></div><div class="offline-note">التنزيل خاص بهذا الجهاز. يحاول ورد طلب تخزين مستمر من المتصفح لتقليل احتمال حذف الصفحات تلقائيًا عند امتلاء مساحة الجهاز.</div></div>
        <div class="card" style="margin-top:10px"><div class="row"><div><b>إدارة التخزين</b><div class="muted">يمكن حذف كل صفحات المصحف المحفوظة دون التأثير على تقدمك أو مفضلاتك.</div></div><button class="smallbtn" id="offlineDeleteAll">حذف الكل</button></div></div>`;main.appendChild(sec);
    }
    addEntryPoints();wire();render();updateStorageEstimate();
  }

  function addEntryPoints(){
    const actions=document.querySelector('#mushaf .mushaf-actions');if(actions&&!document.getElementById('mushafOfflineBtn')){const b=document.createElement('button');b.className='smallbtn';b.id='mushafOfflineBtn';b.textContent='⇩ تنزيل دون إنترنت';b.onclick=openManager;actions.appendChild(b)}
    const grid=document.querySelector('#more .more-grid');if(grid&&!document.getElementById('moreOfflineMushafTile')){const b=document.createElement('button');b.className='more-tile';b.id='moreOfflineMushafTile';b.innerHTML='<span class="mi">⇩</span><b>المصحف دون إنترنت</b><small>تنزيل الأجزاء وإدارة التخزين</small>';b.onclick=openManager;grid.insertBefore(b,grid.firstChild)}
  }

  function wire(){
    document.getElementById('offlineMushafBack').onclick=()=>{if(typeof openMushaf==='function')openMushaf();else go('quran')};
    document.getElementById('offlineSelectAll').onclick=()=>{selected=new Set(Array.from({length:30},(_,i)=>i+1));renderJuzs()};
    document.getElementById('offlineClearSelection').onclick=()=>{selected.clear();renderJuzs()};
    document.getElementById('offlineDownloadBtn').onclick=downloadSelected;
    document.getElementById('offlineDeleteSelected').onclick=deleteSelected;
    document.getElementById('offlineDeleteAll').onclick=deleteAll;
    document.getElementById('offlineCancelBtn').onclick=()=>{cancelRequested=true;document.getElementById('offlineProgressText').textContent='سيتم الإيقاف بعد الطلب الحالي…'};
    window.addEventListener('online',renderNetwork);window.addEventListener('offline',renderNetwork);
  }
  function openManager(){go('offlineMushaf');render();updateStorageEstimate()}
  window.openOfflineMushafManager=openManager;

  function renderNetwork(){const b=document.getElementById('offlineNetBadge');if(b)b.textContent=navigator.onLine?'متصل':'دون اتصال'}
  function render(){if(!document.getElementById('offlineMushaf'))return;renderNetwork();renderJuzs();renderSummary()}
  function renderJuzs(){
    const grid=document.getElementById('offlineJuzGrid');if(!grid)return;const m=manifest();grid.innerHTML=Array.from({length:30},(_,i)=>i+1).map(j=>{const d=!!m.juzs[j]?.pages?.length;return`<button class="offline-juz ${selected.has(j)?'selected':''} ${d?'downloaded':''}" data-offline-juz="${j}">الجزء ${j}<small>${d?'محفوظ على الجهاز':'غير محمّل'}</small></button>`}).join('');
    grid.querySelectorAll('[data-offline-juz]').forEach(b=>b.onclick=()=>{const j=Number(b.dataset.offlineJuz);selected.has(j)?selected.delete(j):selected.add(j);renderJuzs()});
  }
  function renderSummary(){
    const m=manifest(),pages=retainedPages(m),bytes=retainedBytes(m),juzs=downloadedJuzCount(m);document.getElementById('offlineJuzCount').textContent=juzs;document.getElementById('offlinePageCount').textContent=pages.size;document.getElementById('offlineSize').textContent=formatBytes(bytes);document.getElementById('offlineSavedLabel').textContent=juzs?`${juzs} من 30 جزءًا`:'لم يتم تنزيل أجزاء بعد';
  }
  async function updateStorageEstimate(){
    const el=document.getElementById('offlineStorageEstimate');if(!el||!navigator.storage?.estimate)return;try{const e=await navigator.storage.estimate();const used=formatBytes(e.usage||0),quota=formatBytes(e.quota||0);let persisted='';if(navigator.storage.persisted){persisted=(await navigator.storage.persisted())?' • تخزين مستمر':' • قد يدير النظام التخزين تلقائيًا'}el.textContent=`استخدام تخزين الموقع: ${used} من ${quota}${persisted}`}catch(e){el.textContent=''}
  }

  async function requestPersistence(){try{if(navigator.storage?.persist)await navigator.storage.persist()}catch(e){}}
  async function pagesForJuz(juz){
    const map=juzMap();if(Array.isArray(map[juz])&&map[juz].length)return map[juz].map(Number);
    const r=await fetch(juzURL(juz),{cache:'no-store'});if(!r.ok)throw new Error(`juz ${juz}`);const j=await r.json(),pages=[...new Set((j.data?.ayahs||[]).map(a=>Number(a.page)).filter(p=>p>=1&&p<=TOTAL_PAGES))].sort((a,b)=>a-b);if(!pages.length)throw new Error(`pages ${juz}`);map[juz]=pages;saveJuzMap(map);return pages;
  }
  async function mapSelectedJuzs(juzs,onStep){
    const result={};let index=0;const workers=Array.from({length:Math.min(4,juzs.length)},async()=>{while(true){const i=index++;if(i>=juzs.length)return;const juz=juzs[i];if(cancelRequested)return;result[juz]=await pagesForJuz(juz);onStep?.(Object.keys(result).length,juzs.length)}});await Promise.all(workers);return result;
  }

  async function downloadSelected(){
    if(busy)return;if(!selected.size){toast('اختر جزءًا واحدًا على الأقل');return}if(!navigator.onLine){toast('يلزم اتصال بالإنترنت لبدء التنزيل');return}
    busy=true;cancelRequested=false;toggleBusy(true);await requestPersistence();const juzs=[...selected].sort((a,b)=>a-b),progress=document.getElementById('offlineProgressText'),bar=document.getElementById('offlineProgressBar'),sizeEl=document.getElementById('offlineProgressSize');
    try{
      progress.textContent='جاري تحديد صفحات الأجزاء…';const maps=await mapSelectedJuzs(juzs,(n,total)=>{progress.textContent=`تجهيز الأجزاء ${n} من ${total}`});if(cancelRequested)throw new Error('cancel');
      const allPages=[...new Set(Object.values(maps).flat().map(Number))].sort((a,b)=>a-b),cache=await caches.open(CACHE_NAME),m=manifest();let done=0,bytes=0,next=0;
      progress.textContent=`بدء تنزيل ${allPages.length} صفحة…`;
      const workers=Array.from({length:Math.min(4,allPages.length)},async()=>{while(true){const i=next++;if(i>=allPages.length||cancelRequested)return;const page=allPages[i],req=new Request(pageURL(page),{method:'GET'});let res=await fetch(req,{cache:'no-store'});if(!res.ok)throw new Error(`page ${page}`);const forCache=res.clone(),forSize=res.clone();await cache.put(req,forCache);let sz=0;try{sz=(await forSize.blob()).size}catch(e){}m.pageSizes[page]=sz||m.pageSizes[page]||0;bytes+=sz;done++;const pct=Math.round(done/allPages.length*100);bar.style.width=pct+'%';progress.textContent=`تم تنزيل ${done} من ${allPages.length} صفحة • ${pct}٪`;sizeEl.textContent=formatBytes(bytes)}});
      await Promise.all(workers);if(cancelRequested){progress.textContent='تم إيقاف التنزيل. الصفحات المكتملة بقيت محفوظة.';toast('تم إيقاف التنزيل');return}
      juzs.forEach(j=>{m.juzs[j]={pages:maps[j],downloadedAt:new Date().toISOString()}});saveManifest(m);bar.style.width='100%';progress.textContent=`اكتمل تنزيل ${juzs.length} جزء`;sizeEl.textContent=formatBytes(retainedBytes(m));selected.clear();render();updateStorageEstimate();toast('اكتمل تنزيل المصحف المحدد ✓')
    }catch(e){console.error(e);if(e.message!=='cancel'){progress.textContent='تعذر إكمال التنزيل. يمكنك المحاولة مجددًا وسيحتفظ ورد بما اكتمل.';toast('تعذر إكمال تنزيل المصحف')}}finally{busy=false;toggleBusy(false);renderSummary();renderJuzs()}
  }

  function toggleBusy(on){
    ['offlineDownloadBtn','offlineDeleteSelected','offlineDeleteAll','offlineSelectAll','offlineClearSelection'].forEach(id=>{const b=document.getElementById(id);if(b)b.disabled=on});const c=document.getElementById('offlineCancelBtn');if(c)c.style.display=on?'inline-block':'none';
  }

  async function deleteSelected(){
    if(busy)return;if(!selected.size){toast('حدد الأجزاء التي تريد حذفها');return}const m=manifest(),targets=[...selected].filter(j=>m.juzs[j]);if(!targets.length){toast('الأجزاء المحددة غير محفوظة');return}if(!confirm(`حذف ${targets.length} جزء من هذا الجهاز؟`))return;
    const cache=await caches.open(CACHE_NAME);targets.forEach(j=>delete m.juzs[j]);const keep=retainedPages(m),oldPages=Object.keys(m.pageSizes).map(Number);for(const p of oldPages){if(!keep.has(p)){await cache.delete(pageURL(p));delete m.pageSizes[p]}}
    saveManifest(m);selected.clear();render();updateStorageEstimate();toast('تم حذف الأجزاء المحددة من الجهاز')
  }

  async function deleteAll(){
    if(busy)return;const m=manifest();if(!downloadedJuzCount(m)){toast('لا توجد أجزاء محفوظة');return}if(!confirm('حذف جميع صفحات المصحف المحفوظة على هذا الجهاز؟'))return;
    await caches.delete(CACHE_NAME);saveManifest({version:1,juzs:{},pageSizes:{},updatedAt:new Date().toISOString()});selected.clear();render();updateStorageEstimate();toast('تم حذف المصحف المحفوظ من الجهاز')
  }

  injectPage();
})();