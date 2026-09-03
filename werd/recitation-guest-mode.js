// True guest mode for Chrome iOS voice recitation — v105
(function(){
  if(!/CriOS/i.test(navigator.userAgent||''))return;
  const $=id=>document.getElementById(id);
  const ENDPOINT='/functions/v1/werd-transcribe-recitation';
  let installed=false,authPatched=false,fetchPatched=false,observer=null,guestUntil=0;

  function recitationActive(){
    const page=$('recitationTest');
    if(page?.classList.contains('active'))return true;
    const setup=$('rtestSetup');
    return !!(page&&setup&&getComputedStyle(page).display!=='none'&&getComputedStyle(setup).display!=='none');
  }

  function getAuth(){
    try{
      if(typeof sb!=='undefined'&&sb?.auth)return sb.auth;
    }catch(_){ }
    return null;
  }

  function patchAuth(){
    const auth=getAuth();
    if(authPatched||!auth||typeof auth.getSession!=='function')return !!authPatched;
    const realGetSession=auth.getSession.bind(auth);
    auth.getSession=async function(){
      if(recitationActive()||Date.now()<guestUntil){
        return {data:{session:{access_token:'werd-guest-recitation',user:null}},error:null};
      }
      return realGetSession(...arguments);
    };
    authPatched=true;
    return true;
  }

  function patchFetch(){
    if(fetchPatched||typeof window.fetch!=='function')return;
    const realFetch=window.fetch.bind(window);
    window.fetch=function(input,init){
      const url=typeof input==='string'?input:(input?.url||'');
      if(String(url).includes(ENDPOINT)){
        const next={...(init||{})};
        const h=new Headers(next.headers||{});
        h.delete('Authorization');
        h.delete('authorization');
        next.headers=h;
        return realFetch(input,next);
      }
      return realFetch(input,init);
    };
    fetchPatched=true;
  }

  function applyUI(){
    const page=$('recitationTest');if(!page)return;
    const direct=$('rtestDirectBtn'),panel=$('rtestDirectPanel'),start=$('rtestStart'),support=$('rtestSupport');
    const active=!!(direct?.classList.contains('active')&&panel?.classList.contains('show'));
    if(!active||!start)return;
    if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){
      start.disabled=true;
      if(support)support.innerHTML='<span>⚠️</span><div><b>التسجيل الصوتي غير متاح في هذا الإصدار من Chrome.</b><br>حدّث Chrome ثم أعد المحاولة.</div>';
      return;
    }
    start.disabled=false;
    start.textContent='ابدأ جلسة التسميع';
    if(support)support.innerHTML='<span>🎙️</span><div><b>جاهز للتسميع مباشرة بدون تسجيل ✓</b><br>اختر الآية وابدأ. التسجيل الصوتي مؤقت للتحويل فقط ولا يُحفظ.</div>';
  }

  function armGuest(){guestUntil=Date.now()+20000;patchAuth();patchFetch()}

  function install(){
    patchFetch();
    if(!patchAuth())return setTimeout(install,120);
    const page=$('recitationTest');if(!page)return setTimeout(install,180);
    if(installed)return;
    installed=true;
    observer=new MutationObserver(()=>setTimeout(applyUI,0));
    observer.observe(page,{subtree:true,childList:true,attributes:true,attributeFilter:['disabled','class']});
    document.addEventListener('pointerdown',e=>{
      if(e.target?.closest?.('#rtestDirectBtn,#rtestStart,#rtestMic'))armGuest();
    },true);
    document.addEventListener('touchstart',e=>{
      if(e.target?.closest?.('#rtestDirectBtn,#rtestStart,#rtestMic'))armGuest();
    },{capture:true,passive:true});
    document.addEventListener('click',e=>{
      if(e.target?.closest?.('#rtestDirectBtn,#rtestStart,#rtestMic')){
        armGuest();setTimeout(applyUI,0);setTimeout(applyUI,120);
      }
    },true);
    setInterval(()=>{patchAuth();patchFetch();if(recitationActive())applyUI()},200);
    setTimeout(applyUI,50);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  window.addEventListener('pageshow',()=>setTimeout(()=>{patchAuth();patchFetch();applyUI()},100));
})();
