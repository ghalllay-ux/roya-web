// Force every mobile Mushaf entry point to the single Mushaf V2 reader.
// iPhone/WebKit fix: automatically perform the same layout/input pass that previously
// happened only after the user moved the page slider.
(function(){
 let opening=false,lastOpen=0,retryTimer=null;
 function active(){return document.getElementById('mushafV2')?.classList.contains('active')}
 function kick(){
  const r=document.getElementById('mv2Range'),sheet=document.getElementById('mv2Sheet');
  if(!r||!sheet||!active())return false;
  const v=r.value||'1';
  // Safari sometimes keeps the first dynamically rendered sheet in an unpainted layer.
  // Re-run the exact range path automatically without changing the user's page.
  r.value=v;
  r.dispatchEvent(new Event('input',{bubbles:true}));
  r.dispatchEvent(new Event('change',{bubbles:true}));
  // Force a synchronous layout + a fresh WebKit compositing pass.
  void sheet.offsetHeight;
  sheet.style.setProperty('-webkit-transform','translateZ(0)','important');
  requestAnimationFrame(()=>requestAnimationFrame(()=>sheet.style.removeProperty('-webkit-transform')));
  return !!sheet.querySelector('.mv2-text');
 }
 function ensurePaint(){
  clearTimeout(retryTimer);
  const waits=[120,320,650,1050,1650];
  waits.forEach((ms,i)=>setTimeout(()=>{
   if(!active())return;
   const sheet=document.getElementById('mv2Sheet');
   const hasText=!!sheet?.querySelector('.mv2-text');
   if(i===0||!hasText)kick();
   else {
    // Text exists but may still be invisible in WebKit; force one harmless paint pass.
    void sheet.offsetHeight;
    sheet.style.setProperty('opacity','0.999','important');
    requestAnimationFrame(()=>sheet.style.removeProperty('opacity'));
   }
  },ms));
 }
 function open(){
  const now=Date.now();if(opening||now-lastOpen<500)return;opening=true;lastOpen=now;
  try{
   if(typeof window.openWerdMushafV2==='function')window.openWerdMushafV2();
   else if(typeof window.openMushaf==='function')window.openMushaf();
   ensurePaint();
  }finally{setTimeout(()=>{opening=false},900)}
 }
 function bind(){if(!matchMedia('(max-width:959px)').matches)return;
  document.querySelectorAll('.bottom .nav[data-page="quran"]').forEach(b=>{b.onclick=e=>{e.preventDefault();e.stopPropagation();open()}});
  document.querySelectorAll('[data-page="quran"], [onclick*="go(\'quran\')"], [onclick*="go(&quot;quran&quot;)"]').forEach(b=>{if(b.closest('.bottom'))return;b.onclick=e=>{e.preventDefault();open()}});
  const hero=[...document.querySelectorAll('button')].find(b=>/ابدأ\s*\/\s*أكمل القراءة/.test(b.textContent||''));if(hero)hero.onclick=e=>{e.preventDefault();open()};
 }
 document.addEventListener('DOMContentLoaded',()=>setTimeout(bind,120));
 window.addEventListener('pageshow',()=>setTimeout(bind,120));
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&active())ensurePaint()});
 new MutationObserver(()=>bind()).observe(document.documentElement,{childList:true,subtree:true});
 window.openWerdUnifiedMushaf=open;
 window.__werdMushafEnsurePaint=ensurePaint;
})();