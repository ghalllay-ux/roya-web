// v73: mini player is a persistent view of audio state. Closing hides UI only; playback continues.
(function(){
  let userHidden=false;
  const $=id=>document.getElementById(id);
  const audios=()=>[window.werdListeningAudio,...document.querySelectorAll('audio')].filter((a,i,x)=>a&&x.indexOf(a)===i);
  function player(){return $('werdMiniPlayer')}
  function hideUI(e){
    e?.preventDefault?.();e?.stopPropagation?.();e?.stopImmediatePropagation?.();
    userHidden=true;
    const m=player();if(m){m.classList.remove('show');m.hidden=true;m.style.setProperty('display','none','important')}
    document.body.classList.remove('has-mini-player');
    return false;
  }
  function showUI(){
    userHidden=false;
    document.body.classList.remove('mini-player-dismissed');
    const m=player();if(m){m.hidden=false;m.style.removeProperty('display');m.style.removeProperty('visibility');m.style.removeProperty('pointer-events');m.classList.add('show')}
    document.body.classList.add('has-mini-player');
  }
  function isPlaying(){return audios().some(a=>!a.paused&&!a.ended&&a.currentTime>=0)}
  function sync(){
    const m=player();if(!m)return;
    if(isPlaying()&&!userHidden)showUI();
    ['miniPlay','listenPlay'].forEach(id=>{const b=$(id);if(b){b.textContent=isPlaying()?'⏸':'▶';b.classList.toggle('is-playing',isPlaying())}})
  }
  function bind(){
    const c=$('miniClose');if(c&&!c.dataset.v73){c.dataset.v73='1';c.type='button';c.setAttribute('aria-label','إخفاء المشغل');c.title='إخفاء المشغل';['click','touchend','pointerup'].forEach(ev=>c.addEventListener(ev,hideUI,{capture:true,passive:false}))}
    audios().forEach(a=>{if(a.dataset?.miniV73)return;if(a.dataset)a.dataset.miniV73='1';a.addEventListener('play',()=>{userHidden=false;showUI();sync()});a.addEventListener('pause',sync);a.addEventListener('ended',sync)})
  }
  // Any explicit playback action restores the mini player; closing never stops audio.
  document.addEventListener('click',e=>{if(e.target?.closest?.('#miniClose'))return;if(e.target?.closest?.('#listenPlay,#miniPlay,[data-listen-surah]')){userHidden=false;setTimeout(()=>{bind();if(isPlaying())showUI();sync()},0)}},true);
  document.addEventListener('touchend',e=>{if(e.target?.closest?.('#miniClose'))return;if(e.target?.closest?.('#listenPlay,#miniPlay,[data-listen-surah]')){userHidden=false;setTimeout(()=>{bind();if(isPlaying())showUI();sync()},0)}},{capture:true,passive:true});
  const mo=new MutationObserver(()=>{bind();sync()});mo.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{bind();sync()});else{bind();sync()}
})();