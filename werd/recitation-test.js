// Voice recitation test for Werd memorization review — enhanced v93
(function(){
  const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  const INTERVALS={1:1,2:3,3:7,4:14,5:30};
  const IS_IOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(/Macintosh/.test(navigator.userAgent)&&navigator.maxTouchPoints>1);
  let scope='due',session=[],index=0,recognition=null,listening=false,finalTranscript='',interimTranscript='',analysis=null,rated=false;
  let hintUsed=false,hintBusy=false,listenStartedAt=0,timerId=null,elapsedSec=0;
  let stats={scores:[],again:0,hard:0,good:0,easy:0,hints:0,near:0,exact:0,total:0,duration:0};

  function tracker(){
    if(!state.memorizationTracker||typeof state.memorizationTracker!=='object'||Array.isArray(state.memorizationTracker))state.memorizationTracker={};
    state.memorizationTracker={version:1,items:{},history:[],settings:{reminderEnabled:true,reminderTime:'19:30',dailyGoal:5},recitationHistory:[],...state.memorizationTracker};
    if(!state.memorizationTracker.items||typeof state.memorizationTracker.items!=='object'||Array.isArray(state.memorizationTracker.items))state.memorizationTracker.items={};
    if(!Array.isArray(state.memorizationTracker.history))state.memorizationTracker.history=[];
    if(!Array.isArray(state.memorizationTracker.recitationHistory))state.memorizationTracker.recitationHistory=[];
    return state.memorizationTracker;
  }
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function localDate(d=new Date()){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return`${y}-${m}-${day}`}
  function addDays(date,days){const d=new Date(`${date}T12:00:00`);d.setDate(d.getDate()+Number(days||0));return localDate(d)}
  function clamp(n){return Math.max(1,Math.min(5,Number(n)||1))}
  function allItems(){return Object.values(tracker().items).filter(x=>x&&!x.archived)}
  function dueItems(){const t=localDate();return allItems().filter(x=>String(x.nextReview||t)<=t)}
  function surahName(n){const list=(Array.isArray(window.surahs)&&surahs.length)?surahs:(window.fallbackSurahs||[]);return list.find(x=>Number(x.number)===Number(n))?.name||`سورة ${n}`}
  function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
  function fmtTime(sec){const s=Math.max(0,Number(sec)||0),m=Math.floor(s/60),r=s%60;return`${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}`}

  function injectStyles(){
    if(document.getElementById('werdRecitationStyle'))return;
    const s=document.createElement('style');s.id='werdRecitationStyle';s.textContent=`
      .rtest-hero{position:relative;overflow:hidden;background:linear-gradient(145deg,var(--green),#173f34);color:#fff;border-radius:26px;padding:20px;text-align:center;box-shadow:0 16px 36px rgba(19,62,49,.16)}
      .rtest-hero:after{content:"";position:absolute;width:150px;height:150px;border-radius:50%;background:rgba(255,255,255,.05);left:-55px;top:-65px}.rtest-hero small{opacity:.76}.rtest-title{font-size:21px;font-weight:900;margin:9px 0}.rtest-progress{height:8px;background:rgba(255,255,255,.16);border-radius:99px;overflow:hidden;margin-top:13px}.rtest-progress span{display:block;height:100%;background:#f0d39b;transition:width .3s}
      .rtest-scope{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.rtest-scope button.active{background:var(--green);color:#fff;border-color:var(--green)}.rtest-config{display:grid;grid-template-columns:1fr 1fr;gap:9px}.rtest-config select{width:100%;padding:11px;border:1px solid var(--line);border-radius:13px;background:var(--card);color:var(--ink)}
      .rtest-privacy{display:flex;gap:8px;align-items:flex-start;background:var(--sage);border-radius:14px;padding:11px;font-size:10px;line-height:1.7;color:var(--muted)}.rtest-privacy b{color:var(--ink)}
      .rtest-mic-wrap{position:relative;width:106px;height:106px;margin:auto;display:grid;place-items:center}.rtest-mic-ring{position:absolute;inset:0;border-radius:50%;border:1px solid rgba(45,103,81,.18)}.rtest-mic{position:relative;width:88px;height:88px;border-radius:50%;border:0;background:var(--green);color:#fff;font-size:31px;box-shadow:0 10px 30px rgba(0,0,0,.15);z-index:2}.rtest-mic.live{animation:rPulse 1.15s infinite}.rtest-time{font-variant-numeric:tabular-nums;font-weight:800;color:var(--green);margin-top:4px}
      .rtest-live{min-height:105px;padding:15px;border:1px dashed var(--line);border-radius:18px;line-height:1.95;text-align:center;background:linear-gradient(180deg,var(--card),rgba(124,153,126,.05))}.rtest-live .interim{opacity:.48}.rtest-session-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.rtest-session-actions .wide{grid-column:1/-1}
      .rtest-hint{display:none;margin-top:10px;padding:12px;border-radius:15px;background:rgba(190,143,75,.12);border:1px solid rgba(190,143,75,.28);font-size:14px;font-weight:800;line-height:1.9;text-align:center}.rtest-hint.show{display:block}
      .rtest-scorebox{display:flex;align-items:center;justify-content:space-between;gap:12px}.rtest-score{font-size:37px;font-weight:900;line-height:1}.rtest-verdict{display:inline-flex;margin-top:6px;padding:5px 9px;border-radius:999px;background:var(--sage);font-size:10px;font-weight:800}.rtest-legend{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}.rtest-legend span{font-size:9px;padding:5px 8px;border-radius:999px;border:1px solid var(--line)}
      .rtest-words{display:flex;flex-wrap:wrap;gap:6px;line-height:1.8}.rtest-word{border-radius:10px;padding:5px 8px;font-size:14px}.rtest-match{background:rgba(77,128,101,.16);border:1px solid rgba(77,128,101,.32)}.rtest-near{background:rgba(70,116,163,.11);border:1px solid rgba(70,116,163,.27)}.rtest-near small,.rtest-sub small,.rtest-miss small{display:block;color:var(--muted);font-size:8px}.rtest-miss{background:rgba(190,143,75,.14);border:1px solid rgba(190,143,75,.34)}.rtest-sub{background:rgba(170,83,73,.13);border:1px solid rgba(170,83,73,.28)}.rtest-extra{background:var(--sage);border-radius:12px;padding:9px;margin-top:10px;font-size:11px}
      .rtest-recommend{margin-top:11px;padding:11px;border-radius:14px;background:linear-gradient(135deg,rgba(77,128,101,.10),rgba(190,143,75,.08));border:1px solid var(--line);font-size:11px;line-height:1.7}.rtest-rate{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.rtest-rate button{font-size:10px;padding:9px 4px}.rtest-rate button.recommended{outline:2px solid rgba(30,85,68,.25);background:var(--sage);font-weight:900}
      .rtest-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.rtest-stat{background:var(--sage);padding:11px 6px;border-radius:15px;text-align:center}.rtest-stat b{display:block;font-size:19px}.rtest-stat small{font-size:9px}.rtest-note{font-size:10px;line-height:1.75;color:var(--muted)}
      @keyframes rPulse{50%{transform:scale(1.06);box-shadow:0 0 0 14px rgba(30,85,68,.08)}}
      @media(max-width:430px){.rtest-scope{grid-template-columns:1fr}.rtest-config{grid-template-columns:1fr}.rtest-rate{grid-template-columns:1fr 1fr}.rtest-summary{grid-template-columns:1fr 1fr}.rtest-session-actions{grid-template-columns:1fr}}
    `;document.head.appendChild(s)
  }

  function inject(){
    injectStyles();tracker();const main=document.querySelector('main');if(!main)return;
    if(!document.getElementById('recitationTest')){
      const sec=document.createElement('section');sec.className='page';sec.id='recitationTest';sec.innerHTML=`
        <div class="section-title"><h3>التسميع بالصوت</h3><button class="smallbtn" id="rtestBack">اختبار الحفظ</button></div>
        <div class="rtest-hero"><small id="rtestHeroSmall">تسميع ذكي ومقارنة كلمةً بكلمة</small><div class="rtest-title" id="rtestHeroTitle">اختر جلسة التسميع</div><div id="rtestCounter">—</div><div class="rtest-progress"><span id="rtestProgress" style="width:0"></span></div></div>
        <div class="card" id="rtestSetup" style="margin-top:10px">
          <b>نطاق التسميع</b>
          <div class="rtest-scope" style="margin-top:10px"><button class="smallbtn active" data-rscope="due">مستحق اليوم</button><button class="smallbtn" data-rscope="all">كل المحفوظ</button><button class="smallbtn" data-rscope="surah">سورة محددة</button></div>
          <div class="rtest-config" style="margin-top:10px"><div><div class="muted" style="margin-bottom:5px">عدد الآيات</div><select id="rtestCount"><option value="1">آية واحدة</option><option value="3" selected>3 آيات</option><option value="5">5 آيات</option><option value="10">10 آيات</option></select></div><div><div class="muted" style="margin-bottom:5px">ترتيب الجلسة</div><select id="rtestOrder"><option value="smart" selected>الأضعف أولًا</option><option value="random">عشوائي</option><option value="quran">ترتيب السورة والآية</option></select></div></div>
          <div style="margin-top:10px"><div class="muted" style="margin-bottom:5px">السورة</div><select id="rtestSurah" disabled style="width:100%;padding:11px;border:1px solid var(--line);border-radius:13px;background:var(--card);color:var(--ink)"></select></div>
          <div class="rtest-privacy" id="rtestSupport" style="margin-top:10px"><span>🔒</span><div>لا يحفظ «ورد» التسجيل الصوتي أو نص التسميع. تُحفظ فقط <b>النتيجة والتقييم</b> لتحديث خطة المراجعة.</div></div>
          <button class="primary" id="rtestStart" style="width:100%;margin-top:11px">ابدأ جلسة التسميع</button><div class="muted" id="rtestAvailable" style="text-align:center;margin-top:8px">—</div>
        </div>
        <div class="card" id="rtestSession" style="display:none;margin-top:10px">
          <div class="row"><div><b id="rtestPrompt">—</b><div class="muted">اقرأ الآية كاملة من حفظك. يمكنك طلب تلميح اختياري.</div></div><span>🎙</span></div>
          <div class="rtest-hint" id="rtestHint"></div>
          <div style="text-align:center;margin:14px 0"><div class="rtest-mic-wrap"><div class="rtest-mic-ring"></div><button class="rtest-mic" id="rtestMic" aria-label="بدء التسميع">🎙</button></div><div class="muted" id="rtestMicStatus">اضغط للبدء</div><div class="rtest-time" id="rtestTime">00:00</div></div>
          <div class="rtest-live" id="rtestLive"><span class="muted">سيظهر هنا النص الذي تعرّف عليه الجهاز من صوتك.</span></div>
          <div class="rtest-session-actions"><button class="secondary" id="rtestHintBtn" style="margin:0">💡 تلميح</button><button class="secondary" id="rtestRetry" style="margin:0" disabled>↺ إعادة التسميع</button><button class="primary wide" id="rtestAnalyze" style="margin:0" disabled>تحليل التسميع</button></div>
        </div>
        <div class="card" id="rtestAnalysis" style="display:none;margin-top:10px">
          <div class="rtest-scorebox"><div><b>نتيجة المقارنة</b><div class="muted" id="rtestScoreMeta">—</div><span class="rtest-verdict" id="rtestVerdict">—</span></div><div class="rtest-score" id="rtestScore">0٪</div></div>
          <div class="rtest-legend"><span>✓ مطابق</span><span>≈ قريب صوتيًا</span><span>! مختلف</span><span>− لم يُلتقط</span></div>
          <div style="margin-top:12px"><b style="font-size:12px">النص الصحيح ومواقع الاختلاف</b><div class="rtest-words" id="rtestWords" style="margin-top:8px"></div><div class="rtest-extra" id="rtestExtras" style="display:none"></div></div>
          <div class="rtest-recommend" id="rtestRecommend">—</div>
          <div class="rtest-note" style="margin-top:10px">هذه نتيجة تقديرية مبنية على تحويل الصوت إلى نص؛ قد يخطئ المتصفح في بعض الكلمات. لا يقيس «ورد» أحكام التجويد أو المخارج، ولا يغيّر مستوى إتقانك إلا بعد اختيارك أنت.</div>
          <div style="margin-top:13px"><b>قيّم تسميعك</b><div class="rtest-rate" style="margin-top:8px"><button class="smallbtn" data-rrate="again">↺ أعدها</button><button class="smallbtn" data-rrate="hard">◔ صعب</button><button class="smallbtn" data-rrate="good">✓ جيد</button><button class="smallbtn" data-rrate="easy">★ متقن</button></div></div>
          <button class="primary" id="rtestNext" disabled style="width:100%;margin-top:11px">التالي</button>
        </div>
        <div class="card" id="rtestDone" style="display:none;margin-top:10px;text-align:center"><div style="font-size:38px">🎙✓</div><h3 style="margin:5px 0">اكتملت جلسة التسميع</h3><div class="rtest-summary" style="margin-top:12px"><div class="rtest-stat"><b id="rtestAvg">0٪</b><small>متوسط الدقة</small></div><div class="rtest-stat"><b id="rtestStrong">0</b><small>جيد/متقن</small></div><div class="rtest-stat"><b id="rtestWeak">0</b><small>تحتاج تثبيت</small></div><div class="rtest-stat"><b id="rtestHints">0</b><small>تلميحات</small></div></div><div class="muted" id="rtestDoneMeta" style="margin-top:10px">—</div><div class="row" style="margin-top:12px"><button class="primary" id="rtestAgain" style="margin:0;flex:1">جلسة جديدة</button><button class="secondary" id="rtestWeakness" style="margin:0;flex:1">مواضع الضعف</button></div></div>
      `;main.appendChild(sec)
    }
    addEntries();wire();renderSetup()
  }

  function addEntries(){
    const mg=document.querySelector('#more .more-grid');if(mg&&!document.getElementById('moreRecitationTest')){const b=document.createElement('button');b.className='more-tile';b.id='moreRecitationTest';b.innerHTML='<span class="mi">🎙</span><b>التسميع بالصوت</b><small>تسميع ذكي وتحليل مواضع الاختلاف</small>';b.onclick=open;mg.insertBefore(b,mg.firstChild)}
    [['#memorizationTest .section-title','rtestFromTest','🎙 تسميع صوتي'],['#memorizationTracker .section-title','rtestFromTracker','🎙 تسميع'],['#memorization .section-title','rtestFromMem','🎙 تسميع']].forEach(([q,id,label])=>{const host=document.querySelector(q);if(host&&!document.getElementById(id)){const b=document.createElement('button');b.className='smallbtn';b.id=id;b.textContent=label;b.onclick=open;host.appendChild(b)}})
  }

  function wire(){
    const $=id=>document.getElementById(id);
    $('rtestBack').onclick=()=>{if(typeof window.openWerdMemorizationTest==='function')window.openWerdMemorizationTest();else if(typeof window.openWerdMemorizationTracker==='function')window.openWerdMemorizationTracker()};
    $('rtestStart').onclick=startSession;$('rtestMic').onclick=toggleMic;$('rtestHintBtn').onclick=showHint;$('rtestRetry').onclick=retry;$('rtestAnalyze').onclick=analyzeCurrent;$('rtestNext').onclick=next;$('rtestAgain').onclick=reset;
    $('rtestWeakness').onclick=()=>{if(typeof window.openWerdWeaknessAnalysis==='function')window.openWerdWeaknessAnalysis();else if(typeof window.openWerdMemorizationTracker==='function')window.openWerdMemorizationTracker()};
    $('rtestSurah').onchange=renderSetup;
    document.querySelectorAll('[data-rscope]').forEach(b=>b.onclick=()=>{scope=b.dataset.rscope;document.querySelectorAll('[data-rscope]').forEach(x=>x.classList.toggle('active',x.dataset.rscope===scope));$('rtestSurah').disabled=scope!=='surah';renderSetup()});
    document.querySelectorAll('[data-rrate]').forEach(b=>b.onclick=()=>rateCurrent(b.dataset.rrate))
  }

  function open(){stopMic();reset(false);go('recitationTest');renderSetup()} window.openWerdRecitationTest=open;
  function candidates(){let a=scope==='due'?dueItems():allItems();if(scope==='surah'){const s=Number(document.getElementById('rtestSurah')?.value||0);a=a.filter(x=>Number(x.surah)===s)}return a}
  function smartSort(a){const today=localDate();return a.sort((x,y)=>{const xd=String(x.nextReview||today),yd=String(y.nextReview||today);if(xd!==yd)return xd.localeCompare(yd);const xm=Number(x.mastery)||1,ym=Number(y.mastery)||1;if(xm!==ym)return xm-ym;return(Number(x.surah)||0)-(Number(y.surah)||0)||(Number(x.ayah)||0)-(Number(y.ayah)||0)})}
  function orderPool(pool){const mode=document.getElementById('rtestOrder')?.value||'smart';const a=pool.slice();if(mode==='random')return shuffle(a);if(mode==='quran')return a.sort((x,y)=>(Number(x.surah)||0)-(Number(y.surah)||0)||(Number(x.ayah)||0)-(Number(y.ayah)||0));return smartSort(a)}
  function renderSetup(){
    const sel=document.getElementById('rtestSurah');if(!sel)return;const prev=sel.value,map=new Map();allItems().forEach(x=>map.set(Number(x.surah),x.surahName||surahName(x.surah)));const ss=[...map.entries()].sort((a,b)=>a[0]-b[0]);sel.innerHTML=ss.length?ss.map(([n,name])=>`<option value="${n}">${n}. ${esc(name)}</option>`).join(''):'<option value="">لا توجد سور محفوظة</option>';if(prev&&ss.some(x=>String(x[0])===prev))sel.value=prev;
    const n=candidates().length;document.getElementById('rtestAvailable').textContent=scope==='due'?`${n} آية مستحقة متاحة للتسميع`:`${n} آية متاحة للتسميع`;
    const support=document.getElementById('rtestSupport'),start=document.getElementById('rtestStart');if(!SpeechRecognition){support.innerHTML='<span>⚠️</span><div><b>التعرف الصوتي غير مدعوم في هذا المتصفح.</b> استخدم «اختبار الحفظ» النصي بدلًا منه.</div>';start.disabled=true}else{support.innerHTML='<span>🔒</span><div>لا يحفظ «ورد» التسجيل الصوتي أو نص التسميع. تُحفظ فقط <b>النتيجة والتقييم</b>. وقد يستخدم المتصفح خدمة خارجية لتحويل الصوت إلى نص.</div>';start.disabled=!n}
  }

  function startSession(){
    const pool=candidates();if(!SpeechRecognition)return toast('التعرف الصوتي غير مدعوم على هذا المتصفح');if(!pool.length)return toast('لا توجد آيات في هذا النطاق');const count=Math.min(pool.length,Number(document.getElementById('rtestCount').value)||3);session=orderPool(pool).slice(0,count);index=0;stats={scores:[],again:0,hard:0,good:0,easy:0,hints:0,near:0,exact:0,total:0,duration:0};document.getElementById('rtestSetup').style.display='none';document.getElementById('rtestDone').style.display='none';document.getElementById('rtestSession').style.display='block';showQuestion()
  }
  function showQuestion(){
    stopMic();analysis=null;rated=false;hintUsed=false;hintBusy=false;finalTranscript='';interimTranscript='';elapsedSec=0;const x=session[index];if(!x)return finish();document.getElementById('rtestHeroSmall').textContent='اقرأ من حفظك';document.getElementById('rtestHeroTitle').textContent=`${x.surahName||surahName(x.surah)} • الآية ${x.ayah}`;document.getElementById('rtestPrompt').textContent=`${x.surahName||surahName(x.surah)} — الآية ${x.ayah}`;document.getElementById('rtestCounter').textContent=`${index+1} من ${session.length}`;document.getElementById('rtestProgress').style.width=`${Math.round(index/session.length*100)}%`;document.getElementById('rtestLive').innerHTML='<span class="muted">سيظهر هنا النص الذي تعرّف عليه الجهاز من صوتك.</span>';document.getElementById('rtestMicStatus').textContent='اضغط للبدء';document.getElementById('rtestTime').textContent='00:00';document.getElementById('rtestHint').classList.remove('show');document.getElementById('rtestHint').textContent='';document.getElementById('rtestHintBtn').disabled=false;document.getElementById('rtestHintBtn').textContent='💡 تلميح';document.getElementById('rtestRetry').disabled=true;document.getElementById('rtestAnalyze').disabled=true;document.getElementById('rtestAnalysis').style.display='none';document.getElementById('rtestSession').style.display='block';document.querySelectorAll('[data-rrate]').forEach(b=>{b.disabled=false;b.classList.remove('recommended')});document.getElementById('rtestNext').disabled=true;document.getElementById('rtestNext').textContent=index===session.length-1?'إنهاء الجلسة':'التالي'
  }

  function startTimer(){clearInterval(timerId);listenStartedAt=Date.now();timerId=setInterval(()=>{elapsedSec=Math.max(elapsedSec,Math.floor((Date.now()-listenStartedAt)/1000));const el=document.getElementById('rtestTime');if(el)el.textContent=fmtTime(elapsedSec)},500)}
  function stopTimer(){if(listenStartedAt)elapsedSec=Math.max(elapsedSec,Math.floor((Date.now()-listenStartedAt)/1000));listenStartedAt=0;clearInterval(timerId);timerId=null;const el=document.getElementById('rtestTime');if(el)el.textContent=fmtTime(elapsedSec)}
  function makeRecognition(){
    const r=new SpeechRecognition();r.lang='ar-SA';r.continuous=!IS_IOS;r.interimResults=true;r.maxAlternatives=3;
    r.onstart=()=>{listening=true;startTimer();document.getElementById('rtestMic').classList.add('live');document.getElementById('rtestMic').textContent='■';document.getElementById('rtestMicStatus').textContent='أستمع الآن… اضغط للإيقاف'};
    r.onresult=e=>{let interim='';for(let i=e.resultIndex;i<e.results.length;i++){const text=e.results[i][0]?.transcript||'';if(e.results[i].isFinal)finalTranscript+=(finalTranscript?' ':'')+text.trim();else interim+=text}interimTranscript=interim;renderTranscript()};
    r.onerror=e=>{console.warn('Speech recognition',e.error);if(e.error==='not-allowed'||e.error==='service-not-allowed')toast('اسمح للميكروفون لاستخدام التسميع الصوتي');else if(e.error==='network')toast('التعرف الصوتي يحتاج اتصالًا بالشبكة على هذا الجهاز');else if(e.error!=='aborted'&&e.error!=='no-speech')toast('تعذر التعرف على الصوت، حاول مرة أخرى')};
    r.onend=()=>{listening=false;stopTimer();const mic=document.getElementById('rtestMic');if(mic){mic.classList.remove('live');mic.textContent='🎙'}const has=finalTranscript.trim().length>0;if(document.getElementById('rtestMicStatus'))document.getElementById('rtestMicStatus').textContent=has?'تم التقاط التسميع ✓':'اضغط للبدء';if(document.getElementById('rtestRetry'))document.getElementById('rtestRetry').disabled=!has;if(document.getElementById('rtestAnalyze'))document.getElementById('rtestAnalyze').disabled=!has};return r
  }
  function toggleMic(){if(listening){stopMic();return}finalTranscript='';interimTranscript='';elapsedSec=0;renderTranscript();try{recognition=makeRecognition();recognition.start()}catch(e){console.error(e);toast('تعذر تشغيل الميكروفون')}}
  function stopMic(){if(recognition){try{recognition.stop()}catch(e){}recognition=null}listening=false;stopTimer();const mic=document.getElementById('rtestMic');if(mic){mic.classList.remove('live');mic.textContent='🎙'}}
  function retry(){stopMic();finalTranscript='';interimTranscript='';analysis=null;elapsedSec=0;document.getElementById('rtestTime').textContent='00:00';document.getElementById('rtestRetry').disabled=true;document.getElementById('rtestAnalyze').disabled=true;document.getElementById('rtestLive').innerHTML='<span class="muted">اضغط الميكروفون وأعد قراءة الآية.</span>';document.getElementById('rtestMicStatus').textContent='جاهز للإعادة'}
  function renderTranscript(){const box=document.getElementById('rtestLive');if(!box)return;const f=finalTranscript.trim(),i=interimTranscript.trim();box.innerHTML=(f?`<span>${esc(f)}</span>`:'')+(i?` <span class="interim">${esc(i)}</span>`:'')||'<span class="muted">أستمع…</span>'}

  function normalizeWord(v){return String(v||'').normalize('NFKD').replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g,'').replace(/ـ/g,'').replace(/[إأآٱ]/g,'ا').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/ى/g,'ي').replace(/[ۥۦ]/g,'').replace(/[^\u0621-\u063A\u0641-\u064A0-9]/g,'').trim()}
  function tokens(v){return String(v||'').split(/\s+/).map(raw=>({raw:raw.replace(/[۝۞﴿﴾]/g,''),norm:normalizeWord(raw)})).filter(x=>x.norm)}
  function levenshtein(a,b){const m=a.length,n=b.length;if(!m)return n;if(!n)return m;let prev=Array.from({length:n+1},(_,i)=>i);for(let i=1;i<=m;i++){const cur=[i];for(let j=1;j<=n;j++)cur[j]=Math.min(cur[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));prev=cur}return prev[n]}
  function wordKind(a,b){if(a===b)return'match';const max=Math.max(a.length,b.length),d=levenshtein(a,b);if(max>=5&&d===1)return'near';if(max>=7&&d/max<=.18)return'near';return'sub'}
  function align(expected,actual){
    const m=expected.length,n=actual.length,dp=Array.from({length:m+1},()=>Array(n+1).fill(0)),op=Array.from({length:m+1},()=>Array(n+1).fill(''));
    for(let i=1;i<=m;i++){dp[i][0]=i;op[i][0]='del'}for(let j=1;j<=n;j++){dp[0][j]=j;op[0][j]='ins'}
    for(let i=1;i<=m;i++)for(let j=1;j<=n;j++){const kind=wordKind(expected[i-1].norm,actual[j-1].norm),cost=kind==='match'?0:(kind==='near'?.45:1),sub=dp[i-1][j-1]+cost,del=dp[i-1][j]+1,ins=dp[i][j-1]+1,best=Math.min(sub,del,ins);dp[i][j]=best;op[i][j]=best===sub?kind:(best===del?'del':'ins')}
    let i=m,j=n,out=[];while(i>0||j>0){const k=op[i][j];if(k==='match'||k==='near'||k==='sub'){out.push({type:k,e:expected[i-1],a:actual[j-1]});i--;j--}else if(k==='del'){out.push({type:'del',e:expected[i-1]});i--}else{out.push({type:'ins',a:actual[j-1]});j--}}out.reverse();
    const exact=out.filter(x=>x.type==='match').length,near=out.filter(x=>x.type==='near').length,total=m,weighted=exact+near*.6,score=total?Math.round(weighted/total*100):0;return{out,exact,near,correct:exact,total,score,distance:dp[m][n]}
  }
  async function fetchAyah(x){const key=`${x.surah}:${x.ayah}`;window.__werdAyahTextCache=window.__werdAyahTextCache||new Map();if(window.__werdAyahTextCache.has(key))return window.__werdAyahTextCache.get(key);const r=await fetch(`${API_QURAN}/ayah/${x.surah}:${x.ayah}/quran-uthmani`);if(!r.ok)throw new Error('quran');const j=await r.json(),text=j?.data?.text;if(!text)throw new Error('quran');window.__werdAyahTextCache.set(key,text);return text}
  async function showHint(){if(hintUsed||hintBusy)return;hintBusy=true;const btn=document.getElementById('rtestHintBtn');btn.disabled=true;btn.textContent='جاري إظهار التلميح…';try{const text=await fetchAyah(session[index]),words=tokens(text).slice(0,2).map(x=>x.raw).join(' '),box=document.getElementById('rtestHint');box.textContent=`بداية الآية: ${words} …`;box.classList.add('show');hintUsed=true;stats.hints++;btn.textContent='تم استخدام التلميح ✓'}catch(e){console.error(e);btn.disabled=false;btn.textContent='💡 تلميح';toast('تعذر تحميل التلميح الآن')}finally{hintBusy=false}}

  async function analyzeCurrent(){if(!finalTranscript.trim())return toast('سجّل تسميعك أولًا');stopMic();const btn=document.getElementById('rtestAnalyze');btn.disabled=true;btn.textContent='جاري المقارنة…';try{const x=session[index],correctText=await fetchAyah(x);analysis=align(tokens(correctText),tokens(finalTranscript));analysis.correctText=correctText;analysis.hintUsed=hintUsed;analysis.durationSec=elapsedSec;renderAnalysis()}catch(e){console.error(e);toast('تعذر تحميل النص الصحيح للمقارنة');btn.disabled=false}finally{btn.textContent='تحليل التسميع'}}
  function verdict(score){if(score>=95)return'ممتاز';if(score>=85)return'جيد جدًا';if(score>=70)return'جيد';if(score>=55)return'يحتاج تثبيت';return'أعد المراجعة'}
  function recommendedRating(a){if(a.score>=96&&!a.hintUsed)return'easy';if(a.score>=84&&!a.hintUsed)return'good';if(a.score>=62)return'hard';return'again'}
  function ratingLabel(r){return{again:'أعدها',hard:'صعب',good:'جيد',easy:'متقن'}[r]||r}
  function renderAnalysis(){
    const a=analysis;if(!a)return;document.getElementById('rtestSession').style.display='none';document.getElementById('rtestAnalysis').style.display='block';document.getElementById('rtestProgress').style.width=`${Math.round((index+1)/session.length*100)}%`;document.getElementById('rtestScore').textContent=`${a.score}٪`;document.getElementById('rtestVerdict').textContent=verdict(a.score);
    const errs=a.out.filter(x=>x.type==='sub'||x.type==='del'),extras=a.out.filter(x=>x.type==='ins').map(x=>x.a.raw);document.getElementById('rtestScoreMeta').textContent=`${a.exact} مطابق • ${a.near} قريب • ${errs.length} يحتاج مراجعة`;
    document.getElementById('rtestWords').innerHTML=a.out.filter(x=>x.type!=='ins').map(x=>{if(x.type==='match')return`<span class="rtest-word rtest-match">${esc(x.e.raw)}</span>`;if(x.type==='near')return`<span class="rtest-word rtest-near">${esc(x.e.raw)}<small>سُمعت قريبًا: ${esc(x.a?.raw||'—')}</small></span>`;if(x.type==='del')return`<span class="rtest-word rtest-miss">${esc(x.e.raw)}<small>لم تُلتقط</small></span>`;return`<span class="rtest-word rtest-sub">${esc(x.e.raw)}<small>سُمعت: ${esc(x.a?.raw||'—')}</small></span>`}).join('');
    const ex=document.getElementById('rtestExtras');if(extras.length){ex.style.display='block';ex.innerHTML=`<b>كلمات إضافية التقطها الجهاز:</b> ${extras.map(esc).join(' • ')}`}else ex.style.display='none';
    const rec=recommendedRating(a);document.querySelectorAll('[data-rrate]').forEach(b=>b.classList.toggle('recommended',b.dataset.rrate===rec));document.getElementById('rtestRecommend').innerHTML=`اقتراح «ورد»: <b>${ratingLabel(rec)}</b>${a.hintUsed?' • لأنك استخدمت تلميحًا، خذ النتيجة كمؤشر للمراجعة لا كإتقان كامل.':''} • مدة التسميع ${fmtTime(a.durationSec)}.`
  }

  function rateCurrent(rating){
    if(!analysis||rated)return;const x=session[index],t=tracker(),id=x.id||`${x.surah}:${x.ayah}`,item=t.items[id];if(!item)return toast('تعذر العثور على الآية في سجل الحفظ');const before=clamp(item.mastery);let after=before,days=1,success=true;if(rating==='again'){after=1;days=1;success=false;item.lapses=(Number(item.lapses)||0)+1}else if(rating==='hard'){after=before;days=Math.max(1,Math.ceil((INTERVALS[after]||1)/2))}else if(rating==='good'){after=Math.min(5,before+1);days=INTERVALS[after]||7}else if(rating==='easy'){after=Math.min(5,before+2);days=Math.max(INTERVALS[after]||14,7)}
    const today=localDate();item.mastery=after;item.lastReviewed=new Date().toISOString();item.nextReview=addDays(today,days);item.reviewCount=(Number(item.reviewCount)||0)+1;if(success)item.successCount=(Number(item.successCount)||0)+1;
    t.history.unshift({at:new Date().toISOString(),date:today,id,surah:item.surah,ayah:item.ayah,rating,before,after,nextReview:item.nextReview,source:'voice-recitation'});if(t.history.length>500)t.history.length=500;
    t.recitationHistory.unshift({at:new Date().toISOString(),date:today,id,surah:item.surah,ayah:item.ayah,score:analysis.score,exact:analysis.exact,near:analysis.near,total:analysis.total,rating,hintUsed:!!analysis.hintUsed,durationSec:analysis.durationSec});if(t.recitationHistory.length>200)t.recitationHistory.length=200;
    stats.scores.push(analysis.score);stats[rating]=(stats[rating]||0)+1;stats.near+=analysis.near;stats.exact+=analysis.exact;stats.total+=analysis.total;stats.duration+=analysis.durationSec;rated=true;save();document.querySelectorAll('[data-rrate]').forEach(b=>b.disabled=true);document.getElementById('rtestNext').disabled=false;toast('تم حفظ تقييم التسميع ✓')
  }
  function next(){if(!rated)return;index++;if(index>=session.length)finish();else showQuestion()}
  function finish(){
    stopMic();document.getElementById('rtestSession').style.display='none';document.getElementById('rtestAnalysis').style.display='none';document.getElementById('rtestDone').style.display='block';document.getElementById('rtestHeroSmall').textContent='اكتملت الجلسة';document.getElementById('rtestHeroTitle').textContent='نتيجة التسميع';document.getElementById('rtestCounter').textContent=`${session.length} آية`;document.getElementById('rtestProgress').style.width='100%';const avg=stats.scores.length?Math.round(stats.scores.reduce((a,b)=>a+b,0)/stats.scores.length):0;document.getElementById('rtestAvg').textContent=`${avg}٪`;document.getElementById('rtestStrong').textContent=(stats.good||0)+(stats.easy||0);document.getElementById('rtestWeak').textContent=(stats.again||0)+(stats.hard||0);document.getElementById('rtestHints').textContent=stats.hints||0;document.getElementById('rtestDoneMeta').textContent=`${stats.exact} كلمة مطابقة • ${stats.near} قريبة صوتيًا • زمن التسميع ${fmtTime(stats.duration)}`
  }
  function reset(showSetup=true){
    stopMic();session=[];index=0;analysis=null;rated=false;hintUsed=false;hintBusy=false;finalTranscript='';interimTranscript='';elapsedSec=0;stats={scores:[],again:0,hard:0,good:0,easy:0,hints:0,near:0,exact:0,total:0,duration:0};if(document.getElementById('rtestSetup'))document.getElementById('rtestSetup').style.display='block';if(document.getElementById('rtestSession'))document.getElementById('rtestSession').style.display='none';if(document.getElementById('rtestAnalysis'))document.getElementById('rtestAnalysis').style.display='none';if(document.getElementById('rtestDone'))document.getElementById('rtestDone').style.display='none';if(document.getElementById('rtestHeroSmall'))document.getElementById('rtestHeroSmall').textContent='تسميع ذكي ومقارنة كلمةً بكلمة';if(document.getElementById('rtestHeroTitle'))document.getElementById('rtestHeroTitle').textContent='اختر جلسة التسميع';if(document.getElementById('rtestCounter'))document.getElementById('rtestCounter').textContent='—';if(document.getElementById('rtestProgress'))document.getElementById('rtestProgress').style.width='0';renderSetup()
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inject);else inject()
})();
