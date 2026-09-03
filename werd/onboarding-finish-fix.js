// Robust final-step completion for Werd onboarding on iPhone/iOS — v103
(function(){
  const VERSION=1;
  let lastFire=0;

  function fallbackHome(){
    try{
      if(typeof go==='function'){go('home');return}
    }catch(e){console.warn('onboarding go home',e)}
    try{
      document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
      document.getElementById('home')?.classList.add('active');
      document.querySelectorAll('.nav').forEach(n=>n.classList.toggle('active',n.dataset.page==='home'));
      window.scrollTo({top:0,behavior:'auto'});
    }catch(_){ }
  }

  function forceComplete(){
    try{
      if(typeof state==='object'&&state){
        if(!state.onboarding?.completed)state.onboarding={...(state.onboarding||{}),completed:true,version:VERSION,completedAt:new Date().toISOString()};
        localStorage.setItem('ward_state_v3',JSON.stringify(state));
      }else{
        const raw=localStorage.getItem('ward_state_v3')||localStorage.getItem('ward_state_v2')||'{}';
        const s=JSON.parse(raw);s.onboarding={...(s.onboarding||{}),completed:true,version:VERSION,completedAt:new Date().toISOString()};localStorage.setItem('ward_state_v3',JSON.stringify(s));
      }
    }catch(e){console.warn('onboarding finish persist',e)}
    const el=document.getElementById('werdOnboarding');
    if(el){el.hidden=true;el.style.display='none';el.setAttribute('aria-hidden','true')}
    document.body.classList.remove('onboarding-open');
    try{if(typeof renderState==='function')renderState()}catch(e){console.warn('onboarding finish render',e)}
    fallbackHome();
    try{if(typeof toast==='function')toast('تم تجهيز ورد لك ✓')}catch(_){ }
  }

  function bind(){
    const b=document.getElementById('onbNext');
    if(!b||b.dataset.finishFixed)return;
    b.dataset.finishFixed='1';b.type='button';b.style.pointerEvents='auto';b.style.touchAction='manipulation';b.style.position='relative';b.style.zIndex='10070';
    const base=b.onclick;
    const fire=e=>{
      if(!/ابدأ\s*مع\s*ورد/.test(String(b.textContent||'')))return;
      const now=Date.now();if(now-lastFire<700){e?.preventDefault();e?.stopImmediatePropagation?.();return}lastFire=now;
      e?.preventDefault();e?.stopImmediatePropagation?.();
      try{base?.call(b,e)}catch(err){console.warn('onboarding native finish failed',err)}
      setTimeout(forceComplete,30);
    };
    b.addEventListener('click',fire,true);
    b.addEventListener('touchend',fire,{capture:true,passive:false});
    b.addEventListener('pointerup',fire,true);
  }

  function install(){bind();new MutationObserver(bind).observe(document.documentElement,{childList:true,subtree:true,characterData:true});setInterval(bind,800)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  window.werdFinishOnboarding=forceComplete;
})();
