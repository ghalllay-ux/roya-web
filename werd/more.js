// Werd More hub and unified settings
(function(){
  const RECITERS=[
    ['ar.alafasy','مشاري العفاسي'],
    ['ar.abdurrahmaansudais','عبدالرحمن السديس'],
    ['ar.mahermuaiqly','ماهر المعيقلي'],
    ['ar.husary','محمود خليل الحصري'],
    ['ar.hudhaify','علي الحذيفي'],
    ['ar.saoodshuraym','سعود الشريم'],
    ['ar.ahmedajamy','أحمد العجمي'],
    ['ar.abdullahbasfar','عبدالله بصفر']
  ];
  const TAFSIRS=[['ar.muyassar','التفسير الميسر'],['ar.jalalayn','تفسير الجلالين']];
  const MORE_CHILDREN=new Set(['more','settings','plan','khatma','listening','prayer','favorites','bookmarks','stats']);

  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]))}
  function readerPrefs(){
    if(!state.readerPrefs||typeof state.readerPrefs!=='object')state.readerPrefs={};
    state.readerPrefs={fontSize:26,reciter:'ar.alafasy',tafsir:'ar.muyassar',...state.readerPrefs};
    return state.readerPrefs;
  }
  function listeningPrefs(){
    if(!state.listening||typeof state.listening!=='object')state.listening={};
    state.listening={reciter:'ar.alafasy',speed:1,lastSurah:1,lastSurahName:'الفاتحة',lastAyah:1,...state.listening};
    return state.listening;
  }

  function injectStyles(){
    if(document.getElementById('werdMoreStyle'))return;
    const s=document.createElement('style');s.id='werdMoreStyle';s.textContent=`
      .more-hero{display:flex;align-items:center;gap:14px}.more-avatar{width:58px;height:58px;border-radius:18px;background:linear-gradient(145deg,var(--green),#0a3f31);color:#f6e5bd;display:grid;place-items:center;font-size:23px;font-weight:900;box-shadow:var(--shadow)}
      .more-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.more-tile{border:1px solid var(--line);background:var(--card);border-radius:19px;padding:16px;text-align:right;color:var(--ink);min-height:92px;box-shadow:0 5px 16px rgba(26,64,50,.04)}
      .more-tile:active{transform:scale(.98)}.more-tile .mi{font-size:25px;display:block;margin-bottom:8px}.more-tile b{display:block}.more-tile small{display:block;color:var(--muted);margin-top:4px;line-height:1.5}
      .settings-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 0;border-bottom:1px solid var(--line)}.settings-row:last-child{border-bottom:0}.settings-value{display:flex;align-items:center;gap:7px}
      .settings-select{max-width:190px;border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:12px;padding:9px}.settings-number{min-width:42px;text-align:center;font-weight:900}
      .settings-switch{position:relative;width:48px;height:28px;border:0;border-radius:30px;background:#c8cec9;padding:0}.settings-switch span{position:absolute;width:22px;height:22px;border-radius:50%;background:white;top:3px;right:3px;transition:.2s;box-shadow:0 2px 6px #0002}.settings-switch.on{background:var(--green)}.settings-switch.on span{right:23px}
      .more-section-note{font-size:12px;color:var(--muted);line-height:1.7}.more-version{text-align:center;color:var(--muted);font-size:11px;padding:16px}
      @media(min-width:470px){.more-grid{grid-template-columns:repeat(3,1fr)}}
    `;document.head.appendChild(s);
  }

  function injectPages(){
    injectStyles();readerPrefs();listeningPrefs();const main=document.querySelector('main');if(!main)return;
    if(!document.getElementById('more')){
      const sec=document.createElement('section');sec.className='page';sec.id='more';sec.innerHTML=`
        <div class="section-title"><h3>المزيد</h3><span>كل أدوات ورد</span></div>
        <div class="card more-hero"><div class="more-avatar">ورد</div><div style="flex:1"><b id="moreAccountTitle">ورد</b><div class="muted" id="moreAccountSub">حفظ محلي • يمكنك تفعيل المزامنة</div></div><button class="smallbtn" id="moreAccountBtn">الحساب</button></div>
        <div class="section-title"><h3>العبادة والمتابعة</h3><span>وصول سريع</span></div>
        <div class="more-grid">
          <button class="more-tile" data-more-page="plan"><span class="mi">◔</span><b>الورد اليومي</b><small>هدف الصفحات والتقدم</small></button>
          <button class="more-tile" data-more-page="khatma"><span class="mi">📗</span><b>الختمة</b><small>خطتك حتى إتمام القرآن</small></button>
          <button class="more-tile" data-more-page="listening"><span class="mi">🎧</span><b>الاستماع</b><small>القراء والسور والمشغل</small></button>
          <button class="more-tile" data-more-page="prayer"><span class="mi">🕌</span><b>الصلاة والقبلة</b><small>المواقيت والقبلة والهجري</small></button>
          <button class="more-tile" data-more-page="favorites"><span class="mi">♥️</span><b>المفضلة</b><small>الآيات والأذكار المحفوظة</small></button>
          <button class="more-tile" data-more-page="bookmarks"><span class="mi">🔖</span><b>علامات القراءة</b><small>ارجع مباشرة لمواضعك</small></button>
          <button class="more-tile" data-more-page="stats"><span class="mi">📊</span><b>الإنجاز</b><small>ملخص تقدمك اليومي</small></button>
          <button class="more-tile" id="moreNotifications"><span class="mi">🔔</span><b>التنبيهات</b><small>الأذكار والورد والصلاة</small></button>
          <button class="more-tile" data-more-page="settings"><span class="mi">⚙️</span><b>الإعدادات</b><small>المصحف والصوت والمظهر</small></button>
        </div>
        <div class="more-version">ورد • PWA Cloud</div>`;main.appendChild(sec);
    }
    if(!document.getElementById('settings')){
      const sec=document.createElement('section');sec.className='page';sec.id='settings';sec.innerHTML=`
        <div class="section-title"><h3>الإعدادات</h3><button class="smallbtn" id="settingsBack">المزيد</button></div>
        <div class="card"><b>المظهر</b><div class="settings-row"><div><b>الوضع الليلي</b><div class="muted">مريح للقراءة ليلًا</div></div><button class="settings-switch" id="settingsDark"><span></span></button></div></div>
        <div class="card"><b>المصحف</b>
          <div class="settings-row"><div><b>حجم خط الآيات</b><div class="muted">من 20 إلى 38</div></div><div class="settings-value"><button class="smallbtn" id="fontMinus">−</button><span class="settings-number" id="fontValue">26</span><button class="smallbtn" id="fontPlus">+</button></div></div>
          <div class="settings-row"><div><b>قارئ المصحف</b><div class="muted">للاستماع داخل صفحة الآية</div></div><select class="settings-select" id="settingsReaderReciter">${RECITERS.map(r=>`<option value="${r[0]}">${r[1]}</option>`).join('')}</select></div>
          <div class="settings-row"><div><b>التفسير الافتراضي</b></div><select class="settings-select" id="settingsTafsir">${TAFSIRS.map(x=>`<option value="${x[0]}">${x[1]}</option>`).join('')}</select></div>
        </div>
        <div class="card"><b>الاستماع</b><div class="settings-row"><div><b>القارئ الافتراضي</b><div class="muted">في شاشة الاستماع</div></div><select class="settings-select" id="settingsListenReciter">${RECITERS.map(r=>`<option value="${r[0]}">${r[1]}</option>`).join('')}</select></div></div>
        <div class="card"><b>الورد</b><div class="settings-row"><div><b>الهدف اليومي</b><div class="muted">عدد الصفحات</div></div><div class="settings-value"><button class="smallbtn" id="goalMinus">−5</button><span class="settings-number" id="goalValue">20</span><button class="smallbtn" id="goalPlus">+5</button></div></div></div>
        <div class="card"><b>الحساب والبيانات</b><div class="settings-row"><div><b>المزامنة السحابية</b><div class="muted" id="settingsCloudState">غير مسجل</div></div><button class="smallbtn" id="settingsSync">الحساب</button></div><div class="settings-row"><div><b>إعدادات الصلاة</b><div class="muted">الموقع وطريقة الحساب والتنبيهات</div></div><button class="smallbtn" id="settingsPrayer">فتح</button></div><div class="more-section-note">يحفظ ورد التقدم محليًا دائمًا، ويزامنه سحابيًا عند تسجيل الدخول.</div></div>
        <div class="more-version">الإصدار PWA • المزامنة السحابية مفعّلة عند تسجيل الدخول</div>`;main.appendChild(sec);
    }
    wire();refreshMore();refreshSettings();
  }

  function accountHome(){go('home');setTimeout(()=>document.getElementById('authCard')?.scrollIntoView({behavior:'smooth',block:'center'}),80)}
  function notificationsHome(){go('home');setTimeout(()=>document.getElementById('werdNotificationsCard')?.scrollIntoView({behavior:'smooth',block:'center'}),100)}

  function wire(){
    document.querySelectorAll('[data-more-page]').forEach(b=>b.onclick=()=>{
      const p=b.dataset.morePage;if(p==='khatma'&&typeof renderKhatma==='function')renderKhatma();if(p==='favorites'&&typeof renderFavorites==='function')renderFavorites('ayahs');if(p==='bookmarks'&&typeof renderBookmarks==='function')renderBookmarks();go(p);
    });
    const a=document.getElementById('moreAccountBtn');if(a)a.onclick=accountHome;
    const n=document.getElementById('moreNotifications');if(n)n.onclick=notificationsHome;
    document.getElementById('settingsBack').onclick=()=>go('more');
    document.getElementById('settingsDark').onclick=()=>{document.getElementById('darkBtn')?.click();setTimeout(refreshSettings,30)};
    document.getElementById('fontMinus').onclick=()=>changeFont(-2);
    document.getElementById('fontPlus').onclick=()=>changeFont(2);
    document.getElementById('goalMinus').onclick=()=>{changeGoal(-5);refreshSettings()};
    document.getElementById('goalPlus').onclick=()=>{changeGoal(5);refreshSettings()};
    document.getElementById('settingsReaderReciter').onchange=e=>{readerPrefs().reciter=e.target.value;save();toast('تم حفظ قارئ المصحف ✓')};
    document.getElementById('settingsTafsir').onchange=e=>{readerPrefs().tafsir=e.target.value;save();toast('تم حفظ التفسير الافتراضي ✓')};
    document.getElementById('settingsListenReciter').onchange=e=>{listeningPrefs().reciter=e.target.value;save();toast('تم حفظ قارئ الاستماع ✓')};
    document.getElementById('settingsSync').onclick=accountHome;
    document.getElementById('settingsPrayer').onclick=()=>go('prayer');
  }

  function changeFont(delta){const p=readerPrefs();p.fontSize=Math.max(20,Math.min(38,(Number(p.fontSize)||26)+delta));save();refreshSettings();toast(`حجم خط المصحف: ${p.fontSize}`)}

  function refreshMore(){
    const title=document.getElementById('moreAccountTitle'),sub=document.getElementById('moreAccountSub'),btn=document.getElementById('moreAccountBtn');if(!title)return;
    if(typeof cloudUser!=='undefined'&&cloudUser){title.textContent=cloudUser.email||'حساب ورد';sub.textContent='المزامنة السحابية مفعلة ✓';btn.textContent='إدارة'}else{title.textContent='ورد';sub.textContent='حفظ محلي • سجّل الدخول للمزامنة';btn.textContent='تسجيل الدخول'}
  }
  function refreshSettings(){
    readerPrefs();listeningPrefs();const dark=document.getElementById('settingsDark');if(!dark)return;
    const isDark=document.body.classList.contains('dark');dark.classList.toggle('on',isDark);
    document.getElementById('fontValue').textContent=readerPrefs().fontSize;
    document.getElementById('settingsReaderReciter').value=readerPrefs().reciter;
    document.getElementById('settingsTafsir').value=readerPrefs().tafsir;
    document.getElementById('settingsListenReciter').value=listeningPrefs().reciter;
    document.getElementById('goalValue').textContent=Number(state.goal)||20;
    const cloud=document.getElementById('settingsCloudState'),btn=document.getElementById('settingsSync');
    if(typeof cloudUser!=='undefined'&&cloudUser){cloud.textContent='متصل • '+(cloudUser.email||'حساب ورد');btn.textContent='مزامنة/إدارة'}else{cloud.textContent='غير مسجل • الحفظ محلي';btn.textContent='تسجيل الدخول'}
  }

  function markMoreNav(page){
    if(!MORE_CHILDREN.has(page))return;document.querySelectorAll('.bottom .nav').forEach(n=>n.classList.remove('active'));document.querySelector('.bottom .nav[data-page="more"]')?.classList.add('active');
  }

  const baseGo=window.go||go;
  window.go=function(page){baseGo(page);if(page==='more')refreshMore();if(page==='settings')refreshSettings();markMoreNav(page)};
  go=window.go;
  const baseRenderState=renderState;renderState=function(){baseRenderState();refreshMore();refreshSettings()};
  if(typeof sb!=='undefined')sb.auth.onAuthStateChange(()=>setTimeout(()=>{refreshMore();refreshSettings()},100));

  injectPages();
})();