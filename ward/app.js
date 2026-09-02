const SUPABASE_URL='https://oajqczrxzurwvxjkbseq.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_9LTupYVJR3kKTL4xqj3pdw_vA67W-o4';
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession:true, autoRefreshToken:true, detectSessionInUrl:true }
});
let cloudUser=null, cloudSaveTimer=null, cloudBusy=false;

const API_QURAN='https://api.alquran.cloud/v1';
const ADHKAR_URL='https://raw.githubusercontent.com/Seen-Arabic/Morning-And-Evening-Adhkar-DB/main/ar.json';

const fallbackSurahs=[
 {number:1,name:'سُورَةُ ٱلْفَاتِحَةِ',englishName:'Al-Faatiha',numberOfAyahs:7,revelationType:'Meccan'},
 {number:2,name:'سُورَةُ البَقَرَةِ',englishName:'Al-Baqara',numberOfAyahs:286,revelationType:'Medinan'},
 {number:18,name:'سُورَةُ الكَهْفِ',englishName:'Al-Kahf',numberOfAyahs:110,revelationType:'Meccan'},
 {number:36,name:'سُورَةُ يسٓ',englishName:'Yaseen',numberOfAyahs:83,revelationType:'Meccan'},
 {number:67,name:'سُورَةُ المُلْكِ',englishName:'Al-Mulk',numberOfAyahs:30,revelationType:'Meccan'}
];
const fallbackAdhkar=[
 {order:1,content:'أَصْـبَحْنا وَأَصْـبَحَ المُلْكُ لله، وَالحَمدُ لله، لا إلهَ إلاّ اللّهُ وَحدَهُ لا شَريكَ له، لهُ المُـلكُ ولهُ الحَمْـد، وهُوَ على كلّ شَيءٍ قدير.',count:1,type:1,source:'حصن المسلم'},
 {order:2,content:'اللّهـمَّ أَنْتَ رَبِّـي لا إلهَ إلاّ أَنْتَ، خَلَقْتَنـي وَأَنا عَبْـدُك، وَأَنا عَلـى عَهْـدِكَ وَوَعْـدِكَ ما اسْتَطَـعْت.',count:1,type:0,source:'سيد الاستغفار'},
 {order:3,content:'حَسْبِـيَ اللهُ لا إلهَ إلاّ هُوَ، عَلَـيهِ تَوَكَّـلتُ، وَهُوَ رَبُّ العَرْشِ العَظـيم.',count:7,type:0,source:'ذكر صباح ومساء'}
];

const defaults={goal:20,pages:0,tasbih:0,adhkarDone:{},lastSurah:null,dark:false,date:'',streak:1};
let state=loadState(), surahs=[], adhkar=[], currentAdhkarType='morning';

function todayKey(){return new Date().toISOString().slice(0,10)}
function loadState(){
 let s={...defaults};
 try{
   const raw=localStorage.getItem('ward_state_v3')||localStorage.getItem('ward_state_v2')||'{}';
   s={...s,...JSON.parse(raw)};
 }catch(e){}
 if(s.date!==todayKey()){s.pages=0;s.adhkarDone={};s.tasbih=0;s.date=todayKey()}
 return s;
}
function save(){
 localStorage.setItem('ward_state_v3',JSON.stringify(state));
 renderState();
 queueCloudSave();
}
function queueCloudSave(){
 if(!cloudUser || !navigator.onLine) return;
 clearTimeout(cloudSaveTimer);
 cloudSaveTimer=setTimeout(()=>syncNow(false),650);
}
async function syncNow(showMessage=false){
 if(!cloudUser || cloudBusy) return;
 if(!navigator.onLine){setCloudStatus('بانتظار الإنترنت','offline'); if(showMessage)toast('لا يوجد اتصال • سيُرفع التقدم تلقائيًا لاحقًا'); return}
 cloudBusy=true; setCloudStatus('جاري الحفظ…','syncing');
 try{
  const payload={...state,_client_saved_at:new Date().toISOString()};
  const {error}=await sb.from('ward_user_state').upsert(
    {user_id:cloudUser.id,state:payload,updated_at:new Date().toISOString()},
    {onConflict:'user_id'}
  );
  if(error) throw error;
  setCloudStatus('محفوظ سحابيًا ✓','ok');
  if(showMessage) toast('تمت المزامنة السحابية ✓');
 }catch(err){
  console.error(err); setCloudStatus('تعذر الحفظ مؤقتًا','error');
  if(showMessage) toast('تعذر الحفظ السحابي الآن');
 }finally{cloudBusy=false}
}
function toast(msg){let t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800)}
function go(id){
 document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));document.getElementById(id).classList.add('active');
 document.querySelectorAll('.nav').forEach(n=>n.classList.toggle('active',n.dataset.page===id));window.scrollTo({top:0,behavior:'smooth'});
 renderState();
}
document.querySelectorAll('.nav').forEach(n=>n.onclick=()=>go(n.dataset.page));

function setCloudStatus(text,kind=''){
 const el=document.getElementById('cloudState'); if(el)el.textContent=text;
 const badge=document.getElementById('syncBadge'); if(badge)badge.textContent=text;
}
function renderAuth(){
 const out=document.getElementById('signedOutBox'), inn=document.getElementById('signedInBox');
 if(!out||!inn)return;
 out.style.display=cloudUser?'none':'block'; inn.style.display=cloudUser?'block':'none';
 if(cloudUser){
  document.getElementById('accountEmail').textContent=cloudUser.email||'حساب ورد';
  setCloudStatus(navigator.onLine?'سحابي ومتصّل':'سحابي • دون اتصال');
 }else setCloudStatus('محلي مؤقتًا');
}
async function cloudSignup(){
 const email=document.getElementById('authEmail').value.trim();
 const password=document.getElementById('authPassword').value;
 if(!email||password.length<6){toast('أدخل بريدًا صحيحًا وكلمة مرور 6 أحرف على الأقل');return}
 setCloudStatus('إنشاء الحساب…');
 const {data,error}=await sb.auth.signUp({email,password});
 if(error){console.error(error);toast(error.message||'تعذر إنشاء الحساب');renderAuth();return}
 if(data.session){
  cloudUser=data.user; renderAuth(); await mergeCloudState(); toast('تم إنشاء الحساب وتفعيل الحفظ السحابي ✓');
 }else{
  toast('تم إنشاء الحساب • تحقق من بريدك لتأكيد الحساب ثم سجل الدخول');
  setCloudStatus('بانتظار تأكيد البريد');
 }
}
async function cloudLogin(){
 const email=document.getElementById('authEmail').value.trim();
 const password=document.getElementById('authPassword').value;
 if(!email||!password){toast('أدخل البريد وكلمة المرور');return}
 setCloudStatus('تسجيل الدخول…');
 const {data,error}=await sb.auth.signInWithPassword({email,password});
 if(error){console.error(error);toast('تعذر تسجيل الدخول: '+(error.message||''));renderAuth();return}
 cloudUser=data.user; renderAuth(); await mergeCloudState(); toast('تم تسجيل الدخول والمزامنة ✓');
}
async function cloudLogout(){
 await syncNow(false);
 const {error}=await sb.auth.signOut();
 if(error){toast('تعذر تسجيل الخروج');return}
 cloudUser=null; renderAuth(); toast('تم تسجيل الخروج • ستبقى نسخة محلية على الجهاز');
}
async function mergeCloudState(){
 if(!cloudUser)return;
 setCloudStatus('جاري استعادة بياناتك…');
 try{
  const {data,error}=await sb.from('ward_user_state').select('state,updated_at').eq('user_id',cloudUser.id).maybeSingle();
  if(error)throw error;
  if(data?.state){
    state={...defaults,...data.state};
    if(state.date!==todayKey()){state.pages=0;state.adhkarDone={};state.tasbih=0;state.date=todayKey()}
    localStorage.setItem('ward_state_v3',JSON.stringify(state));
    renderState();
    setCloudStatus('تمت الاستعادة ✓');
    await syncNow(false);
  }else{
    await syncNow(false);
    setCloudStatus('تم رفع بيانات هذا الجهاز ✓');
  }
 }catch(err){console.error(err);setCloudStatus('تعذر الاستعادة مؤقتًا');}
}
async function initCloud(){
 const {data:{session}}=await sb.auth.getSession();
 cloudUser=session?.user||null; renderAuth();
 if(cloudUser) await mergeCloudState();
 sb.auth.onAuthStateChange((event,session)=>{
   const next=session?.user||null;
   const changed=(next?.id||null)!==(cloudUser?.id||null);
   cloudUser=next; renderAuth();
   if(changed && cloudUser) setTimeout(()=>mergeCloudState(),0);
 });
}

function renderState(){
 const pct=Math.min(100,Math.round(state.pages/state.goal*100));
 document.getElementById('homeProgress').style.width=pct+'%';document.getElementById('homePct').textContent=pct+'٪ إنجاز';
 document.getElementById('homeGoalText').textContent=`${state.pages} من ${state.goal} صفحة • ${pct? 'استمر، أنت على الطريق الصحيح':'ابدأ وردك بهدوء'}`;
 document.getElementById('streak').textContent=`${state.streak} يوم متتالٍ 🌿`;
 document.getElementById('goalPages').textContent=state.goal;document.getElementById('goalInline').textContent=state.goal;document.getElementById('readPages').textContent=state.pages;
 document.getElementById('readInline').textContent=state.pages;document.getElementById('planProgress').style.width=pct+'%';
 document.getElementById('counter').textContent=state.tasbih;document.getElementById('tasbihGoal').textContent=`${state.tasbih%33} / 33`;document.getElementById('tasbihToday').textContent=state.tasbih;
 const morningComplete=Object.keys(state.adhkarDone).filter(k=>k.startsWith('morning:')).length;
 document.getElementById('morningDone').textContent=morningComplete?`${morningComplete} مكتمل`:'غير مكتمل';
 document.getElementById('statPages').textContent=state.pages;document.getElementById('statTasbih').textContent=state.tasbih;document.getElementById('statAdhkar').textContent=Object.keys(state.adhkarDone).length;
 document.getElementById('statGoal').textContent=state.goal+' صفحة';document.getElementById('statTheme').textContent=state.dark?'مفعل':'غير مفعل';
 if(state.lastSurah){document.getElementById('lastSurahName').textContent=state.lastSurah.name;document.getElementById('lastSurahMeta').textContent=`سورة رقم ${state.lastSurah.number}`;document.getElementById('statSurah').textContent=state.lastSurah.name}else document.getElementById('statSurah').textContent='—';
 document.body.classList.toggle('dark',!!state.dark);
}
function changeGoal(delta){state.goal=Math.max(5,Math.min(100,state.goal+delta));save();toast('تم تحديث هدف الورد')}
function markPageRead(){state.pages=Math.min(state.goal,state.pages+1);save();toast('تم تسجيل صفحة في ورد اليوم ✓')}
document.getElementById('tapBtn').onclick=()=>{state.tasbih++;save();if(navigator.vibrate)navigator.vibrate(18)};
function resetTasbih(){state.tasbih=0;save();toast('تم تصفير المسبحة')}
document.getElementById('darkBtn').onclick=()=>{state.dark=!state.dark;save()};
document.getElementById('syncBtn').onclick=()=>{if(cloudUser)syncNow(true);else{go('home');document.getElementById('authCard')?.scrollIntoView({behavior:'smooth'});toast('سجّل الدخول لتفعيل الحفظ السحابي')}};
function toggleFavInfo(){toast('المفضلة ستُربط بالآيات والأذكار في النسخة التالية')}

async function initQuran(){
 const status=document.getElementById('quranStatus');
 try{
  const r=await fetch(API_QURAN+'/surah');if(!r.ok)throw new Error('network');
  const j=await r.json();surahs=j.data;status.textContent='114 سورة • مصدر مباشر';renderSurahs(surahs);
 }catch(e){surahs=fallbackSurahs;status.textContent='وضع دون اتصال • فهرس مختصر';renderSurahs(surahs)}
}
function renderSurahs(list){
 const box=document.getElementById('surahList');
 box.innerHTML=list.map(s=>`<div class="surah" onclick="openSurah(${s.number})"><div class="num">${s.number}</div><div class="grow"><b>${s.name}</b><small>${s.numberOfAyahs} آية • ${s.revelationType==='Meccan'?'مكية':'مدنية'}</small></div><span>‹</span></div>`).join('');
}
function filterSurahs(){
 const q=document.getElementById('surahSearch').value.trim();if(!q){renderSurahs(surahs);return}
 renderSurahs(surahs.filter(s=>(s.name+' '+s.englishName).toLowerCase().includes(q.toLowerCase())));
}
document.getElementById('surahSearch').addEventListener('input',filterSurahs);

async function openSurah(n){
 document.getElementById('surahList').style.display='none';document.getElementById('reader').style.display='block';document.getElementById('ayahs').innerHTML='<div class="loading">جاري تحميل نص السورة…</div>';
 try{
  const r=await fetch(`${API_QURAN}/surah/${n}/quran-uthmani`);if(!r.ok)throw new Error('network');
  const j=await r.json(),s=j.data;
  document.getElementById('readerName').textContent=s.name;document.getElementById('readerMeta').textContent=`${s.numberOfAyahs} آية • ${s.revelationType==='Meccan'?'مكية':'مدنية'}`;
  document.getElementById('ayahs').innerHTML=s.ayahs.map(a=>`<div class="ayah">${a.text} <span class="an">${a.numberInSurah}</span></div>`).join('');
  state.lastSurah={number:s.number,name:s.name};save();
 }catch(e){
  let s=surahs.find(x=>x.number===n)||fallbackSurahs[0];
  document.getElementById('readerName').textContent=s.name;document.getElementById('readerMeta').textContent='النص الكامل يحتاج اتصالًا بالإنترنت';
  document.getElementById('ayahs').innerHTML='<div class="offline">تعذر جلب نص السورة الآن. الفهرس والحفظ والتقدم ما زالت تعمل دون اتصال.</div>';
  state.lastSurah={number:s.number,name:s.name};save();
 }
}
function closeReader(){document.getElementById('reader').style.display='none';document.getElementById('surahList').style.display='block'}
function resumeReading(){if(state.lastSurah){go('quran');openSurah(state.lastSurah.number)}else{go('quran');toast('اختر سورة لبدء القراءة')}}

async function initAdhkar(){
 try{
  const r=await fetch(ADHKAR_URL);if(!r.ok)throw new Error('network');adhkar=await r.json();
  document.getElementById('adhkarStatus').textContent='حصن المسلم • مصدر مفتوح';
 }catch(e){adhkar=fallbackAdhkar;document.getElementById('adhkarStatus').textContent='وضع دون اتصال • نسخة مختصرة'}
 renderAdhkar();
}
function normalizedItems(){
 const morning=currentAdhkarType==='morning';
 return adhkar.filter(x=>{
   let t=Number(x.type);
   return t===0 || (morning?t===1:t===2);
 }).slice(0,24);
}
function renderAdhkar(){
 const items=normalizedItems(), box=document.getElementById('adhkarList');
 box.innerHTML=items.map((x,i)=>{
  const key=`${currentAdhkarType}:${x.order??i}`,done=!!state.adhkarDone[key],count=Number(x.count)||1;
  return `<div class="card"><div class="row"><b>${done?'تم الذكر ✓':'ذكر '+(i+1)}</b><span class="badge">${count} ×</span></div><p class="dhikr">${x.content||x.zekr||''}</p><div class="row"><span class="muted">${x.source||'حصن المسلم'}</span><button class="smallbtn" onclick="completeDhikr('${key}')">${done?'مكتمل':'تم'}</button></div></div>`
 }).join('')||'<div class="offline">لا توجد عناصر متاحة في هذا التصنيف.</div>';
}
function completeDhikr(key){state.adhkarDone[key]=true;save();renderAdhkar();toast('تم حفظ إنجاز الذكر ✓')}
document.querySelectorAll('.chip[data-type]').forEach(c=>c.onclick=()=>{
 document.querySelectorAll('.chip[data-type]').forEach(x=>x.classList.remove('active'));c.classList.add('active');currentAdhkarType=c.dataset.type;renderAdhkar()
});

window.addEventListener('online',()=>{toast('عاد الاتصال • تتم المزامنة السحابية'); if(cloudUser)syncNow(false)});window.addEventListener('offline',()=>{setCloudStatus(cloudUser?'سحابي • بانتظار الإنترنت':'محلي مؤقتًا');toast('وضع دون اتصال • الحفظ المحلي مستمر')});
renderState();initCloud();initQuran();initAdhkar();

let deferredInstallPrompt = null;

function isIOS(){
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}
function isStandalone(){
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}
function setupInstallUI(){
  const card = document.getElementById('installCard');
  const btn = document.getElementById('installBtn');
  const hint = document.getElementById('installHint');
  if(!card || !btn || !hint) return;

  if(isStandalone()){
    card.style.display='none';
    return;
  }

  if(isIOS()){
    card.style.display='block';
    btn.textContent='طريقة التثبيت';
    hint.textContent='على iPhone: افتح قائمة المشاركة ثم اختر «إضافة إلى الشاشة الرئيسية».';
    btn.onclick=()=>toast('على iPhone: مشاركة ← إضافة إلى الشاشة الرئيسية');
  }
}

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredInstallPrompt = e;
  const card = document.getElementById('installCard');
  const btn = document.getElementById('installBtn');
  if(card) card.style.display='block';
  if(btn){
    btn.textContent='تثبيت';
    btn.onclick=async()=>{
      if(!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      if(card) card.style.display='none';
    };
  }
});

window.addEventListener('appinstalled', ()=>{
  const card = document.getElementById('installCard');
  if(card) card.style.display='none';
  if(window.toast) toast('تم تثبيت ورد ✓');
});

if('serviceWorker' in navigator){
  window.addEventListener('load', async ()=>{
    try{
      await navigator.serviceWorker.register('./service-worker.js', {scope:'./'});
      console.log('Ward PWA service worker registered');
    }catch(err){
      console.error('Service worker registration failed', err);
    }
  });
}

document.addEventListener('DOMContentLoaded', setupInstallUI);
