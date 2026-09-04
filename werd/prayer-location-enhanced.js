// Premium location and prayer settings card for Werd
(function(){
  const STYLE_ID='werdPrayerLocationEnhancedStyle';
  const CARD_CLASS='prayer-location-pro';
  const CITY_CACHE_KEY='werd_prayer_city_v1';
  let minuteTimer=null,cityRequestKey='',locating=false;

  function locationData(){try{return JSON.parse(localStorage.getItem('werd_prayer_location')||'null')}catch(_){return null}}
  function cityCache(){try{return JSON.parse(localStorage.getItem(CITY_CACHE_KEY)||'null')}catch(_){return null}}
  function saveCityCache(v){try{localStorage.setItem(CITY_CACHE_KEY,JSON.stringify(v))}catch(_){}}
  function saveLocation(v){try{localStorage.setItem('werd_prayer_location',JSON.stringify(v))}catch(_){}}
  function quality(acc){
    acc=Number(acc)||0;
    if(!acc)return{label:'بانتظار الموقع',kind:'idle'};
    if(acc<=30)return{label:'دقة ممتازة',kind:'great'};
    if(acc<=100)return{label:'دقة جيدة',kind:'good'};
    if(acc<=1000)return{label:'دقة مقبولة',kind:'approx'};
    return{label:'الدقة غير كافية',kind:'bad'};
  }
  function relativeTime(iso){
    if(!iso)return'لم يُحدّث بعد';
    const ms=Date.now()-new Date(iso).getTime();if(!Number.isFinite(ms))return'تم الحفظ على الجهاز';
    const min=Math.max(0,Math.round(ms/60000));if(min<1)return'تم التحديث الآن';if(min<60)return`آخر تحديث قبل ${min} د`;
    const h=Math.round(min/60);if(h<24)return`آخر تحديث قبل ${h} س`;return`آخر تحديث قبل ${Math.round(h/24)} يوم`;
  }
  function samePlace(cache,loc){return !!cache&&!!loc&&Math.abs(Number(cache.latitude)-Number(loc.latitude))<0.02&&Math.abs(Number(cache.longitude)-Number(loc.longitude))<0.02}
  function cityLabel(c){
    if(!c||!c.city)return'';
    const parts=[c.city];if(c.region&&c.region!==c.city)parts.push(c.region);return parts.join('، ');
  }
  function paintPrayerCity(name){
    if(!name)return;
    const status=document.getElementById('prayerStatus');
    if(status&&status.textContent!==name)status.textContent=name;
  }
  function keepPrayerCityVisible(){
    const status=document.getElementById('prayerStatus');if(!status||status.dataset.werdCityWatch==='1')return;
    status.dataset.werdCityWatch='1';
    new MutationObserver(()=>{
      const loc=locationData(),cached=cityCache(),name=samePlace(cached,loc)?cityLabel(cached):'';
      if(name&&status.textContent!==name)status.textContent=name;
    }).observe(status,{childList:true,subtree:true,characterData:true});
  }
  function fixHomeButton(){
    const btn=document.getElementById('syncBtn');if(!btn)return;
    btn.title='الرئيسية';btn.setAttribute('aria-label','الرئيسية');
    btn.innerHTML='<svg class="werd-home-one" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3.5 10.7 12 3.8l8.5 6.9"/><path d="M5.5 9.5v10.7h13V9.5"/><path d="M9.6 20.2v-5.4h4.8v5.4"/></svg>';
    btn.onclick=e=>{e.preventDefault();if(typeof go==='function')go('home')};
  }
  async function resolveCity(loc){
    if(!loc)return null;
    const key=`${Number(loc.latitude).toFixed(5)},${Number(loc.longitude).toFixed(5)}`;
    const cached=cityCache();if(samePlace(cached,loc)&&cached.city)return cached;
    if(cityRequestKey===key)return null;cityRequestKey=key;
    let result=null;
    try{
      const u=`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(loc.latitude)}&lon=${encodeURIComponent(loc.longitude)}&zoom=14&addressdetails=1&accept-language=ar`;
      const r=await fetch(u,{cache:'no-store'});if(r.ok){
        const j=await r.json(),a=j.address||{};
        const city=a.city||a.town||a.village||a.hamlet||a.municipality||a.county||a.state_district||'';
        const region=a.state||a.region||'';
        if(city)result={city,region,country:a.country||'',latitude:Number(loc.latitude),longitude:Number(loc.longitude),updatedAt:new Date().toISOString()};
      }
    }catch(e){console.warn('Primary reverse geocoding failed',e)}
    if(!result){
      try{
        const u=`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(loc.latitude)}&longitude=${encodeURIComponent(loc.longitude)}&localityLanguage=ar`;
        const r=await fetch(u,{cache:'no-store'});if(r.ok){
          const j=await r.json();const city=j.locality||j.city||'';const region=j.principalSubdivision||'';
          if(city)result={city,region,country:j.countryName||'',latitude:Number(loc.latitude),longitude:Number(loc.longitude),updatedAt:new Date().toISOString()};
        }
      }catch(e){console.warn('Fallback reverse geocoding failed',e)}
    }
    cityRequestKey='';if(result){saveCityCache(result);paintPrayerCity(cityLabel(result))}return result;
  }

  function injectStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
      #syncBtn::before{content:none!important;display:none!important}#syncBtn{display:grid!important;place-items:center!important;padding:0!important;font-size:0!important}#syncBtn .werd-home-one{width:24px;height:24px;display:block;stroke:#0b654c;stroke-width:2.1;stroke-linecap:round;stroke-linejoin:round}.dark #syncBtn .werd-home-one{stroke:#f0ddb0}@media(max-width:430px){#syncBtn .werd-home-one{width:22px;height:22px}}
      .${CARD_CLASS}{margin-top:14px!important;padding:0!important;overflow:hidden;border:1px solid rgba(180,147,89,.34)!important;background:linear-gradient(180deg,var(--card),rgba(246,241,226,.82))!important;box-shadow:0 12px 34px rgba(28,64,49,.07)!important}
      .plp-head{padding:18px;display:flex;align-items:center;justify-content:space-between;gap:14px;background:linear-gradient(135deg,rgba(15,91,69,.10),rgba(180,147,89,.08));border-bottom:1px solid rgba(180,147,89,.20)}
      .plp-title{display:flex;align-items:center;gap:11px;min-width:0}.plp-pin{width:46px;height:46px;flex:0 0 46px;border-radius:16px;display:grid;place-items:center;background:var(--green);color:#fff;box-shadow:0 8px 18px rgba(15,91,69,.18)}
      .plp-pin svg{width:23px;height:23px}.plp-title b{display:block;font-size:17px}.plp-title small{display:block;color:var(--muted);font-size:11px;margin-top:3px}.plp-head #locatePrayerBtn{min-height:42px;padding:0 14px;border-radius:14px;font-weight:800;white-space:nowrap;background:var(--card)}
      .plp-summary{padding:16px 18px 13px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center}.plp-location-main b{font-size:17px;display:block}.plp-location-main small{display:block;color:var(--muted);font-size:11px;margin-top:4px;line-height:1.6}
      .plp-quality{border-radius:999px;padding:7px 10px;font-size:11px;font-weight:900;border:1px solid var(--line);white-space:nowrap}.plp-quality.great{background:rgba(15,91,69,.11);color:var(--green)}.plp-quality.good{background:rgba(180,147,89,.12);color:var(--ink)}.plp-quality.approx{background:rgba(170,112,42,.10);color:#8a5c23}.plp-quality.bad{background:rgba(170,60,42,.10);color:#9b3d2f}.plp-quality.idle{color:var(--muted)}
      .plp-city-note{margin:0 18px 12px;padding:9px 11px;border-radius:12px;background:rgba(180,147,89,.07);color:var(--muted);font-size:10px;line-height:1.7}.plp-city-note b{color:var(--ink)}
      .plp-city-note.warn{background:rgba(170,60,42,.08);color:#8d4438}.plp-city-note.warn b{color:#8d4438}
      .plp-coords{margin:0 18px 14px;padding:10px 12px;border-radius:14px;background:rgba(15,91,69,.045);display:none;align-items:center;justify-content:space-between;gap:10px}.plp-coords.show{display:flex}.plp-coords #prayerLocationLabel{font-size:11px;color:var(--muted);direction:ltr;text-align:left}.plp-coords button{border:0;background:transparent;color:var(--green);font-weight:800;font-size:11px}
      .plp-details-toggle{margin:0 18px 14px;border:0;background:transparent;color:var(--green);font-weight:800;font-size:12px;padding:0;display:flex;align-items:center;gap:6px}
      .plp-settings{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:0 18px 16px}.plp-field{min-width:0}.plp-field label{display:block;font-size:11px;color:var(--muted);font-weight:800;margin:0 3px 7px}.plp-field .prayer-select{height:48px;border-radius:15px;padding:0 11px;font-weight:700;background:var(--card);box-shadow:0 2px 8px rgba(24,62,47,.035)}
      .plp-alert-wrap{margin:0 18px 14px;border:1px solid rgba(15,91,69,.12);border-radius:18px;padding:13px 14px;background:rgba(15,91,69,.045)}.plp-alert-wrap .list-item{padding:0!important;border:0!important;background:transparent!important;min-height:0}.plp-alert-wrap label{font-weight:900}.plp-alert-wrap .badge{background:rgba(15,91,69,.10);color:var(--green);border:0}
      .plp-privacy{margin:0 18px 18px;padding:11px 12px;border-radius:14px;background:rgba(180,147,89,.07);display:flex;gap:9px;align-items:flex-start}.plp-lock{font-size:16px;line-height:1}.plp-privacy .privacy-note{margin:0!important;font-size:10.5px;line-height:1.8}
      body.dark .${CARD_CLASS}{background:linear-gradient(180deg,#173027,#12261f)!important}.dark .plp-head{background:linear-gradient(135deg,rgba(47,142,108,.18),rgba(180,147,89,.10))}.dark .plp-coords,.dark .plp-alert-wrap{background:rgba(255,255,255,.035)}
      @media(max-width:430px){.plp-head{padding:15px}.plp-pin{width:42px;height:42px;flex-basis:42px;border-radius:14px}.plp-summary{padding:14px 15px 12px}.plp-settings{padding:0 15px 14px;grid-template-columns:1fr}.plp-details-toggle,.plp-coords,.plp-alert-wrap,.plp-privacy,.plp-city-note{margin-left:15px;margin-right:15px}.plp-head #locatePrayerBtn{padding:0 11px;font-size:11px}}
    `;document.head.appendChild(s);
  }

  async function updateSummary(){
    const loc=locationData(),title=document.getElementById('plpLocationName'),meta=document.getElementById('plpLocationMeta'),chip=document.getElementById('plpQuality'),note=document.getElementById('plpCityNote');
    if(!title||!meta||!chip)return;
    if(!loc){title.textContent='لم يتم تحديد الموقع';meta.textContent='اسمح للموقع لعرض مواقيت دقيقة';chip.textContent='بانتظار الموقع';chip.className='plp-quality idle';if(note){note.classList.remove('warn');note.innerHTML='<b>الموقع الحالي:</b> غير محدد'}return}
    const q=quality(loc.accuracy),cached=cityCache();
    const cachedName=samePlace(cached,loc)?cityLabel(cached):'';
    if(cachedName)paintPrayerCity(cachedName);
    title.textContent=cachedName||'الموقع محدد بالإحداثيات';meta.textContent=`${relativeTime(loc.updatedAt)} • دقة GPS ${Math.round(loc.accuracy||0)} م`;chip.textContent=q.label;chip.className=`plp-quality ${q.kind}`;
    if(note){note.classList.toggle('warn',Number(loc.accuracy)>1000);note.innerHTML=Number(loc.accuracy)>1000?'<b>تنبيه:</b> دقة الموقع الحالية غير كافية. فعّل «الموقع الدقيق / Precise Location» ثم اضغط تحديث الموقع.':`<b>الموقع الحالي:</b> ${cachedName||'يتم تحديد اسم المدينة من إحداثيات GPS'}<br><b>طريقة الحساب:</b> الخيار أدناه لا يغيّر مدينتك؛ «أم القرى - مكة المكرمة» اسم طريقة حساب فقط.`}
    if(!cachedName&&Number(loc.accuracy)<=1000){const city=await resolveCity(loc);const name=cityLabel(city);if(name){paintPrayerCity(name);title.textContent=name;if(note){note.classList.remove('warn');note.innerHTML=`<b>الموقع الحالي:</b> ${name}<br><b>طريقة الحساب:</b> الخيار أدناه لا يغيّر مدينتك؛ «أم القرى - مكة المكرمة» اسم طريقة حساب فقط.`}}}
  }

  function acquirePrecisePosition(){
    return new Promise((resolve,reject)=>{
      if(!navigator.geolocation){reject(new Error('GEO_UNSUPPORTED'));return}
      let best=null,lastError=null,watchId=null,done=false,earlyTimer=null;
      const finish=()=>{
        if(done)return;done=true;if(watchId!==null)navigator.geolocation.clearWatch(watchId);clearTimeout(timeoutTimer);clearTimeout(earlyTimer);
        if(best)resolve(best);else reject(lastError||new Error('GEO_FAILED'));
      };
      const timeoutTimer=setTimeout(finish,11000);
      watchId=navigator.geolocation.watchPosition(p=>{
        const acc=Number(p.coords.accuracy)||Infinity;
        if(!best||acc<(Number(best.coords.accuracy)||Infinity))best=p;
        const chip=document.getElementById('plpQuality'),meta=document.getElementById('plpLocationMeta');
        if(chip){const q=quality(acc);chip.textContent=`${q.label} • ${Math.round(acc)}م`;chip.className=`plp-quality ${q.kind}`}
        if(meta)meta.textContent='جاري تثبيت أدق قراءة GPS…';
        if(acc<=50&&!earlyTimer)earlyTimer=setTimeout(finish,700);
      },err=>{
        lastError=err;if(err&&err.code===1)finish();
      },{enableHighAccuracy:true,maximumAge:0,timeout:10000});
    });
  }

  async function refreshPrayerDataInPlace(){
    await updateSummary();
    const method=document.getElementById('prayerMethod');
    if(method)method.dispatchEvent(new Event('change',{bubbles:true}));
  }

  async function preciseLocate(ev){
    if(ev){ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation()}
    if(locating)return false;locating=true;
    const btn=document.getElementById('locatePrayerBtn'),note=document.getElementById('plpCityNote');
    if(btn){btn.disabled=true;btn.textContent='جاري تحديد GPS…'}
    if(note){note.classList.remove('warn');note.innerHTML='<b>جاري التحديث:</b> نأخذ عدة قراءات GPS ونختار الأدق، بدون استخدام موقع مخزّن قديم.'}
    try{
      const p=await acquirePrecisePosition();const acc=Math.round(Number(p.coords.accuracy)||0);
      if(!Number.isFinite(p.coords.latitude)||!Number.isFinite(p.coords.longitude))throw new Error('BAD_COORDS');
      if(acc>1000){
        if(note){note.classList.add('warn');note.innerHTML=`<b>لم نعتمد هذا الموقع:</b> دقته ${acc}م، وهي غير كافية لتحديد مدينتك بثقة.<br>على iPhone فعّل: الإعدادات ← الخصوصية والأمان ← خدمات الموقع ← Chrome/Safari ← «الموقع الدقيق». ثم اضغط تحديث الموقع مرة أخرى.`}
        if(typeof toast==='function')toast('الموقع تقريبي جدًا • فعّل الموقع الدقيق ثم أعد المحاولة');
        return false;
      }
      const loc={latitude:Number(p.coords.latitude),longitude:Number(p.coords.longitude),accuracy:acc,updatedAt:new Date().toISOString(),source:'fresh-high-accuracy-gps'};
      saveLocation(loc);try{localStorage.removeItem(CITY_CACHE_KEY)}catch(_){}
      const label=document.getElementById('prayerLocationLabel');if(label)label.textContent=`${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)} • دقة ${acc}م`;
      const city=await resolveCity(loc);const name=cityLabel(city);if(name)paintPrayerCity(name);
      if(note){note.classList.remove('warn');note.innerHTML=`<b>تم تثبيت الموقع:</b> ${name||'من GPS مباشرة'} • دقة ${acc}م<br>يتم الآن تحديث مواقيت الصلاة والقبلة دون مغادرة موضعك في الصفحة.`}
      if(typeof toast==='function')toast(name?`تم تحديد موقعك: ${name}`:`تم تحديث الموقع بدقة ${acc}م`);
      await refreshPrayerDataInPlace();
      return true;
    }catch(e){
      console.warn('Precise location failed',e);
      if(note){note.classList.add('warn');note.innerHTML='<b>تعذر تحديد الموقع.</b> تأكد من السماح لـ«ورد» باستخدام الموقع، ثم أعد المحاولة.'}
      if(typeof toast==='function')toast('تعذر الوصول إلى GPS • تحقق من إذن الموقع');
      return false;
    }finally{
      locating=false;if(btn){btn.disabled=false;btn.textContent='تحديث الموقع الدقيق'}
    }
  }

  function enhance(){
    injectStyle();fixHomeButton();
    const locate=document.getElementById('locatePrayerBtn'),method=document.getElementById('prayerMethod'),school=document.getElementById('prayerSchool'),alerts=document.getElementById('prayerAlerts'),label=document.getElementById('prayerLocationLabel');
    if(!locate||!method||!school||!alerts||!label)return false;
    const card=locate.closest('.card');if(!card||card.classList.contains(CARD_CLASS)){keepPrayerCityVisible();updateSummary();return true}
    const alertRow=alerts.closest('.list-item'),privacy=card.querySelector('.privacy-note');
    locate.remove();method.remove();school.remove();label.remove();if(alertRow)alertRow.remove();if(privacy)privacy.remove();
    card.innerHTML='';card.classList.add(CARD_CLASS);
    card.innerHTML=`<div class="plp-head"><div class="plp-title"><span class="plp-pin"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.6"/></svg></span><div><b>الموقع وإعدادات الصلاة</b><small>يعتمد على GPS الفعلي وليس موقعًا تقريبيًا مخزنًا</small></div></div><div id="plpLocateMount"></div></div><div class="plp-summary"><div class="plp-location-main"><b id="plpLocationName">الموقع الحالي</b><small id="plpLocationMeta">—</small></div><span id="plpQuality" class="plp-quality idle">بانتظار الموقع</span></div><div class="plp-city-note" id="plpCityNote"><b>الموقع الحالي:</b> جارٍ التحقق</div><button type="button" class="plp-details-toggle" id="plpDetailsToggle">⌄ عرض الإحداثيات</button><div class="plp-coords" id="plpCoords"><div id="plpLabelMount"></div><button type="button" id="plpHideCoords">إخفاء</button></div><div class="plp-settings"><div class="plp-field"><label>طريقة حساب المواقيت — وليست المدينة</label><div id="plpMethodMount"></div></div><div class="plp-field"><label>حساب وقت العصر</label><div id="plpSchoolMount"></div></div></div><div class="plp-alert-wrap" id="plpAlertMount"></div><div class="plp-privacy"><span class="plp-lock">🔒</span><div id="plpPrivacyMount"></div></div>`;
    document.getElementById('plpLocateMount').appendChild(locate);document.getElementById('plpLabelMount').appendChild(label);document.getElementById('plpMethodMount').appendChild(method);document.getElementById('plpSchoolMount').appendChild(school);if(alertRow)document.getElementById('plpAlertMount').appendChild(alertRow);if(privacy)document.getElementById('plpPrivacyMount').appendChild(privacy);
    locate.textContent='تحديث الموقع الدقيق';
    locate.addEventListener('click',preciseLocate,true);
    const coords=document.getElementById('plpCoords'),toggle=document.getElementById('plpDetailsToggle');
    const show=on=>{coords.classList.toggle('show',on);toggle.textContent=on?'⌃ إخفاء الإحداثيات':'⌄ عرض الإحداثيات'};toggle.onclick=()=>show(!coords.classList.contains('show'));document.getElementById('plpHideCoords').onclick=()=>show(false);
    new MutationObserver(()=>updateSummary()).observe(label,{childList:true,subtree:true,characterData:true});
    keepPrayerCityVisible();updateSummary();if(minuteTimer)clearInterval(minuteTimer);minuteTimer=setInterval(updateSummary,60000);return true;
  }
  function boot(){
    injectStyle();fixHomeButton();
    if(enhance())return;
    let tries=0;const t=setInterval(()=>{tries++;fixHomeButton();if(enhance())clearInterval(t);else if(tries>40)clearInterval(t)},150)
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();