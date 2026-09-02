// Werd mini-player close control + expanded reciter library.
(function(){
  const EXTRA=[
    ['mp3:yasser','ياسر الدوسري'],
    ['mp3:farris','فارس عباد'],
    ['mp3:saad','سعد الغامدي'],
    ['mp3:ayyub','محمد أيوب'],
    ['mp3:akhdar','إبراهيم الأخضر'],
    ['mp3:abdulbasit','عبدالباسط عبدالصمد'],
    ['mp3:minshawi','محمد صديق المنشاوي'],
    ['mp3:banna','محمود علي البنا'],
    ['mp3:shatri','أبو بكر الشاطري'],
    ['mp3:rifai','هاني الرفاعي'],
    ['mp3:qattami','ناصر القطامي'],
    ['mp3:abkar','إدريس أبكر'],
    ['mp3:jaleel','خالد الجليل']
  ];
  const ALIASES={
    'mp3:yasser':['ياسر الدوسري','ياسر بن راشد الدوسري'],
    'mp3:farris':['فارس عباد'],
    'mp3:saad':['سعد الغامدي'],
    'mp3:ayyub':['محمد أيوب','محمد ايوب'],
    'mp3:akhdar':['إبراهيم الأخضر','ابراهيم الاخضر'],
    'mp3:abdulbasit':['عبد الباسط عبد الصمد','عبدالباسط عبدالصمد','عبد الباسط عبدالصمد'],
    'mp3:minshawi':['محمد صديق المنشاوي','محمد صديق المنشاوى','المنشاوي'],
    'mp3:banna':['محمود علي البنا','محمود على البنا'],
    'mp3:shatri':['أبو بكر الشاطري','شيخ أبو بكر الشاطري','ابو بكر الشاطري'],
    'mp3:rifai':['هاني الرفاعي','هانى الرفاعى'],
    'mp3:qattami':['ناصر القطامي','ناصر القطامى'],
    'mp3:abkar':['إدريس أبكر','ادريس ابكر'],
    'mp3:jaleel':['خالد الجليل']
  };
  const API='https://www.mp3quran.net/api/v3/reciters?language=ar';
  const mp3Audio=document.createElement('audio');
  mp3Audio.preload='metadata';mp3Audio.setAttribute('playsinline','');mp3Audio.setAttribute('webkit-playsinline','');
  mp3Audio.style.display='none';document.body.appendChild(mp3Audio);
  let catalog=null,currentServer='',currentReciterName='',currentSurah=1;
  const $=id=>document.getElementById(id);
  const norm=s=>String(s||'').normalize('NFKD').replace(/[\u064B-\u065F\u0670]/g,'').replace(/[إأآ]/g,'ا').replace(/ى/g,'ي').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/[^\u0621-\u064A0-9]/g,'').toLowerCase();
  const isExtra=()=>String($('listenReciter')?.value||'').startsWith('mp3:');
  function saveExtra(v){try{localStorage.setItem('werd_extra_reciter',v)}catch(_){} }
  function savedExtra(){try{return localStorage.getItem('werd_extra_reciter')||''}catch(_){return''}}
  async function getCatalog(){if(catalog)return catalog;const r=await fetch(API,{cache:'no-store'});if(!r.ok)throw new Error('mp3quran_http_'+r.status);const j=await r.json();catalog=Array.isArray(j.reciters)?j.reciters:[];return catalog}
  async function resolve(key){const list=await getCatalog(),aliases=ALIASES[key]||[];const wanted=aliases.map(norm);let rec=list.find(r=>wanted.includes(norm(r.name)));if(!rec)rec=list.find(r=>wanted.some(a=>norm(r.name).includes(a)||a.includes(norm(r.name))));if(!rec)throw new Error('reciter_not_found');const m=(rec.moshaf||[]).find(x=>String(x.surah_list||'').split(',').includes(String(currentSurah)))||(rec.moshaf||[])[0];if(!m?.server)throw new Error('reciter_no_server');currentServer=m.server.endsWith('/')?m.server:m.server+'/';currentReciterName=rec.name||EXTRA.find(x=>x[0]===key)?.[1]||'القارئ';return m}
  function source(){return currentServer+String(currentSurah).padStart(3,'0')+'.mp3'}
  function showMini(show=true){const m=$('werdMiniPlayer');if(m)m.classList.toggle('show',show);document.body.classList.toggle('has-mini-player',show)}
  function render(playing){const sel=$('listenSurah'),sn=sel?.selectedOptions?.[0]?.textContent?.replace(/^\s*\d+\.\s*/,'')||`سورة ${currentSurah}`;if($('listenSurahTitle'))$('listenSurahTitle').textContent=sn;if($('listenNow'))$('listenNow').textContent=`تلاوة كاملة • ${currentReciterName||EXTRA.find(x=>x[0]===$('listenReciter')?.value)?.[1]||'القارئ'}`;if($('miniTitle'))$('miniTitle').textContent=sn;if($('miniSub'))$('miniSub').textContent=currentReciterName||'التلاوة';['listenPlay','miniPlay'].forEach(id=>{const b=$(id);if(b)b.textContent=playing?'⏸':'▶'});}
  async function playExtra(fromGesture=true){if(!isExtra())return;try{window.werdListeningAudio?.pause?.()}catch(_){};currentSurah=Math.max(1,Math.min(114,Number($('listenSurah')?.value||currentSurah||1)));const key=$('listenReciter').value;saveExtra(key);const st=$('listenStatus');if(st)st.textContent='جاري تجهيز التلاوة…';await resolve(key);mp3Audio.src=source();mp3Audio.playbackRate=Number(window.state?.listening?.speed)||1;const p=mp3Audio.play();if(p&&p.then)await p;window.werdListeningAudio=mp3Audio;render(true);showMini(true);if(st)st.textContent='يعمل الآن ▶'}catch(e){console.warn(e);const st=$('listenStatus');if(st)st.textContent='تعذر تشغيل القارئ';try{toast('تعذر تحميل تلاوة هذا القارئ الآن')}catch(_){} }}
  function toggleExtra(){if(!isExtra())return;if(!mp3Audio.paused){mp3Audio.pause();render(false)}else if(mp3Audio.src){mp3Audio.play().then(()=>render(true)).catch(()=>playExtra())}else playExtra()}
  function moveSurah(step){if(!isExtra())return;const sel=$('listenSurah');currentSurah=Math.max(1,Math.min(114,Number(sel?.value||currentSurah||1)+step));if(sel)sel.value=String(currentSurah);mp3Audio.pause();mp3Audio.removeAttribute('src');currentServer='';playExtra()}
  function stopAndClose(e){if(e){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation?.()}try{window.werdListeningAudio?.pause?.()}catch(_){}try{mp3Audio.pause();mp3Audio.removeAttribute('src');mp3Audio.load()}catch(_){}const mini=$('werdMiniPlayer');if(mini)mini.classList.remove('show');document.body.classList.remove('has-mini-player');['listenPlay','miniPlay'].forEach(id=>{const b=$(id);if(b)b.textContent='▶'});const status=$('listenStatus');if(status)status.textContent='متوقف'}
  function addOptions(){const sel=$('listenReciter');if(!sel)return;EXTRA.forEach(([v,n])=>{if(!sel.querySelector(`option[value="${v}"]`)){const o=document.createElement('option');o.value=v;o.textContent=n;sel.appendChild(o)}});const sv=savedExtra();if(sv&&sel.querySelector(`option[value="${sv}"]`)&&!sel.dataset.extraRestored){sel.dataset.extraRestored='1';sel.value=sv}}
  function installClose(){const mini=$('werdMiniPlayer');if(!mini)return;let close=$('miniClose');if(!close){close=document.createElement('button');close.id='miniClose';close.type='button';close.className='mini-close';close.setAttribute('aria-label','إغلاق مشغل الاستماع');close.title='إغلاق';close.textContent='×';mini.appendChild(close)}if(!close.dataset.bound){close.dataset.bound='1';close.addEventListener('click',stopAndClose,true);close.addEventListener('touchend',stopAndClose,{capture:true,passive:false})}if(!$('miniCloseStyle')){const s=document.createElement('style');s.id='miniCloseStyle';s.textContent='.mini-player{padding-inline-start:44px!important}.mini-player .mini-close{position:absolute!important;inset-inline-start:8px!important;top:8px!important;width:30px!important;height:30px!important;border-radius:50%!important;background:rgba(255,255,255,.16)!important;color:#fff!important;font-size:23px!important;line-height:28px!important;display:grid!important;place-items:center!important;z-index:3!important}';document.head.appendChild(s)}}
  function install(){addOptions();installClose()}
  document.addEventListener('change',e=>{if(e.target?.id==='listenReciter'&&String(e.target.value).startsWith('mp3:')){e.stopImmediatePropagation();e.stopPropagation();saveExtra(e.target.value);try{window.werdListeningAudio?.pause?.()}catch(_){};mp3Audio.pause();mp3Audio.removeAttribute('src');currentServer='';currentReciterName=e.target.selectedOptions?.[0]?.textContent||'';const st=$('listenStatus');if(st)st.textContent='جاهز';render(false)}else if(e.target?.id==='listenSurah'&&isExtra()){e.stopImmediatePropagation();e.stopPropagation();currentSurah=Number(e.target.value)||1;mp3Audio.pause();mp3Audio.removeAttribute('src');currentServer='';playExtra()}},true);
  document.addEventListener('click',e=>{if(!isExtra())return;const t=e.target?.closest?.('button,[data-listen-surah]');if(!t)return;if(t.id==='listenPlay'||t.id==='miniPlay'){e.preventDefault();e.stopImmediatePropagation();toggleExtra()}else if(t.id==='listenNext'||t.id==='miniNext'){e.preventDefault();e.stopImmediatePropagation();moveSurah(1)}else if(t.id==='listenPrev'||t.id==='miniPrev'){e.preventDefault();e.stopImmediatePropagation();moveSurah(-1)}else if(t.dataset?.listenSurah){e.preventDefault();e.stopImmediatePropagation();const sel=$('listenSurah');currentSurah=Number(t.dataset.listenSurah)||1;if(sel)sel.value=String(currentSurah);mp3Audio.pause();mp3Audio.removeAttribute('src');currentServer='';playExtra()}},true);
  mp3Audio.addEventListener('play',()=>render(true));mp3Audio.addEventListener('pause',()=>render(false));mp3Audio.addEventListener('ended',()=>moveSurah(1));mp3Audio.addEventListener('timeupdate',()=>{const d=mp3Audio.duration,c=mp3Audio.currentTime,p=Number.isFinite(d)&&d>0?c/d*100:0;if($('listenSeek'))$('listenSeek').value=String(p);if($('listenCurrent'))$('listenCurrent').textContent=fmt(c);if($('listenDuration'))$('listenDuration').textContent=fmt(d);if($('miniProgress'))$('miniProgress').style.width=p+'%'});
  function fmt(x){if(!Number.isFinite(x))return'0:00';x=Math.max(0,Math.floor(x));return`${Math.floor(x/60)}:${String(x%60).padStart(2,'0')}`}
  const mo=new MutationObserver(install);mo.observe(document.documentElement,{childList:true,subtree:true});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();