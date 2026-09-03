// Prayer header/timezone polish and clearer precise-location action for Werd
(function(){
  const STYLE_ID='werdPrayerPolishV121Style';
  const CITY_KEY='werd_prayer_city_v1';
  const LOC_KEY='werd_prayer_location';
  let cityPromise=null;

  function readJson(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(_){return null}}
  function safe(v){return String(v||'').trim()}
  function esc(v){return safe(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function cityParts(c){
    if(!c)return{city:'',region:''};
    const city=safe(c.city),region=safe(c.region);
    return{city:city||region||'',region:city&&region&&city!==region?region:''};
  }
  function cityName(c){const p=cityParts(c);return[p.city,p.region].filter(Boolean).join('، ')}
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
        if(r.ok){
          const j=await r.json(),a=j.address||{};
          const city=a.city||a.town||a.village||a.hamlet||a.municipality||a.county||a.state_district||'';
          const region=a.state||a.region||'';
          if(city){
            out=cityName({city,region});
            try{localStorage.setItem(CITY_KEY,JSON.stringify({city,region,country:a.country||'',latitude:Number(loc.latitude),longitude:Number(loc.longitude),updatedAt:new Date().toISOString()}))}catch(_){}
          }
        }
      }catch(e){console.warn('prayer polish city lookup',e)}
      cityPromise=null;return out;
    })();
    return cityPromise;
  }
  function injectStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
      #prayer .section-title:first-child{align-items:flex-end!important;gap:12px}
      #prayer #prayerStatus{display:flex!important;flex-direction:column;align-items:flex-start;gap:6px;min-width:0;text-align:right;line-height:1.15;color:inherit!important;direction:rtl}
      #prayer #prayerStatus .wp-city-block{display:flex;align-items:center;gap:9px;max-width:min(54vw,310px);padding:7px 10px 7px 12px;border:1px solid rgba(180,147,89,.25);border-radius:17px;background:linear-gradient(145deg,rgba(255,255,255,.76),rgba(249,243,228,.52));box-shadow:0 8px 22px rgba(35,71,56,.055),inset 0 1px 0 rgba(255,255,255,.9);backdrop-filter:blur(7px)}
      #prayer #prayerStatus .wp-city-pin{width:32px;height:32px;flex:0 0 32px;border-radius:11px;display:grid;place-items:center;color:#f3dfae;background:linear-gradient(145deg,#117054,#0a503d);box-shadow:0 7px 16px rgba(15,91,69,.16),0 0 0 2px rgba(180,147,89,.10)}
      #prayer #prayerStatus .wp-city-pin svg{width:17px;height:17px;display:block}
      #prayer #prayerStatus .wp-city-copy{display:flex;flex-direction:column;align-items:flex-start;min-width:0;text-align:right;direction:rtl}
      #prayer #prayerStatus .wp-city-main{display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:"SF Arabic","Geeza Pro","Noto Sans Arabic","Segoe UI",Tahoma,sans-serif;font-size:19px;font-weight:900;line-height:1.12;color:#0a5a43;letter-spacing:-.25px;text-shadow:0 1px 0 rgba(255,255,255,.72)}
      #prayer #prayerStatus .wp-city-region{display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:3px;font-family:"SF Arabic","Geeza Pro","Noto Sans Arabic","Segoe UI",Tahoma,sans-serif;font-size:10.5px;font-weight:700;line-height:1.25;color:#7f8a82;letter-spacing:.05px}
      #prayer #prayerStatus .wp-zone{display:inline-flex;align-items:center;gap:6px;margin-inline-start:3px;font-size:9.5px;font-weight:800;color:var(--muted);padding:5px 9px;border:1px solid rgba(180,147,89,.22);border-radius:999px;background:rgba(255,255,255,.42);white-space:nowrap}
      #prayer #prayerStatus .wp-zone-dot{width:6px;height:6px;border-radius:50%;background:var(--green);box-shadow:0 0 0 3px rgba(15,91,69,.08)}
      .prayer-location-pro .plp-head{padding-bottom:13px!important}
      .prayer-location-pro .plp-head #plpLocateMount{display:none!important}
      .wp-locate-action{margin:2px 18px 16px;padding:12px;border:1px solid rgba(15,91,69,.14);border-radius:18px;background:linear-gradient(135deg,rgba(15,91,69,.07),rgba(180,147,89,.07));display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center}
      .wp-locate-copy b{display:block;font-size:13px;color:var(--ink)}.wp-locate-copy small{display:block;margin-top:3px;font-size:10px;line-height:1.6;color:var(--muted)}
      .wp-locate-action #locatePrayerBtn{min-height:48px!important;padding:0 16px!important;border-radius:15px!important;border:0!important;background:var(--green)!important;color:#fff!important;font-size:12px!important;font-weight:900!important;box-shadow:0 8px 20px rgba(15,91,69,.18)!important;white-space:nowrap}
      .wp-locate-action #locatePrayerBtn:active{transform:scale(.97)}
      .wp-locate-action #locatePrayerBtn:disabled{opacity:.7}
      body.dark #prayer #prayerStatus .wp-city-block{background:linear-gradient(145deg,rgba(32,56,47,.88),rgba(24,45,37,.72));border-color:rgba(180,147,89,.24);box-shadow:0 8px 22px rgba(0,0,0,.12)}
      body.dark #prayer #prayerStatus .wp-city-main{color:#f3e6c6;text-shadow:none}
      body.dark #prayer #prayerStatus .wp-city-region{color:#aebcb4}
      body.dark #prayer #prayerStatus .wp-zone{background:rgba(255,255,255,.04);border-color:rgba(180,147,89,.24)}
      body.dark .wp-locate-action{background:linear-gradient(135deg,rgba(47,142,108,.08),rgba(180,147,89,.06))}
      @media(max-width:430px){
        #prayer .section-title:first-child{align-items:center!important}
        #prayer #prayerStatus{gap:5px}
        #prayer #prayerStatus .wp-city-block{max-width:47vw;padding:6px 8px 6px 9px;border-radius:15px;gap:7px}
        #prayer #prayerStatus .wp-city-pin{width:29px;height:29px;flex-basis:29px;border-radius:10px}
        #prayer #prayerStatus .wp-city-pin svg{width:15px;height:15px}
        #prayer #prayerStatus .wp-city-main{font-size:16.5px;letter-spacing:-.15px}
        #prayer #prayerStatus .wp-city-region{font-size:9.5px;margin-top:2px}
        #prayer #prayerStatus .wp-zone{font-size:8.5px;padding:4px 7px}
        .wp-locate-action{margin-left:15px;margin-right:15px;grid-template-columns:1fr}
        .wp-locate-action #locatePrayerBtn{width:100%!important;min-height:50px!important;font-size:13px!important}
      }
    `;document.head.appendChild(s);
  }
  async function paintHeader(){
    const status=document.getElementById('prayerStatus');if(!status)return false;
    let cached=readJson(CITY_KEY),parts=cityParts(cached);
    if(!parts.city){await resolveCity();cached=readJson(CITY_KEY);parts=cityParts(cached)}
    const city=parts.city||'موقعك الحالي',region=parts.region||'';
    const html=`<span class="wp-city-block"><span class="wp-city-pin" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg></span><span class="wp-city-copy"><strong class="wp-city-main">${esc(city)}</strong>${region?`<small class="wp-city-region">${esc(region)}</small>`:''}</span></span><span class="wp-zone"><span class="wp-zone-dot"></span>${friendlyZone()} • ${offsetLabel()}</span>`;
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

// Keep the currently open section after a browser refresh.
(function(){
  const KEY='werd_active_page_v1';
  let restoring=true;
  function validPage(id){const el=id&&document.getElementById(id);return!!(el&&el.classList?.contains('page'))}
  function savePage(id){if(!id)return;if(id==='quran'||validPage(id)){try{sessionStorage.setItem(KEY,id)}catch(_){}}}
  function activePage(){return document.querySelector('.page.active')?.id||''}
  function wrapGo(){
    const original=window.go;
    if(typeof original!=='function'||original.__werdPageStateWrapped)return false;
    function wrapped(id,...args){savePage(id);return original.call(this,id,...args)}
    wrapped.__werdPageStateWrapped=true;wrapped.__werdOriginalGo=original;window.go=wrapped;return true;
  }
  function restore(){
    let saved='';try{saved=sessionStorage.getItem(KEY)||''}catch(_){}
    if(!saved){restoring=false;return true}
    if(saved==='home'){restoring=false;return true}
    if(typeof window.go!=='function')return false;
    if(saved==='quran'||validPage(saved)){
      try{window.go(saved);restoring=false;return true}catch(e){console.warn('Werd page restore failed',e)}
    }
    return false;
  }
  function bootPageState(){
    wrapGo();
    document.addEventListener('click',e=>{const nav=e.target.closest?.('.nav[data-page]');if(nav)savePage(nav.dataset.page)},true);
    window.addEventListener('beforeunload',()=>{const id=activePage();if(id)savePage(id)});
    const main=document.querySelector('main');
    if(main)new MutationObserver(()=>{if(restoring)return;const id=activePage();if(id)savePage(id)}).observe(main,{subtree:true,attributes:true,attributeFilter:['class']});
    let tries=0;const timer=setInterval(()=>{tries++;wrapGo();if(restore()||tries>=60){clearInterval(timer);restoring=false}},100);
    setTimeout(restore,0);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootPageState);else bootPageState();
})();
