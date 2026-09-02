// v71 iPhone hard-close: install a direct close button handler that wins over player delegates.
(function(){
  let dismissed=false;
  const $=id=>document.getElementById(id);
  function stopAll(){
    try{window.werdListeningAudio?.pause?.()}catch(_){}
    document.querySelectorAll('audio').forEach(a=>{try{a.pause()}catch(_){}});
  }
  function hide(){
    dismissed=true;
    stopAll();
    const m=$('werdMiniPlayer');
    if(m){m.classList.remove('show');m.hidden=true;m.style.cssText+=';display:none!important;visibility:hidden!important;pointer-events:none!important;'}
    document.body.classList.remove('has-mini-player');
    document.body.classList.add('mini-player-dismissed');
    const p=$('listenPlay');if(p)p.textContent='▶';
    const s=$('listenStatus');if(s)s.textContent='متوقف';
  }
  function closeEvent(e){e?.preventDefault?.();e?.stopPropagation?.();e?.stopImmediatePropagation?.();hide();return false}
  function reopen(){
    dismissed=false;document.body.classList.remove('mini-player-dismissed');
    const m=$('werdMiniPlayer');if(m){m.hidden=false;m.style.removeProperty('display');m.style.removeProperty('visibility');m.style.removeProperty('pointer-events')}
  }
  function bind(){
    const c=$('miniClose');if(!c)return;
    c.type='button';c.setAttribute('aria-label','إغلاق المشغل');
    c.onclick=closeEvent;c.ontouchstart=closeEvent;c.ontouchend=closeEvent;c.onpointerdown=closeEvent;c.onpointerup=closeEvent;
  }
  document.addEventListener('click',e=>{if(e.target?.closest?.('#miniClose')){closeEvent(e);return}if(e.target?.closest?.('#listenPlay,[data-listen-surah]'))reopen()},true);
  document.addEventListener('touchstart',e=>{if(e.target?.closest?.('#miniClose'))closeEvent(e)},{capture:true,passive:false});
  document.addEventListener('touchend',e=>{if(e.target?.closest?.('#miniClose'))closeEvent(e)},{capture:true,passive:false});
  const mo=new MutationObserver(()=>{bind();if(dismissed)hide()});
  mo.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();