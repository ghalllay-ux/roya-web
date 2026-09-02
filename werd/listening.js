// Full listening experience for Werd
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
  const SPEEDS=[0.75,1,1.25,1.5,2];
  const audio=new Audio();
  audio.preload='metadata';
  let currentSurah=1,currentSurahName='الفاتحة',queue=[],index=0,sleepTimer=null,sleepEndsAt=0,loading=false;
  window.werdListeningAudio=audio;

  function prefs(){
    if(!state.listening||typeof state.listening!=='object')state.listening={};
    state.listening={reciter:'ar.alafasy',speed:1,lastSurah:1,lastSurahName:'الفاتحة',lastAyah:1,...state.listening};
    return state.listening;
  }
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function fmt(sec){if(!Number.isFinite(sec)||sec<0)return'0:00';sec=Math.floor(sec);return`${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`}

  function injectStyles(){
    if(document.getElementById('werdListeningStyle'))return;
    const s=document.createElement('style');s.id='werdListeningStyle';s.textContent=`
      .listen-hero{text-align:center;padding:22px}.listen-cover{width:116px;height:116px;border-radius:28px;margin:0 auto 14px;background:linear-gradient(145deg,var(--green),#0a3f31);display:grid;place-items:center;color:#f7ead0;font-size:38px;box-shadow:var(--shadow)}
      .listen-selects{display:grid;grid-template-columns:1fr 1fr;gap:8px}.listen-select{width:100%;border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:14px;padding:11px}
      .listen-main-actions{display:flex;justify-content:center;align-items:center;gap:10px;margin:18px 0}.listen-round{width:48px;height:48px;border-radius:50%;border:1px solid var(--line);background:var(--card);color:var(--ink);font-size:20px}.listen-round.primary-play{width:66px;height:66px;background:var(--green);color:white;border:0;font-size:26px}
      .listen-range{width:100%;accent-color:var(--green)}.listen-meta{display:flex;justify-content:space-between;font-size:12px;color:var(--muted)}
      .listen-speed{display:flex;gap:7px;overflow:auto;padding-bottom:4px}.listen-speed button.active{background:var(--green);color:white;border-color:var(--green)}
      .listen-surah{cursor:pointer}.listen-surah.playing{background:var(--sage);border-radius:14px;padding-inline:8px}
      .mini-player{position:fixed;z-index:19;left:50%;transform:translateX(-50%);bottom:70px;width:min(516px,calc(100% - 20px));background:rgba(20,79,62,.97);color:white;border-radius:18px;padding:10px 12px;box-shadow:0 14px 35px rgba(0,0,0,.22);display:none;align-items:center;gap:10px;backdrop-filter:blur(14px)}
      .mini-player.show{display:flex}.mini-player .mini-grow{flex:1;min-width:0}.mini-player b,.mini-player small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mini-player small{opacity:.8;margin-top:2px}.mini-player button{border:0;background:rgba(255,255,255,.12);color:white;border-radius:12px;width:38px;height:38px}.mini-progress{height:3px;background:rgba(255,255,255,.22);border-radius:9px;margin-top:6px;overflow:hidden}.mini-progress span{display:block;height:100%;background:#f2d8a0;width:0%}
      .sleep-note{font-size:12px;color:var(--muted);margin-top:8px;text-align:center}
      body.has-mini-player .app{padding-bottom:150px}
    `;document.head.appendChild(s);
  }

  function surahOptions(){
    const list=(Array.isArray(surahs)&&surahs.length)?surahs:fallbackSurahs;
    return list.map(s=>`<option value="${s.number}">${s.number}. ${esc(s.name)}</option>`).join('');
  }

  function injectUI(){
    injectStyles();prefs();
    const main=document.querySelector('main');if(!main)return;
    if(!document.getElementById('listening')){
      const sec=document.createElement('section');sec.className='page';sec.id='listening';
      sec.innerHTML=`
        <div class="section-title"><h3>الاستماع</h3><span id="listenStatus">جاهز</span></div>
        <div class="card listen-hero">
          <div class="listen-cover">🎧</div><b id="listenSurahTitle">سورة الفاتحة</b><div class="muted" id="listenNow">اختر السورة والقارئ</div>
          <div class="listen-main-actions"><button class="listen-round" id="listenPrev">⏮</button><button class="listen-round primary-play" id="listenPlay">▶</button><button class="listen-round" id="listenNext">⏭</button></div>
          <input class="listen-range" type="range" id="listenSeek" min="0" max="100" value="0"><div class="listen-meta"><span id="listenCurrent">0:00</span><span id="listenDuration">0:00</span></div>
        </div>
        <div class="card"><div class="listen-selects"><select class="listen-select" id="listenReciter">${RECITERS.map(r=>`<option value="${r[0]}">${r[1]}</option>`).join('')}</select><select class="listen-select" id="listenSurah">${surahOptions()}</select></div></div>
        <div class="card"><b>سرعة التشغيل</b><div class="listen-speed" id="listenSpeeds" style="margin-top:10px">${SPEEDS.map(x=>`<button class="chip" data-speed="${x}">${x}×</button>`).join('')}</div></div>
        <div class="card"><div class="row"><b>مؤقت إيقاف التلاوة</b><span class="badge" id="sleepStatus">متوقف</span></div><div class="listen-speed" style="margin-top:10px"><button class="chip" data-sleep="5">5 دقائق</button><button class="chip" data-sleep="10">10 دقائق</button><button class="chip" data-sleep="15">15 دقيقة</button><button class="chip" data-sleep="30">30 دقيقة</button><button class="chip" data-sleep="0">إلغاء</button></div><div class="sleep-note" id="sleepNote">يمكنك التنقل داخل التطبيق وسيستمر المشغل.</div></div>
        <div class="section-title"><h3>السور</h3><span>114 سورة</span></div><div class="card" id="listenSurahList"></div>`;
      main.appendChild(sec);
    }
    if(!document.getElementById('werdMiniPlayer')){
      const mini=document.createElement('div');mini.className='mini-player';mini.id='werdMiniPlayer';mini.innerHTML=`<button id="miniPrev">⏮</button><button id="miniPlay">▶</button><div class="mini-grow"><b id="miniTitle">ورد</b><small id="miniSub">الاستماع</small><div class="mini-progress"><span id="miniProgress"></span></div></div><button id="miniNext">⏭</button>`;document.body.appendChild(mini);
    }
    const grid=document.querySelector('#home .grid');
    if(grid&&!document.getElementById('listenTile')){const t=document.createElement('div');t.className='tile';t.id='listenTile';t.innerHTML='<div class="em">🎧</div><b>الاستماع</b>';t.onclick=()=>{refreshSurahControls();go('listening')};grid.appendChild(t)}
    wireUI();refreshSurahControls();renderSurahList();applySpeed(prefs().speed,false);
  }

  function wireUI(){
    const $=id=>document.getElementById(id);
    if($('listenPlay'))$('listenPlay').onclick=togglePlay;
    if($('listenPrev'))$('listenPrev').onclick=previousTrack;
    if($('listenNext'))$('listenNext').onclick=nextTrack;
    if($('miniPlay'))$('miniPlay').onclick=togglePlay;
    if($('miniPrev'))$('miniPrev').onclick=previousTrack;
    if($('miniNext'))$('miniNext').onclick=nextTrack;
    if($('listenReciter')){$('listenReciter').value=prefs().reciter;$('listenReciter').onchange=async e=>{prefs().reciter=e.target.value;save();await loadSurah(currentSurah,false);toast('تم تغيير القارئ ✓')}}
    if($('listenSurah')){$('listenSurah').value=String(prefs().lastSurah||1);$('listenSurah').onchange=e=>loadSurah(Number(e.target.value),true)}
    document.querySelectorAll('#listenSpeeds [data-speed]').forEach(b=>b.onclick=()=>applySpeed(Number(b.dataset.speed),true));
    document.querySelectorAll('[data-sleep]').forEach(b=>b.onclick=()=>setSleep(Number(b.dataset.sleep)));
    if($('listenSeek'))$('listenSeek').oninput=e=>{if(Number.isFinite(audio.duration)&&audio.duration>0)audio.currentTime=audio.duration*(Number(e.target.value)/100)};
  }

  function refreshSurahControls(){
    const sel=document.getElementById('listenSurah');if(sel){sel.innerHTML=surahOptions();sel.value=String(prefs().lastSurah||currentSurah||1)}
    renderSurahList();
  }
  function renderSurahList(){
    const box=document.getElementById('listenSurahList');if(!box)return;const list=(Array.isArray(surahs)&&surahs.length)?surahs:fallbackSurahs;
    box.innerHTML=list.map(s=>`<div class="surah listen-surah${Number(s.number)===Number(currentSurah)?' playing':''}" data-listen-surah="${s.number}"><div class="num">${s.number}</div><div class="grow"><b>${esc(s.name)}</b><small>${s.numberOfAyahs||''} آية</small></div><span>▶</span></div>`).join('');
    box.querySelectorAll('[data-listen-surah]').forEach(n=>n.onclick=()=>loadSurah(Number(n.dataset.listenSurah),true));
  }

  async function loadSurah(n,autoplay=false){
    if(loading)return;loading=true;currentSurah=Number(n);const s=((Array.isArray(surahs)&&surahs.length)?surahs:fallbackSurahs).find(x=>Number(x.number)===currentSurah);currentSurahName=s?.name||`سورة ${currentSurah}`;
    setStatus('تحميل التلاوة…');
    try{
      const r=await fetch(`${API_QURAN}/surah/${currentSurah}/${encodeURIComponent(prefs().reciter)}`);if(!r.ok)throw new Error('audio');const j=await r.json();
      queue=(j.data?.ayahs||[]).map(a=>({surah:currentSurah,surahName:j.data?.name||currentSurahName,ayah:Number(a.numberInSurah),audio:a.audio||a.audioSecondary?.[0]||''})).filter(x=>x.audio);
      if(!queue.length)throw new Error('empty');index=0;prefs().lastSurah=currentSurah;prefs().lastSurahName=j.data?.name||currentSurahName;prefs().lastAyah=1;save();
      const sel=document.getElementById('listenSurah');if(sel)sel.value=String(currentSurah);renderSurahList();updateTitles();setStatus('جاهز');if(autoplay)await playIndex(0);
    }catch(e){console.error(e);queue=[];setStatus('تعذر تحميل التلاوة');toast('تعذر تحميل صوت السورة الآن')}
    finally{loading=false}
  }

  async function ensureQueue(){if(!queue.length||Number(queue[0]?.surah)!==Number(currentSurah))await loadSurah(currentSurah,false);return queue.length>0}
  async function playIndex(i){
    if(!(await ensureQueue()))return;i=Math.max(0,Math.min(queue.length-1,Number(i)));index=i;const item=queue[index];
    audio.src=item.audio;audio.playbackRate=Number(prefs().speed)||1;prefs().lastSurah=item.surah;prefs().lastSurahName=item.surahName;prefs().lastAyah=item.ayah;save();updateTitles();showMini(true);
    try{await audio.play();setStatus('يعمل الآن ▶');updatePlayButtons(true);updateMediaSession(item)}catch(e){console.error(e);toast('تعذر تشغيل الصوت')}
  }
  async function togglePlay(){if(audio.src&&!audio.paused){audio.pause();return}if(audio.src&&audio.paused){try{await audio.play();updatePlayButtons(true);showMini(true)}catch(e){};return}currentSurah=Number(prefs().lastSurah||1);await loadSurah(currentSurah,false);if(queue.length){const saved=Math.max(1,Number(prefs().lastAyah)||1);const i=Math.max(0,queue.findIndex(x=>x.ayah===saved));await playIndex(i)}}
  async function nextTrack(){if(queue.length&&index<queue.length-1)return playIndex(index+1);const next=currentSurah>=114?1:currentSurah+1;await loadSurah(next,true)}
  async function previousTrack(){if(audio.currentTime>5){audio.currentTime=0;return}if(queue.length&&index>0)return playIndex(index-1);const prev=currentSurah<=1?114:currentSurah-1;await loadSurah(prev,false);if(queue.length)await playIndex(queue.length-1)}

  function applySpeed(speed,notify=true){prefs().speed=Number(speed)||1;audio.playbackRate=prefs().speed;save();document.querySelectorAll('#listenSpeeds [data-speed]').forEach(b=>b.classList.toggle('active',Number(b.dataset.speed)===prefs().speed));if(notify)toast(`سرعة التشغيل ${prefs().speed}×`)}
  function setSleep(minutes){if(sleepTimer)clearTimeout(sleepTimer);sleepTimer=null;sleepEndsAt=0;if(minutes>0){sleepEndsAt=Date.now()+minutes*60000;sleepTimer=setTimeout(()=>{audio.pause();sleepTimer=null;sleepEndsAt=0;updateSleep();toast('تم إيقاف التلاوة حسب المؤقت')},minutes*60000)}updateSleep();toast(minutes?`سيتم إيقاف التلاوة بعد ${minutes} دقيقة`:'تم إلغاء مؤقت الإيقاف')}
  function updateSleep(){const badge=document.getElementById('sleepStatus'),note=document.getElementById('sleepNote');if(!badge)return;if(!sleepEndsAt){badge.textContent='متوقف';if(note)note.textContent='يمكنك التنقل داخل التطبيق وسيستمر المشغل.';return}const mins=Math.max(1,Math.ceil((sleepEndsAt-Date.now())/60000));badge.textContent=`${mins} د`;if(note)note.textContent=`سيتم إيقاف التلاوة تلقائيًا بعد نحو ${mins} دقيقة.`}

  function setStatus(t){const x=document.getElementById('listenStatus');if(x)x.textContent=t}
  function updateTitles(){const item=queue[index];const name=item?.surahName||prefs().lastSurahName||currentSurahName;const ayah=item?.ayah||prefs().lastAyah||1;const title=document.getElementById('listenSurahTitle'),now=document.getElementById('listenNow'),mt=document.getElementById('miniTitle'),ms=document.getElementById('miniSub');if(title)title.textContent=name;if(now)now.textContent=`الآية ${ayah} • ${RECITERS.find(r=>r[0]===prefs().reciter)?.[1]||'القارئ'}`;if(mt)mt.textContent=name;if(ms)ms.textContent=`الآية ${ayah} • ${RECITERS.find(r=>r[0]===prefs().reciter)?.[1]||''}`}
  function updatePlayButtons(playing){const a=document.getElementById('listenPlay'),b=document.getElementById('miniPlay');if(a)a.textContent=playing?'⏸':'▶';if(b)b.textContent=playing?'⏸':'▶'}
  function showMini(show){const m=document.getElementById('werdMiniPlayer');if(!m)return;m.classList.toggle('show',show);document.body.classList.toggle('has-mini-player',show)}

  audio.addEventListener('play',()=>{updatePlayButtons(true);showMini(true);setStatus('يعمل الآن ▶')});
  audio.addEventListener('pause',()=>{updatePlayButtons(false);if(!audio.ended)setStatus('متوقف')});
  audio.addEventListener('ended',()=>nextTrack());
  audio.addEventListener('timeupdate',()=>{const pct=(audio.duration&&Number.isFinite(audio.duration))?(audio.currentTime/audio.duration*100):0;const seek=document.getElementById('listenSeek'),mini=document.getElementById('miniProgress'),cur=document.getElementById('listenCurrent'),dur=document.getElementById('listenDuration');if(seek&&!seek.matches(':active'))seek.value=String(pct);if(mini)mini.style.width=pct+'%';if(cur)cur.textContent=fmt(audio.currentTime);if(dur)dur.textContent=fmt(audio.duration)});
  audio.addEventListener('error',()=>{setStatus('خطأ في الصوت');if(audio.src)toast('تعذر تشغيل هذا المقطع')});
  setInterval(updateSleep,30000);

  function updateMediaSession(item){
    if(!('mediaSession'in navigator))return;
    try{navigator.mediaSession.metadata=new MediaMetadata({title:item.surahName,artist:RECITERS.find(r=>r[0]===prefs().reciter)?.[1]||'ورد',album:`الآية ${item.ayah} • ورد`});navigator.mediaSession.setActionHandler('play',()=>audio.play());navigator.mediaSession.setActionHandler('pause',()=>audio.pause());navigator.mediaSession.setActionHandler('nexttrack',nextTrack);navigator.mediaSession.setActionHandler('previoustrack',previousTrack)}catch(e){console.warn(e)}
  }

  const baseInitQuran=initQuran;initQuran=async function(){await baseInitQuran();refreshSurahControls()};
  const baseRenderState=renderState;renderState=function(){baseRenderState();prefs();applySpeed(prefs().speed,false);updateTitles()};
  injectUI();
  currentSurah=Number(prefs().lastSurah||1);currentSurahName=prefs().lastSurahName||'الفاتحة';updateTitles();
})();
