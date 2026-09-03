// Guest bridge for Chrome iOS voice recitation — v103
(function(){
  if(!/CriOS/i.test(navigator.userAgent||''))return;
  const $=id=>document.getElementById(id);
  let installed=false,observer=null;

  function withGuestSession(fn,ctx,args){
    const auth=window.sb?.auth;
    if(!auth||typeof auth.getSession!=='function')return fn?.apply(ctx,args||[]);
    const original=auth.getSession;
    auth.getSession=()=>Promise.resolve({data:{session:{access_token:'werd-guest-recitation'}}});
    let result;
    try{result=fn?.apply(ctx,args||[])}catch(e){auth.getSession=original;throw e}
    if(result&&typeof result.finally==='function')return result.finally(()=>{auth.getSession=original});
    auth.getSession=original;
    return result;
  }

  function wrap(el){
    if(!el||typeof el.onclick!=='function'||el.onclick.__werdGuestWrapped)return;
    const base=el.onclick;
    const wrapped=function(){return withGuestSession(base,this,[...arguments])};
    wrapped.__werdGuestWrapped=true;
    wrapped.__werdGuestBase=base;
    el.onclick=wrapped;
  }

  function apply(){
    const page=$('recitationTest');if(!page)return;
    wrap($('rtestStart'));wrap($('rtestMic'));
    const direct=$('rtestDirectBtn'),panel=$('rtestDirectPanel'),start=$('rtestStart'),support=$('rtestSupport');
    const active=!!(direct?.classList.contains('active')&&panel?.classList.contains('show'));
    if(active&&start&&navigator.mediaDevices?.getUserMedia&&window.MediaRecorder){
      start.disabled=false;
      if(start.textContent!=='ابدأ جلسة التسميع')start.textContent='ابدأ جلسة التسميع';
      if(support&&!support.textContent.includes('بدون تسجيل'))support.innerHTML='<span>🎙️</span><div><b>جاهز للتسميع مباشرة بدون تسجيل ✓</b><br>اختر الآية وابدأ. التسجيل الصوتي مؤقت للتحويل فقط ولا يُحفظ.</div>';
    }
  }

  function install(){
    const page=$('recitationTest');if(!page)return setTimeout(install,250);
    if(installed)return;installed=true;
    observer=new MutationObserver(()=>setTimeout(apply,0));
    observer.observe(page,{subtree:true,childList:true,attributes:true,attributeFilter:['disabled','class']});
    document.addEventListener('click',e=>{if(e.target?.closest?.('#rtestDirectBtn,#rtestStart,#rtestMic'))setTimeout(apply,30)});
    setInterval(apply,250);
    setTimeout(apply,100);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
