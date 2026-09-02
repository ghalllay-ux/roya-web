// v74 lightweight mini-player state: no DOM-wide MutationObserver.
(function(){
  let userHidden=false,boundAudio=null;
  const $=id=>document.getElementById(id);
  const player=()=>$('werdMiniPlayer');
  const audio=()=>window.werdListeningAudio||document.querySelector('audio');
  function playing(){const a=audio();return !!(a&&!a.paused&&!a.ended)}
  function hide(e){e?.preventDefault?.();e?.stopPropagation?.();userHidden=true;const m=player();if(m){m.classList.remove('show');m.hidden=true;m.style.setProperty('display','none','important')}document.body.classList.remove('has-mini-player')}
  function show(){if(userHidden)return;const m=player();if(m){m.hidden=false;m.style.removeProperty('display');m.classList.add('show')}document.body.classList.add('has-mini-player')}
  function sync(){const p=playing();['miniPlay','listenPlay'].forEach(id=>{const b=$(id);if(b){b.textContent=p?'⏸':'▶';b.classList.toggle('is-playing',p)}});if(p)show()}
  function bind(){const c=$('miniClose');if(c&&!c.dataset.lightClose){c.dataset.lightClose='1';c.addEventListener('click',hide,true);c.addEventListener('touchend',hide,{capture:true,passive:false})}const a=audio();if(a&&a!==boundAudio){boundAudio=a;a.addEventListener('play',()=>{userHidden=false;show();sync()});a.addEventListener('pause',sync);a.addEventListener('ended',sync)}}
  document.addEventListener('click',e=>{if(e.target?.closest?.('#miniClose'))return;if(e.target?.closest?.('#listenPlay,#miniPlay,[data-listen-surah]')){userHidden=false;requestAnimationFrame(()=>{bind();sync()})}},true);
  document.addEventListener('werd:listening-ready',()=>{bind();sync()});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{bind();sync()},{once:true});else{bind();sync()}
  // Very low-cost fallback for dynamically-created audio/player; stops after binding.
  let tries=0;const timer=setInterval(()=>{bind();sync();if(++tries>=12&&$('miniClose')&&audio())clearInterval(timer)},500);
})();