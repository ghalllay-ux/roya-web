// v77 lightweight mini-player state. Media icons are CSS-only: never write emoji glyphs into buttons.
(function(){
  let userHidden=false,boundAudio=null;
  const $=id=>document.getElementById(id);
  const player=()=>$('werdMiniPlayer');
  const audio=()=>window.werdListeningAudio||document.querySelector('audio');
  function playing(){const a=audio();return !!(a&&!a.paused&&!a.ended)}
  function cleanButton(b,p){if(!b)return;b.textContent='';b.setAttribute('aria-label',p?'إيقاف مؤقت':'تشغيل');b.classList.toggle('is-playing',p)}
  function hide(e){e?.preventDefault?.();e?.stopPropagation?.();userHidden=true;const m=player();if(m){m.classList.remove('show');m.hidden=true;m.style.setProperty('display','none','important')}document.body.classList.remove('has-mini-player')}
  function show(){if(userHidden)return;const m=player();if(m){m.hidden=false;m.style.removeProperty('display');m.classList.add('show')}document.body.classList.add('has-mini-player')}
  function sync(){const p=playing();cleanButton($('miniPlay'),p);cleanButton($('listenPlay'),p);['listenPrev','listenNext','miniPrev','miniNext'].forEach(id=>{const b=$(id);if(b)b.textContent=''});if(p)show()}
  function bind(){const c=$('miniClose');if(c&&!c.dataset.lightClose){c.dataset.lightClose='1';c.addEventListener('click',hide,true);c.addEventListener('touchend',hide,{capture:true,passive:false})}const a=audio();if(a&&a!==boundAudio){boundAudio=a;a.addEventListener('play',()=>{userHidden=false;show();sync()});a.addEventListener('pause',sync);a.addEventListener('ended',sync)}}
  document.addEventListener('click',e=>{if(e.target?.closest?.('#miniClose'))return;if(e.target?.closest?.('#listenPlay,#miniPlay,[data-listen-surah]')){userHidden=false;requestAnimationFrame(()=>{bind();sync()})}},true);
  document.addEventListener('werd:listening-ready',()=>{bind();sync()});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{bind();sync()},{once:true});else{bind();sync()}
  let tries=0;const timer=setInterval(()=>{bind();sync();if(++tries>=12&&$('miniClose')&&audio())clearInterval(timer)},500);
})();

// v94: restore the memorization/voice-recitation feature chain that is present in
// the app shell but was no longer loaded by the compact index page.
(function(){
  const modules=['memorization.js','memorization-tracker.js','memorization-test.js','recitation-test.js','weakness-analysis.js','mobile-memorization-hub.js'];
  function load(src){return new Promise(resolve=>{if(document.querySelector(`script[data-werd-module="${src}"]`))return resolve();const s=document.createElement('script');s.src=`./${src}?v=94`;s.async=false;s.dataset.werdModule=src;s.onload=resolve;s.onerror=resolve;document.body.appendChild(s)})}
  async function boot(){for(const m of modules)await load(m);document.dispatchEvent(new CustomEvent('werd:memorization-modules-ready'))}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();