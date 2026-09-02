// Prayer times, Qibla and Hijri calendar for Werd
(function(){
  const ALADHAN='https://api.aladhan.com/v1';
  const PRAYERS=[['Fajr','الفجر','🌅'],['Sunrise','الشروق','☀️'],['Dhuhr','الظهر','🌤️'],['Asr','العصر','🌥️'],['Maghrib','المغرب','🌇'],['Isha','العشاء','🌙']];
  const METHODS=[
    [4,'أم القرى - مكة المكرمة'],[3,'رابطة العالم الإسلامي'],[8,'منطقة الخليج'],[9,'الكويت'],[10,'قطر'],[5,'الهيئة المصرية العامة للمساحة'],[2,'الجمعية الإسلامية لأمريكا الشمالية']
  ];
  let timings=null,qiblaDirection=null,countdownTimer=null,orientationHandler=null;

  function cfg(){
    if(!state.prayer||typeof state.prayer!=='object')state.prayer={};
    state.prayer={method:4,school:0,alerts:false,...state.prayer};
    return state.prayer;
  }
  function getLocalLocation(){
    try{return JSON.parse(localStorage.getItem('werd_prayer_location')||'null')}catch(e){return null}
  }
  function saveLocalLocation(loc){localStorage.setItem('werd_prayer_location',JSON.stringify(loc))}
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function cleanTime(v){return String(v||'').match(/^\d{1,2}:\d{2}/)?.[0]||'--:--'}
  function format12(t){
    const m=String(t||'').match(/^(\d{1,2}):(\d{2})/);if(!m)return'--:--';let h=Number(m[1]),min=m[2],ap=h>=12?'م':'ص';h=h%12||12;return`${h}:${min} ${ap}`
  }

  function injectStyles(){
    if(document.getElementById('werdPrayerStyle'))return;
    const s=document.createElement('style');s.id='werdPrayerStyle';s.textContent=`
      .prayer-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}.prayer-card{border:1px solid var(--line);background:var(--card);border-radius:18px;padding:13px}.prayer-card.next{outline:2px solid var(--gold);background:var(--sage)}
      .prayer-card b{font-size:16px}.prayer-time{font-size:22px;font-weight:900;margin-top:5px}.prayer-emoji{font-size:23px}.prayer-location{display:grid;grid-template-columns:1fr 1fr;gap:8px}.prayer-select{width:100%;border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:13px;padding:10px}
      .qibla-wrap{text-align:center}.qibla-compass{width:220px;height:220px;border-radius:50%;margin:14px auto;position:relative;border:10px solid var(--sage);box-shadow:inset 0 0 0 2px var(--line);background:radial-gradient(circle,var(--card) 57%,var(--bg) 58%)}
      .qibla-compass .north{position:absolute;top:9px;left:50%;transform:translateX(-50%);font-weight:900;color:var(--muted)}.qibla-needle{position:absolute;inset:22px;transition:transform .25s ease;transform-origin:50% 50%}
      .qibla-needle:before{content:'◆';position:absolute;top:-7px;left:50%;transform:translateX(-50%);font-size:30px;color:var(--green)}.qibla-kaaba{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:33px}.qibla-deg{font-size:25px;font-weight:900}.hijri-big{text-align:center;font-size:25px;font-weight:900;margin:5px 0}.next-prayer{text-align:center}.next-prayer strong{font-size:28px;display:block;margin:5px 0}.privacy-note{font-size:11px;color:var(--muted);line-height:1.7;margin-top:9px}
      @media(min-width:470px){.prayer-grid{grid-template-columns:repeat(3,1fr)}}
    `;document.head.appendChild(s);
  }

  function injectUI(){
    injectStyles();cfg();const main=document.querySelector('main');if(!main)return;
    if(!document.getElementById('prayer')){
      const sec=document.createElement('section');sec.className='page';sec.id='prayer';sec.innerHTML=`
        <div class="section-title"><h3>الصلاة</h3><span id="prayerStatus">حدد موقعك</span></div>
        <div class="hero next-prayer"><div class="eyebrow">الصلاة القادمة</div><h2 id="nextPrayerName">—</h2><strong id="nextPrayerCountdown">--:--:--</strong><div id="nextPrayerTime">فعّل الموقع لعرض المواقيت</div></div>
        <div class="section-title"><h3>مواقيت اليوم</h3><span id="prayerDate"></span></div><div id="prayerTimes" class="prayer-grid"><div class="card muted">لم يتم تحديد الموقع بعد.</div></div>
        <div class="card" style="margin-top:12px"><div class="row"><div><b>الموقع والحساب</b><div class="muted" id="prayerLocationLabel">غير محدد</div></div><button class="smallbtn" id="locatePrayerBtn">تحديد موقعي</button></div><div class="prayer-location" style="margin-top:12px"><select id="prayerMethod" class="prayer-select">${METHODS.map(m=>`<option value="${m[0]}">${m[1]}</option>`).join('')}</select><select id="prayerSchool" class="prayer-select"><option value="0">العصر: شافعي/مالكي/حنبلي</option><option value="1">العصر: حنفي</option></select></div><div class="list-item"><label><input type="checkbox" id="prayerAlerts"> تنبيهات الصلوات الخمس</label><span class="badge">Web Push</span></div><div class="privacy-note">الموقع يُحفظ على جهازك فقط. عند تفعيل تنبيهات الصلاة، تُرسل إحداثيات تقريبية إلى اشتراك التنبيهات السحابي لحساب المواقيت.</div></div>
        <div class="section-title"><h3>اتجاه القبلة</h3><span id="qiblaStatus">—</span></div><div class="card qibla-wrap"><div class="qibla-compass"><span class="north">N</span><div class="qibla-needle" id="qiblaNeedle"></div><div class="qibla-kaaba">🕋</div></div><div class="qibla-deg" id="qiblaDegree">—°</div><div class="muted">من اتجاه الشمال</div><button class="smallbtn" id="startCompass" style="margin-top:12px">تشغيل بوصلة الجهاز</button></div>
        <div class="section-title"><h3>التقويم الهجري</h3><span>أم القرى</span></div><div class="card"><div class="hijri-big" id="hijriDate">—</div><div class="muted" style="text-align:center" id="gregDate">—</div></div>`;main.appendChild(sec);
    }
    const grid=document.querySelector('#home .grid');if(grid&&!document.getElementById('prayerTile')){const t=document.createElement('div');t.className='tile';t.id='prayerTile';t.innerHTML='<div class="em">🕌</div><b>الصلاة</b>';t.onclick=()=>{go('prayer');loadPrayerData(false)};grid.appendChild(t)}
    wire();renderStored();
  }

  function wire(){
    const method=document.getElementById('prayerMethod'),school=document.getElementById('prayerSchool'),alerts=document.getElementById('prayerAlerts');
    if(method){method.value=String(cfg().method);method.onchange=()=>{cfg().method=Number(method.value);save();loadPrayerData(true);syncPrayerPush()}}
    if(school){school.value=String(cfg().school);school.onchange=()=>{cfg().school=Number(school.value);save();loadPrayerData(true);syncPrayerPush()}}
    if(alerts){alerts.checked=!!cfg().alerts;alerts.onchange=async()=>{cfg().alerts=alerts.checked;save();if(alerts.checked&&!getLocalLocation()){alerts.checked=false;cfg().alerts=false;save();toast('حدد موقعك أولًا لتفعيل تنبيهات الصلاة');return}if(alerts.checked&&typeof enableWerdPush==='function')await enableWerdPush();await syncPrayerPush();toast(alerts.checked?'تم تفعيل تنبيهات الصلاة ✓':'تم إيقاف تنبيهات الصلاة')}}
    document.getElementById('locatePrayerBtn').onclick=requestLocation;document.getElementById('startCompass').onclick=startCompass;
  }

  function renderStored(){
    const loc=getLocalLocation();const label=document.getElementById('prayerLocationLabel');if(label&&loc)label.textContent=`${loc.latitude.toFixed(3)}, ${loc.longitude.toFixed(3)} • دقة ${Math.round(loc.accuracy||0)}م`;
    if(loc)loadPrayerData(false);
  }

  function requestLocation(){
    if(!navigator.geolocation){toast('تحديد الموقع غير مدعوم على هذا الجهاز');return}
    const b=document.getElementById('locatePrayerBtn');b.disabled=true;b.textContent='جاري التحديد…';
    navigator.geolocation.getCurrentPosition(async p=>{
      const loc={latitude:p.coords.latitude,longitude:p.coords.longitude,accuracy:p.coords.accuracy,updatedAt:new Date().toISOString()};saveLocalLocation(loc);b.disabled=false;b.textContent='تحديث الموقع';document.getElementById('prayerLocationLabel').textContent=`${loc.latitude.toFixed(3)}, ${loc.longitude.toFixed(3)} • دقة ${Math.round(loc.accuracy||0)}م`;await loadPrayerData(true);await syncPrayerPush();toast('تم تحديث موقع مواقيت الصلاة ✓')
    },e=>{console.warn(e);b.disabled=false;b.textContent='تحديد موقعي';toast('تعذر الوصول للموقع. اسمح للتطبيق باستخدام الموقع.')},{enableHighAccuracy:true,timeout:12000,maximumAge:300000});
  }

  async function loadPrayerData(showToast=false){
    const loc=getLocalLocation();if(!loc)return;const status=document.getElementById('prayerStatus');if(status)status.textContent='تحميل المواقيت…';
    try{
      const now=new Date(),date=`${String(now.getDate()).padStart(2,'0')}-${String(now.getMonth()+1).padStart(2,'0')}-${now.getFullYear()}`;
      const url=`${ALADHAN}/timings/${date}?latitude=${encodeURIComponent(loc.latitude)}&longitude=${encodeURIComponent(loc.longitude)}&method=${cfg().method}&school=${cfg().school}`;
      const [tr,qr]=await Promise.all([fetch(url),fetch(`${ALADHAN}/qibla/${encodeURIComponent(loc.latitude)}/${encodeURIComponent(loc.longitude)}`)]);if(!tr.ok||!qr.ok)throw new Error('api');
      const tj=await tr.json(),qj=await qr.json();timings=tj.data?.timings||null;qiblaDirection=Number(qj.data?.direction);renderTimings(tj.data);renderQibla();if(status)status.textContent=tj.data?.meta?.timezone||'مواقيت اليوم';if(showToast)toast('تم تحديث مواقيت الصلاة ✓');startCountdown();
    }catch(e){console.error(e);if(status)status.textContent='تعذر التحديث';toast('تعذر تحميل مواقيت الصلاة الآن')}
  }

  function renderTimings(data){
    if(!data||!timings)return;const box=document.getElementById('prayerTimes');box.innerHTML=PRAYERS.map(p=>`<div class="prayer-card" data-prayer="${p[0]}"><div class="row"><b>${p[1]}</b><span class="prayer-emoji">${p[2]}</span></div><div class="prayer-time">${format12(timings[p[0]])}</div></div>`).join('');
    const h=data.date?.hijri,g=data.date?.gregorian;if(h){document.getElementById('hijriDate').textContent=`${h.weekday?.ar||''} ${h.day} ${h.month?.ar||h.month?.en||''} ${h.year} هـ`}if(g){document.getElementById('gregDate').textContent=`${g.weekday?.en||''} ${g.day}-${g.month?.number||''}-${g.year}`;document.getElementById('prayerDate').textContent=`${g.day}/${g.month?.number||''}/${g.year}`}
  }

  function prayerMinutes(t){const m=cleanTime(t).match(/^(\d+):(\d+)/);return m?Number(m[1])*60+Number(m[2]):null}
  function nextPrayer(){
    if(!timings)return null;const now=new Date(),cur=now.getHours()*60+now.getMinutes()+now.getSeconds()/60;const list=PRAYERS.filter(p=>p[0]!=='Sunrise').map(p=>({...{key:p[0],name:p[1]},minute:prayerMinutes(timings[p[0]])})).filter(x=>x.minute!=null);let n=list.find(x=>x.minute>cur);let dayOffset=0;if(!n){n=list[0];dayOffset=1}return{...n,dayOffset}
  }
  function startCountdown(){if(countdownTimer)clearInterval(countdownTimer);updateCountdown();countdownTimer=setInterval(updateCountdown,1000)}
  function updateCountdown(){
    const n=nextPrayer();if(!n)return;const now=new Date(),target=new Date(now);target.setHours(Math.floor(n.minute/60),n.minute%60,0,0);if(n.dayOffset)target.setDate(target.getDate()+1);let sec=Math.max(0,Math.floor((target-now)/1000));const h=Math.floor(sec/3600);sec%=3600;const m=Math.floor(sec/60),s=sec%60;document.getElementById('nextPrayerName').textContent=n.name;document.getElementById('nextPrayerTime').textContent=`الوقت ${format12(timings[n.key])}`;document.getElementById('nextPrayerCountdown').textContent=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;document.querySelectorAll('.prayer-card').forEach(x=>x.classList.toggle('next',x.dataset.prayer===n.key));
  }

  function renderQibla(heading=0){if(!Number.isFinite(qiblaDirection))return;document.getElementById('qiblaDegree').textContent=`${qiblaDirection.toFixed(1)}°`;document.getElementById('qiblaStatus').textContent=`${qiblaDirection.toFixed(1)}°`;const needle=document.getElementById('qiblaNeedle');if(needle)needle.style.transform=`rotate(${qiblaDirection-heading}deg)`}
  async function startCompass(){
    if(!Number.isFinite(qiblaDirection)){toast('حدد موقعك أولًا');return}
    try{if(typeof DeviceOrientationEvent!=='undefined'&&typeof DeviceOrientationEvent.requestPermission==='function'){const p=await DeviceOrientationEvent.requestPermission();if(p!=='granted'){toast('لم يتم السماح بالبوصلة');return}}
      if(orientationHandler)window.removeEventListener('deviceorientation',orientationHandler,true);orientationHandler=e=>{const heading=Number.isFinite(e.webkitCompassHeading)?e.webkitCompassHeading:(Number.isFinite(e.alpha)?360-e.alpha:0);renderQibla(heading)};window.addEventListener('deviceorientation',orientationHandler,true);document.getElementById('startCompass').textContent='البوصلة تعمل ✓';toast('حرّك الهاتف بشكل رقم 8 لمعايرة البوصلة')
    }catch(e){console.error(e);toast('تعذر تشغيل بوصلة الجهاز')}
  }

  // Extend existing push preferences without changing the notification module.
  const baseCurrentWerdPrefs=typeof currentWerdPrefs==='function'?currentWerdPrefs:null;
  if(baseCurrentWerdPrefs){
    currentWerdPrefs=function(){const base=baseCurrentWerdPrefs();const loc=getLocalLocation();return{...base,prayers:{enabled:!!cfg().alerts,method:Number(cfg().method)||4,school:Number(cfg().school)||0,location:loc?{latitude:Number(loc.latitude.toFixed(3)),longitude:Number(loc.longitude.toFixed(3))}:null}}};
  }
  async function syncPrayerPush(){if(cloudUser&&typeof syncWerdPushRecord==='function'){try{await syncWerdPushRecord(false)}catch(e){console.warn(e)}}}

  const baseRenderState=renderState;renderState=function(){baseRenderState();cfg();const a=document.getElementById('prayerAlerts');if(a)a.checked=!!cfg().alerts};
  injectUI();
})();