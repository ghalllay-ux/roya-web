// Werd faith tools: Hisn Al-Muslim and Asma Al-Husna
(function(){
  const HISN_INDEX='https://www.hisnmuslim.com/api/ar/husn_ar.json';
  const HISN_BASE='https://www.hisnmuslim.com/api/ar';
  const ASMA_API='https://api.aladhan.com/v1/asmaAlHusna';
  let hisnCategories=[],hisnCurrent=null,hisnItems=[],asmaNames=[],hisnFavOnly=false,asmaFavOnly=false,hisnAudio=null;

  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function norm(v){return String(v||'').normalize('NFKD').replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g,'').replace(/[إأآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/ـ/g,'').toLowerCase().trim()}
  function faithState(){
    if(!state.faithFavorites||typeof state.faithFavorites!=='object')state.faithFavorites={hisn:[],asma:[]};
    if(!Array.isArray(state.faithFavorites.hisn))state.faithFavorites.hisn=[];
    if(!Array.isArray(state.faithFavorites.asma))state.faithFavorites.asma=[];
    return state.faithFavorites;
  }
  function isHisnFav(id){return faithState().hisn.some(x=>String(x.id)===String(id))}
  function isAsmaFav(n){return faithState().asma.some(x=>Number(x.number)===Number(n))}

  function injectStyles(){
    if(document.getElementById('werdImanStyle'))return;
    const s=document.createElement('style');s.id='werdImanStyle';s.textContent=`
      .iman-search{display:flex;gap:8px}.iman-search input{flex:1;min-width:0;border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:14px;padding:12px 13px;font-size:16px}.iman-search button{border:0;border-radius:13px;background:var(--green);color:#fff;padding:0 15px;font-weight:800}
      .hisn-door{cursor:pointer}.hisn-door small{display:block;color:var(--muted);margin-top:4px}.hisn-text{font-size:20px;line-height:2.05;margin:12px 0}.iman-tools{display:flex;flex-wrap:wrap;gap:7px;align-items:center}.iman-source{font-size:11px;color:var(--muted);margin-top:10px;line-height:1.7}
      .asma-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.asma-card{text-align:center;position:relative;min-height:142px}.asma-name{font-size:25px;font-weight:900;color:var(--green);margin-top:10px}.asma-trans{font-size:12px;color:var(--muted);margin-top:5px}.asma-meaning{font-size:12px;line-height:1.6;margin-top:8px}.asma-num{position:absolute;top:10px;left:10px;font-size:11px;color:var(--muted)}.asma-heart{position:absolute;top:8px;right:8px;border:0;background:transparent;font-size:20px;color:var(--green)}
      .iman-tabs{display:flex;gap:8px;margin-bottom:12px}.iman-tabs button{flex:1}.faith-empty{text-align:center;color:var(--muted);padding:30px 12px}
      @media(min-width:470px){.asma-grid{grid-template-columns:repeat(3,1fr)}}
    `;document.head.appendChild(s);
  }

  function injectPages(){
    injectStyles();faithState();const main=document.querySelector('main');if(!main)return;
    if(!document.getElementById('hisn')){
      const sec=document.createElement('section');sec.className='page';sec.id='hisn';sec.innerHTML=`
        <div class="section-title"><h3>حصن المسلم</h3><button class="smallbtn" id="hisnBackMore">المزيد</button></div>
        <div class="card"><div class="iman-search"><input id="hisnSearch" inputmode="search" placeholder="ابحث في أبواب حصن المسلم"><button id="hisnSearchBtn">بحث</button></div></div>
        <div class="iman-tabs"><button class="chip active" id="hisnAllTab">كل الأبواب</button><button class="chip" id="hisnFavTab">المحفوظ</button></div>
        <div class="section-title"><h3 id="hisnTitle">الأبواب</h3><span id="hisnStatus">تحميل المصدر…</span></div><div id="hisnBody"><div class="card loading">جاري تحميل حصن المسلم…</div></div>`;main.appendChild(sec);
    }
    if(!document.getElementById('asma')){
      const sec=document.createElement('section');sec.className='page';sec.id='asma';sec.innerHTML=`
        <div class="section-title"><h3>أسماء الله الحسنى</h3><button class="smallbtn" id="asmaBackMore">المزيد</button></div>
        <div class="card"><div class="iman-search"><input id="asmaSearch" inputmode="search" placeholder="ابحث بالاسم أو النطق"><button id="asmaSearchBtn">بحث</button></div></div>
        <div class="iman-tabs"><button class="chip active" id="asmaAllTab">الأسماء 99</button><button class="chip" id="asmaFavTab">المحفوظ</button></div>
        <div class="section-title"><h3>الأسماء الحسنى</h3><span id="asmaStatus">تحميل المصدر…</span></div><div id="asmaBody"><div class="card loading">جاري تحميل الأسماء…</div></div>`;main.appendChild(sec);
    }
    const grid=document.querySelector('#more .more-grid');
    if(grid&&!document.getElementById('moreHisnTile')){const b=document.createElement('button');b.className='more-tile';b.id='moreHisnTile';b.innerHTML='<span class="mi">🤲</span><b>حصن المسلم</b><small>الأذكار والأدعية من الكتاب والسنة</small>';b.onclick=()=>openHisn();grid.appendChild(b)}
    if(grid&&!document.getElementById('moreAsmaTile')){const b=document.createElement('button');b.className='more-tile';b.id='moreAsmaTile';b.innerHTML='<span class="mi">✦</span><b>أسماء الله الحسنى</b><small>الأسماء التسعة والتسعون</small>';b.onclick=()=>openAsma();grid.appendChild(b)}
    wire();
  }

  function wire(){
    document.getElementById('hisnBackMore').onclick=()=>{if(hisnCurrent){hisnCurrent=null;hisnItems=[];renderHisnCategories(document.getElementById('hisnSearch').value)}else go('more')};
    document.getElementById('asmaBackMore').onclick=()=>go('more');
    document.getElementById('hisnSearchBtn').onclick=()=>renderHisnCategories(document.getElementById('hisnSearch').value);
    document.getElementById('hisnSearch').oninput=e=>{if(!hisnCurrent)renderHisnCategories(e.target.value)};
    document.getElementById('asmaSearchBtn').onclick=()=>renderAsma(document.getElementById('asmaSearch').value);
    document.getElementById('asmaSearch').oninput=e=>renderAsma(e.target.value);
    document.getElementById('hisnAllTab').onclick=()=>{hisnFavOnly=false;tabState('hisn');hisnCurrent?renderHisnItems():renderHisnCategories(document.getElementById('hisnSearch').value)};
    document.getElementById('hisnFavTab').onclick=()=>{hisnFavOnly=true;hisnCurrent=null;tabState('hisn');renderHisnFavorites()};
    document.getElementById('asmaAllTab').onclick=()=>{asmaFavOnly=false;tabState('asma');renderAsma(document.getElementById('asmaSearch').value)};
    document.getElementById('asmaFavTab').onclick=()=>{asmaFavOnly=true;tabState('asma');renderAsma(document.getElementById('asmaSearch').value)};
  }
  function tabState(kind){
    document.getElementById(kind+'AllTab')?.classList.toggle('active',kind==='hisn'?!hisnFavOnly:!asmaFavOnly);
    document.getElementById(kind+'FavTab')?.classList.toggle('active',kind==='hisn'?hisnFavOnly:asmaFavOnly);
  }
  function markMore(){document.querySelectorAll('.bottom .nav').forEach(n=>n.classList.remove('active'));document.querySelector('.bottom .nav[data-page="more"]')?.classList.add('active')}

  window.openHisn=async function(){go('hisn');markMore();if(!hisnCategories.length)await loadHisnIndex();else if(!hisnFavOnly)renderHisnCategories('')};
  window.openAsma=async function(){go('asma');markMore();if(!asmaNames.length)await loadAsma();else renderAsma('')};

  async function loadHisnIndex(){
    const status=document.getElementById('hisnStatus');status.textContent='تحميل المصدر…';
    try{const r=await fetch(HISN_INDEX);if(!r.ok)throw new Error('hisn_index');const j=await r.json();hisnCategories=Array.isArray(j['العربية'])?j['العربية']:[];status.textContent=`${hisnCategories.length} باب • hisnmuslim.com`;renderHisnCategories('')}
    catch(e){console.error(e);status.textContent='تعذر التحميل';document.getElementById('hisnBody').innerHTML='<div class="card faith-empty">تعذر تحميل حصن المسلم الآن. تحقق من الاتصال وحاول مجددًا.</div>'}
  }
  function renderHisnCategories(q=''){
    if(hisnFavOnly)return renderHisnFavorites();hisnCurrent=null;document.getElementById('hisnTitle').textContent='أبواب حصن المسلم';const nq=norm(q);const rows=hisnCategories.filter(x=>!nq||norm(x.TITLE).includes(nq));
    document.getElementById('hisnBody').innerHTML=rows.length?`<div class="card">${rows.map(x=>`<div class="list-item hisn-door" data-hisn-id="${Number(x.ID)}"><div><b>${esc(x.TITLE)}</b><small>باب رقم ${Number(x.ID)}</small></div><span>‹</span></div>`).join('')}</div>`:'<div class="card faith-empty">لا توجد أبواب مطابقة.</div>';
    document.querySelectorAll('[data-hisn-id]').forEach(n=>n.onclick=()=>openHisnCategory(Number(n.dataset.hisnId)));
  }
  async function openHisnCategory(id){
    const cat=hisnCategories.find(x=>Number(x.ID)===Number(id));if(!cat)return;hisnCurrent=cat;document.getElementById('hisnTitle').textContent=cat.TITLE;document.getElementById('hisnStatus').textContent='تحميل الباب…';document.getElementById('hisnBody').innerHTML='<div class="card loading">جاري تحميل الأذكار…</div>';
    try{const r=await fetch(`${HISN_BASE}/${id}.json`);if(!r.ok)throw new Error('hisn_door');const j=await r.json();const key=Object.keys(j)[0];hisnItems=Array.isArray(j[key])?j[key]:[];document.getElementById('hisnStatus').textContent=`${hisnItems.length} ذكر/دعاء • حصن المسلم`;renderHisnItems()}
    catch(e){console.error(e);document.getElementById('hisnStatus').textContent='تعذر التحميل';document.getElementById('hisnBody').innerHTML='<div class="card faith-empty">تعذر تحميل هذا الباب الآن.</div>'}
  }
  function hisnFavId(x){return `${Number(hisnCurrent?.ID||x.categoryId)}:${Number(x.ID||x.itemId)}`}
  function renderHisnItems(){
    const box=document.getElementById('hisnBody');if(!hisnItems.length){box.innerHTML='<div class="card faith-empty">لا توجد عناصر في هذا الباب.</div>';return}
    box.innerHTML=hisnItems.map(x=>{const id=hisnFavId(x),audio=String(x.AUDIO||'').replace(/^http:/,'https:');return `<div class="card"><div class="row"><b>${esc(hisnCurrent.TITLE)}</b><span class="badge">${Number(x.REPEAT)||1} ×</span></div><div class="hisn-text">${esc(x.ARABIC_TEXT||'')}</div><div class="iman-tools">${audio?`<button class="smallbtn" data-hisn-audio="${esc(audio)}">▶ استماع</button>`:''}<button class="smallbtn" data-hisn-fav="${esc(id)}">${isHisnFav(id)?'♥ محفوظ':'♡ حفظ'}</button></div><div class="iman-source">المصدر: حصن المسلم من أذكار الكتاب والسنة • hisnmuslim.com</div></div>`}).join('');
    box.querySelectorAll('[data-hisn-audio]').forEach(b=>b.onclick=()=>playHisnAudio(b.dataset.hisnAudio));
    box.querySelectorAll('[data-hisn-fav]').forEach(b=>b.onclick=()=>toggleHisnFavorite(b.dataset.hisnFav));
  }
  function toggleHisnFavorite(id){
    const f=faithState().hisn,i=f.findIndex(x=>String(x.id)===String(id));if(i>=0){f.splice(i,1);toast('تمت إزالة الذكر من المحفوظ')}else{const item=hisnItems.find(x=>hisnFavId(x)===id);if(!item)return;f.unshift({id,categoryId:Number(hisnCurrent.ID),categoryTitle:hisnCurrent.TITLE,itemId:Number(item.ID),text:item.ARABIC_TEXT||'',repeat:Number(item.REPEAT)||1,audio:String(item.AUDIO||'').replace(/^http:/,'https:'),savedAt:new Date().toISOString()});toast('تم حفظ الذكر ♥')}save();hisnFavOnly?renderHisnFavorites():renderHisnItems()
  }
  function renderHisnFavorites(){
    document.getElementById('hisnTitle').textContent='محفوظات حصن المسلم';const rows=faithState().hisn;document.getElementById('hisnStatus').textContent=`${rows.length} محفوظ`;
    const box=document.getElementById('hisnBody');box.innerHTML=rows.length?rows.map(x=>`<div class="card"><div class="row"><b>${esc(x.categoryTitle)}</b><span class="badge">${Number(x.repeat)||1} ×</span></div><div class="hisn-text">${esc(x.text)}</div><div class="iman-tools">${x.audio?`<button class="smallbtn" data-hisn-audio="${esc(x.audio)}">▶ استماع</button>`:''}<button class="smallbtn" data-remove-hisn="${esc(x.id)}">إزالة</button></div><div class="iman-source">المصدر: حصن المسلم • hisnmuslim.com</div></div>`).join(''):'<div class="card faith-empty">لم تحفظ أي ذكر من حصن المسلم بعد.</div>';
    box.querySelectorAll('[data-hisn-audio]').forEach(b=>b.onclick=()=>playHisnAudio(b.dataset.hisnAudio));box.querySelectorAll('[data-remove-hisn]').forEach(b=>b.onclick=()=>{const i=faithState().hisn.findIndex(x=>String(x.id)===String(b.dataset.removeHisn));if(i>=0){faithState().hisn.splice(i,1);save();renderHisnFavorites()}})
  }
  function playHisnAudio(url){try{if(hisnAudio){hisnAudio.pause();hisnAudio=null}hisnAudio=new Audio(url);hisnAudio.play().catch(()=>toast('تعذر تشغيل الصوت الآن'))}catch(e){toast('تعذر تشغيل الصوت الآن')}}

  async function loadAsma(){
    document.getElementById('asmaStatus').textContent='تحميل المصدر…';
    try{const r=await fetch(ASMA_API);if(!r.ok)throw new Error('asma');const j=await r.json();asmaNames=Array.isArray(j.data)?j.data:[];document.getElementById('asmaStatus').textContent=`${asmaNames.length} اسمًا • AlAdhan`;renderAsma('')}
    catch(e){console.error(e);document.getElementById('asmaStatus').textContent='تعذر التحميل';document.getElementById('asmaBody').innerHTML='<div class="card faith-empty">تعذر تحميل أسماء الله الحسنى الآن.</div>'}
  }
  function renderAsma(q=''){
    const nq=norm(q);let rows=asmaFavOnly?faithState().asma:asmaNames;rows=rows.filter(x=>!nq||norm(`${x.name||''} ${x.transliteration||''} ${x.en?.meaning||x.meaning||''}`).includes(nq));document.getElementById('asmaStatus').textContent=`${rows.length} اسمًا${asmaFavOnly?' محفوظًا':' • AlAdhan'}`;
    const box=document.getElementById('asmaBody');box.innerHTML=rows.length?`<div class="asma-grid">${rows.map(x=>`<div class="card asma-card"><span class="asma-num">${Number(x.number)}</span><button class="asma-heart" data-asma-fav="${Number(x.number)}">${isAsmaFav(x.number)?'♥':'♡'}</button><div class="asma-name">${esc(x.name)}</div><div class="asma-trans">${esc(x.transliteration||'')}</div>${(x.en?.meaning||x.meaning)?`<div class="asma-meaning">المعنى بالإنجليزية: ${esc(x.en?.meaning||x.meaning)}</div>`:''}<div class="iman-source">المصدر: AlAdhan • Islamic Network</div></div>`).join('')}</div>`:'<div class="card faith-empty">لا توجد أسماء مطابقة.</div>';
    box.querySelectorAll('[data-asma-fav]').forEach(b=>b.onclick=()=>toggleAsmaFavorite(Number(b.dataset.asmaFav)));
  }
  function toggleAsmaFavorite(number){
    const f=faithState().asma,i=f.findIndex(x=>Number(x.number)===Number(number));if(i>=0){f.splice(i,1);toast('تمت إزالة الاسم من المحفوظ')}else{const x=asmaNames.find(v=>Number(v.number)===Number(number));if(!x)return;f.unshift({number:Number(x.number),name:x.name,transliteration:x.transliteration||'',meaning:x.en?.meaning||'',savedAt:new Date().toISOString()});toast('تم حفظ الاسم ♥')}save();renderAsma(document.getElementById('asmaSearch').value)
  }

  const baseGo=window.go||go;window.go=function(page){baseGo(page);if(page==='hisn'||page==='asma')markMore()};go=window.go;
  const baseRender=renderState;renderState=function(){faithState();baseRender();if(document.getElementById('hisn')&&hisnFavOnly)renderHisnFavorites();if(document.getElementById('asma')&&asmaNames.length)renderAsma(document.getElementById('asmaSearch')?.value||'')};
  injectPages();
})();
