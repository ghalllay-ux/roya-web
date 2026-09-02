// Force every mobile Mushaf entry point to the single Mushaf V2 reader.
(function(){
 function open(){if(typeof window.openWerdMushafV2==='function')return window.openWerdMushafV2();if(typeof window.openMushaf==='function')return window.openMushaf()}
 function bind(){if(!matchMedia('(max-width:959px)').matches)return;
  document.querySelectorAll('.bottom .nav[data-page="quran"]').forEach(b=>{b.onclick=e=>{e.preventDefault();e.stopPropagation();open()}});
  document.querySelectorAll('[data-page="quran"], [onclick*="go(\'quran\')"], [onclick*="go(&quot;quran&quot;)"]').forEach(b=>{if(b.closest('.bottom'))return;b.onclick=e=>{e.preventDefault();open()}});
  const hero=[...document.querySelectorAll('button')].find(b=>/ابدأ\s*\/\s*أكمل القراءة/.test(b.textContent||''));if(hero)hero.onclick=e=>{e.preventDefault();open()};
 }
 document.addEventListener('DOMContentLoaded',()=>setTimeout(bind,250));window.addEventListener('pageshow',()=>setTimeout(bind,250));new MutationObserver(()=>bind()).observe(document.documentElement,{childList:true,subtree:true});
 window.openWerdUnifiedMushaf=open;
})();