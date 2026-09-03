// Premium prayer city, timezone and precise location presentation for Werd
(function(){
  const STYLE_ID='werdPrayerPremiumCityV124Style';
  const CITY_KEY='werd_prayer_city_v1';
  const LOC_KEY='werd_prayer_location';
  let lookupPromise=null;

  function read(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(_){return null}}
  function text(v){return String(v||'').trim()}
  function esc(v){return text(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function parts(c){
    if(!c)return{city:'',region:''};
    const city=text(c.city),region=text(c.region);
    return{city:city||region||'',region:city&&region&&city!==region?region:''};
  }
  function samePlace(c,l){return !!(c&&l)&&Math.abs(Number(c.latitude)-Number(l.latitude))<.02&&Math.abs(Number(c.longitude)-Number(l.longitude))<.02}
  function zoneName(){
    const z=Intl.DateTimeFormat().resolvedOptions().timeZone||'';
    return ({'Asia/Riyadh':'توقيت السعودية','Asia/Kuwait':'توقيت الكويت','Asia/Bahrain':'توقيت البحرين','Asia/Qatar':'توقيت قطر','Asia/Dubai':'توقيت الإمارات','Asia/Muscat':'توقيت عُمان'})[z]||'التوقيت المحلي';
  }
  function utcOffset(){
    const mins=-new Date().getTimezoneOffset(),sign=mins>=0?'+':'-',a=Math.abs(mins),h=Math.floor(a/60),m=a%60;
    return `UTC${sign}${h}${m?':'+String(m).padStart(2,'0'):''}`;
  }
  async function resolveCity(){
    const loc=read(LOC_KEY);if(!loc||!Number.isFinite(Number(loc.latitude))||!Number.isFinite(Number(loc.longitude)))return null;
    const cached=read(CITY_KEY);if(samePlace(cached,loc)&&parts(cached).city)return cached;
    if(lookupPromise)return lookupPromise;
    lookupPromise=(async()=>{
      let result=null;
      try{
        const u=`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(loc.latitude)}&lon=${encodeURIComponent(loc.longitude)}&zoom=14&addressdetails=1&accept-language=ar`;
        const r=await fetch(u,{cache:'no-store'});
        if(r.ok){
          const j=await r.json(),a=j.address||{};
          const city=a.city||a.town||a.village||a.hamlet||a.municipality||a.county||a.state_district||'';
          const region=a.state||a.region||'';
          if(city){result={city,region,country:a.country||'',latitude:Number(loc.latitude),longitude:Number(loc.longitude),updatedAt:new Date().toISOString()};try{localStorage.setItem(CITY_KEY,JSON.stringify(result))}catch(_){}}
        }
      }catch(e){console.warn('Werd city lookup',e)}
      lookupPromise=null;return result;
    })();
    return lookupPromise;
  }
  function injectStyle(){
    let old=document.getElementById(STYLE_ID);if(old)return;
    const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
      #prayer .section-title:first-child{align-items:center!important;gap:14px!important;margin-bottom:16px!important}
      #prayer #prayerStatus{display:flex!important;flex-direction:column!important;align-items:flex-start!important;gap:7px!important;min-width:0!important;color:inherit!important;text-align:right!important;direction:rtl!important;line-height:1!important}
      #prayer #prayerStatus .wpc-card{position:relative;display:flex;align-items:center;gap:11px;max-width:min(58vw,340px);padding:9px 12px 9px 13px;border:1.4px solid rgba(183,148,82,.36);border-radius:20px;background:linear-gradient(145deg,rgba(255,255,255,.92),rgba(249,241,221,.78));box-shadow:0 10px 26px rgba(21,76,57,.08),inset 0 1px 0 rgba(255,255,255,.95);overflow:hidden}
      #prayer #prayerStatus .wpc-card:after{content:"";position:absolute;inset:auto -28px -34px auto;width:88px;height:88px;border:1px solid rgba(183,148,82,.12);border-radius:50%;pointer-events:none}
      #prayer #prayerStatus .wpc-pin{width:38px;height:38px;flex:0 0 38px;border-radius:13px;display:grid;place-items:center;color:#f8e5b6;background:linear-gradient(145deg,#147658,#07503c);box-shadow:0 8px 18px rgba(9,82,60,.20),0 0 0 3px rgba(183,148,82,.09)}
      #prayer #prayerStatus .wpc-pin svg{width:19px;height:19px;display:block}
      #prayer #prayerStatus .wpc-copy{display:flex;flex-direction:column;align-items:flex-start;min-width:0;direction:rtl;text-align:right}
      #prayer #prayerStatus .wpc-kicker{font-family:"SF Arabic","Geeza Pro","Noto Sans Arabic","Segoe UI",Tahoma,sans-serif;font-size:8.5px;font-weight:900;color:#b08d48;letter-spacing:.35px;margin-bottom:3px}
      #prayer #prayerStatus .wpc-city{display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:"SF Arabic","Geeza Pro","Noto Sans Arabic","Segoe UI",Tahoma,sans-serif;font-size:21px;font-weight:950;line-height:1.05;color:#07543f;letter-spacing:-.45px;text-shadow:0 1px 0 rgba(255,255,255,.76)}
      #prayer #prayerStatus .wpc-region{display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:4px;font-family:"SF Arabic","Geeza Pro","Noto Sans Arabic","Segoe UI",Tahoma,sans-serif;font-size:10.5px;font-weight:700;line-height:1.2;color:#7c887f}
      #prayer #prayerStatus .wpc-zone{display:inline-flex;align-items:center;gap:6px;margin-inline-start:4px;padding:5px 10px;border:1px solid rgba(183,148,82,.25);border-radius:999px;background:rgba(255,253,246,.72);font-family:"SF Arabic","Geeza Pro","Segoe UI",Tahoma,sans-serif;font-size:9.5px;font-weight:850;color:#718078;white-space:nowrap;box-shadow:0 4px 12px rgba(32,68,54,.035)}
      #prayer #prayerStatus .wpc-dot{width:6px;height:6px;border-radius:50%;background:#148064;box-shadow:0 0 0 3px rgba(20,128,100,.09)}
      .prayer-location-pro .plp-head #plpLocateMount{display:none!important}
      .wpc-locate{margin:3px 18px 17px;padding:13px;border:1px solid rgba(15,91,69,.14);border-radius:19px;background:linear-gradient(135deg,rgba(15,91,69,.065),rgba(183,148,82,.065));display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center}
      .wpc-locate-copy b{display:block;font-size:13px;font-weight:900;color:var(--ink)}
      .wpc-locate-copy small{display:block;margin-top:4px;font-size:10px;line-height:1.65;color:var(--muted)}
      .wpc-locate #locatePrayerBtn{min-height:50px!important;padding:0 18px!important;border:0!important;border-radius:16px!important;background:linear-gradient(145deg,#137657,#09503d)!important;color:#fff!important;font-size:12.5px!important;font-weight:900!important;box-shadow:0 9px 21px rgba(15,91,69,.20)!important;white-space:nowrap!important}
      .wpc-locate #locatePrayerBtn:active{transform:scale(.97)}
      body.dark #prayer #prayerStatus .wpc-card{background:linear-gradient(145deg,rgba(34,59,50,.94),rgba(22,43,35,.88));border-color:rgba(183,148,82,.28);box-shadow:0 10px 26px rgba(0,0,0,.16)}
      body.dark #prayer #prayerStatus .wpc-city{color:#f2e4bf;text-shadow:none}
      body.dark #prayer #prayerStatus .wpc-kicker{color:#d1b36f}
      body.dark #prayer #prayerStatus .wpc-region{color:#aab9b0}
      body.dark #prayer #prayerStatus .wpc-zone{background:rgba(255,255,255,.035);border-color:rgba(183,148,82,.24);color:#aebbb4}
      @media(max-width:430px){
        #prayer .section-title:first-child{align-items:center!important;gap:9px!important}
        #prayer #prayerStatus{gap:5px!important}
        #prayer #prayerStatus .wpc-card{max-width:51vw;padding:8px 9px 8px 10px;border-radius:17px;gap:8px}
        #prayer #prayerStatus .wpc-pin{width:33px;height:33px;flex-basis:33px;border-radius:11px}
        #prayer #prayerStatus .wpc-pin svg{width:17px;height:17px}
        #prayer #prayerStatus .wpc-kicker{font-size:7.5px;margin-bottom:2px}
        #prayer #prayerStatus .wpc-city{font-size:18px;letter-spacing:-.3px}
        #prayer #prayerStatus .wpc-region{font-size:9px;margin-top:3px}
        #prayer #prayerStatus .wpc-zone{font-size:8px;padding:4px 7px}
        .wpc-locate{margin-left:15px;margin-right:15px;grid-template-columns:1fr;padding:12px}
        .wpc-locate #locatePrayerBtn{width:100%!important;min-height:52px!important;font-size:13px!important}
      }
    `;document.head.appendChild(s);
  }
  async function paint(){
    const status=document.getElementById('prayerStatus');if(!status)return false;
    let loc=read(LOC_KEY),cached=read(CITY_KEY);
    if(loc&&!samePlace(cached,loc)){cached=await resolveCity()||cached}
    if(!parts(cached).city){cached=await resolveCity()||cached}
    const p=parts(cached),city=p.city||'موقعك الحالي',region=p.region||'';
    const html=`<span class="wpc-card"><span class="wpc-pin" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg></span><span class="wpc-copy"><small class="wpc-kicker">موقع الصلاة</small><strong class="wpc-city">${esc(city)}</strong>${region?`<small class="wpc-region">${esc(region)}</small>`:''}</span></span><span class="wpc-zone"><span class="wpc-dot"></span>${zoneName()} • ${utcOffset()}</span>`;
    if(status.innerHTML!==html)status.innerHTML=html;
    return true;
  }
  function placeLocate(){
    const card=document.querySelector('.prayer-location-pro'),btn=document.getElementById('locatePrayerBtn');if(!card||!btn)return false;
    let row=document.getElementById('wpcLocate');
    if(!row){row=document.createElement('div');row.id='wpcLocate';row.className='wpc-locate';row.innerHTML='<div class="wpc-locate-copy"><b>تحديث موقع الصلاة</b><small>يستخدم GPS الدقيق لتحديث اسم المدينة ومواقيت الصلاة والقبلة حسب موقعك الفعلي.</small></div><div id="wpcLocateMount"></div>';const summary=card.querySelector('.plp-summary');if(summary)summary.insertAdjacentElement('afterend',row);else card.prepend(row)}
    const mount=row.querySelector('#wpcLocateMount');if(mount&&btn.parentElement!==mount)mount.appendChild(btn);
    if(!btn.disabled)btn.textContent='📍 تحديث موقعي بدقة';
    btn.setAttribute('aria-label','تحديث الموقع الدقيق لمواقيت الصلاة والقبلة');return true;
  }
  function refresh(){injectStyle();paint();placeLocate()}
  function boot(){
    let tries=0;const t=setInterval(()=>{tries++;refresh();if((document.getElementById('prayerStatus')&&document.getElementById('locatePrayerBtn'))||tries>55)clearInterval(t)},130);
    setTimeout(refresh,900);setTimeout(refresh,2300);setTimeout(refresh,5000);
    const mo=new MutationObserver(()=>{clearTimeout(mo._t);mo._t=setTimeout(refresh,45)});mo.observe(document.body,{childList:true,subtree:true});
    window.addEventListener('pageshow',()=>setTimeout(refresh,90));document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(refresh,90)});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

// Keep current app section after refresh.
(function(){
  const KEY='werd_active_page_v1';let restoring=true;
  function valid(id){const el=id&&document.getElementById(id);return!!(el&&el.classList?.contains('page'))}
  function remember(id){if(!id)return;if(id==='quran'||valid(id)){try{sessionStorage.setItem(KEY,id)}catch(_){}}}
  function active(){return document.querySelector('.page.active')?.id||''}
  function wrap(){const g=window.go;if(typeof g!=='function'||g.__werdPageStateWrapped)return false;function w(id,...args){remember(id);return g.call(this,id,...args)}w.__werdPageStateWrapped=true;window.go=w;return true}
  function restore(){let id='';try{id=sessionStorage.getItem(KEY)||''}catch(_){}if(!id||id==='home'){restoring=false;return true}if(typeof window.go!=='function')return false;if(id==='quran'||valid(id)){try{window.go(id);restoring=false;return true}catch(_){}}return false}
  function boot(){wrap();document.addEventListener('click',e=>{const n=e.target.closest?.('.nav[data-page]');if(n)remember(n.dataset.page)},true);window.addEventListener('beforeunload',()=>{const id=active();if(id)remember(id)});const main=document.querySelector('main');if(main)new MutationObserver(()=>{if(!restoring){const id=active();if(id)remember(id)}}).observe(main,{subtree:true,attributes:true,attributeFilter:['class']});let n=0,t=setInterval(()=>{n++;wrap();if(restore()||n>=60){clearInterval(t);restoring=false}},100);setTimeout(restore,0)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
