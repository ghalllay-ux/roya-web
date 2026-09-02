// Force every mobile Mushaf entry point to the single Mushaf V2 reader.
(function(){
 let opening=false,lastOpen=0;
 function kick(){
  const r=document.getElementById('mv2Range');
  const sheet=document.getElementById('mv2Sheet');
  if(!r||!sheet)return;
  // iOS Safari sometimes paints the first dynamically loaded Quran page only after
  // the range control causes a second layout pass. Trigger that pass automatically.
  if(!sheet.querySelector('.mv2-text') || sheet.getBoundingClientRect().height<80){
   r.dispatchEvent(new Event('change',{bubbles:true}));
  }else{
   const old=r.value;r.value=old;
   r.dispatchEvent(new Event('change',{bubbles:true}));
  }
 }
 function open(){
  const now=Date.now();if(opening||now-lastOpen<900)return;opening=true;lastOpen=now;
  try{
   if(typeof window.openWerdMushafV2==='function')window.openWerdMushafV2();
   else if(typeof window.openMushaf==='function')window.openMushaf();
  }finally{
   setTimeout(kick,650);
   setTimeout(()=>{opening=false},1200);
  }
 }
 function bind(){if(!matchMedia('(max-width:959px)').matches)return;
  document.querySelectorAll('.bottom .nav[data-page="quran"]').forEach(b=>{b.onclick=e=>{e.preventDefault();e.stopPropagation();open()}});
  document.querySelectorAll('[data-page="quran"], [onclick*="go(\'quran\')"], [onclick*="go(&quot;quran&quot;)"]').forEach(b=>{if(b.closest('.bottom'))return;b.onclick=e=>{e.preventDefault();open()}});
  const hero=[...document.querySelectorAll('button')].find(b=>/ابدأ\s*\/\s*أكمل القراءة/.test(b.textContent||''));if(hero)hero.onclick=e=>{e.preventDefault();open()};
 }
 document.addEventListener('DOMContentLoaded',()=>setTimeout(bind,250));
 window.addEventListener('pageshow',()=>setTimeout(bind,250));
 new MutationObserver(()=>bind()).observe(document.documentElement,{childList:true,subtree:true});
 window.openWerdUnifiedMushaf=open;
})();