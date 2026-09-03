// Robust iPhone/iOS onboarding controls — skip + final start bridge v103.
(function(){
 const VERSION=1;
 let lastFinish=0;

 function persistBasic(skipped=false){
  try{
   if(typeof state==='object'&&state){
    state.onboarding={...(state.onboarding||{}),completed:true,version:VERSION,completedAt:new Date().toISOString(),...(skipped?{skipped:true}:{})};
    try{localStorage.setItem('ward_state_v3',JSON.stringify(state))}catch(_){ }
   }else{
    const raw=localStorage.getItem('ward_state_v3')||localStorage.getItem('ward_state_v2')||'{}';
    const s=JSON.parse(raw);s.onboarding={...(s.onboarding||{}),completed:true,version:VERSION,completedAt:new Date().toISOString(),...(skipped?{skipped:true}:{})};localStorage.setItem('ward_state_v3',JSON.stringify(s));
   }
  }catch(e){console.warn('onboarding persist',e)}
 }
 function closeOverlay(){
  const el=document.getElementById('werdOnboarding');if(el){el.hidden=true;el.style.display='none';el.setAttribute('aria-hidden','true')}
  document.body.classList.remove('onboarding-open');
 }
 function goHome(){
  try{if(typeof renderState==='function')renderState()}catch(e){console.warn('onboarding render',e)}
  try{if(typeof go==='function'){go('home');return}}catch(e){console.warn('onboarding go',e)}
  try{
   document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
   document.getElementById('home')?.classList.add('active');
   document.querySelectorAll('.nav').forEach(n=>n.classList.toggle('active',n.dataset.page==='home'));
   window.scrollTo({top:0,behavior:'auto'});
  }catch(_){ }
 }
 function persistAndClose(){
  persistBasic(true);closeOverlay();goHome();
  try{if(typeof toast==='function')toast('تم تخطي إعداد البداية ✓')}catch(_){ }
 }
 function finishAndClose(base,e){
  const now=Date.now();if(now-lastFinish<700)return;lastFinish=now;
  // Run the original onboarding handler first so the selected goal/reader/theme are preserved.
  try{base?.call(document.getElementById('onbNext'),e)}catch(err){console.warn('onboarding original finish',err)}
  // Even if save()/renderState() throws, onboarding itself must finish and never trap the user.
  setTimeout(()=>{
   persistBasic(false);closeOverlay();goHome();
   try{if(typeof toast==='function')toast('تم تجهيز ورد لك ✓')}catch(_){ }
  },25);
 }
 function bindSkip(){
  const b=document.getElementById('onbSkip');if(!b||b.dataset.skipFixed)return;
  b.dataset.skipFixed='1';b.type='button';b.style.position='relative';b.style.zIndex='10060';b.style.pointerEvents='auto';b.style.touchAction='manipulation';
  const fire=e=>{if(e){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation?.()}persistAndClose()};
  b.addEventListener('click',fire,true);b.addEventListener('touchend',fire,{capture:true,passive:false});b.addEventListener('pointerup',fire,true);
 }
 function bindFinish(){
  const b=document.getElementById('onbNext');if(!b||b.dataset.finishFixed)return;
  b.dataset.finishFixed='1';b.type='button';b.style.position='relative';b.style.zIndex='10060';b.style.pointerEvents='auto';b.style.touchAction='manipulation';
  const base=b.onclick;
  const fire=e=>{
   if(!/ابدأ\s*مع\s*ورد/.test(String(b.textContent||'')))return;
   if(e){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation?.()}
   finishAndClose(base,e);
  };
  b.addEventListener('click',fire,true);b.addEventListener('touchend',fire,{capture:true,passive:false});b.addEventListener('pointerup',fire,true);
 }
 function bind(){bindSkip();bindFinish()}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
 new MutationObserver(bind).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
 window.werdSkipOnboarding=persistAndClose;
})();