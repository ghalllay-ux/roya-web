// Deep-link router for Werd notification targets
(function(){
  function openRequestedPage(){
    try{
      const u=new URL(location.href),page=u.searchParams.get('open');
      if(!page||typeof go!=='function'||!document.getElementById(page))return;
      go(page);
      u.searchParams.delete('open');
      history.replaceState({},'',u.pathname+(u.searchParams.toString()?`?${u.searchParams}`:'')+u.hash);
    }catch(e){console.warn('Werd deep link',e)}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(openRequestedPage,450));
  else setTimeout(openRequestedPage,450);
  window.addEventListener('pageshow',()=>setTimeout(openRequestedPage,150));
})();