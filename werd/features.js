// Werd favorites, bookmarks and khatma layer
(function(){
  const TOTAL_QURAN_PAGES=604;

  function featureState(){
    if(!state.favorites||typeof state.favorites!=='object')state.favorites={ayahs:[],adhkar:[]};
    if(!Array.isArray(state.favorites.ayahs))state.favorites.ayahs=[];
    if(!Array.isArray(state.favorites.adhkar))state.favorites.adhkar=[];
    if(!state.khatma||typeof state.khatma!=='object')state.khatma={active:false,totalPages:TOTAL_QURAN_PAGES,days:30,readPages:0,startDate:null};
    state.khatma={active:false,totalPages:TOTAL_QURAN_PAGES,days:30,readPages:0,startDate:null,...state.khatma};
    state.khatma.totalPages=TOTAL_QURAN_PAGES;
  }

  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

  function injectStyles(){
    if(document.getElementById('werdFeaturesStyle'))return;
    const s=document.createElement('style');s.id='werdFeaturesStyle';
    s.textContent=`
      .fav-tools{display:flex;gap:8px;justify-content:flex-end;margin-top:10px}
      .fav-heart{border:1px solid var(--line);background:var(--card);color:var(--green);border-radius:12px;padding:7px 10px;font-size:16px}
      .fav-heart.active{background:var(--sage);font-weight:900}
      .fav-empty{text-align:center;padding:32px 16px;color:var(--muted)}
      .fav-tabs{display:flex;gap:8px;margin-bottom:12px}.fav-tabs button{flex:1}
      .khatma-big{font-size:34px;font-weight:900}.khatma-pct{font-size:13px;color:var(--muted)}
      .khatma-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}
      .khatma-days{display:flex;gap:7px;overflow:auto;padding-bottom:4px}.khatma-days button{white-space:nowrap}
    `;document.head.appendChild(s);
  }

  function injectPages(){
    featureState();injectStyles();
    const main=document.querySelector('main');if(!main)return;
    if(!document.getElementById('favorites')){
      const fav=document.createElement('section');fav.className='page';fav.id='favorites';
      fav.innerHTML=`<div class="section-title"><h3>المفضلة</h3><span id="favCount">0 عنصر</span></div><div class="fav-tabs"><button class="chip active" id="favAyahTab">الآيات</button><button class="chip" id="favDhikrTab">الأذكار</button></div><div id="favoritesList"></div>`;
      main.appendChild(fav);
      document.getElementById('favAyahTab').onclick=()=>renderFavorites('ayahs');
      document.getElementById('favDhikrTab').onclick=()=>renderFavorites('adhkar');
    }
    if(!document.getElementById('khatma')){
      const kh=document.createElement('section');kh.className='page';kh.id='khatma';
      kh.innerHTML=`<div class="section-title"><h3>الختمة</h3><span>خطة ختم القرآن</span></div><div id="khatmaBody"></div>`;
      main.appendChild(kh);
    }
    const grid=document.querySelector('#home .grid');
    if(grid&&!document.getElementById('khatmaTile')){
      const tile=document.createElement('div');tile.className='tile';tile.id='khatmaTile';tile.innerHTML='<div class="em">🕋</div><b>الختمة</b>';tile.onclick=()=>{renderKhatma();go('khatma')};grid.appendChild(tile);
    }
  }

  function isAyahFav(id){featureState();return state.favorites.ayahs.some(x=>x.id===id)}
  function isDhikrFav(id){featureState();return state.favorites.adhkar.some(x=>x.id===id)}

  window.toggleAyahFavorite=function(item){
    featureState();const i=state.favorites.ayahs.findIndex(x=>x.id===item.id);
    if(i>=0){state.favorites.ayahs.splice(i,1);toast('تمت إزالة الآية من المفضلة')}else{state.favorites.ayahs.unshift({...item,savedAt:new Date().toISOString()});toast('تم حفظ الآية في المفضلة ♥')}
    save();decorateAyahs(item.surahNumber);renderFavorites('ayahs');
  };
  window.toggleDhikrFavorite=function(item){
    featureState();const i=state.favorites.adhkar.findIndex(x=>x.id===item.id);
    if(i>=0){state.favorites.adhkar.splice(i,1);toast('تمت إزالة الذكر من المفضلة')}else{state.favorites.adhkar.unshift({...item,savedAt:new Date().toISOString()});toast('تم حفظ الذكر في المفضلة ♥')}
    save();decorateAdhkar();renderFavorites('adhkar');
  };

  window.openFavoriteAyah=async function(surahNumber,ayahNumber){
    go('quran');await openSurah(Number(surahNumber));setTimeout(()=>document.getElementById(`ayah-${ayahNumber}`)?.scrollIntoView({behavior:'smooth',block:'center'}),100);
  };

  function decorateAyahs(surahNumber){
    featureState();const surahName=document.getElementById('readerName')?.textContent||'';
    document.querySelectorAll('#ayahs .ayah').forEach(node=>{
      const number=Number(node.querySelector('.an')?.textContent||0);if(!number)return;
      node.id=`ayah-${number}`;node.querySelector('.fav-tools')?.remove();
      const clone=node.cloneNode(true);clone.querySelector('.an')?.remove();clone.querySelector('.fav-tools')?.remove();const text=clone.textContent.trim();
      const id=`ayah:${surahNumber}:${number}`,item={id,type:'ayah',surahNumber:Number(surahNumber),surahName,ayahNumber:number,text};
      const tools=document.createElement('div');tools.className='fav-tools';const b=document.createElement('button');b.className='fav-heart'+(isAyahFav(id)?' active':'');b.textContent=isAyahFav(id)?'♥ محفوظ':'♡ حفظ';b.onclick=()=>toggleAyahFavorite(item);tools.appendChild(b);node.appendChild(tools);
    });
  }

  function decorateAdhkar(){
    featureState();if(typeof normalizedItems!=='function')return;const items=normalizedItems();
    document.querySelectorAll('#adhkarList .card').forEach((card,i)=>{
      const x=items[i];if(!x)return;card.querySelector('.fav-heart')?.remove();const key=`${currentAdhkarType}:${x.order??i}`;const id=`dhikr:${key}`;
      const item={id,type:'dhikr',category:currentAdhkarType,key,text:x.content||x.zekr||'',source:x.source||'حصن المسلم',count:Number(x.count)||1};
      const b=document.createElement('button');b.className='fav-heart'+(isDhikrFav(id)?' active':'');b.textContent=isDhikrFav(id)?'♥ محفوظ':'♡ حفظ';b.onclick=()=>toggleDhikrFavorite(item);
      const row=card.querySelector('.row:last-child')||card;row.appendChild(b);
    });
  }

  window.renderFavorites=function(kind='ayahs'){
    featureState();const list=document.getElementById('favoritesList');if(!list)return;
    document.getElementById('favAyahTab')?.classList.toggle('active',kind==='ayahs');document.getElementById('favDhikrTab')?.classList.toggle('active',kind==='adhkar');
    const items=kind==='ayahs'?state.favorites.ayahs:state.favorites.adhkar;document.getElementById('favCount').textContent=`${items.length} عنصر`;
    if(!items.length){list.innerHTML=`<div class="card fav-empty">${kind==='ayahs'?'لم تحفظ أي آية بعد. افتح المصحف واضغط «حفظ».':'لم تحفظ أي ذكر بعد. افتح الأذكار واضغط «حفظ».'}</div>`;return}
    list.innerHTML=items.map(x=>kind==='ayahs'
      ?`<div class="card"><div class="row"><b>${esc(x.surahName)} • الآية ${x.ayahNumber}</b><span class="badge">قرآن</span></div><p class="dhikr">${esc(x.text)}</p><div class="row"><button class="smallbtn" onclick="openFavoriteAyah(${Number(x.surahNumber)},${Number(x.ayahNumber)})">فتح في المصحف</button><button class="smallbtn" data-remove-ayah="${esc(x.id)}">إزالة</button></div></div>`
      :`<div class="card"><div class="row"><b>${x.category==='morning'?'أذكار الصباح':'أذكار المساء'}</b><span class="badge">${Number(x.count)||1} ×</span></div><p class="dhikr">${esc(x.text)}</p><div class="row"><span class="muted">${esc(x.source)}</span><button class="smallbtn" data-remove-dhikr="${esc(x.id)}">إزالة</button></div></div>`).join('');
    list.querySelectorAll('[data-remove-ayah]').forEach(b=>b.onclick=()=>{const x=state.favorites.ayahs.find(v=>v.id===b.dataset.removeAyah);if(x)toggleAyahFavorite(x)});
    list.querySelectorAll('[data-remove-dhikr]').forEach(b=>b.onclick=()=>{const x=state.favorites.adhkar.find(v=>v.id===b.dataset.removeDhikr);if(x)toggleDhikrFavorite(x)});
  };

  toggleFavInfo=function(){renderFavorites('ayahs');go('favorites')};

  function dailyKhatmaTarget(){featureState();return Math.ceil(TOTAL_QURAN_PAGES/Math.max(1,Number(state.khatma.days)||30))}
  window.startKhatma=function(days){featureState();state.khatma={active:true,totalPages:TOTAL_QURAN_PAGES,days:Number(days)||30,readPages:0,startDate:todayKey()};save();renderKhatma();toast('بدأت خطة الختمة 🌿')};
  window.setKhatmaDays=function(days){featureState();state.khatma.days=Number(days);save();renderKhatma();toast('تم تحديث مدة الختمة')};
  window.addKhatmaPages=function(n){featureState();if(!state.khatma.active){toast('ابدأ الختمة أولًا');return}state.khatma.readPages=Math.max(0,Math.min(TOTAL_QURAN_PAGES,(Number(state.khatma.readPages)||0)+Number(n)));save();renderKhatma();if(state.khatma.readPages>=TOTAL_QURAN_PAGES)toast('مبارك! أتممت الختمة 🎉')};
  window.resetKhatma=function(){featureState();state.khatma={active:false,totalPages:TOTAL_QURAN_PAGES,days:30,readPages:0,startDate:null};save();renderKhatma();toast('تمت إعادة ضبط الختمة')};

  window.renderKhatma=function(){
    featureState();const box=document.getElementById('khatmaBody');if(!box)return;const k=state.khatma,pct=Math.min(100,Math.round((Number(k.readPages)||0)/TOTAL_QURAN_PAGES*100)),remaining=Math.max(0,TOTAL_QURAN_PAGES-(Number(k.readPages)||0)),target=dailyKhatmaTarget();
    if(!k.active){box.innerHTML=`<div class="hero"><div class="eyebrow">ابدأ خطة جديدة</div><h2>اختم القرآن بخطتك</h2><p>اختر المدة المناسبة، وسيتابع ورد تقدمك تلقائيًا.</p></div><div class="card" style="margin-top:14px"><b>اختر مدة الختمة</b><div class="khatma-days" style="margin-top:12px"><button class="chip" onclick="startKhatma(30)">30 يومًا</button><button class="chip" onclick="startKhatma(45)">45 يومًا</button><button class="chip" onclick="startKhatma(60)">60 يومًا</button><button class="chip" onclick="startKhatma(90)">90 يومًا</button></div></div>`;return}
    box.innerHTML=`<div class="hero"><div class="eyebrow">تقدم الختمة</div><div class="khatma-big">${pct}٪</div><p>${Number(k.readPages)||0} من ${TOTAL_QURAN_PAGES} صفحة</p><div class="progress"><span style="width:${pct}%"></span></div><div class="hero-meta"><span>المتبقي ${remaining} صفحة</span><span>${target} صفحة يوميًا</span></div></div><div class="card" style="margin-top:14px"><div class="list-item"><span>مدة الخطة</span><span class="badge">${Number(k.days)||30} يومًا</span></div><div class="list-item"><span>تاريخ البداية</span><span class="muted">${esc(k.startDate||todayKey())}</span></div><div class="list-item"><span>الهدف اليومي التقريبي</span><span class="badge">${target} صفحة</span></div><div class="khatma-actions"><button class="smallbtn" onclick="addKhatmaPages(1)">+ صفحة</button><button class="smallbtn" onclick="addKhatmaPages(5)">+ 5 صفحات</button><button class="smallbtn" onclick="addKhatmaPages(-1)">− صفحة</button></div><div class="khatma-days" style="margin-top:14px"><button class="chip" onclick="setKhatmaDays(30)">30</button><button class="chip" onclick="setKhatmaDays(45)">45</button><button class="chip" onclick="setKhatmaDays(60)">60</button><button class="chip" onclick="setKhatmaDays(90)">90</button></div><button class="smallbtn" style="width:100%;margin-top:14px" onclick="resetKhatma()">إعادة ضبط الختمة</button></div>`;
  };

  const baseRenderState=renderState;renderState=function(){featureState();baseRenderState();if(document.getElementById('favorites')){const current=document.getElementById('favDhikrTab')?.classList.contains('active')?'adhkar':'ayahs';renderFavorites(current)}if(document.getElementById('khatma'))renderKhatma()};
  const baseOpenSurah=openSurah;openSurah=async function(n){await baseOpenSurah(n);decorateAyahs(n)};
  const baseRenderAdhkar=renderAdhkar;renderAdhkar=function(){baseRenderAdhkar();decorateAdhkar()};
  const baseMarkPageRead=markPageRead;markPageRead=function(){baseMarkPageRead();featureState();if(state.khatma.active&&state.khatma.readPages<TOTAL_QURAN_PAGES){state.khatma.readPages++;save()}};

  injectPages();renderKhatma();
})();