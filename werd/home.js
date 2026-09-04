// Smart daily home dashboard for Werd
(function(){
  const ALADHAN='https://api.aladhan.com/v1';
  const PRAYERS=[['Fajr','الفجر'],['Dhuhr','الظهر'],['Asr','العصر'],['Maghrib','المغرب'],['Isha','العشاء']];
  let prayerTimer=null,homeTimings=null,homePrayerMeta=null;

  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function cfg(){return state.prayer&&typeof state.prayer==='object'?{method:4,school:0,...state.prayer}:{method:4,school:0}}
  function getLocation(){try{return JSON.parse(localStorage.getItem('werd_prayer_location')||'null')}catch(e){return null}}
  function cleanTime(v){return String(v||'').match(/^\d{1,2}:\d{2}/)?.[0]||'--:--'}
  function format12(t){const m=cleanTime(t).match(/^(\d{1,2}):(\d{2})/);if(!m)return'--:--';let h=Number(m[1]),ap=h>=12?'م':'ص';h=h%12||12;return`${h}:${m[2]} ${ap}`}
  function minutes(t){const m=cleanTime(t).match(/^(\d+):(\d+)/);return m?Number(m[1])*60+Number(m[2]):null}
  function greeting(){const h=new Date().getHours();return h<5?'ليلة هادئة':h<12?'صباح الخير':h<17?'نهارك مبارك':h<21?'مساء الخير':'مساء هادئ'}
  function dayIndex(){const d=new Date(),start=new Date(d.getFullYear(),0,0);return Math.floor((d-start)/86400000)}

  function injectStyles(){
    if(document.getElementById('werdSmartHomeStyle'))return;
    const s=document.createElement('style');s.id='werdSmartHomeStyle';s.textContent=`
      .smart-head{display:flex;align-items:end;justify-content:space-between;gap:12px;margin:18px 0 10px}.smart-head h3{margin:0;font-size:19px}.smart-head span{font-size:12px;color:var(--muted)}
      .smart-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.smart-card{border:1px solid var(--line);background:var(--card);border-radius:20px;padding:15px;box-shadow:0 6px 18px rgba(25,64,50,.045);min-height:130px;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;position:relative}.smart-card.wide{grid-column:1/-1;min-height:auto}.smart-card .sc-top{display:flex;align-items:center;justify-content:space-between;gap:8px}.smart-card .sc-icon{font-size:23px}.smart-card .sc-kicker{font-size:11px;color:var(--muted)}.smart-card .sc-big{font-size:25px;font-weight:900;color:var(--green);margin-top:7px}.smart-card .sc-sub{font-size:12px;color:var(--muted);line-height:1.6;margin-top:4px}.smart-card .sc-action{border:0;background:transparent;color:var(--green);font-weight:800;padding:8px 0 0;text-align:right}.smart-progress{height:7px;border-radius:20px;background:var(--sage);overflow:hidden;margin-top:9px}.smart-progress span{display:block;height:100%;background:var(--green);border-radius:20px}.smart-prayer{background:linear-gradient(145deg,color-mix(in srgb,var(--sage) 55%,var(--card)),var(--card))}.smart-dhikr{background:linear-gradient(145deg,color-mix(in srgb,var(--sage) 35%,var(--card)),var(--card))}.smart-dhikr-text{font-size:16px;line-height:2.05;margin:9px 0 2px}.smart-hijri{font-size:11px;color:var(--muted);margin-top:3px}.smart-countdown{font-variant-numeric:tabular-nums}.home-old-last{display:none!important}
      @media(max-width:360px){.smart-grid{grid-template-columns:1fr}.smart-card.wide{grid-column:auto}}
    `;document.head.appendChild(s);
  }

  function injectDashboard(){
    injectStyles();const home=document.getElementById('home');if(!home||document.getElementById('smartDashboard'))return;
    const hero=home.querySelector('.hero');const wrap=document.createElement('div');wrap.id='smartDashboard';wrap.innerHTML=`
      <div class="smart-head"><div><span id="smartGreeting">${greeting()}</span><h3>يومك مع ورد</h3></div><span id="smartHijri">—</span></div>
      <div class="smart-grid">
        <div class="smart-card smart-prayer" id="smartPrayerCard"><div><div class="sc-top"><div><div class="sc-kicker">الصلاة القادمة</div><div class="sc-big" id="smartPrayerName">حدد موقعك</div></div><span class="sc-icon">🕌</span></div><div class="sc-sub" id="smartPrayerTime">لعرض مواقيت الصلاة والعد التنازلي</div><div class="smart-hijri" id="smartPrayerDate"></div></div><button class="sc-action" id="smartPrayerAction">فتح الصلاة ←</button></div>
        <div class="smart-card"><div><div class="sc-top"><div><div class="sc-kicker">ورد اليوم</div><div class="sc-big"><span id="smartRemaining">0</span> صفحة</div></div><span class="sc-icon">📖</span></div><div class="sc-sub" id="smartWirdSub">متبقية من هدف اليوم</div><div class="smart-progress"><span id="smartWirdProgress" style="width:0%"></span></div></div><button class="sc-action" id="smartWirdAction">أكمل القراءة ←</button></div>
        <div class="smart-card"><div><div class="sc-top"><div><div class="sc-kicker">الختمة</div><div class="sc-big" id="smartKhatmaPct">—</div></div><span class="sc-icon">📗</span></div><div class="sc-sub" id="smartKhatmaSub">ابدأ خطة ختمة تناسبك</div><div class="smart-progress"><span id="smartKhatmaProgress" style="width:0%"></span></div></div><button class="sc-action" id="smartKhatmaAction">فتح الختمة ←</button></div>
        <div class="smart-card"><div><div class="sc-top"><div><div class="sc-kicker">آخر قراءة</div><div class="sc-big" id="smartLastSurah">لم تبدأ بعد</div></div><span class="sc-icon">🔖</span></div><div class="sc-sub" id="smartLastSub">ابدأ من فهرس المصحف</div></div><button class="sc-action" id="smartLastAction">متابعة ←</button></div>
        <div class="smart-card wide smart-dhikr"><div class="sc-top"><div><div class="sc-kicker">ذكر اليوم</div><b id="smartDhikrTitle">من الأذكار الموثوقة</b></div><span class="sc-icon">🌿</span></div><div class="smart-dhikr-text" id="smartDhikrText">يظهر هنا ذكر من المصدر المحمّل داخل التطبيق.</div><div class="sc-sub" id="smartDhikrSource">—</div><button class="sc-action" id="smartDhikrAction">فتح الأذكار ←</button></div>
      </div>`;
    hero?.insertAdjacentElement('afterend',wrap);
    markOldLast();wire();renderHome();loadPrayerSummary();setTimeout(renderHome,1500);
  }

  function markOldLast(){
    const home=document.getElementById('home');if(!home)return;
    [...home.querySelectorAll('.section-title')].forEach(title=>{if(title.querySelector('h3')?.textContent.trim()==='آخر قراءة'){title.classList.add('home-old-last');let next=title.nextElementSibling;if(next)next.classList.add('home-old-last')}});
  }

  function wire(){
    document.getElementById('smartPrayerAction').onclick=()=>go('prayer');
    document.getElementById('smartPrayerCard').onclick=e=>{if(e.target.tagName!=='BUTTON')go('prayer')};
    document.getElementById('smartWirdAction').onclick=()=>go('quran');
    document.getElementById('smartKhatmaAction').onclick=()=>{if(typeof renderKhatma==='function')renderKhatma();go('khatma')};
    document.getElementById('smartLastAction').onclick=()=>{if(state.lastSurah&&typeof resumeReading==='function')resumeReading();else go('quran')};
    document.getElementById('smartDhikrAction').onclick=()=>go('adhkar');
  }

  function renderHome(){
    if(!document.getElementById('smartDashboard'))return;
    document.getElementById('smartGreeting').textContent=greeting();
    const goal=Math.max(1,Number(state.goal)||20),pages=Math.max(0,Number(state.pages)||0),remaining=Math.max(0,goal-pages),pct=Math.min(100,Math.round(pages/goal*100));
    document.getElementById('smartRemaining').textContent=remaining;document.getElementById('smartWirdProgress').style.width=pct+'%';document.getElementById('smartWirdSub').textContent=remaining?`${pages} من ${goal} صفحة • ${pct}٪ مكتمل`:'أتممت هدف اليوم، بارك الله في وقتك 🌿';
    const k=state.khatma||{},read=Math.max(0,Number(k.readPages)||0),total=Math.max(1,Number(k.totalPages)||604),kpct=k.active?Math.min(100,Math.round(read/total*100)):0;
    document.getElementById('smartKhatmaPct').textContent=k.active?kpct+'٪':'ابدأ';document.getElementById('smartKhatmaProgress').style.width=kpct+'%';document.getElementById('smartKhatmaSub').textContent=k.active?`${read} من ${total} صفحة • المتبقي ${Math.max(0,total-read)}`:'اختر خطة 30 أو 45 أو 60 أو 90 يومًا';
    const last=state.lastSurah;document.getElementById('smartLastSurah').textContent=last?.name||'لم تبدأ بعد';document.getElementById('smartLastSub').textContent=last?`سورة رقم ${last.number} • محفوظة تلقائيًا`:'اختر سورة من المصحف لبدء القراءة';
    renderDailyDhikr();
  }

  function renderDailyDhikr(){
    const list=(Array.isArray(adhkar)&&adhkar.length?adhkar:fallbackAdhkar).filter(x=>(x.content||x.zekr));if(!list.length)return;const x=list[dayIndex()%list.length],text=String(x.content||x.zekr||'').trim();
    document.getElementById('smartDhikrText').textContent=text.length>280?text.slice(0,280)+'…':text;document.getElementById('smartDhikrSource').textContent=x.source?`المصدر: ${x.source}`:'من أذكار التطبيق';
  }

  async function loadPrayerSummary(){
    const loc=getLocation();if(!loc){renderPrayerEmpty();return}const c=cfg();
    try{
      const now=new Date(),date=`${String(now.getDate()).padStart(2,'0')}-${String(now.getMonth()+1).padStart(2,'0')}-${now.getFullYear()}`;
      const r=await fetch(`${ALADHAN}/timings/${date}?latitude=${encodeURIComponent(loc.latitude)}&longitude=${encodeURIComponent(loc.longitude)}&method=${encodeURIComponent(c.method)}&school=${encodeURIComponent(c.school)}`);if(!r.ok)throw new Error('prayer');const j=await r.json();homeTimings=j.data?.timings||null;homePrayerMeta=j.data||null;renderPrayer();if(prayerTimer)clearInterval(prayerTimer);prayerTimer=setInterval(renderPrayer,1000);
    }catch(e){console.warn(e);document.getElementById('smartPrayerName').textContent='تعذر التحديث';document.getElementById('smartPrayerTime').textContent='افتح صفحة الصلاة للمحاولة مجددًا'}
  }

  function nextPrayer(){
    if(!homeTimings)return null;const now=new Date(),cur=now.getHours()*60+now.getMinutes()+now.getSeconds()/60;const list=PRAYERS.map(p=>({key:p[0],name:p[1],minute:minutes(homeTimings[p[0]])})).filter(x=>x.minute!=null);let n=list.find(x=>x.minute>cur),day=0;if(!n){n=list[0];day=1}return n?{...n,day}:null;
  }
  function renderPrayer(){
    const n=nextPrayer();if(!n||!homeTimings)return;const now=new Date(),target=new Date(now);target.setHours(Math.floor(n.minute/60),n.minute%60,0,0);if(n.day)target.setDate(target.getDate()+1);let sec=Math.max(0,Math.floor((target-now)/1000)),h=Math.floor(sec/3600);sec%=3600;const m=Math.floor(sec/60),s=sec%60;
    document.getElementById('smartPrayerName').textContent=n.name;document.getElementById('smartPrayerTime').innerHTML=`${format12(homeTimings[n.key])} • <span class="smart-countdown">بعد ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}</span>`;
    const hijri=homePrayerMeta?.date?.hijri;if(hijri){const txt=`${hijri.day} ${hijri.month?.ar||hijri.month?.en||''} ${hijri.year} هـ`;document.getElementById('smartHijri').textContent=txt;document.getElementById('smartPrayerDate').textContent=txt}
  }
  function renderPrayerEmpty(){document.getElementById('smartPrayerName').textContent='حدد موقعك';document.getElementById('smartPrayerTime').textContent='لعرض الصلاة القادمة والعد التنازلي';document.getElementById('smartPrayerAction').textContent='تحديد الموقع ←'}

  const baseRenderState=renderState;renderState=function(){baseRenderState();renderHome()};
  const baseGo=window.go||go;window.go=function(page){baseGo(page);if(page==='home'){renderHome();loadPrayerSummary()}};go=window.go;
  injectDashboard();
})();
