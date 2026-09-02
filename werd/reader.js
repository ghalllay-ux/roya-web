// Advanced Quran reader for Werd
(function(){
  const RECITERS=[
    ['ar.alafasy','مشاري العفاسي'],
    ['ar.abdurrahmaansudais','عبدالرحمن السديس'],
    ['ar.mahermuaiqly','ماهر المعيقلي'],
    ['ar.husary','محمود خليل الحصري'],
    ['ar.hudhaify','علي الحذيفي'],
    ['ar.saoodshuraym','سعود الشريم'],
    ['ar.ahmedajamy','أحمد العجمي'],
    ['ar.abdullahbasfar','عبدالله بصفر']
  ];
  const TAFSIRS=[['ar.muyassar','التفسير الميسر'],['ar.jalalayn','تفسير الجلالين']];
  let currentSurahNumber=null,currentAyahMap=new Map(),playlist=[],playIndex=-1,isSequence=false;
  const audio=new Audio();audio.preload='metadata';

  function prefs(){
    if(!state.readerPrefs||typeof state.readerPrefs!=='object')state.readerPrefs={};
    state.readerPrefs={fontSize:26,reciter:'ar.alafasy',tafsir:'ar.muyassar',...state.readerPrefs};
    if(!Array.isArray(state.bookmarks))state.bookmarks=[];
    return state.readerPrefs;
  }
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function injectStyles(){
    if(document.getElementById('werdReaderStyle'))return;
    const s=document.createElement('style');s.id='werdReaderStyle';
    s.textContent=`
      .reader-panel{display:grid;gap:10px}.reader-controls{display:grid;grid-template-columns:1fr 1fr;gap:8px}
      .reader-select{width:100%;border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:13px;padding:10px}
      .reader-actions{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.reader-actions button{min-width:0}
      .reader-tools{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}.reader-tools .smallbtn{font-size:12px}
      .reader-detail{margin-top:10px;padding:12px;border-radius:14px;background:var(--sage);line-height:1.9;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Tahoma,Arial,sans-serif;font-size:14px}
      .ayah.is-playing{outline:2px solid var(--gold);border-radius:14px;padding-inline:9px;background:color-mix(in srgb,var(--sage) 60%,transparent)}
      .bookmark-card .dhikr{font-size:20px}.reader-source{display:block;margin-top:8px;color:var(--muted);font-size:11px}
      @media(max-width:390px){.reader-actions{grid-template-columns:repeat(2,1fr)}}
    `;document.head.appendChild(s);
  }
  function injectUI(){
    injectStyles();prefs();
    const reader=document.getElementById('reader');if(!reader||document.getElementById('werdReaderPanel'))return;
    const firstCard=reader.querySelector('.card');
    const panel=document.createElement('div');panel.className='card reader-panel';panel.id='werdReaderPanel';
    panel.innerHTML=`
      <div class="row"><div><b>قارئ القرآن</b><div class="muted">استماع • تفسير • معاني • علامات</div></div><span class="badge" id="readerAudioStatus">جاهز</span></div>
      <div class="reader-controls">
        <select class="reader-select" id="readerReciter">${RECITERS.map(r=>`<option value="${r[0]}">${r[1]}</option>`).join('')}</select>
        <select class="reader-select" id="readerTafsir">${TAFSIRS.map(r=>`<option value="${r[0]}">${r[1]}</option>`).join('')}</select>
      </div>
      <div class="reader-actions">
        <button class="smallbtn" id="readerPlaySurah">▶ السورة</button>
        <button class="smallbtn" id="readerPause">⏸ إيقاف</button>
        <button class="smallbtn" id="readerFontDown">أ−</button>
        <button class="smallbtn" id="readerFontUp">أ+</button>
      </div>
      <button class="smallbtn" id="readerBookmarksBtn">🔖 علامات القراءة</button>`;
    firstCard.insertAdjacentElement('afterend',panel);
    document.getElementById('readerReciter').value=prefs().reciter;
    document.getElementById('readerTafsir').value=prefs().tafsir;
    document.getElementById('readerReciter').onchange=async e=>{prefs().reciter=e.target.value;save();if(currentSurahNumber)await loadAudioMap(currentSurahNumber);toast('تم تغيير القارئ ✓')};
    document.getElementById('readerTafsir').onchange=e=>{prefs().tafsir=e.target.value;save();toast('تم تغيير التفسير ✓')};
    document.getElementById('readerPlaySurah').onclick=playWholeSurah;
    document.getElementById('readerPause').onclick=()=>{isSequence=false;audio.pause();setAudioStatus('متوقف')};
    document.getElementById('readerFontDown').onclick=()=>changeFont(-2);
    document.getElementById('readerFontUp').onclick=()=>changeFont(2);
    document.getElementById('readerBookmarksBtn').onclick=()=>{renderBookmarks();go('bookmarks')};

    if(!document.getElementById('bookmarks')){
      const sec=document.createElement('section');sec.className='page';sec.id='bookmarks';
      sec.innerHTML='<div class="section-title"><h3>علامات القراءة</h3><span id="bookmarkCount">0 علامة</span></div><div id="bookmarkList"></div>';
      document.querySelector('main').appendChild(sec);
    }
  }
  function applyFont(){document.querySelectorAll('#ayahs .ayah').forEach(n=>n.style.fontSize=prefs().fontSize+'px')}
  function changeFont(d){prefs().fontSize=Math.max(20,Math.min(38,prefs().fontSize+d));save();applyFont();toast('حجم خط المصحف: '+prefs().fontSize)}
  function setAudioStatus(t){const x=document.getElementById('readerAudioStatus');if(x)x.textContent=t}

  async function loadAudioMap(n){
    currentAyahMap=new Map();setAudioStatus('تحميل الصوت…');
    try{
      const r=await fetch(`${API_QURAN}/surah/${n}/${encodeURIComponent(prefs().reciter)}`);if(!r.ok)throw new Error('audio');
      const j=await r.json();(j.data?.ayahs||[]).forEach(a=>currentAyahMap.set(Number(a.numberInSurah),a));
      playlist=[...currentAyahMap.values()].sort((a,b)=>a.numberInSurah-b.numberInSurah);setAudioStatus('الصوت جاهز');decorateReaderTools();
    }catch(e){console.error(e);setAudioStatus('الصوت غير متاح')}
  }
  function clearPlaying(){document.querySelectorAll('#ayahs .ayah').forEach(n=>n.classList.remove('is-playing'))}
  async function playAyah(num,sequence=false){
    const a=currentAyahMap.get(Number(num));if(!a){toast('الصوت غير جاهز لهذه الآية');return}
    clearPlaying();document.getElementById(`ayah-${num}`)?.classList.add('is-playing');
    isSequence=sequence;playIndex=playlist.findIndex(x=>Number(x.numberInSurah)===Number(num));
    audio.src=a.audio||a.audioSecondary?.[0]||'';if(!audio.src){toast('تعذر العثور على ملف الصوت');return}
    try{await audio.play();setAudioStatus('يعمل الآن ▶');document.getElementById(`ayah-${num}`)?.scrollIntoView({behavior:'smooth',block:'center'})}catch(e){console.error(e);toast('تعذر تشغيل الصوت')}
  }
  async function playWholeSurah(){if(!playlist.length&&currentSurahNumber)await loadAudioMap(currentSurahNumber);if(!playlist.length)return;isSequence=true;playIndex=0;playAyah(playlist[0].numberInSurah,true)}
  audio.addEventListener('ended',()=>{clearPlaying();if(isSequence&&playIndex>=0&&playIndex<playlist.length-1){playIndex++;playAyah(playlist[playIndex].numberInSurah,true)}else{isSequence=false;setAudioStatus('انتهت التلاوة ✓')}});
  audio.addEventListener('pause',()=>{if(!audio.ended&&!isSequence)setAudioStatus('متوقف')});

  async function showDetail(num,edition,label){
    const a=currentAyahMap.get(Number(num));if(!a?.number){toast('جاري تجهيز بيانات الآية');return}
    const node=document.getElementById(`ayah-${num}`);if(!node)return;
    let box=node.querySelector(`.reader-detail[data-kind="${edition}"]`);
    if(box){box.remove();return}
    box=document.createElement('div');box.className='reader-detail';box.dataset.kind=edition;box.textContent='جاري التحميل…';node.appendChild(box);
    try{
      const r=await fetch(`${API_QURAN}/ayah/${a.number}/${encodeURIComponent(edition)}`);if(!r.ok)throw new Error('detail');
      const j=await r.json();box.innerHTML=`<b>${esc(label)}</b><div>${esc(j.data?.text||'')}</div><span class="reader-source">المصدر: Al Quran Cloud • ${esc(j.data?.edition?.name||label)}</span>`;
    }catch(e){box.textContent='تعذر تحميل المحتوى الآن.'}
  }
  function toggleBookmark(num){
    prefs();const a=currentAyahMap.get(Number(num));const node=document.getElementById(`ayah-${num}`);if(!a||!node)return;
    const id=`bookmark:${currentSurahNumber}:${num}`,i=state.bookmarks.findIndex(x=>x.id===id);
    const clone=node.cloneNode(true);clone.querySelectorAll('.fav-tools,.reader-tools,.reader-detail').forEach(x=>x.remove());clone.querySelector('.an')?.remove();
    if(i>=0){state.bookmarks.splice(i,1);toast('تمت إزالة علامة القراءة')}else state.bookmarks.unshift({id,surahNumber:currentSurahNumber,surahName:document.getElementById('readerName')?.textContent||'',ayahNumber:Number(num),globalNumber:a.number,text:clone.textContent.trim(),savedAt:new Date().toISOString()});
    save();decorateReaderTools();renderBookmarks();
  }
  function isBookmarked(num){prefs();return state.bookmarks.some(x=>x.id===`bookmark:${currentSurahNumber}:${num}`)}
  function decorateReaderTools(){
    applyFont();if(!currentAyahMap.size)return;
    document.querySelectorAll('#ayahs .ayah').forEach(node=>{
      const num=Number(node.querySelector('.an')?.textContent||0);if(!num)return;node.id=`ayah-${num}`;node.querySelector('.reader-tools')?.remove();
      const tools=document.createElement('div');tools.className='reader-tools';
      const mk=(txt,fn)=>{const b=document.createElement('button');b.className='smallbtn';b.textContent=txt;b.onclick=fn;return b};
      tools.append(
        mk('▶ استماع',()=>playAyah(num,false)),
        mk('📖 تفسير',()=>showDetail(num,prefs().tafsir,TAFSIRS.find(x=>x[0]===prefs().tafsir)?.[1]||'التفسير')),
        mk('معاني',()=>showDetail(num,'quran-wordbyword','معاني المفردات')),
        mk(isBookmarked(num)?'🔖 معلّمة':'🔖 علامة',()=>toggleBookmark(num))
      );node.appendChild(tools);
    });
  }
  window.renderBookmarks=function(){
    prefs();const box=document.getElementById('bookmarkList');if(!box)return;document.getElementById('bookmarkCount').textContent=`${state.bookmarks.length} علامة`;
    if(!state.bookmarks.length){box.innerHTML='<div class="card fav-empty">لا توجد علامات قراءة بعد. افتح المصحف واضغط «علامة» بجوار الآية.</div>';return}
    box.innerHTML=state.bookmarks.map(b=>`<div class="card bookmark-card"><div class="row"><b>${esc(b.surahName)} • الآية ${b.ayahNumber}</b><span class="badge">🔖</span></div><p class="dhikr">${esc(b.text)}</p><div class="row"><button class="smallbtn" data-open-bookmark="${esc(b.id)}">فتح</button><button class="smallbtn" data-remove-bookmark="${esc(b.id)}">إزالة</button></div></div>`).join('');
    box.querySelectorAll('[data-open-bookmark]').forEach(btn=>btn.onclick=async()=>{const b=state.bookmarks.find(x=>x.id===btn.dataset.openBookmark);if(!b)return;go('quran');await openSurah(b.surahNumber);setTimeout(()=>document.getElementById(`ayah-${b.ayahNumber}`)?.scrollIntoView({behavior:'smooth',block:'center'}),120)});
    box.querySelectorAll('[data-remove-bookmark]').forEach(btn=>btn.onclick=()=>{const i=state.bookmarks.findIndex(x=>x.id===btn.dataset.removeBookmark);if(i>=0){state.bookmarks.splice(i,1);save();renderBookmarks();toast('تم حذف العلامة')}});
  };

  const baseOpenSurah=openSurah;
  openSurah=async function(n){currentSurahNumber=Number(n);injectUI();await baseOpenSurah(n);applyFont();await loadAudioMap(n);decorateReaderTools()};
  const baseRenderState=renderState;
  renderState=function(){baseRenderState();prefs();applyFont();if(document.getElementById('bookmarks'))renderBookmarks()};
  injectUI();renderBookmarks();
})();