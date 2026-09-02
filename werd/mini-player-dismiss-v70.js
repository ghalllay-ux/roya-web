// v72 definitive close: remove the mini player node entirely when X is pressed.
(function(){
  const $=id=>document.getElementById(id);
  function stopAll(){
    try{window.werdListeningAudio?.pause?.()}catch(_){}
    document.querySelectorAll('audio').forEach(a=>{try{a.pause()}catch(_){}});
  }
  function hardClose(e){
    e?.preventDefault?.();e?.stopPropagation?.();e?.stopImmediatePropagation?.();
    stopAll();
    const m=$('werdMiniPlayer');if(m)m.remove();
    document.body.classList.remove('has-mini-player','mini-player-dismissed');
    document.body.style.removeProperty('padding-bottom');
    const p=$('listenPlay');if(p)p.textContent='▶';
    const s=$('listenStatus');if(s)s.textContent='متوقف';
    return false;
  }
  function install(){
    const c=$('miniClose');if(!c)return;
    c.type='button';
    c.setAttribute('aria-label','إغلاق المشغل');
    c.style.setProperty('pointer-events','auto','important');
    c.style.setProperty('z-index','99999','important');
    c.onclick=hardClose;
    c.addEventListener('touchstart',hardClose,{capture:true,passive:false});
    c.addEventListener('touchend',hardClose,{capture:true,passive:false});
    c.addEventListener('pointerdown',hardClose,true);
    c.addEventListener('pointerup',hardClose,true);
  }
  document.addEventListener('click',e=>{if(e.target?.closest?.('#miniClose'))hardClose(e)},true);
  document.addEventListener('touchstart',e=>{if(e.target?.closest?.('#miniClose'))hardClose(e)},{capture:true,passive:false});
  document.addEventListener('touchend',e=>{if(e.target?.closest?.('#miniClose'))hardClose(e)},{capture:true,passive:false});
  const mo=new MutationObserver(install);mo.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();