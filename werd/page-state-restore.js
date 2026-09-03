// Preserve the currently open Werd section across browser refreshes.
(function(){
  const KEY='werd_active_page_v1';
  let restoring=true;

  function validPage(id){
    const el=id&&document.getElementById(id);
    return !!(el&&el.classList&&el.classList.contains('page'));
  }
  function savePage(id){
    if(!id)return;
    // quran may be routed to the mobile mushaf before its target page is shown.
    if(id==='quran'||validPage(id)){
      try{sessionStorage.setItem(KEY,id)}catch(_){}
    }
  }
  function activePage(){
    return document.querySelector('.page.active')?.id||'';
  }
  function wrapGo(){
    const original=window.go;
    if(typeof original!=='function'||original.__werdPageStateWrapped)return false;
    function wrapped(id,...args){
      savePage(id);
      return original.call(this,id,...args);
    }
    wrapped.__werdPageStateWrapped=true;
    wrapped.__werdOriginalGo=original;
    window.go=wrapped;
    return true;
  }
  function restore(){
    let saved='';
    try{saved=sessionStorage.getItem(KEY)||''}catch(_){}
    if(!saved){restoring=false;return true}
    if(saved==='home'){
      restoring=false;
      return true;
    }
    if(typeof window.go!=='function')return false;
    if(saved==='quran'||validPage(saved)){
      try{window.go(saved);restoring=false;return true}catch(e){console.warn('Werd page restore failed',e)}
    }
    return false;
  }
  function observe(){
    const main=document.querySelector('main');if(!main)return;
    const mo=new MutationObserver(()=>{
      if(restoring)return;
      const id=activePage();if(id)savePage(id);
    });
    mo.observe(main,{subtree:true,attributes:true,attributeFilter:['class']});
  }
  function boot(){
    wrapGo();
    document.addEventListener('click',e=>{
      const nav=e.target.closest?.('.nav[data-page]');if(nav)savePage(nav.dataset.page);
    },true);
    window.addEventListener('beforeunload',()=>{const id=activePage();if(id)savePage(id)});

    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      wrapGo();
      if(restore()||tries>=60){
        clearInterval(timer);
        restoring=false;
        const id=activePage();if(id&&!sessionStorage.getItem(KEY))savePage(id);
      }
    },100);
    setTimeout(()=>restore(),0);
    observe();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
