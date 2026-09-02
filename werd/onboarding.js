// First-run onboarding for Werd
(function(){
  const VERSION=1;
  const RECITERS=[
    ['ar.alafasy','مشاري العفاسي'],
    ['ar.abdurrahmaansudais','عبدالرحمن السديس'],
    ['ar.mahermuaiqly','ماهر المعيقلي'],
    ['ar.husary','محمود خليل الحصري']
  ];
  let step=0,locating=false,notifyBusy=false;
  const draft={goal:Number(state.goal)||20,reciter:state.readerPrefs?.reciter||'ar.alafasy',theme:state.dark?'dark':'light',location:false,notifications:false};

  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function completed(){return Number(state.onboarding?.version||0)>=VERSION&&!!state.onboarding?.completed}
  function ensurePrefs(){
    if(!state.readerPrefs||typeof state.readerPrefs!=='object')state.readerPrefs={};
    state.readerPrefs={fontSize:26,reciter:'ar.alafasy',tafsir:'ar.muyassar',...state.readerPrefs};
    if(!state.listening||typeof state.listening!=='object')state.listening={};
    state.listening={reciter:'ar.alafasy',speed:1,lastSurah:1,lastSurahName:'الفاتحة',lastAyah:1,...state.listening};
  }
  function hasLocation(){try{return !!JSON.parse(localStorage.getItem('werd_prayer_location')||'null')}catch(e){return false}}

  function injectStyles(){
    if(document.getElementById('werdOnboardingStyle'))return;
    const s=document.createElement('style');s.id='werdOnboardingStyle';s.textContent=`
      .onb{position:fixed;inset:0;z-index:10050;background:var(--bg);color:var(--ink);display:flex;flex-direction:column;overflow:auto;padding:max(16px,env(safe-area-inset-top)) 16px max(18px,env(safe-area-inset-bottom));font-family:inherit}
      .onb[hidden]{display:none}.onb-shell{width:min(620px,100%);margin:auto;display:flex;flex-direction:column;min-height:min(720px,calc(100dvh - 32px))}.onb-top{display:flex;align-items:center;justify-content:space-between;gap:12px}.onb-brand{display:flex;align-items:center;gap:10px}.onb-logo{width:44px;height:44px;border-radius:15px;background:var(--green);color:#f6e5bd;display:grid;place-items:center;font-weight:900;box-shadow:var(--shadow)}
      .onb-skip{border:0;background:transparent;color:var(--muted);padding:10px;font-weight:800}.onb-progress{display:flex;gap:6px;margin:19px 0 5px}.onb-dot{height:5px;flex:1;border-radius:99px;background:var(--line)}.onb-dot.on{background:var(--green)}
      .onb-body{flex:1;display:flex;flex-direction:column;justify-content:center;padding:22px 0}.onb-emoji{font-size:54px;margin-bottom:16px}.onb-body h2{font-size:30px;margin:0 0 10px;line-height:1.35}.onb-lead{color:var(--muted);line-height:1.9;margin:0 0 22px}.onb-card{border:1px solid var(--line);background:var(--card);border-radius:22px;padding:16px;box-shadow:var(--shadow)}
      .onb-options{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.onb-option{border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:18px;padding:15px;text-align:right;min-height:84px}.onb-option.active{border:2px solid var(--green);background:var(--sage)}.onb-option b{display:block;font-size:16px}.onb-option small{display:block;color:var(--muted);margin-top:5px;line-height:1.5}
      .onb-goal{font-size:32px;font-weight:900;color:var(--green)}.onb-range{width:100%;accent-color:var(--green);margin:15px 0}.onb-status{display:flex;align-items:center;gap:10px;margin-top:12px;padding:12px;border-radius:15px;background:var(--sage);font-size:13px;line-height:1.6}.onb-status.bad{background:color-mix(in srgb,#d56b6b 12%,var(--card))}.onb-status .os-icon{font-size:20px}
      .onb-permission{width:100%;border:0;background:var(--green);color:#fff;border-radius:16px;padding:13px 15px;font-weight:900;margin-top:12px}.onb-permission.secondary{background:var(--card);color:var(--green);border:1px solid var(--line)}
      .onb-footer{display:grid;grid-template-columns:1fr 1.6fr;gap:9px;padding-top:14px}.onb-footer button{border-radius:16px;padding:14px;font-weight:900}.onb-back{border:1px solid var(--line);background:var(--card);color:var(--ink)}.onb-next{border:0;background:var(--green);color:#fff}.onb-next:disabled{opacity:.5}
      .onb-summary{display:grid;gap:9px}.onb-summary-row{display:flex;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid var(--line)}.onb-summary-row:last-child{border-bottom:0}.onb-summary-row span:last-child{color:var(--green);font-weight:900}
      body.onboarding-open{overflow:hidden}@media(max-width:360px){.onb-options{grid-template-columns:1fr}.onb-body h2{font-size:26px}}
    `;document.head.appendChild(s);
  }

  function inject(){
    injectStyles();if(document.getElementById('werdOnboarding'))return;
    const el=document.createElement('div');el.className='onb';el.id='werdOnboarding';el.hidden=true;el.innerHTML=`
      <div class="onb-shell">
        <div class="onb-top"><div class="onb-brand"><div class="onb-logo">ورد</div><div><b>إعداد ورد</b><div class="muted">بداية تناسب يومك</div></div></div><button class="onb-skip" id="onbSkip">تخطي</button></div>
        <div class="onb-progress" id="onbProgress"></div><div class="onb-body" id="onbBody"></div>
        <div class="onb-footer"><button class="onb-back" id="onbBack">السابق</button><button class="onb-next" id="onbNext">التالي</button></div>
      </div>`;document.body.appendChild(el);
    document.getElementById('onbSkip').onclick=()=>finish(true);
    document.getElementById('onbBack').onclick=()=>{if(step>0){step--;render()}};
    document.getElementById('onbNext').onclick=()=>{if(step<5){step++;render()}else finish(false)};
    addSettingsEntry();
  }

  function addSettingsEntry(){
    const page=document.getElementById('settings');if(!page||document.getElementById('reopenOnboarding'))return;
    const cards=page.querySelectorAll('.card');const target=cards[cards.length-1]||page;const row=document.createElement('div');row.className='settings-row';row.innerHTML='<div><b>إعداد البداية</b><div class="muted">الهدف والقارئ والمظهر والصلاحيات</div></div><button class="smallbtn" id="reopenOnboarding">إعادة الإعداد</button>';target.appendChild(row);document.getElementById('reopenOnboarding').onclick=()=>open(true);
  }

  function progress(){document.getElementById('onbProgress').innerHTML=Array.from({length:6},(_,i)=>`<span class="onb-dot ${i<=step?'on':''}"></span>`).join('')}
  function render(){
    progress();const body=document.getElementById('onbBody'),back=document.getElementById('onbBack'),next=document.getElementById('onbNext');back.style.visibility=step===0?'hidden':'visible';next.textContent=step===5?'ابدأ مع ورد':'التالي';next.disabled=false;
    if(step===0)body.innerHTML=`<div class="onb-emoji">🌿</div><h2>أهلًا بك في ورد</h2><p class="onb-lead">سنجهز التطبيق في أقل من دقيقة ليصبح مناسبًا لقراءتك وأذكارك وصلاتك. يمكنك تغيير كل هذه الخيارات لاحقًا من الإعدادات.</p><div class="onb-card"><b>ما الذي سيُضبط؟</b><div class="muted" style="line-height:2;margin-top:8px">وردك اليومي • القارئ المفضل • المظهر • مواقيت الصلاة • التنبيهات</div></div>`;
    if(step===1)renderGoal(body);
    if(step===2)renderReciter(body);
    if(step===3)renderTheme(body);
    if(step===4)renderLocation(body);
    if(step===5)renderNotifications(body);
  }

  function renderGoal(body){
    body.innerHTML=`<div class="onb-emoji">📖</div><h2>كم تريد أن تقرأ يوميًا؟</h2><p class="onb-lead">اختر هدفًا واقعيًا. يمكنك تعديله في أي وقت.</p><div class="onb-card"><div class="row"><b>الهدف اليومي</b><span class="onb-goal"><span id="onbGoalValue">${draft.goal}</span> صفحة</span></div><input class="onb-range" id="onbGoalRange" type="range" min="5" max="60" step="5" value="${draft.goal}"><div class="onb-options"><button class="onb-option" data-goal="5"><b>5 صفحات</b><small>بداية خفيفة</small></button><button class="onb-option" data-goal="10"><b>10 صفحات</b><small>ورد يومي متوازن</small></button><button class="onb-option" data-goal="20"><b>20 صفحة</b><small>نحو ختمة شهرية</small></button><button class="onb-option" data-goal="30"><b>30 صفحة</b><small>وتيرة أعلى</small></button></div></div>`;
    const range=document.getElementById('onbGoalRange');range.oninput=()=>{draft.goal=Number(range.value);document.getElementById('onbGoalValue').textContent=draft.goal;paintGoals()};document.querySelectorAll('[data-goal]').forEach(b=>b.onclick=()=>{draft.goal=Number(b.dataset.goal);range.value=draft.goal;document.getElementById('onbGoalValue').textContent=draft.goal;paintGoals()});paintGoals();
  }
  function paintGoals(){document.querySelectorAll('[data-goal]').forEach(b=>b.classList.toggle('active',Number(b.dataset.goal)===draft.goal))}

  function renderReciter(body){
    body.innerHTML=`<div class="onb-emoji">🎧</div><h2>اختر قارئك المفضل</h2><p class="onb-lead">سنستخدمه افتراضيًا في قارئ المصحف وشاشة الاستماع.</p><div class="onb-options">${RECITERS.map(r=>`<button class="onb-option ${draft.reciter===r[0]?'active':''}" data-reciter="${r[0]}"><b>${r[1]}</b><small>تلاوة القرآن</small></button>`).join('')}</div>`;
    document.querySelectorAll('[data-reciter]').forEach(b=>b.onclick=()=>{draft.reciter=b.dataset.reciter;document.querySelectorAll('[data-reciter]').forEach(x=>x.classList.toggle('active',x===b))});
  }

  function renderTheme(body){
    body.innerHTML=`<div class="onb-emoji">◐</div><h2>اختر المظهر المريح لك</h2><p class="onb-lead">يمكنك التبديل لاحقًا من أي وقت.</p><div class="onb-options"><button class="onb-option ${draft.theme==='light'?'active':''}" data-theme="light"><b>☀️ فاتح</b><small>هادئ وواضح للنهار</small></button><button class="onb-option ${draft.theme==='dark'?'active':''}" data-theme="dark"><b>🌙 داكن</b><small>مريح للقراءة ليلًا</small></button></div>`;
    document.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>{draft.theme=b.dataset.theme;document.querySelectorAll('[data-theme]').forEach(x=>x.classList.toggle('active',x===b));previewTheme()});
  }
  function previewTheme(){document.body.classList.toggle('dark',draft.theme==='dark')}

  function renderLocation(body){
    const loc=hasLocation();draft.location=loc||draft.location;
    body.innerHTML=`<div class="onb-emoji">🕌</div><h2>مواقيت الصلاة والقبلة</h2><p class="onb-lead">يمكن لورد استخدام موقع جهازك لحساب المواقيت واتجاه القبلة. لن نطلب الموقع إلا عند ضغطك على الزر.</p><div class="onb-card"><b>خصوصية الموقع</b><div class="muted" style="line-height:1.8;margin-top:6px">يُحفظ الموقع على جهازك. وعند تفعيل تنبيهات الصلاة تُستخدم إحداثيات تقريبية لحساب وقت التنبيه.</div><button class="onb-permission" id="onbLocate">${loc?'✓ الموقع محفوظ':'استخدام موقعي'}</button><div id="onbLocationStatus">${loc?'<div class="onb-status"><span class="os-icon">✓</span><span>تم إعداد موقع مواقيت الصلاة.</span></div>':''}</div></div>`;
    document.getElementById('onbLocate').onclick=requestLocation;
  }

  function requestLocation(){
    if(locating)return;locating=true;const btn=document.getElementById('onbLocate'),status=document.getElementById('onbLocationStatus');btn.disabled=true;btn.textContent='جاري تحديد الموقع…';status.innerHTML='<div class="onb-status"><span class="os-icon">⌖</span><span>بانتظار إذن الموقع من الجهاز…</span></div>';
    const before=localStorage.getItem('werd_prayer_location');const prayerBtn=document.getElementById('locatePrayerBtn');
    if(prayerBtn){prayerBtn.click();let tries=0;const timer=setInterval(()=>{tries++;const now=localStorage.getItem('werd_prayer_location');if(now&&now!==before){clearInterval(timer);locationSuccess()}else if(tries>24){clearInterval(timer);locationCheckFallback()}},500);return}
    locationCheckFallback();
  }
  function locationCheckFallback(){
    if(hasLocation()){locationSuccess();return}if(!navigator.geolocation){locationFail('تحديد الموقع غير مدعوم على هذا الجهاز.');return}
    navigator.geolocation.getCurrentPosition(p=>{const loc={latitude:p.coords.latitude,longitude:p.coords.longitude,accuracy:p.coords.accuracy,updatedAt:new Date().toISOString()};localStorage.setItem('werd_prayer_location',JSON.stringify(loc));locationSuccess()},()=>locationFail('لم يتم السماح بالموقع. يمكنك إعداده لاحقًا من صفحة الصلاة.'),{enableHighAccuracy:true,timeout:12000,maximumAge:300000});
  }
  function locationSuccess(){locating=false;draft.location=true;const btn=document.getElementById('onbLocate'),status=document.getElementById('onbLocationStatus');if(btn){btn.disabled=false;btn.textContent='✓ الموقع محفوظ'}if(status)status.innerHTML='<div class="onb-status"><span class="os-icon">✓</span><span>تم حفظ موقع مواقيت الصلاة والقبلة.</span></div>';const label=document.getElementById('prayerLocationLabel');try{const l=JSON.parse(localStorage.getItem('werd_prayer_location')||'null');if(label&&l)label.textContent=`${Number(l.latitude).toFixed(3)}, ${Number(l.longitude).toFixed(3)}`}catch(e){}}
  function locationFail(msg){locating=false;const btn=document.getElementById('onbLocate'),status=document.getElementById('onbLocationStatus');if(btn){btn.disabled=false;btn.textContent='المحاولة مجددًا'}if(status)status.innerHTML=`<div class="onb-status bad"><span class="os-icon">!</span><span>${esc(msg)}</span></div>`}

  function renderNotifications(body){
    const permission=('Notification'in window)?Notification.permission:'unsupported';draft.notifications=permission==='granted'||draft.notifications;
    body.innerHTML=`<div class="onb-emoji">🔔</div><h2>ابقَ قريبًا من وردك</h2><p class="onb-lead">فعّل التنبيهات لتذكيرك بالأذكار والورد. يمكنك تعديل الأوقات وتنبيهات الصلاة لاحقًا.</p><div class="onb-card"><div class="onb-summary"><div class="onb-summary-row"><span>هدف الورد</span><span>${draft.goal} صفحة</span></div><div class="onb-summary-row"><span>القارئ</span><span>${esc(RECITERS.find(r=>r[0]===draft.reciter)?.[1]||'مشاري العفاسي')}</span></div><div class="onb-summary-row"><span>المظهر</span><span>${draft.theme==='dark'?'داكن':'فاتح'}</span></div><div class="onb-summary-row"><span>موقع الصلاة</span><span>${hasLocation()?'معدّ ✓':'لاحقًا'}</span></div></div><button class="onb-permission" id="onbNotify">${draft.notifications?'✓ التنبيهات مفعلة':'تفعيل التنبيهات'}</button><div id="onbNotifyStatus">${draft.notifications?'<div class="onb-status"><span class="os-icon">✓</span><span>التنبيهات مفعلة على هذا الجهاز.</span></div>':''}</div></div>`;
    document.getElementById('onbNotify').onclick=enableNotifications;
  }

  async function enableNotifications(){
    if(notifyBusy)return;notifyBusy=true;const btn=document.getElementById('onbNotify'),status=document.getElementById('onbNotifyStatus');btn.disabled=true;btn.textContent='جاري التفعيل…';status.innerHTML='<div class="onb-status"><span class="os-icon">🔔</span><span>قد يطلب الجهاز السماح بالإشعارات.</span></div>';
    try{
      if(typeof enableWerdPush==='function')await enableWerdPush();
      else if('Notification'in window){const p=await Notification.requestPermission();if(p!=='granted')throw new Error('denied')}
      draft.notifications=('Notification'in window&&Notification.permission==='granted')||draft.notifications;
      if(draft.notifications){btn.textContent='✓ التنبيهات مفعلة';status.innerHTML='<div class="onb-status"><span class="os-icon">✓</span><span>تم تفعيل تنبيهات ورد على هذا الجهاز.</span></div>'}else{btn.textContent='المحاولة مجددًا';status.innerHTML='<div class="onb-status bad"><span class="os-icon">!</span><span>لم تُفعّل الإشعارات. يمكنك تفعيلها لاحقًا من إعدادات التنبيهات.</span></div>'}
    }catch(e){btn.textContent='المحاولة مجددًا';status.innerHTML='<div class="onb-status bad"><span class="os-icon">!</span><span>تعذر تفعيل التنبيهات الآن. على iPhone قد تحتاج أولًا إلى تثبيت ورد على الشاشة الرئيسية.</span></div>'}finally{btn.disabled=false;notifyBusy=false}
  }

  function applyDraft(){
    ensurePrefs();state.goal=Math.max(5,Math.min(100,Number(draft.goal)||20));state.readerPrefs.reciter=draft.reciter;state.listening.reciter=draft.reciter;state.dark=draft.theme==='dark';state.onboarding={completed:true,version:VERSION,completedAt:new Date().toISOString(),goal:state.goal,reciter:draft.reciter,theme:draft.theme,locationConfigured:hasLocation(),notificationsEnabled:('Notification'in window&&Notification.permission==='granted')};
  }

  function finish(skipped){
    if(skipped){state.onboarding={completed:true,version:VERSION,completedAt:new Date().toISOString(),skipped:true}}else applyDraft();
    save();close();toast(skipped?'تم تخطي إعداد البداية • يمكنك تشغيله من الإعدادات':'تم تجهيز ورد لك ✓');setTimeout(()=>{try{if(typeof syncNow==='function'&&cloudUser)syncNow(false)}catch(e){}},250);
  }

  function open(force=false){
    if(!force&&completed())return;ensurePrefs();draft.goal=Number(state.goal)||20;draft.reciter=state.readerPrefs.reciter||'ar.alafasy';draft.theme=state.dark?'dark':'light';draft.location=hasLocation();draft.notifications=('Notification'in window&&Notification.permission==='granted');step=0;const el=document.getElementById('werdOnboarding');if(!el)return;el.hidden=false;document.body.classList.add('onboarding-open');render();
  }
  function close(){const el=document.getElementById('werdOnboarding');if(el)el.hidden=true;document.body.classList.remove('onboarding-open');document.body.classList.toggle('dark',!!state.dark)}

  window.openWerdOnboarding=()=>open(true);
  inject();
  setTimeout(()=>{addSettingsEntry();if(!completed())open(false)},900);
})();
