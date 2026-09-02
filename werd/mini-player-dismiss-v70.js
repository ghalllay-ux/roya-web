// v70 hard fix: mini-player X must stop audio and stay dismissed until playback starts again.
(function(){
  let dismissed=false;
  const $=id=>document.getElementById(id);
  function syncMainPlayVisual(){
    const b=$('listenPlay');if(!b)return;
    const paused=/⏸|❚❚|Ⅱ/.test(b.textContent||'');
    b.classList.toggle('is-paused',paused);
  }
  function dismiss(e){
    if(e){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation?.()}
    dismissed=true;
    document.body.classList.add('mini-player-dismissed');
    document.body.classList.remove('has-mini-player');
    const mini=$('werdMiniPlayer');if(mini){mini.classList.remove('show');mini.style.setProperty('display','none','important')}
    try{window.werdListeningAudio?.pause?.()}catch(_){}
    document.querySelectorAll('audio').forEach(a=>{try{a.pause()}catch(_){}});
    ['listenPlay','miniPlay'].forEach(id=>{const b=$(id);if(b)b.textContent='▶'});
    syncMainPlayVisual();
    const st=$('listenStatus');if(st)st.textContent='متوقف';
    return false;
  }
  function restoreOnUserPlay(e){
    const t=e.target?.closest?.('#listenPlay,#miniPlay,[data-listen-surah]');
    if(!t)return;
    dismissed=false;
    document.body.classList.remove('mini-player-dismissed');
    const mini=$('werdMiniPlayer');if(mini)mini.style.removeProperty('display');
    setTimeout(syncMainPlayVisual,0);
  }
  function bind(){
    const c=$('miniClose');
    if(c&&!c.dataset.v70){c.dataset.v70='1';c.onclick=dismiss;c.ontouchend=dismiss;c.addEventListener('pointerup',dismiss,true)}
    syncMainPlayVisual();
  }
  document.addEventListener('click',e=>{if(e.target?.closest?.('#miniClose'))return dismiss(e);restoreOnUserPlay(e)},true);
  document.addEventListener('touchend',e=>{if(e.target?.closest?.('#miniClose'))dismiss(e)},{capture:true,passive:false});
  const mo=new MutationObserver(()=>{bind();if(dismissed){const m=$('werdMiniPlayer');if(m){m.classList.remove('show');m.style.setProperty('display','none','important')}document.body.classList.remove('has-mini-player');document.body.classList.add('mini-player-dismissed')}});
  mo.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();