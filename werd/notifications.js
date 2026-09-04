// Werd smart push notifications — guest-ready v113
const WERD_VAPID_PUBLIC_KEY='BD4YQqbmbU_MGC1WZgAz_e4UD-B6LBEnHY7anbnMlKAvezo7yB_jbd_HrtZa2dRS_H3T5kivFDSjzv9fYRupJi0';
const WERD_VAPID_VERSION=2;
const WERD_PUSH_SUBSCRIPTION_URL='https://oajqczrxzurwvxjkbseq.supabase.co/functions/v1/werd-push-subscription';
const WERD_PUSH_CLIENT_TOKEN_KEY='werd_push_client_token_v1';

function werdNotifDefaults(){return{morning:{enabled:true,time:'06:30'},evening:{enabled:true,time:'18:00'},wird:{enabled:true,time:'20:00'},timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||'Asia/Riyadh',pushEnabled:false,vapidVersion:0}}
function ensureWerdNotifState(){const d=werdNotifDefaults();state.notifications={...d,...(state.notifications||{})};state.notifications.morning={...d.morning,...(state.notifications.morning||{})};state.notifications.evening={...d.evening,...(state.notifications.evening||{})};state.notifications.wird={...d.wird,...(state.notifications.wird||{})}}
function el(id){return document.getElementById(id)}
function b64ToUint8(s){const padding='='.repeat((4-s.length%4)%4),base64=(s+padding).replace(/-/g,'+').replace(/_/g,'/'),raw=atob(base64),out=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out}
function isWerdStandalone(){return !!(window.matchMedia?.('(display-mode: standalone)').matches||navigator.standalone===true)}
function isWerdIOS(){return /iphone|ipad|ipod/i.test(navigator.userAgent||'')}
function pushApiSupported(){return 'Notification'in window&&'serviceWorker'in navigator&&'PushManager'in window}
function werdPushClientToken(){let t='';try{t=localStorage.getItem(WERD_PUSH_CLIENT_TOKEN_KEY)||''}catch(_){}if(t.length>=32)return t;try{t=crypto.randomUUID?`${crypto.randomUUID()}-${crypto.randomUUID()}`:`${Date.now()}-${Math.random()}-${Math.random()}`}catch(_){t=`${Date.now()}-${Math.random()}-${Math.random()}`}try{localStorage.setItem(WERD_PUSH_CLIENT_TOKEN_KEY,t)}catch(_){}return t}

function injectWerdNotificationUI(){
 ensureWerdNotifState();if(el('werdNotificationsCard'))return;const auth=el('authCard');if(!auth)return;
 const wrap=document.createElement('div');wrap.innerHTML=`<div class="section-title"><h3>التنبيهات الذكية</h3><span id="werdNotifStatus">جاري التحقق…</span></div><div class="card" id="werdNotificationsCard"><div class="row"><div><b>تنبيهات ورد</b><div class="muted">أذكار الصباح والمساء والورد القرآني</div></div><button class="smallbtn" id="werdEnableNotif">تفعيل</button></div><div class="list-item"><label><input type="checkbox" id="wnMorningOn"> أذكار الصباح</label><input class="werd-time" type="time" id="wnMorningTime"></div><div class="list-item"><label><input type="checkbox" id="wnEveningOn"> أذكار المساء</label><input class="werd-time" type="time" id="wnEveningTime"></div><div class="list-item"><label><input type="checkbox" id="wnWirdOn"> الورد اليومي</label><input class="werd-time" type="time" id="wnWirdTime"></div><div class="row" style="margin-top:12px"><button class="smallbtn" id="werdTestNotif">إرسال تنبيه تجريبي</button><button class="smallbtn" id="werdDisableNotif" style="display:none">إيقاف التنبيهات</button></div><div class="muted" style="margin-top:10px;line-height:1.8" id="werdNotifNote">تعمل التنبيهات حسب المنطقة الزمنية لجهازك.</div></div>`;auth.insertAdjacentElement('afterend',wrap);
 const style=document.createElement('style');style.textContent='.werd-time{border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:12px;padding:8px}.card input[type=checkbox]{accent-color:var(--green);width:18px;height:18px;vertical-align:middle}#werdEnableNotif.werd-install-needed{background:var(--green);color:#fff;border-color:var(--green);font-weight:900}';document.head.appendChild(style);
 const n=state.notifications;el('wnMorningOn').checked=n.morning.enabled;el('wnMorningTime').value=n.morning.time;el('wnEveningOn').checked=n.evening.enabled;el('wnEveningTime').value=n.evening.time;el('wnWirdOn').checked=n.wird.enabled;el('wnWirdTime').value=n.wird.time;
 ['wnMorningOn','wnMorningTime','wnEveningOn','wnEveningTime','wnWirdOn','wnWirdTime'].forEach(id=>el(id).addEventListener('change',saveWerdNotifPrefs));el('werdEnableNotif').onclick=enableWerdPush;el('werdDisableNotif').onclick=disableWerdPush;el('werdTestNotif').onclick=testWerdNotification;refreshWerdNotifStatus();
}
function currentWerdPrefs(){return{morning:{enabled:el('wnMorningOn')?.checked??true,time:el('wnMorningTime')?.value||'06:30'},evening:{enabled:el('wnEveningOn')?.checked??true,time:el('wnEveningTime')?.value||'18:00'},wird:{enabled:el('wnWirdOn')?.checked??true,time:el('wnWirdTime')?.value||'20:00'}}}
async function saveWerdNotifPrefs(){if(!el('werdNotificationsCard'))return;ensureWerdNotifState();state.notifications={...state.notifications,...currentWerdPrefs(),timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||'Asia/Riyadh'};save();const sub=await getWerdPushSubscription().catch(()=>null);if(sub)await syncWerdPushRecord(false);toast('تم حفظ أوقات التنبيهات ✓')}
async function getWerdPushSubscription(){if(!('serviceWorker'in navigator)||!('PushManager'in window))return null;const reg=await navigator.serviceWorker.ready;return reg.pushManager.getSubscription()}
async function makeWerdSubscription(){const reg=await navigator.serviceWorker.ready;return reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64ToUint8(WERD_VAPID_PUBLIC_KEY)})}
async function werdPushHeaders(){const h={'Content-Type':'application/json','apikey':typeof SUPABASE_PUBLISHABLE_KEY!=='undefined'?SUPABASE_PUBLISHABLE_KEY:'sb_publishable_9LTupYVJR3kKTL4xqj3pdw_vA67W-o4'};try{if(typeof sb!=='undefined'){const{data}=await sb.auth.getSession();const token=data?.session?.access_token;if(token)h.Authorization='Bearer '+token}}catch(_){}return h}
async function postWerdPush(body){const res=await fetch(WERD_PUSH_SUBSCRIPTION_URL,{method:'POST',headers:await werdPushHeaders(),body:JSON.stringify({...body,client_token:werdPushClientToken()})});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data?.error||'PUSH_SAVE_FAILED');return data}
async function syncWerdPushRecord(showToast=true){
 ensureWerdNotifState();let sub=await getWerdPushSubscription(),oldEndpoint=null,oldJson=null;
 if(typeof Notification!=='undefined'&&Notification.permission==='granted'&&state.notifications.vapidVersion!==WERD_VAPID_VERSION){
  try{if(sub){oldEndpoint=sub.endpoint;oldJson=sub.toJSON();await sub.unsubscribe()}sub=await makeWerdSubscription();state.notifications.vapidVersion=WERD_VAPID_VERSION;state.notifications.pushEnabled=true;save()}catch(e){console.error('Push key migration',e);if(showToast)toast('تعذر تحديث اشتراك التنبيهات');return false}
 }
 if(!sub)return false;
 const j=sub.toJSON();try{await postWerdPush({action:'upsert',endpoint:sub.endpoint,p256dh:j.keys?.p256dh||'',auth:j.keys?.auth||'',timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||'Asia/Riyadh',preferences:currentWerdPrefs()});if(oldEndpoint&&oldEndpoint!==sub.endpoint){await postWerdPush({action:'delete',endpoint:oldEndpoint,p256dh:oldJson?.keys?.p256dh||'',auth:oldJson?.keys?.auth||''}).catch(()=>{})}}
 catch(error){console.error(error);if(showToast)toast('تعذر حفظ اشتراك التنبيهات');return false}
 state.notifications.pushEnabled=true;state.notifications.vapidVersion=WERD_VAPID_VERSION;save();refreshWerdNotifStatus();if(showToast)toast('تم تفعيل تنبيهات ورد ✓');return true;
}
function openWerdInstallForNotifications(){
 const btn=el('installBtn');if(btn){btn.click();setTimeout(()=>el('installCard')?.scrollIntoView({behavior:'smooth',block:'center'}),80);return}
 el('installCard')?.scrollIntoView({behavior:'smooth',block:'center'});toast('ثبّت ورد على الشاشة الرئيسية ثم افتحه من الأيقونة')
}
async function enableWerdPush(){
 if(isWerdIOS()&&!isWerdStandalone()){openWerdInstallForNotifications();toast('ثبّت ورد أولًا، ثم افتحه من الشاشة الرئيسية لتفعيل التنبيهات');return}
 if(!pushApiSupported()){toast(isWerdIOS()?'حدّث iOS ثم افتح ورد من أيقونته المثبتة':'هذا المتصفح لا يدعم Web Push');return}
 let permission=Notification.permission;if(permission!=='granted')permission=await Notification.requestPermission();if(permission!=='granted'){toast(permission==='denied'?'التنبيهات محظورة من إعدادات الجهاز':'لم يتم السماح بالتنبيهات');refreshWerdNotifStatus();return}
 let sub=await getWerdPushSubscription();if(!sub||state.notifications?.vapidVersion!==WERD_VAPID_VERSION){if(sub)await sub.unsubscribe();sub=await makeWerdSubscription()}ensureWerdNotifState();state.notifications={...state.notifications,...currentWerdPrefs(),pushEnabled:true,vapidVersion:WERD_VAPID_VERSION,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||'Asia/Riyadh'};save();await syncWerdPushRecord(true);
}
async function disableWerdPush(){const sub=await getWerdPushSubscription();if(sub){const j=sub.toJSON();await postWerdPush({action:'delete',endpoint:sub.endpoint,p256dh:j.keys?.p256dh||'',auth:j.keys?.auth||''}).catch(()=>{});await sub.unsubscribe()}ensureWerdNotifState();state.notifications.pushEnabled=false;save();refreshWerdNotifStatus();toast('تم إيقاف التنبيهات')}
async function testWerdNotification(){if(isWerdIOS()&&!isWerdStandalone()){openWerdInstallForNotifications();toast('التنبيه التجريبي يعمل بعد تثبيت ورد وفتحه من الشاشة الرئيسية');return}if(!pushApiSupported()){toast('التنبيهات غير متاحة في هذا المتصفح');return}if(Notification.permission!=='granted'){toast('فعّل التنبيهات أولًا');return}const reg=await navigator.serviceWorker.ready;await reg.showNotification('ورد 🌿',{body:'هذا تنبيه تجريبي. تنبيهاتك جاهزة.',icon:'./icon.svg',badge:'./icon.svg',dir:'rtl',lang:'ar',data:{url:'./'}})}
async function refreshWerdNotifStatus(){
 const status=el('werdNotifStatus'),on=el('werdEnableNotif'),off=el('werdDisableNotif'),note=el('werdNotifNote'),test=el('werdTestNotif');if(!status)return;
 if(on)on.classList.remove('werd-install-needed');
 if(isWerdIOS()&&!isWerdStandalone()){
  status.textContent='يتطلب تثبيت ورد';if(on){on.disabled=false;on.textContent='ثبّت ورد أولًا';on.classList.add('werd-install-needed');on.onclick=enableWerdPush}if(off)off.style.display='none';if(test)test.disabled=false;if(note)note.innerHTML='<b>على iPhone:</b> ثبّت «ورد» على الشاشة الرئيسية، ثم افتحه من الأيقونة الجديدة واضغط «تفعيل التنبيهات». لا يلزم تسجيل الدخول.';return
 }
 if(!pushApiSupported()){status.textContent='غير مدعومة على هذا الإصدار';if(on){on.disabled=true;on.textContent='غير متاح'}if(test)test.disabled=true;if(note)note.textContent='حدّث نظام الجهاز أو استخدم متصفحًا يدعم Web Push.';return}
 const sub=await getWerdPushSubscription().catch(()=>null),permission=Notification.permission,active=permission==='granted'&&!!sub;status.textContent=active?'مفعلة ✓':(permission==='denied'?'محظورة':'جاهزة للتفعيل');if(on){on.disabled=false;on.textContent=active?'مفعلة ✓':'تفعيل التنبيهات';on.onclick=enableWerdPush}if(off)off.style.display=active?'inline-block':'none';if(test)test.disabled=false;if(note)note.textContent=active?'التنبيهات تعمل على هذا الجهاز حتى بدون تسجيل الدخول.':'اضغط «تفعيل التنبيهات» ثم اسمح بالإشعارات عند ظهور طلب النظام.'
}
function initWerdNotifications(){injectWerdNotificationUI();if(typeof sb!=='undefined')sb.auth.onAuthStateChange(()=>setTimeout(()=>{refreshWerdNotifStatus();getWerdPushSubscription().then(s=>{if(s&&typeof Notification!=='undefined'&&Notification.permission==='granted')syncWerdPushRecord(false)})},300));setTimeout(()=>{if(pushApiSupported()&&Notification.permission==='granted')getWerdPushSubscription().then(s=>{if(s)syncWerdPushRecord(false)})},1800);window.addEventListener('pageshow',()=>setTimeout(refreshWerdNotifStatus,120));document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(refreshWerdNotifStatus,100)})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initWerdNotifications);else initWerdNotifications();