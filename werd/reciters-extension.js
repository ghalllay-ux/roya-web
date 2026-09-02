// Werd — requested reciters via MP3Quran (surah-level playback), preserving existing reciters.
(function(){
  const REQUESTED=['ياسر الدوسري','فارس عباد','سعد الغامدي','محمد أيوب','إبراهيم الأخضر','عبدالباسط عبدالصمد','محمد صديق المنشاوي','محمود علي البنا','شيخ أبو بكر الشاطري','أبو بكر الشاطري','هاني الرفاعي','ناصر القطامي','إدريس أبكر','خالد الجليل'];
  const ALIASES={
    'عبدالباسط عبدالصمد':['عبد الباسط عبد الصمد','عبدالباسط عبدالصمد'],
    'سعد الغامدي':['سعد الغامدي','سعد بن سعيد الغامدي'],
    'خالد الجليل':['خالد الجليل','خالد بن فهد الجليل'],
    'أبو بكر الشاطري':['شيخ أبو بكر الشاطري','أبو بكر الشاطري']
  };
  const audio=document.createElement('audio');audio.preload='metadata';audio.setAttribute('playsinline','');audio.setAttribute('webkit-playsinline','');audio.style.display='none';document.body.appendChild(audio);
  const records=new Map();let active=null,bound=false;
  const $=id=>document.getElementById(id), pad=n=>String(n).padStart(3,'0');
  const norm=s=>String(s||'').replace(/[\u064B-\u065F\u0670]/g,'').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/\s+/g,' ').trim();
  const wantedNames=()=>new Set(REQUESTED.flatMap(n=>[n,...(ALIASES[n]||[])]).map(norm));
  function pickMoshaf(r){return (r.moshaf||[]).find(m=>Number(m.surah_total)>=114)||(r.moshaf||[])[0]}
  function displayName(name){const n=norm(name);for(const req of REQUESTED){if([req,...(ALIASES[req]||[])].map(norm).includes(n))return req==='شيخ أبو بكر الشاطري'?'أبو بكر الشاطري':req}return name}
  async function loadReciters(){
    try{
      const res=await fetch('https://www.mp3quran.net/api/v3/reciters?language=ar',{cache:'no-store'});if(!res.ok)throw new Error(res.status);
      const data=await res.json(), wanted=wantedNames();
      (data.reciters||[]).forEach(r=>{if(!wanted.has(norm(r.name)))return;const m=pickMoshaf(r);if(!m?.server)return;const key='mp3quran:'+r.id;records.set(key,{key,name:displayName(r.name),server:m.server,surahs:new Set(String(m.surah_list||'').split(',').map(Number))})});
      injectOptions();
    }catch(e){console.warn('Werd MP3Quran reciters unavailable',e)}
  }
  function injectOptions(){const sel=$('listenReciter');if(!sel)return;const current=sel.value;[...records.values()].sort((a,b)=>a.name.localeCompare(b.name,'ar')).forEach(r=>{if(sel.querySelector(`option[value="${r.key}"]`))return;const o=document.createElement('option');o.value=r.key;o.textContent=r.name;sel.appendChild(o)});if(current)sel.value=current}
  function selected(){return records.get($('listenReciter')?.value)||null}
  function surah(){return Math.max(1,Math.min(114,Number($('listenSurah')?.value||1)))}
  function surahName(){const s=$('listenSurah');return s?.selectedOptions?.[0]?.textContent?.replace(/^\s*\d+\.\s*/,'')||`سورة ${surah()}`}
  function setStatus(t){if($('listenStatus'))$('listenStatus').textContent=t}
  function render(playing=false){const r=selected()||active;if(!r)return;const sn=surahName();if($('listenSurahTitle'))$('listenSurahTitle').textContent=sn;if($('listenNow'))$('listenNow').textContent=r.name;if($('miniTitle'))$('miniTitle').textContent=sn;if($('miniSub'))$('miniSub').textContent=r.name;['listenPlay','miniPlay'].forEach(id=>{if($(id))$(id).textContent=playing?'⏸':'▶'})}
  async function play(){const r=selected()||active;if(!r)return;active=r;const s=surah();if(r.surahs.size&&!r.surahs.has(s)){setStatus('هذه السورة غير متاحة لهذا القارئ');return}audio.src=r.server.replace(/\/?$/,'/')+pad(s)+'.mp3';window.werdListeningAudio=audio;audio.load();try{await audio.play();setStatus('يعمل الآن ▶');render(true);$('werdMiniPlayer')?.classList.add('show');document.body.classList.add('has-mini-player')}catch(e){setStatus('تعذر تشغيل الصوت');if(typeof toast==='function')toast('تعذر تشغيل تلاوة هذا القارئ') }}
  function stopOld(){try{const a=window.werdListeningAudio;if(a&&a!==audio)a.pause()}catch(_){} }
  function selectNew(e){const r=records.get(e.target.value);if(!r)return;e.stopImmediatePropagation();stopOld();active=r;audio.pause();audio.removeAttribute('src');try{if(window.state){state.listening=state.listening||{};state.listening.reciter=r.key;if(typeof save==='function')save()}}catch(_){}render(false);setStatus('جاهز')}
  function interceptPlay(e){if(!selected())return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();if(!audio.paused){audio.pause();render(false)}else play()}
  function interceptSurah(e){if(!selected())return;e.stopImmediatePropagation();audio.pause();render(false);setStatus('جاهز')}
  function nav(delta,e){if(!selected())return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();const s=$('listenSurah');if(!s)return;let n=surah()+delta;if(n<1)n=114;if(n>114)n=1;s.value=String(n);play()}
  function bind(){const sel=$('listenReciter');if(!sel){return}injectOptions();if(bound)return;bound=true;sel.addEventListener('change',selectNew,true);$('listenSurah')?.addEventListener('change',interceptSurah,true);$('listenPlay')?.addEventListener('click',interceptPlay,true);$('miniPlay')?.addEventListener('click',interceptPlay,true);$('listenNext')?.addEventListener('click',e=>nav(1,e),true);$('miniNext')?.addEventListener('click',e=>nav(1,e),true);$('listenPrev')?.addEventListener('click',e=>nav(-1,e),true);$('miniPrev')?.addEventListener('click',e=>nav(-1,e),true)}
  audio.addEventListener('play',()=>render(true));audio.addEventListener('pause',()=>render(false));audio.addEventListener('ended',()=>{const s=$('listenSurah');if(s){let n=surah()+1;if(n>114)n=1;s.value=String(n);play()}});audio.addEventListener('timeupdate',()=>{const d=audio.duration,c=audio.currentTime,p=Number.isFinite(d)&&d>0?c/d*100:0;if($('listenSeek'))$('listenSeek').value=String(p);if($('miniProgress'))$('miniProgress').style.width=p+'%'});
  const mo=new MutationObserver(()=>{injectOptions();if(!bound&&$('listenReciter'))bind()});mo.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{loadReciters();bind()});else{loadReciters();bind()}
})();