// Profile, synced devices and backup/restore for Werd
(function(){
  const DEVICE_ID_KEY='werd_device_id_v1';
  const DEVICE_NAME_KEY='werd_device_name_v1';
  const BACKUP_SCHEMA='werd-backup';
  const BACKUP_VERSION=1;
  const AVATARS=['🌿','📖','🕌','🌙','⭐','🤲'];
  let devicesBusy=false;

  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function ensureProfile(){
    if(!state.profile||typeof state.profile!=='object'||Array.isArray(state.profile))state.profile={};
    state.profile={name:'',avatar:'🌿',...state.profile};
    if(!AVATARS.includes(state.profile.avatar))state.profile.avatar='🌿';
    return state.profile;
  }
  function deviceId(){
    let id=localStorage.getItem(DEVICE_ID_KEY);if(id)return id;
    try{id=crypto.randomUUID()}catch(e){id='dev-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10)}
    localStorage.setItem(DEVICE_ID_KEY,id);return id;
  }
  function platformName(){
    const ua=navigator.userAgent||'';
    if(/iPhone/i.test(ua))return'iPhone';if(/iPad/i.test(ua))return'iPad';if(/Android/i.test(ua))return'Android';if(/Macintosh|Mac OS X/i.test(ua))return'Mac';if(/Windows/i.test(ua))return'Windows';if(/Linux/i.test(ua))return'Linux';return'جهاز';
  }
  function browserName(){
    const ua=navigator.userAgent||'';
    if(/EdgiOS|Edg\//.test(ua))return'Edge';if(/CriOS|Chrome\//.test(ua))return'Chrome';if(/FxiOS|Firefox\//.test(ua))return'Firefox';if(/Safari\//.test(ua))return'Safari';return'متصفح';
  }
  function defaultDeviceName(){return`${platformName()} • ${browserName()}`}
  function deviceName(){return localStorage.getItem(DEVICE_NAME_KEY)||defaultDeviceName()}
  function signedIn(){return typeof cloudUser!=='undefined'&&!!cloudUser}
  function historyTotals(){
    const h=state.activityHistory&&typeof state.activityHistory==='object'?state.activityHistory:{};let pages=0,tasbih=0,adhkar=0,days=0;
    Object.values(h).forEach(x=>{if(!x||typeof x!=='object')return;pages+=Number(x.pages)||0;tasbih+=Number(x.tasbih)||0;adhkar+=Number(x.adhkar)||0;if((Number(x.pages)||0)+(Number(x.tasbih)||0)+(Number(x.adhkar)||0)>0)days++});
    return{pages,tasbih,adhkar,days};
  }
  function formatDate(v){try{return new Intl.DateTimeFormat('ar-SA',{dateStyle:'medium',timeStyle:'short'}).format(new Date(v))}catch(e){return String(v||'—')}}

  function injectStyles(){
    if(document.getElementById('werdProfileStyle'))return;
    const s=document.createElement('style');s.id='werdProfileStyle';s.textContent=`
      .profile-hero{display:flex;align-items:center;gap:14px}.profile-avatar{width:70px;height:70px;border-radius:23px;background:linear-gradient(145deg,var(--green),#0a3f31);display:grid;place-items:center;font-size:32px;box-shadow:var(--shadow)}.profile-grow{flex:1;min-width:0}.profile-email{font-size:12px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .profile-input{width:100%;border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:14px;padding:12px;font:inherit}.avatar-row{display:flex;gap:8px;overflow:auto;padding:9px 0 2px}.avatar-choice{min-width:48px;height:48px;border-radius:15px;border:1px solid var(--line);background:var(--card);font-size:23px}.avatar-choice.active{outline:2px solid var(--green);background:var(--sage)}
      .profile-stats{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}.profile-stat{border:1px solid var(--line);background:var(--card);border-radius:18px;padding:14px}.profile-stat b{display:block;color:var(--green);font-size:24px}.profile-stat small{color:var(--muted)}
      .device-item{display:flex;align-items:center;gap:11px;padding:13px 0;border-bottom:1px solid var(--line)}.device-item:last-child{border-bottom:0}.device-icon{width:43px;height:43px;border-radius:14px;background:var(--sage);display:grid;place-items:center;font-size:20px}.device-main{flex:1;min-width:0}.device-main b,.device-main small{display:block}.device-main small{color:var(--muted);margin-top:3px;font-size:10px}.device-current{font-size:10px;border-radius:99px;padding:4px 7px;background:var(--sage);color:var(--green);font-weight:900}
      .backup-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px}.backup-btn{border-radius:16px;padding:13px;border:1px solid var(--line);background:var(--card);color:var(--ink);font-weight:900}.backup-btn.primary{background:var(--green);color:#fff;border-color:var(--green)}.profile-note{font-size:11px;line-height:1.75;color:var(--muted);margin-top:9px}
      @media(min-width:470px){.profile-stats{grid-template-columns:repeat(4,1fr)}}
    `;document.head.appendChild(s);
  }

  function injectPage(){
    injectStyles();ensureProfile();const main=document.querySelector('main');if(!main)return;
    if(!document.getElementById('profile')){
      const sec=document.createElement('section');sec.className='page';sec.id='profile';sec.innerHTML=`
        <div class="section-title"><h3>الملف الشخصي</h3><button class="smallbtn" id="profileBack">المزيد</button></div>
        <div class="card profile-hero"><div class="profile-avatar" id="profileAvatar">🌿</div><div class="profile-grow"><b id="profileDisplayName">ورد</b><div class="profile-email" id="profileEmail">حفظ محلي</div></div><span class="badge" id="profileCloudBadge">محلي</span></div>
        <div class="card"><b>بياناتك في ورد</b><div style="margin-top:12px"><label class="muted" for="profileNameInput">الاسم المعروض</label><input class="profile-input" id="profileNameInput" maxlength="40" autocomplete="name" placeholder="اكتب اسمك"></div><div class="avatar-row" id="profileAvatars">${AVATARS.map(a=>`<button class="avatar-choice" data-profile-avatar="${a}">${a}</button>`).join('')}</div><button class="primary" id="saveProfileBtn" style="margin-top:10px">حفظ الملف الشخصي</button></div>
        <div class="section-title"><h3>ملخصك</h3><span>من سجل ورد</span></div><div class="profile-stats"><div class="profile-stat"><b id="profileStreak">0</b><small>سلسلة حالية</small></div><div class="profile-stat"><b id="profilePages">0</b><small>صفحة مسجلة</small></div><div class="profile-stat"><b id="profileSaved">0</b><small>محفوظات</small></div><div class="profile-stat"><b id="profileDays">0</b><small>أيام نشطة</small></div></div>
        <div class="section-title"><h3>الأجهزة المتزامنة</h3><button class="smallbtn" id="refreshDevices">تحديث</button></div><div class="card"><div class="row"><div><b>اسم هذا الجهاز</b><div class="muted">يظهر في قائمة أجهزتك فقط</div></div></div><div class="row" style="margin-top:10px"><input class="profile-input" id="currentDeviceName" maxlength="60" style="flex:1"><button class="smallbtn" id="saveDeviceName">حفظ</button></div><div id="deviceList" style="margin-top:9px"><div class="muted">سجّل الدخول لعرض الأجهزة المتزامنة.</div></div><div class="profile-note">إزالة جهاز من هذه القائمة لا تسجّل خروجه تلقائيًا؛ إنها تزيل سجل الجهاز من قائمة ورد فقط.</div></div>
        <div class="section-title"><h3>النسخة الاحتياطية</h3><span>ملف خاص بورد</span></div><div class="card"><div class="backup-actions"><button class="backup-btn primary" id="exportWerdData">تصدير البيانات</button><button class="backup-btn" id="importWerdData">استعادة نسخة</button></div><input type="file" id="importWerdFile" accept="application/json,.json" hidden><div class="profile-note">يتضمن الملف التقدم والإعدادات والمفضلة وسجل النشاط. إذا كان موقع الصلاة محفوظًا فسيُضمّن أيضًا. لا يتم تصدير كلمة المرور أو جلسة تسجيل الدخول.</div></div>`;main.appendChild(sec);
    }
    const grid=document.querySelector('#more .more-grid');if(grid&&!document.getElementById('moreProfileTile')){const b=document.createElement('button');b.className='more-tile';b.id='moreProfileTile';b.innerHTML='<span class="mi">👤</span><b>الملف الشخصي</b><small>الحساب والأجهزة والنسخ الاحتياطي</small>';b.onclick=()=>go('profile');grid.insertBefore(b,grid.firstChild)}
    wire();refreshProfile();refreshProfileSurfaces();
  }

  function wire(){
    document.getElementById('profileBack').onclick=()=>go('more');
    document.querySelectorAll('[data-profile-avatar]').forEach(b=>b.onclick=()=>{ensureProfile().avatar=b.dataset.profileAvatar;paintAvatars()});
    document.getElementById('saveProfileBtn').onclick=saveProfile;
    document.getElementById('refreshDevices').onclick=()=>loadDevices(true);
    document.getElementById('saveDeviceName').onclick=saveCurrentDeviceName;
    document.getElementById('exportWerdData').onclick=exportBackup;
    document.getElementById('importWerdData').onclick=()=>document.getElementById('importWerdFile').click();
    document.getElementById('importWerdFile').onchange=importBackup;
    const moreAccount=document.getElementById('moreAccountBtn');if(moreAccount)moreAccount.onclick=()=>go('profile');
  }

  function paintAvatars(){const p=ensureProfile();document.querySelectorAll('[data-profile-avatar]').forEach(b=>b.classList.toggle('active',b.dataset.profileAvatar===p.avatar));document.getElementById('profileAvatar').textContent=p.avatar}
  function refreshProfile(){
    const p=ensureProfile(),tot=historyTotals(),fav=(state.favorites?.ayahs?.length||0)+(state.favorites?.adhkar?.length||0)+(state.bookmarks?.length||0)+(state.faithFavorites?.length||0);
    const input=document.getElementById('profileNameInput');if(!input)return;input.value=p.name||'';document.getElementById('profileDisplayName').textContent=p.name||'ورد';document.getElementById('profileEmail').textContent=signedIn()?(cloudUser.email||'حساب ورد'):'حفظ محلي • سجّل الدخول للمزامنة';document.getElementById('profileCloudBadge').textContent=signedIn()?'سحابي ✓':'محلي';document.getElementById('profileStreak').textContent=Number(state.streak)||0;document.getElementById('profilePages').textContent=tot.pages;document.getElementById('profileSaved').textContent=fav;document.getElementById('profileDays').textContent=tot.days;document.getElementById('currentDeviceName').value=deviceName();paintAvatars();
    if(signedIn())loadDevices(false);else document.getElementById('deviceList').innerHTML='<div class="muted">سجّل الدخول من الصفحة الرئيسية لتفعيل مزامنة الأجهزة.</div>';
  }
  function refreshProfileSurfaces(){
    const p=ensureProfile(),name=p.name||((typeof cloudUser!=='undefined'&&cloudUser?.email)?cloudUser.email.split('@')[0]:'ورد');
    const moreAvatar=document.querySelector('#more .more-avatar');if(moreAvatar)moreAvatar.textContent=p.avatar;
    const moreTitle=document.getElementById('moreAccountTitle');if(moreTitle)moreTitle.textContent=name;
  }
  function saveProfile(){const p=ensureProfile(),v=document.getElementById('profileNameInput').value.trim().slice(0,40);p.name=v;save();refreshProfile();refreshProfileSurfaces();toast('تم حفظ الملف الشخصي ✓')}

  async function registerDevice(){
    if(!signedIn()||!navigator.onLine)return false;const id=deviceId(),name=deviceName();
    try{const {error}=await sb.from('werd_devices').upsert({user_id:cloudUser.id,device_id:id,device_name:name,platform:platformName(),browser:browserName(),last_seen:new Date().toISOString()},{onConflict:'user_id,device_id'});if(error)throw error;return true}catch(e){console.warn('werd device sync',e);return false}
  }
  async function loadDevices(showToast=false){
    const box=document.getElementById('deviceList');if(!box||devicesBusy)return;if(!signedIn()){box.innerHTML='<div class="muted">سجّل الدخول لعرض الأجهزة المتزامنة.</div>';return}devicesBusy=true;box.innerHTML='<div class="loading">جاري تحديث الأجهزة…</div>';
    try{await registerDevice();const {data,error}=await sb.from('werd_devices').select('device_id,device_name,platform,browser,last_seen,created_at').order('last_seen',{ascending:false});if(error)throw error;renderDevices(data||[]);if(showToast)toast('تم تحديث قائمة الأجهزة ✓')}catch(e){console.error(e);box.innerHTML='<div class="muted">تعذر تحميل الأجهزة الآن.</div>';if(showToast)toast('تعذر تحديث الأجهزة')}finally{devicesBusy=false}
  }
  function renderDevices(rows){
    const box=document.getElementById('deviceList'),current=deviceId();if(!rows.length){box.innerHTML='<div class="muted">لا توجد أجهزة مسجلة بعد.</div>';return}
    box.innerHTML=rows.map(r=>`<div class="device-item"><div class="device-icon">${r.platform==='iPhone'||r.platform==='Android'?'📱':'💻'}</div><div class="device-main"><b>${esc(r.device_name||r.platform||'جهاز ورد')}</b><small>${esc([r.platform,r.browser].filter(Boolean).join(' • '))}</small><small>آخر نشاط: ${esc(formatDate(r.last_seen))}</small></div>${r.device_id===current?'<span class="device-current">هذا الجهاز</span>':`<button class="smallbtn" data-remove-device="${esc(r.device_id)}">إزالة</button>`}</div>`).join('');
    box.querySelectorAll('[data-remove-device]').forEach(b=>b.onclick=()=>removeDevice(b.dataset.removeDevice));
  }
  async function saveCurrentDeviceName(){const input=document.getElementById('currentDeviceName'),name=input.value.trim().slice(0,60)||defaultDeviceName();localStorage.setItem(DEVICE_NAME_KEY,name);input.value=name;if(signedIn()){await registerDevice();await loadDevices(false)}toast('تم حفظ اسم الجهاز ✓')}
  async function removeDevice(id){if(!signedIn()||id===deviceId())return;if(!confirm('إزالة هذا الجهاز من قائمة الأجهزة المتزامنة؟'))return;try{const {error}=await sb.from('werd_devices').delete().eq('device_id',id);if(error)throw error;await loadDevices(false);toast('تمت إزالة الجهاز من القائمة')}catch(e){console.error(e);toast('تعذر إزالة الجهاز الآن')}}

  function prayerLocation(){try{return JSON.parse(localStorage.getItem('werd_prayer_location')||'null')}catch(e){return null}}
  function exportBackup(){
    try{const payload={schema:BACKUP_SCHEMA,version:BACKUP_VERSION,exportedAt:new Date().toISOString(),state:state,prayerLocation:prayerLocation()};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`werd-backup-${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('تم تجهيز نسخة ورد الاحتياطية ✓')}catch(e){console.error(e);toast('تعذر تصدير البيانات')}
  }
  async function importBackup(e){
    const input=e.target,file=input.files?.[0];input.value='';if(!file)return;if(file.size>2*1024*1024){toast('ملف النسخة الاحتياطية أكبر من الحد المسموح');return}
    try{const text=await file.text(),data=JSON.parse(text);if(data?.schema!==BACKUP_SCHEMA||!data.state||typeof data.state!=='object'||Array.isArray(data.state))throw new Error('invalid');if(!confirm('سيتم استبدال بيانات ورد الحالية بالنسخة المختارة. هل تريد المتابعة؟'))return;
      const imported=JSON.parse(JSON.stringify(data.state));state={...defaults,...imported};localStorage.setItem('ward_state_v3',JSON.stringify(state));
      const loc=data.prayerLocation;if(loc&&Number.isFinite(Number(loc.latitude))&&Number.isFinite(Number(loc.longitude)))localStorage.setItem('werd_prayer_location',JSON.stringify(loc));
      if(signedIn())await syncNow(false);toast('تمت استعادة النسخة بنجاح ✓');setTimeout(()=>location.reload(),500);
    }catch(err){console.error(err);toast('الملف ليس نسخة احتياطية صالحة من ورد')}
  }

  const baseGo=window.go||go;window.go=function(page){baseGo(page);if(page==='profile'){document.querySelectorAll('.bottom .nav').forEach(n=>n.classList.remove('active'));document.querySelector('.bottom .nav[data-page="more"]')?.classList.add('active');refreshProfile();registerDevice()}};go=window.go;
  const baseRenderState=renderState;renderState=function(){baseRenderState();refreshProfileSurfaces();if(document.getElementById('profile')?.classList.contains('active'))refreshProfile()};
  if(typeof sb!=='undefined')sb.auth.onAuthStateChange(()=>setTimeout(()=>{refreshProfile();refreshProfileSurfaces();registerDevice()},180));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')registerDevice()});
  injectPage();setTimeout(()=>registerDevice(),400);
})();