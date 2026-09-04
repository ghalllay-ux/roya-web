// Werd live visitor presence + privacy-conscious admin analytics — v1
(function(){
  const VISITOR_KEY='werd_visitor_id_v1';
  const $=id=>document.getElementById(id);
  let timer=null,isAdmin=false,analyticsReady=false;

  function fmt(n){try{return new Intl.NumberFormat('ar-SA').format(Math.max(0,Number(n)||0))}catch(_){return String(Math.max(0,Number(n)||0))}}
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function notify(m){try{typeof toast==='function'?toast(m):console.log(m)}catch(_){console.log(m)}}

  function visitorId(){
    let id='';try{id=localStorage.getItem(VISITOR_KEY)||''}catch(_){}
    if(id)return id;
    try{id=crypto.randomUUID?crypto.randomUUID():`w-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`}catch(_){id=`w-${Date.now()}-${Math.random().toString(36).slice(2)}`}
    try{localStorage.setItem(VISITOR_KEY,id)}catch(_){}
    return id;
  }

  function profile(){
    const ua=navigator.userAgent||'',platform=navigator.platform||'';
    const ipad=/iPad/.test(ua)||(platform==='MacIntel'&&navigator.maxTouchPoints>1);
    const mobile=/iPhone|iPod|Android.*Mobile|Mobile/.test(ua);
    const tablet=ipad||/Android/.test(ua)&&!/Mobile/.test(ua);
    let device_type=tablet?'جهاز لوحي':mobile?'جوال':'كمبيوتر';
    let os_name=/iPhone|iPad|iPod/.test(ua)||ipad?'iOS':/Android/.test(ua)?'Android':/Windows/.test(ua)?'Windows':/Mac OS X|Macintosh/.test(ua)?'macOS':/Linux/.test(ua)?'Linux':'أخرى';
    let browser_name=/EdgiOS|Edg\//.test(ua)?'Edge':/CriOS/.test(ua)?'Chrome':/FxiOS/.test(ua)?'Firefox':/OPiOS|OPR\//.test(ua)?'Opera':/Chrome\//.test(ua)?'Chrome':/Firefox\//.test(ua)?'Firefox':/Safari\//.test(ua)&&/Version\//.test(ua)?'Safari':'أخرى';
    return{device_type,os_name,browser_name};
  }

  function addStyle(){
    if($('werdPresenceStyle'))return;const s=document.createElement('style');s.id='werdPresenceStyle';s.textContent=`
      #werdVisitorCounter .werd-visitor-grid.werd-live-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}
      #werdVisitorCounter .werd-live-grid .werd-visitor-stat{min-width:0;padding:14px 9px;text-align:center}
      #werdVisitorCounter .werd-live-grid .werd-visitor-stat strong{font-size:27px}
      #werdVisitorCounter .werd-live-grid .werd-visitor-stat small,#werdVisitorCounter .werd-live-grid .werd-visitor-stat span{font-size:10px}
      .werd-live-pulse{display:inline-block;width:8px;height:8px;border-radius:50%;background:#16845f;box-shadow:0 0 0 5px rgba(22,132,95,.10);margin-inline-end:5px}
      .wva-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin:12px 0}.wva-stat{padding:16px 10px;border-radius:18px;border:1px solid var(--line);background:var(--card);text-align:center}.wva-stat b{display:block;font-size:27px;color:var(--green)}.wva-stat small{font-size:10px;color:var(--muted)}
      .wva-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.wva-card{border:1px solid var(--line);background:var(--card);border-radius:20px;padding:15px}.wva-card h4{margin:0 0 11px;color:var(--green);font-size:16px}.wva-list{display:grid;gap:8px}.wva-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid rgba(120,120,120,.12)}.wva-row:last-child{border-bottom:0}.wva-row span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.wva-row b{color:var(--green);font-variant-numeric:tabular-nums}.wva-empty{color:var(--muted);font-size:11px;padding:10px 0}.wva-note{font-size:10px;color:var(--muted);line-height:1.8;margin-top:10px}
      @media(max-width:520px){.wva-grid{grid-template-columns:1fr}.wva-summary{gap:7px}.wva-stat{padding:13px 5px}.wva-stat b{font-size:23px}#werdVisitorCounter .werd-live-grid .werd-visitor-stat strong{font-size:23px}}
    `;document.head.appendChild(s)
  }

  function injectOnline(){
    addStyle();const grid=document.querySelector('#werdVisitorCounter .werd-visitor-grid');if(!grid)return false;grid.classList.add('werd-live-grid');if($('werdVisitorOnline'))return true;
    const d=document.createElement('div');d.className='werd-visitor-stat';d.innerHTML='<small><i class="werd-live-pulse"></i>متصلون الآن</small><strong id="werdVisitorOnline">٠</strong><span>آخر دقيقتين</span>';grid.appendChild(d);return true
  }
  function setOnline(n){injectOnline();const el=$('werdVisitorOnline');if(el)el.textContent=fmt(n)}

  async function heartbeat(){
    if(document.visibilityState==='hidden')return;
    const body={visitor_id:visitorId(),...profile()};
    try{
      const r=await fetch('/api/visitor-presence',{method:'POST',headers:{'content-type':'application/json','cache-control':'no-store'},body:JSON.stringify(body),cache:'no-store'});const j=await r.json();if(r.ok&&Number.isFinite(Number(j.online_now)))setOnline(j.online_now)
    }catch(e){console.warn('Werd presence',e)}
  }

  function regionName(code){
    if(!code)return'غير محدد';try{return new Intl.DisplayNames(['ar'],{type:'region'}).of(String(code).toUpperCase())||code}catch(_){return code}
  }
  function listHtml(arr,label){
    if(!Array.isArray(arr)||!arr.length)return'<div class="wva-empty">لا توجد بيانات كافية بعد.</div>';
    return '<div class="wva-list">'+arr.map(x=>`<div class="wva-row"><span>${esc(label(x))}</span><b>${fmt(x.count)}</b></div>`).join('')+'</div>'
  }

  function injectAnalyticsPage(){
    addStyle();if($('werdVisitorAnalytics'))return;const main=document.querySelector('main');if(!main)return;
    const sec=document.createElement('section');sec.id='werdVisitorAnalytics';sec.className='page';sec.innerHTML=`
      <div class="section-title"><h3>تحليلات الزوار</h3><button class="smallbtn" id="wvaBack" type="button">المزيد</button></div>
      <div class="card"><div class="row"><div><b>نظرة مباشرة</b><div class="muted">إحصاءات مجهولة الهوية لتحسين «ورد»</div></div><button class="smallbtn" id="wvaRefresh" type="button">تحديث</button></div><div class="wva-summary"><div class="wva-stat"><b id="wvaOnline">—</b><small>متصلون الآن</small></div><div class="wva-stat"><b id="wvaUnique">—</b><small>زوار فريدون</small></div><div class="wva-stat"><b id="wvaVisits">—</b><small>إجمالي الزيارات</small></div></div></div>
      <div class="wva-grid" style="margin-top:10px"><div class="wva-card"><h4>🌍 الدول</h4><div id="wvaCountries"></div></div><div class="wva-card"><h4>📍 المدن التقريبية</h4><div id="wvaCities"></div></div><div class="wva-card"><h4>📱 نوع الجهاز</h4><div id="wvaDevices"></div></div><div class="wva-card"><h4>⚙️ نظام التشغيل</h4><div id="wvaOS"></div></div><div class="wva-card"><h4>🌐 المتصفح</h4><div id="wvaBrowsers"></div></div></div>
      <div class="wva-note">🔒 لا تُجمع أسماء الزوار أو أرقامهم أو بريدهم. المدينة تقريبية حسب شبكة الاتصال وقد لا تكون دقيقة دائمًا.</div>`;
    main.appendChild(sec);$('wvaBack').onclick=()=>{try{go('more')}catch(_){}};$('wvaRefresh').onclick=loadAnalytics
  }

  function injectAdminTile(){
    if(!isAdmin||$('visitorAnalyticsTile'))return;const grid=document.querySelector('#more .more-grid');if(!grid)return;
    const b=document.createElement('button');b.id='visitorAnalyticsTile';b.className='more-tile';b.type='button';b.innerHTML='<span class="mi">📈</span><b>تحليلات الزوار</b><small>الحاليون والأجهزة والمواقع</small>';b.onclick=()=>openAnalytics();grid.appendChild(b)
  }

  async function checkAdmin(){
    try{const {data,error}=await sb.rpc('is_werd_admin');if(error)throw error;isAdmin=!!data;if(isAdmin){injectAnalyticsPage();injectAdminTile()}}catch(_){isAdmin=false}
  }
  async function openAnalytics(){
    injectAnalyticsPage();try{go('werdVisitorAnalytics')}catch(_){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));$('werdVisitorAnalytics')?.classList.add('active')}await loadAnalytics()
  }
  window.openWerdVisitorAnalytics=openAnalytics;

  async function loadAnalytics(){
    if(!isAdmin)return;const b=$('wvaRefresh');if(b){b.disabled=true;b.textContent='جاري التحديث…'}
    try{
      const {data,error}=await sb.rpc('get_werd_admin_visitor_analytics');if(error)throw error;const x=data||{};
      $('wvaOnline').textContent=fmt(x.online_now);$('wvaUnique').textContent=fmt(x.unique_visitors);$('wvaVisits').textContent=fmt(x.total_visits);
      $('wvaCountries').innerHTML=listHtml(x.countries,z=>regionName(z.country_code));
      $('wvaCities').innerHTML=listHtml(x.cities,z=>`${z.city||'غير محدد'}${z.country_code?' • '+regionName(z.country_code):''}`);
      $('wvaDevices').innerHTML=listHtml(x.devices,z=>z.name||'غير محدد');
      $('wvaOS').innerHTML=listHtml(x.operating_systems,z=>z.name||'غير محدد');
      $('wvaBrowsers').innerHTML=listHtml(x.browsers,z=>z.name||'غير محدد');
      setOnline(x.online_now)
    }catch(e){console.error('Werd visitor analytics',e);notify('تعذر تحميل تحليلات الزوار الآن')}
    finally{if(b){b.disabled=false;b.textContent='تحديث'}}
  }

  function start(){
    addStyle();let tries=0;const injectTimer=setInterval(()=>{tries++;if(injectOnline()||tries>30)clearInterval(injectTimer)},250);
    setTimeout(heartbeat,1600);timer=setInterval(heartbeat,45000);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')heartbeat()});window.addEventListener('pageshow',()=>setTimeout(heartbeat,600));
    setTimeout(checkAdmin,1800);setInterval(()=>{if(!isAdmin)checkAdmin()},15000)
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
