// Werd mini-player close control + direct MP3Quran reciters for reliable iPhone playback.
(function(){
  const EXTRA=[
    ['mp3:yasser','ياسر الدوسري','https://server11.mp3quran.net/yasser/'],
    ['mp3:farris','فارس عباد','https://server8.mp3quran.net/frs_a/'],
    ['mp3:saad','سعد الغامدي','https://server7.mp3quran.net/s_gmd/'],
    ['mp3:ayyub','محمد أيوب','https://server8.mp3quran.net/ayyub/'],
    ['mp3:akhdar','إبراهيم الأخضر','https://server6.mp3quran.net/akdr/'],
    ['mp3:abdulbasit','عبدالباسط عبدالصمد','https://server7.mp3quran.net/basit/'],
    ['mp3:minshawi','محمد صديق المنشاوي','https://server10.mp3quran.net/minsh/'],
    ['mp3:banna','محمود علي البنا','https://server8.mp3quran.net/bna/'],
    ['mp3:shatri','أبو بكر الشاطري','https://server11.mp3quran.net/shatri/'],
    ['mp3:rifai','هاني الرفاعي','https://server8.mp3quran.net/hani/'],
    ['mp3:qattami','ناصر القطامي','https://server6.mp3quran.net/qtm/'],
    ['mp3:abkar','إدريس أبكر','https://server6.mp3quran.net/abkr/'],
    ['mp3:jaleel','خالد الجليل','https://server10.mp3quran.net/jleel/']
  ];
  const MAP=Object.fromEntries(EXTRA.map(x=>[x[0],{name:x[1],server:x[2]}]));
  const mp3Audio=document.createElement('audio');
  mp3Audio.preload='metadata';mp3Audio.setAttribute('playsinline','');mp3Audio.setAttribute('webkit-playsinline','');mp3Audio.style.display='none';
  document.documentElement.appendChild(mp3Audio);
  let currentSurah=1,currentReciterName='';
  const $=id=>document.getElementById(id);
  const isExtra=()=>!!MAP[$('listenReciter')?.value];
  function saveExtra(v){try{localStorage.setItem('werd_extra_reciter',v)}catch(_){} }
  function savedExtra(){try{return localStorage.getItem('werd_extra_reciter')||''}catch(_){return''}}
  function source(){const rec=MAP[$('listenReciter')?.value];return rec?rec.server+String(currentSurah).padStart(3,'0')+'.mp3':''}
  function showMini(show=true){const m=$('werdMiniPlayer');if(m)m.classList.toggle('show',show);document.body.classList.toggle('has-mini-player',show)}
  function render(playing){const sel=$('listenSurah'),sn=sel?.selectedOptions?.[0]?.textContent?.replace(/^\s*\d+\.\s*/,'')||`سورة ${currentSurah}`;if($('listenSurahTitle'))$('listenSurahTitle').textContent=sn;if($('listenNow'))$('listenNow').textContent=`تلاوة كاملة • ${currentReciterName||'القارئ'}`;if($('miniTitle'))$('miniTitle').textContent=sn;if($('miniSub'))$('miniSub').textContent=currentReciterName||'التلاوة';['listenPlay','miniPlay'].forEach(id=>{const b=$(id);if(b)b.textContent=playing?'⏸':'▶'});}
  function prepare(){if(!isExtra())return false;currentSurah=Math.max(1,Math.min(114,Number($('listenSurah')?.value||1)));const key=$('listenReciter').value,rec=MAP[key];currentReciterName=rec.name;saveExtra(key);const src=source();if(mp3Audio.src!==src){mp3Audio.src=src;mp3Audio.load()}return true}
  function playExtra(){if(!prepare())return;try{if(window.werdListeningAudio&&window.werdListeningAudio!==mp3Audio)window.werdListeningAudio.pause?.()}catch(_){};mp3Audio.playbackRate=Number(window.state?.listening?.speed)||1;window.werdListeningAudio=mp3Audio;const st=$('listenStatus');if(st)st.textContent='جاري التشغيل…';const p=mp3Audio.play();if(p?.then)p.then(()=>{render(true);showMini(true);if(st)st.textContent='يعمل الآن ▶'}).catch(e=>{console.warn('direct mp3 play failed',e,mp3Audio.src);render(false);if(st)st.textContent='تعذر تشغيل الصوت';try{toast('تعذر تشغيل التلاوة. تحقق من الاتصال ثم أعد المحاولة')}catch(_){}})}
  function toggleExtra(){if(!isExtra())return;if(!mp3Audio.paused){mp3Audio.pause();render(false)}else playExtra()}
  function moveSurah(step){if(!isExtra())return;const sel=$('listenSurah');currentSurah=Number(sel?.value||1)+step;if(currentSurah<1)currentSurah=114;if(currentSurah>114)currentSurah=1;if(sel)sel.value=String(currentSurah);mp3Audio.pause();mp3Audio.removeAttribute('src');playExtra()}
  function stopAndClose(e){if(e){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation?.()}try{window.werdListeningAudio?.pause?.()}catch(_){}try{mp3Audio.pause();mp3Audio.removeAttribute('src');mp3Audio.load()}catch(_){}const mini=$('werdMiniPlayer');if(mini)mini.classList.remove('show');document.body.classList.remove('has-mini-player');['listenPlay','miniPlay'].forEach(id=>{const b=$(id);if(b)b.textContent='▶'});const status=$('listenStatus');if(status)status.textContent='متوقف'}
  function addOptions(){const sel=$('listenReciter');if(!sel)return;[...sel.querySelectorAll('option')].forEach(o=>{if(String(o.value).startsWith('mp3quran:'))o.remove()});EXTRA.forEach(([v,n])=>{if(!sel.querySelector(`option[value="${v}"]`)){const o=document.createElement('option');o.value=v;o.textContent=n;sel.appendChild(o)}});const sv=savedExtra();if(sv&&MAP[sv]&&sel.querySelector(`option[value="${sv}"]`)&&!sel.dataset.extraRestored){sel.dataset.extraRestored='1';sel.value=sv;currentReciterName=MAP[sv].name;render(false)}}
  function installClose(){const mini=$('werdMiniPlayer');if(!mini)return;let close=$('miniClose');if(!close){close=document.createElement('button');close.id='miniClose';close.type='button';close.className='mini-close';close.setAttribute('aria-label','إغلاق مشغل الاستماع');close.title='إغلاق';close.textContent='×';mini.appendChild(close)}if(!close.dataset.bound){close.dataset.bound='1';close.addEventListener('click',stopAndClose,true);close.addEventListener('touchend',stopAndClose,{capture:true,passive:false})}if(!$('miniCloseStyle')){const s=document.createElement('style');s.id='miniCloseStyle';s.textContent='.mini-player{padding-inline-start:44px!important}.mini-player .mini-close{position:absolute!important;inset-inline-start:8px!important;top:8px!important;width:30px!important;height:30px!important;border-radius:50%!important;background:rgba(255,255,255,.16)!important;color:#fff!important;font-size:23px!important;line-height:28px!important;display:grid!important;place-items:center!important;z-index:3!important}';document.head.appendChild(s)}}
  function install(){addOptions();installClose()}
  document.addEventListener('change',e=>{if(e.target?.id==='listenReciter'&&MAP[e.target.value]){e.stopImmediatePropagation();e.stopPropagation();try{window.werdListeningAudio?.pause?.()}catch(_){};mp3Audio.pause();mp3Audio.removeAttribute('src');currentReciterName=MAP[e.target.value].name;saveExtra(e.target.value);currentSurah=Number($('listenSurah')?.value||1);prepare();render(false);const st=$('listenStatus');if(st)st.textContent='جاهز'}else if(e.target?.id==='listenSurah'&&isExtra()){e.stopImmediatePropagation();e.stopPropagation();currentSurah=Number(e.target.value)||1;mp3Audio.pause();mp3Audio.removeAttribute('src');prepare();render(false);const st=$('listenStatus');if(st)st.textContent='جاهز'}},true);
  document.addEventListener('click',e=>{if(!isExtra())return;const t=e.target?.closest?.('button,[data-listen-surah]');if(!t)return;if(t.id==='listenPlay'||t.id==='miniPlay'){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();toggleExtra()}else if(t.id==='listenNext'||t.id==='miniNext'){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();moveSurah(1)}else if(t.id==='listenPrev'||t.id==='miniPrev'){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();moveSurah(-1)}else if(t.dataset?.listenSurah){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();const sel=$('listenSurah');currentSurah=Number(t.dataset.listenSurah)||1;if(sel)sel.value=String(currentSurah);mp3Audio.pause();mp3Audio.removeAttribute('src');playExtra()}},true);
  document.addEventListener('input',e=>{if(e.target?.id==='listenSeek'&&isExtra()&&Number.isFinite(mp3Audio.duration)&&mp3Audio.duration>0){e.stopImmediatePropagation();mp3Audio.currentTime=mp3Audio.duration*(Number(e.target.value)/100)}},true);
  document.addEventListener('click',e=>{const b=e.target?.closest?.('#listenSpeeds [data-speed]');if(!b||!isExtra())return;const speed=Number(b.dataset.speed)||1;mp3Audio.playbackRate=speed},true);
  mp3Audio.addEventListener('play',()=>render(true));mp3Audio.addEventListener('pause',()=>render(false));mp3Audio.addEventListener('ended',()=>moveSurah(1));mp3Audio.addEventListener('timeupdate',()=>{const d=mp3Audio.duration,c=mp3Audio.currentTime,p=Number.isFinite(d)&&d>0?c/d*100:0;if($('listenSeek'))$('listenSeek').value=String(p);if($('listenCurrent'))$('listenCurrent').textContent=fmt(c);if($('listenDuration'))$('listenDuration').textContent=fmt(d);if($('miniProgress'))$('miniProgress').style.width=p+'%'});
  mp3Audio.addEventListener('error',()=>{const st=$('listenStatus');if(st&&isExtra())st.textContent='تعذر تحميل ملف التلاوة'});
  function fmt(x){if(!Number.isFinite(x))return'0:00';x=Math.max(0,Math.floor(x));return`${Math.floor(x/60)}:${String(x%60).padStart(2,'0')}`}
  const mo=new MutationObserver(install);mo.observe(document.documentElement,{childList:true,subtree:true});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();