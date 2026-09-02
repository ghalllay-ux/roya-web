// Robust iPhone/Safari onboarding skip bridge.
(function(){
 const VERSION=1;
 function persistAndClose(){
  try{
   if(typeof state==='object'&&state){
    state.onboarding={completed:true,version:VERSION,completedAt:new Date().toISOString(),skipped:true};
    try{localStorage.setItem('ward_state_v3',JSON.stringify(state))}catch(_){ }
   }else{
    const raw=localStorage.getItem('ward_state_v3')||localStorage.getItem('ward_state_v2')||'{}';
    const s=JSON.parse(raw);s.onboarding={completed:true,version:VERSION,completedAt:new Date().toISOString(),skipped:true};localStorage.setItem('ward_state_v3',JSON.stringify(s));
   }
  }catch(e){console.warn('onboarding skip persist',e)}
  const el=document.getElementById('werdOnboarding');if(el){el.hidden=true;el.style.display='none'}
  document.body.classList.remove('onboarding-open');
  try{if(typeof renderState==='function')renderState()}catch(_){ }
  try{if(typeof go==='function')go('home')}catch(_){ }
  try{if(typeof toast==='function')toast('تم تخطي إعداد البداية ✓')}catch(_){ }
 }
 function bind(){
  const b=document.getElementById('onbSkip');if(!b||b.dataset.skipFixed)return;
  b.dataset.skipFixed='1';b.type='button';b.style.position='relative';b.style.zIndex='10060';b.style.pointerEvents='auto';b.style.touchAction='manipulation';
  const fire=e=>{if(e){e.preventDefault();e.stopPropagation()}persistAndClose()};
  b.addEventListener('click',fire,true);b.addEventListener('touchend',fire,{capture:true,passive:false});b.addEventListener('pointerup',fire,true);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
 new MutationObserver(bind).observe(document.documentElement,{childList:true,subtree:true});
 window.werdSkipOnboarding=persistAndClose;
})();