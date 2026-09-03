// Prayer header/timezone polish and clearer precise-location action for Werd v121
(function(){
  const STYLE_ID='werdPrayerPolishV121Style';
  const CITY_KEY='werd_prayer_city_v1';
  const LOC_KEY='werd_prayer_location';
  let cityPromise=null;

  function readJson(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(_){return null}}
  function safe(v){return String(v||'').trim()}
  function cityName(c){
    if(!c)return'';
    const city=safe(c.city),region=safe(c.region);
    if(city&&region&&city!==region)return`${city}، ${region}`;
    return city||region||'';
  }
  function offsetLabel(){
    const mins=-new Date().getTimezoneOffset();
    const sign=mins>=0?'+':'-';
    const abs=Math.abs(mins),h=Math.floor(abs/60),m=abs%60;
    return `UTC${sign}${h}${m?':'+String(m).padStart(2,'0'):''}`;
  }
  function friendlyZone(){
    const z=Intl.DateTimeFormat().resolvedOptions().timeZone||'';
    const map={
      'Asia/Riyadh':'توقيت السعودية',
      'Asia/Kuwait':'توقيت الكويت',
      'Asia/Bahrain':'توقيت البحرين',
      'Asia/Qatar':'توقيت قطر',
      'Asia/Dubai':'توقيت الإمارات',
      'Asia/Muscat':'توقيت عُمان'
    };
    return map[z]||'التوقيت المحلي';
  }
  async function resolveCity(){
    const loc=readJson(LOC_KEY);if(!loc||!Number.isFinite(Number(loc.latitude))||!Number.isFinite(Number(loc.longitude)))return'';
    const cached=readJson(CITY_KEY),cachedName=cityName(cached);
    if(cachedName&&Math.abs(Number(cached.latitude)-Number(loc.latitude))<0.02&&Math.abs(Number(cached.longitude)-Number(loc.longitude))<0.02)return cachedName;
    if(cityPromise)return cityPromise;
    cityPromise=(async()=>{
      let out='';
      try{
        const u=`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(loc.latitude)}&lon=${encodeURIComponent(loc.longitude)}&zoom=14&addressdetails=1&accept-language=ar`;
        const r=await fetch(u,{cache:'no-store'});
        if(r.ok){const j=await r.json(),a=j.address||{};const city=a.city||a.town||a.village||a.hamlet||a.municipality||a.county||a.state_district||'';const region=a.state||a.region||'';if(city){out=cityName({city,region});try{localStorage.setItem(CITY_KEY,JSON.stringify({city,region,country:a.country||'',latitude:Number(loc.latitude),longitude:Number(loc.longitude),updatedAt:new Date().toISOString()}))}catch(_){}}}
      }catch(e){console.warn('prayer polish city lookup',e)}
      cityPromise=null;return out;
    })();
    return cityPromise;
  }
  function injectStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
      #prayer .section-title:first-child{align-items:flex-end!important;gap:12px}
      #prayer #prayerStatus{display:flex!important;flex-direction:column;align-items:flex-start;gap:3px;min-width:0;text-align:left;line-height:1.2;color:inherit!important}
      #prayer #prayerStatus .wp-city{font-size:14px;font-weight:900;color:var(--green);max-width:46vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      #prayer #prayerStatus .wp-zone{display:inline-flex;align-items:center;gap:6px;font-size:10px;font-weight:800;color:var(--muted);padding:5px 9px;border:1px solid rgba(180,147,89,.26);border-radius:999px;background:rgba(255,255,255,.50);white-space:nowrap}
      #prayer #prayerStatus .wp-zone-dot{width:6px;height:6px;border-radius:50%;background:var(--green);box-shadow:0 0 0 3px rgba(15,91,69,.08)}
      .prayer-location-pro .plp-head{padding-bottom:13px!important}
      .prayer-location-pro .plp-head #plpLocateMount{display:none!important}
      .wp-locate-action{margin:2px 18px 16px;padding:12px;border:1px solid rgba(15,91,69,.14);border-radius:18px;background:linear-gradient(135deg,rgba(15,91,69,.07),rgba(180,147,89,.07));display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center}
      .wp-locate-copy b{display:block;font-size:13px;color:var(--ink)}.wp-locate-copy small{display:block;margin-top:3px;font-size:10px;line-height:1.6;color:var(--muted)}
      .wp-locate-action #locatePrayerBtn{min-height:48px!important;padding:0 16px!important;border-radius:15px!important;border:0!important;background:var(--green)!important;color:#fff!important;font-size:12px!important;font-weight:900!important;box-shadow:0 8px 20px rgba(15,91,69,.18)!important;white-space:nowrap}
      .wp-locate-action #locatePrayerBtn:active{transform:scale(.97)}
      .wp-locate-action #locatePrayerBtn:disabled{opacity:.7}
      body.dark #prayer #prayerStatus .wp-zone{background:rgba(255,255,255,.04);border-color:rgba(180,147,89,.24)}
      body.dark .wp-locate-action{background:linear-gradient(135deg,rgba(47,142,108,.08),rgba(180,147,89,.06))}
      @media(max-width:430px){
        #prayer .section-title:first-child{align-items:center!important}
        #prayer #prayerStatus .wp-city{font-size:12px;max-width:43vw}
        #prayer #prayerStatus .wp-zone{font-size:9px;padding:4px 7px}
        .wp-locate-action{margin-left:15px;margin-right:15px;grid-template-columns:1fr}
        .wp-locate-action #locatePrayerBtn{width:100%!important;min-height:50px!important;font-size:13px!important}
      }
    `;document.head.appendChild(s);
  }
  async function paintHeader(){
    const status=document.getElementById('prayerStatus');if(!status)return false;
    const cachedName=cityName(readJson(CITY_KEY));
    const city=cachedName||await resolveCity()||'موقعك الحالي';
    const html=`<span class="wp-city">📍 ${city}</span><span class="wp-zone"><span class="wp-zone-dot"></span>${friendlyZone()} • ${offsetLabel()}</span>`;
    if(status.innerHTML!==html)status.innerHTML=html;
    return true;
  }
  function placeLocationButton(){
    const card=document.querySelector('.prayer-location-pro');
    const btn=document.getElementById('locatePrayerBtn');
    if(!card||!btn)return false;
    let row=document.getElementById('wpLocateAction');
    if(!row){
      row=document.createElement('div');row.id='wpLocateAction';row.className='wp-locate-action';
      row.innerHTML='<div class="wp-locate-copy"><b>تحديد موقع مواقيت الصلاة</b><small>استخدم GPS الدقيق للحصول على المدينة والمواقيت والقبلة حسب موقعك الفعلي.</small></div><div id="wpLocateBtnMount"></div>';
      const summary=card.querySelector('.plp-summary');
      if(summary)summary.insertAdjacentElement('afterend',row);else card.prepend(row);
    }
    const mount=row.querySelector('#wpLocateBtnMount');if(mount&&btn.parentElement!==mount)mount.appendChild(btn);
    if(!btn.disabled)btn.textContent='📍 تحديث موقعي بدقة';
    btn.setAttribute('aria-label','تحديث الموقع الدقيق لمواقيت الصلاة والقبلة');
    return true;
  }
  function refresh(){injectStyle();paintHeader();placeLocationButton()}
  function boot(){
    let tries=0;const t=setInterval(()=>{tries++;refresh();if((document.getElementById('prayerStatus')&&document.getElementById('locatePrayerBtn'))||tries>50)clearInterval(t)},140);
    setTimeout(refresh,1200);setTimeout(refresh,3500);
    const mo=new MutationObserver(()=>{clearTimeout(mo._t);mo._t=setTimeout(refresh,40)});
    mo.observe(document.body,{childList:true,subtree:true});
    window.addEventListener('pageshow',()=>setTimeout(refresh,80));
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(refresh,80)});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
