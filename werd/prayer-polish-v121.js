// Persistent premium GPS city header and clear location action for Werd
(function(){
  const STYLE_ID='werdPrayerCityV125Style';
  const CITY_KEY='werd_prayer_city_v1';
  const LOC_KEY='werd_prayer_location';
  let lookupPromise=null,painting=false;

  function read(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(_){return null}}
  function txt(v){return String(v||'').trim()}
  function esc(v){return txt(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function parts(c){
    if(!c)return{city:'',region:''};
    const city=txt(c.city),region=txt(c.region);
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
  async function reverseCity(lat,lon){
    try{
      const u=`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=14&addressdetails=1&accept-language=ar`;
      const r=await fetch(u,{cache:'no-store'});
      if(r.ok){
        const j=await r.json(),a=j.address||{};
        const city=a.city||a.town||a.village||a.hamlet||a.municipality||a.county||a.state_district||'';
        const region=a.state||a.region||'';
        if(city)return{city,region,country:a.country||''};
      }
    }catch(_){ }
    try{
      const u=`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&localityLanguage=ar`;
      const r=await fetch(u,{cache:'no-store'});
      if(r.ok){
        const j=await r.json(),city=j.locality||j.city||'',region=j.principalSubdivision||'';
        if(city)return{city,region,country:j.countryName||''};
      }
    }catch(_){ }
    return null;
  }
  async function resolveCity(){
    const loc=read(LOC_KEY);if(!loc||!Number.isFinite(Number(loc.latitude))||!Number.isFinite(Number(loc.longitude)))return null;
    const cached=read(CITY_KEY);if(samePlace(cached,loc)&&parts(cached).city)return cached;
    if(lookupPromise)return lookupPromise;
    lookupPromise=(async()=>{
      const found=await reverseCity(loc.latitude,loc.longitude);
      if(!found){lookupPromise=null;return cached||null}
      const out={...found,latitude:Number(loc.latitude),longitude:Number(loc.longitude),updatedAt:new Date().toISOString()};
      try{localStorage.setItem(CITY_KEY,JSON.stringify(out))}catch(_){ }
      lookupPromise=null;return out;
    })();
    return lookupPromise;
  }
  function injectStyle(){
    if(document.getElementById(STYLE_ID))return;
    document.querySelectorAll('#werdPrayerPremiumCityV124Style,#werdPrayerPolishV121Style').forEach(x=>x.remove());
    const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
      #prayer .section-title:first-child{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;align-items:center!important;gap:14px!important;margin-bottom:17px!important}
      #prayer .section-title:first-child>h3{grid-column:2!important;grid-row:1!important;margin:0!important}
      #prayer #prayerStatus{grid-column:1!important;grid-row:1!important;display:flex!important;flex-direction:column!important;align-items:flex-start!important;gap:6px!important;min-width:0!important;width:max-content!important;max-width:100%!important;color:inherit!important;text-align:right!important;direction:rtl!important;line-height:1!important;padding:0!important;background:none!important;border:0!important}
      #prayer #prayerStatus .wp-city-premium{position:relative;display:flex;align-items:center;gap:11px;min-width:190px;max-width:min(62vw,350px);padding:9px 13px 9px 15px;border:1.5px solid rgba(180,147,89,.40);border-radius:20px;background:linear-gradient(145deg,rgba(255,255,255,.96),rgba(249,240,219,.86));box-shadow:0 12px 28px rgba(18,70,53,.10),inset 0 1px 0 rgba(255,255,255,.98);overflow:hidden;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
      #prayer #prayerStatus .wp-city-premium:after{content:"";position:absolute;width:90px;height:90px;border:1px solid rgba(180,147,89,.13);border-radius:50%;left:-42px;bottom:-54px;pointer-events:none}
      #prayer #prayerStatus .wp-city-pin{width:39px;height:39px;flex:0 0 39px;border-radius:13px;display:grid;place-items:center;color:#f6e1ad;background:linear-gradient(145deg,#17795b,#07503d);box-shadow:0 9px 20px rgba(10,86,63,.22),0 0 0 3px rgba(180,147,89,.10)}
      #prayer #prayerStatus .wp-city-pin svg{width:19px;height:19px;display:block}
      #prayer #prayerStatus .wp-city-copy{display:flex;flex-direction:column;align-items:flex-start;min-width:0;direction:rtl;text-align:right}
      #prayer #prayerStatus .wp-city-kicker{display:block;margin-bottom:3px;font-family:"SF Arabic","Geeza Pro","Noto Sans Arabic","Segoe UI",Tahoma,sans-serif;font-size:8px;font-weight:900;line-height:1;color:#b08b43;letter-spacing:.25px}
      #prayer #prayerStatus .wp-city-name{display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:"SF Arabic","Geeza Pro","Noto Sans Arabic","Segoe UI",Tahoma,sans-serif;font-size:22px!important;font-weight:950!important;line-height:1.08!important;color:#07543f!important;letter-spacing:-.55px!important;text-shadow:0 1px 0 rgba(255,255,255,.8)}
      #prayer #prayerStatus .wp-city-region{display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:4px;font-family:"SF Arabic","Geeza Pro","Noto Sans Arabic","Segoe UI",Tahoma,sans-serif;font-size:10px!important;font-weight:750!important;line-height:1.2!important;color:#7d8981!important}
      #prayer #prayerStatus .wp-zone-pill{display:inline-flex;align-items:center;gap:6px;margin-inline-start:4px;padding:5px 10px;border:1px solid rgba(180,147,89,.26);border-radius:999px;background:rgba(255,253,247,.82);font-family:"SF Arabic","Geeza Pro","Segoe UI",Tahoma,sans-serif;font-size:9px!important;font-weight:850!important;color:#718078!important;white-space:nowrap;box-shadow:0 4px 12px rgba(32,68,54,.04)}
      #prayer #prayerStatus .wp-zone-dot{width:6px;height:6px;border-radius:50%;background:#148064;box-shadow:0 0 0 3px rgba(20,128,100,.09)}
      .prayer-location-pro .plp-head #plpLocateMount{display:none!important}
      .wp-locate-action{margin:3px 18px 17px;padding:13px;border:1px solid rgba(15,91,69,.14);border-radius:19px;background:linear-gradient(135deg,rgba(15,91,69,.065),rgba(180,147,89,.065));display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center}
      .wp-locate-copy b{display:block;font-size:13px;font-weight:900;color:var(--ink)}
      .wp-locate-copy small{display:block;margin-top:4px;font-size:10px;line-height:1.65;color:var(--muted)}
      .wp-locate-action #locatePrayerBtn{min-height:50px!important;padding:0 18px!important;border:0!important;border-radius:16px!important;background:linear-gradient(145deg,#137657,#09503d)!important;color:#fff!important;font-size:12.5px!important;font-weight:900!important;box-shadow:0 9px 21px rgba(15,91,69,.20)!important;white-space:nowrap!important}
      body.dark #prayer #prayerStatus .wp-city-premium{background:linear-gradient(145deg,rgba(34,59,50,.96),rgba(22,43,35,.90));border-color:rgba(180,147,89,.30);box-shadow:0 12px 28px rgba(0,0,0,.18)}
      body.dark #prayer #prayerStatus .wp-city-name{color:#f3e4bc!important;text-shadow:none}
      body.dark #prayer #prayerStatus .wp-city-kicker{color:#d1b36f}
      body.dark #prayer #prayerStatus .wp-city-region{color:#aab9b0!important}
      body.dark #prayer #prayerStatus .wp-zone-pill{background:rgba(255,255,255,.04);border-color:rgba(180,147,89,.25);color:#aebbb4!important}
      @media(max-width:430px){
        #prayer .section-title:first-child{gap:9px!important}
        #prayer #prayerStatus .wp-city-premium{min-width:0;max-width:57vw;padding:8px 10px;border-radius:17px;gap:8px}
        #prayer #prayerStatus .wp-city-pin{width:34px;height:34px;flex-basis:34px;border-radius:11px}
        #prayer #prayerStatus .wp-city-pin svg{width:17px;height:17px}
        #prayer #prayerStatus .wp-city-kicker{font-size:7px}
        #prayer #prayerStatus .wp-city-name{font-size:19px!important;letter-spacing:-.35px!important}
        #prayer #prayerStatus .wp-city-region{font-size:9px!important;margin-top:3px}
        #prayer #prayerStatus .wp-zone-pill{font-size:8px!important;padding:4px 7px}
        .wp-locate-action{margin-left:15px;margin-right:15px;grid-template-columns:1fr;padding:12px}
        .wp-locate-action #locatePrayerBtn{width:100%!important;min-height:52px!important;font-size:13px!important}
      }
    `;document.head.appendChild(s);
  }
  async function paintCity(force=false){
    const status=document.getElementById('prayerStatus');if(!status||painting)return false;
    painting=true;
    try{
      const loc=read(LOC_KEY);let cached=read(CITY_KEY);
      if(loc&&(!samePlace(cached,loc)||!parts(cached).city))cached=await resolveCity()||cached;
      const p=parts(cached),city=p.city||'موقعك الحالي',region=p.region||'';
      const current=status.querySelector('.wp-city-premium');
      if(!force&&current&&current.dataset.city===city&&current.dataset.region===region){painting=false;return true}
      status.innerHTML=`<span class="wp-city-premium" data-city="${esc(city)}" data-region="${esc(region)}"><span class="wp-city-pin" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg></span><span class="wp-city-copy"><small class="wp-city-kicker">الموقع الحالي</small><strong class="wp-city-name">${esc(city)}</strong>${region?`<small class="wp-city-region">${esc(region)}</small>`:''}</span></span><span class="wp-zone-pill"><span class="wp-zone-dot"></span>${zoneName()} • ${utcOffset()}</span>`;
      return true;
    }finally{painting=false}
  }
  function placeLocate(){
    const card=document.querySelector('.prayer-location-pro'),btn=document.getElementById('locatePrayerBtn');if(!card||!btn)return false;
    let row=document.getElementById('wpLocateAction');
    if(!row){
      row=document.createElement('div');row.id='wpLocateAction';row.className='wp-locate-action';
      row.innerHTML='<div class="wp-locate-copy"><b>تحديث موقع الصلاة</b><small>يستخدم GPS الدقيق لتحديث المدينة ومواقيت الصلاة والقبلة حسب موقعك الفعلي.</small></div><div id="wpLocateMount"></div>';
      const summary=card.querySelector('.plp-summary');if(summary)summary.insertAdjacentElement('afterend',row);else card.prepend(row);
    }
    const mount=row.querySelector('#wpLocateMount');if(mount&&btn.parentElement!==mount)mount.appendChild(btn);
    if(!btn.disabled)btn.textContent='📍 تحديث موقعي بدقة';
    return true;
  }
  function refresh(force=false){injectStyle();paintCity(force);placeLocate()}
  function boot(){
    injectStyle();
    let tries=0;const ready=setInterval(()=>{tries++;refresh(true);if(document.getElementById('prayerStatus')||tries>60)clearInterval(ready)},120);
    setTimeout(()=>refresh(true),700);setTimeout(()=>refresh(true),1800);setTimeout(()=>refresh(true),4000);
    const root=document.body;
    const mo=new MutationObserver(muts=>{
      if(painting)return;
      let relevant=false;
      for(const m of muts){
        const t=m.target?.nodeType===1?m.target:m.target?.parentElement;
        if(t&&(t.id==='prayerStatus'||t.closest?.('#prayerStatus')||t.closest?.('#prayer'))){relevant=true;break}
      }
      if(relevant){clearTimeout(mo._t);mo._t=setTimeout(()=>refresh(false),35)}
    });
    mo.observe(root,{childList:true,subtree:true,characterData:true});
    document.addEventListener('click',e=>{if(e.target.closest?.('#locatePrayerBtn')){setTimeout(()=>refresh(true),700);setTimeout(()=>refresh(true),1800);setTimeout(()=>refresh(true),3200)}},true);
    window.addEventListener('pageshow',()=>setTimeout(()=>refresh(true),80));
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(()=>refresh(true),80)});
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
