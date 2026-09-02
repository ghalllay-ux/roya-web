// Professional paged Mushaf mode for Werd
(function(){
  const TOTAL_PAGES=604;
  const EDITION='quran-uthmani';
  let currentPage=1,currentAyahs=[],selectedAyah=null,loading=false,touchX=null,touchY=null;

  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function prefs(){
    if(!state.mushaf||typeof state.mushaf!=='object'||Array.isArray(state.mushaf))state.mushaf={};
    state.mushaf={page:1,surahNumber:null,surahName:'',ayahNumber:null,globalAyah:null,juz:null,hizbQuarter:null,distractionFree:false,updatedAt:null,...state.mushaf};
    state.mushaf.page=Math.max(1,Math.min(TOTAL_PAGES,Number(state.mushaf.page)||1));
    return state.mushaf;
  }
  function quarterMeta(hq){
    hq=Number(hq)||1;return{hizb:Math.ceil(hq/4),quarter:((hq-1)%4)+1};
  }
  function uniqueSurahs(ayahs){
    const seen=new Set(),out=[];for(const a of ayahs){const n=Number(a.surah?.number);if(!seen.has(n)){seen.add(n);out.push(a.surah)}}return out.filter(Boolean);
  }

  function injectStyles(){
    if(document.getElementById('werdMushafStyle'))return;
    const s=document.createElement('style');s.id='werdMushafStyle';s.textContent=`
      .mushaf-shell{max-width:760px;margin:0 auto}.mushaf-top{position:sticky;top:0;z-index:25;background:color-mix(in srgb,var(--bg) 92%,transparent);backdrop-filter:blur(14px);padding:8px 0 10px}.mushaf-meta{display:flex;gap:7px;flex-wrap:wrap;align-items:center}.mushaf-meta .badge{font-size:11px}
      .mushaf-sheet{background:#fffdf5;color:#183c30;border:1px solid #ddd4bf;border-radius:22px;min-height:64vh;padding:24px 20px 26px;box-shadow:0 14px 38px rgba(42,62,49,.08);position:relative;overflow:hidden}.dark .mushaf-sheet{background:#14261f;color:#f4efe1;border-color:#2c473c}.mushaf-ornament{text-align:center;color:var(--green);opacity:.6;font-size:12px;letter-spacing:6px;margin-bottom:12px}
      .mushaf-surah-title{text-align:center;font-size:19px;font-weight:900;padding:9px 12px;margin:12px auto;border-radius:99px;background:color-mix(in srgb,var(--sage) 72%,transparent);width:min(330px,90%)}.mushaf-text{font-size:27px;line-height:2.35;text-align:justify;text-align-last:center;direction:rtl;font-family:"Amiri Quran","Traditional Arabic","Noto Naskh Arabic",serif}.mushaf-ayah{cursor:pointer;border-radius:8px;transition:.18s}.mushaf-ayah.selected{background:color-mix(in srgb,var(--gold) 25%,transparent);box-shadow:0 0 0 4px color-mix(in srgb,var(--gold) 12%,transparent)}.mushaf-num{display:inline-grid;place-items:center;min-width:27px;height:27px;border:1px solid currentColor;border-radius:50%;font-family:system-ui,sans-serif;font-size:11px;font-weight:800;margin:0 4px;vertical-align:middle;opacity:.8}
      .mushaf-footer{text-align:center;color:var(--muted);font-size:11px;padding-top:15px}.mushaf-nav{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;margin-top:12px}.mushaf-nav button{border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:15px;padding:12px;font-weight:900}.mushaf-pagebox{display:flex;align-items:center;gap:7px}.mushaf-page-input{width:68px;text-align:center;border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:13px;padding:10px;font-weight:900}.mushaf-slider{width:100%;accent-color:var(--green);margin:12px 0 4px}
      .mushaf-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}.mushaf-actions button{min-width:0}.mushaf-tip{text-align:center;font-size:10px;color:var(--muted);margin-top:8px}.mushaf-loader{text-align:center;padding:80px 20px;color:var(--muted)}
      .mushaf-focus .top,.mushaf-focus .bottom{display:none!important}.mushaf-focus .app{padding-bottom:0}.mushaf-focus #mushaf{padding-top:max(8px,env(safe-area-inset-top));padding-bottom:max(8px,env(safe-area-inset-bottom))}.mushaf-focus .mushaf-top{top:0}.mushaf-focus .mushaf-sheet{min-height:calc(100dvh - 190px);border-radius:12px}.mushaf-focus #mushafBack,.mushaf-focus #mushafRecordPage,.mushaf-focus #mushafOpenTools{display:none}.mushaf-focus #mushafFocusBtn{position:fixed;left:14px;top:max(12px,env(safe-area-inset-top));z-index:60;box-shadow:var(--shadow)}
      @media(max-width:430px){.mushaf-sheet{padding:20px 15px}.mushaf-text{font-size:24px;line-height:2.25}.mushaf-actions{grid-template-columns:1fr 1fr}.mushaf-actions #mushafOpenTools{grid-column:1/-1}.mushaf-nav{grid-template-columns:1fr auto 1fr}}
    `;document.head.appendChild(s);
  }

  function injectPage(){
    injectStyles();prefs();const main=document.querySelector('main');if(!main)return;
    if(!document.getElementById('mushaf')){
      const sec=document.createElement('section');sec.className='page';sec.id='mushaf';sec.innerHTML=`
        <div class="mushaf-shell">
          <div class="mushaf-top">
            <div class="row"><button class="smallbtn" id="mushafBack">فهرس السور</button><div style="text-align:center"><b id="mushafTitle">المصحف</b><div class="muted" id="mushafStatus">صفحة ${prefs().page}</div></div><button class="smallbtn" id="mushafFocusBtn">◱ تركيز</button></div>
            <div class="mushaf-meta" style="justify-content:center;margin-top:9px"><span class="badge" id="mushafSurahBadge">—</span><span class="badge" id="mushafJuzBadge">الجزء —</span><span class="badge" id="mushafHizbBadge">الحزب —</span></div>
          </div>
          <div class="mushaf-sheet" id="mushafSheet"><div class="mushaf-loader">جاري تحميل صفحة المصحف…</div></div>
          <div class="mushaf-nav"><button id="mushafPrev">→ الصفحة السابقة</button><div class="mushaf-pagebox"><input class="mushaf-page-input" id="mushafPageInput" type="number" min="1" max="604" inputmode="numeric"><span class="muted">/ 604</span></div><button id="mushafNext">الصفحة التالية ←</button></div>
          <input class="mushaf-slider" id="mushafSlider" type="range" min="1" max="604" step="1"><div class="mushaf-tip">اسحب على صفحة المصحف للتنقل، واضغط على الآية لحفظ موضعك الدقيق.</div>
          <div class="mushaf-actions"><button class="smallbtn" id="mushafRecordPage">✓ سجل الصفحة في ورد اليوم</button><button class="smallbtn" id="mushafOpenTools">أدوات الآية</button><button class="smallbtn" id="mushafResume">آخر موضع محفوظ</button></div>
        </div>`;main.appendChild(sec);
    }
    addEntryPoints();wire();applyFocus();
  }

  function addEntryPoints(){
    const head=document.querySelector('#quran .reader-head');if(head&&!document.getElementById('openMushafBtn')){
      const b=document.createElement('button');b.className='secondary';b.id='openMushafBtn';b.style.margin='0 0 12px';b.textContent='📖 وضع صفحات المصحف';b.onclick=()=>openMushaf();head.appendChild(b);
    }
    const panel=document.getElementById('werdReaderPanel');if(panel&&!document.getElementById('readerMushafBtn')){
      const b=document.createElement('button');b.className='smallbtn';b.id='readerMushafBtn';b.textContent='📖 فتح في وضع الصفحات';b.onclick=()=>openMushafForSurah(state.lastSurah?.number);panel.appendChild(b);
    }
    const grid=document.querySelector('#more .more-grid');if(grid&&!document.getElementById('moreMushafTile')){
      const b=document.createElement('button');b.className='more-tile';b.id='moreMushafTile';b.innerHTML='<span class="mi">📖</span><b>المصحف</b><small>قراءة بالصفحات ووضع التركيز</small>';b.onclick=()=>openMushaf();grid.insertBefore(b,grid.firstChild);
    }
  }

  function wire(){
    document.getElementById('mushafBack').onclick=()=>{setFocus(false);go('quran')};
    document.getElementById('mushafFocusBtn').onclick=()=>setFocus(!prefs().distractionFree);
    document.getElementById('mushafPrev').onclick=()=>loadPage(currentPage-1);
    document.getElementById('mushafNext').onclick=()=>loadPage(currentPage+1);
    document.getElementById('mushafRecordPage').onclick=()=>{if(typeof markPageRead==='function')markPageRead();toast('تم تسجيل صفحة في ورد اليوم ✓')};
    document.getElementById('mushafOpenTools').onclick=openSelectedTools;
    document.getElementById('mushafResume').onclick=()=>loadPage(prefs().page,prefs().globalAyah);
    const input=document.getElementById('mushafPageInput'),slider=document.getElementById('mushafSlider');
    input.onchange=()=>loadPage(Number(input.value));input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();loadPage(Number(input.value))}};
    slider.onchange=()=>loadPage(Number(slider.value));slider.oninput=()=>{document.getElementById('mushafStatus').textContent=`الانتقال إلى صفحة ${slider.value}`};
    const sheet=document.getElementById('mushafSheet');
    sheet.addEventListener('touchstart',e=>{const t=e.changedTouches?.[0];if(!t)return;touchX=t.clientX;touchY=t.clientY},{passive:true});
    sheet.addEventListener('touchend',e=>{const t=e.changedTouches?.[0];if(!t||touchX==null)return;const dx=t.clientX-touchX,dy=t.clientY-touchY;touchX=touchY=null;if(Math.abs(dx)<55||Math.abs(dx)<Math.abs(dy)*1.25)return;if(dx<0)loadPage(currentPage+1);else loadPage(currentPage-1)},{passive:true});
  }

  function setFocus(on){prefs().distractionFree=!!on;save();applyFocus()}
  function applyFocus(){const on=!!prefs().distractionFree;document.body.classList.toggle('mushaf-focus',on);const b=document.getElementById('mushafFocusBtn');if(b)b.textContent=on?'× خروج':'◱ تركيز'}

  function renderPage(data,anchorGlobal){
    currentAyahs=Array.isArray(data?.ayahs)?data.ayahs:[];const sheet=document.getElementById('mushafSheet');if(!currentAyahs.length){sheet.innerHTML='<div class="mushaf-loader">تعذر العثور على آيات هذه الصفحة.</div>';return}
    const groups=[];for(const a of currentAyahs){let g=groups[groups.length-1];if(!g||Number(g.surah.number)!==Number(a.surah?.number)){g={surah:a.surah,ayahs:[]};groups.push(g)}g.ayahs.push(a)}
    sheet.innerHTML=`<div class="mushaf-ornament">◆ ◇ ◆</div><div class="mushaf-text">${groups.map(g=>`<div class="mushaf-surah-title">${esc(g.surah?.name||'')}</div>${g.ayahs.map(a=>`<span class="mushaf-ayah" data-global="${Number(a.number)}" data-surah="${Number(a.surah?.number)}" data-ayah="${Number(a.numberInSurah)}">${esc(a.text)} <span class="mushaf-num">${Number(a.numberInSurah)}</span> </span>`).join('')}`).join('')}</div><div class="mushaf-footer">صفحة ${currentPage} من ${TOTAL_PAGES}</div>`;
    sheet.querySelectorAll('.mushaf-ayah').forEach(n=>n.onclick=()=>selectAyah(Number(n.dataset.global),true));
    const first=currentAyahs[0],surahs=uniqueSurahs(currentAyahs),meta=quarterMeta(first.hizbQuarter);
    document.getElementById('mushafSurahBadge').textContent=surahs.length===1?(surahs[0].name||'سورة'):`${surahs[0]?.name||''} • ${surahs[surahs.length-1]?.name||''}`;
    document.getElementById('mushafJuzBadge').textContent=`الجزء ${first.juz||'—'}`;document.getElementById('mushafHizbBadge').textContent=`الحزب ${meta.hizb} • الربع ${meta.quarter}`;
    const target=anchorGlobal&&currentAyahs.some(a=>Number(a.number)===Number(anchorGlobal))?Number(anchorGlobal):Number(first.number);selectAyah(target,false);
    if(anchorGlobal)setTimeout(()=>sheet.querySelector(`[data-global="${target}"]`)?.scrollIntoView({block:'center'}),80);
  }

  function selectAyah(global,announce){
    const a=currentAyahs.find(x=>Number(x.number)===Number(global));if(!a)return;selectedAyah=a;
    document.querySelectorAll('#mushafSheet .mushaf-ayah').forEach(n=>n.classList.toggle('selected',Number(n.dataset.global)===Number(global)));
    const p=prefs();p.page=currentPage;p.surahNumber=Number(a.surah?.number)||null;p.surahName=a.surah?.name||'';p.ayahNumber=Number(a.numberInSurah)||null;p.globalAyah=Number(a.number)||null;p.juz=Number(a.juz)||null;p.hizbQuarter=Number(a.hizbQuarter)||null;p.updatedAt=new Date().toISOString();save();
    if(announce)toast(`تم حفظ موضعك: ${p.surahName} • الآية ${p.ayahNumber}`);
  }

  async function loadPage(page,anchorGlobal=null){
    page=Math.max(1,Math.min(TOTAL_PAGES,Number(page)||1));if(loading)return;loading=true;currentPage=page;const sheet=document.getElementById('mushafSheet');if(sheet)sheet.innerHTML='<div class="mushaf-loader">جاري تحميل صفحة المصحف…</div>';
    document.getElementById('mushafStatus').textContent=`صفحة ${page}`;document.getElementById('mushafPageInput').value=page;document.getElementById('mushafSlider').value=page;document.getElementById('mushafPrev').disabled=page<=1;document.getElementById('mushafNext').disabled=page>=TOTAL_PAGES;
    try{
      const r=await fetch(`${API_QURAN}/page/${page}/${encodeURIComponent(EDITION)}`);if(!r.ok)throw new Error('page');const j=await r.json();renderPage(j.data,anchorGlobal);window.scrollTo({top:0,behavior:'smooth'});
    }catch(e){console.error(e);sheet.innerHTML='<div class="mushaf-loader">تعذر تحميل الصفحة الآن. تحقق من الاتصال وحاول مرة أخرى.</div>';toast('تعذر تحميل صفحة المصحف')}
    finally{loading=false}
  }

  async function openSelectedTools(){
    const a=selectedAyah;if(!a){toast('اختر آية أولًا');return}setFocus(false);go('quran');await openSurah(Number(a.surah?.number));setTimeout(()=>document.getElementById(`ayah-${a.numberInSurah}`)?.scrollIntoView({behavior:'smooth',block:'center'}),160);
  }

  window.openMushaf=function(page=null){injectPage();go('mushaf');const p=prefs(),target=page?Number(page):p.page;loadPage(target,page?null:p.globalAyah)};
  window.openMushafForSurah=async function(n){
    n=Number(n);if(!n){openMushaf();return}try{const r=await fetch(`${API_QURAN}/surah/${n}/${encodeURIComponent(EDITION)}`);if(!r.ok)throw new Error('surah');const j=await r.json(),a=j.data?.ayahs?.[0];openMushaf(Number(a?.page)||prefs().page)}catch(e){openMushaf()}
  };

  const baseGo=window.go||go;window.go=function(page){if(page!=='mushaf'&&document.body.classList.contains('mushaf-focus'))setFocus(false);baseGo(page);if(page==='mushaf'){document.querySelectorAll('.bottom .nav').forEach(n=>n.classList.remove('active'));document.querySelector('.bottom .nav[data-page="quran"]')?.classList.add('active')}};go=window.go;
  const baseRenderState=renderState;renderState=function(){baseRenderState();prefs();applyFocus()};
  injectPage();
})();