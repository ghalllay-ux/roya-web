// Hard isolation between desktop-only navigation/design and the mobile Werd UI.
(function(){
 const ID='werdMobileIsolationFix';
 function inject(){
  if(document.getElementById(ID))return;
  const s=document.createElement('style');s.id=ID;s.textContent=`
  @media(max-width:959px){
    #desktopExtraNav,.desktop-extra-nav{display:none!important}
    #premiumDesktopHome{display:none!important}
    .app{width:100%!important;max-width:760px!important;margin:0 auto!important;padding:0 16px 96px!important;min-height:100vh!important;overflow:visible!important}
    main{width:100%!important;max-width:100%!important;overflow:visible!important}
    .top{position:relative!important;top:auto!important;right:auto!important;left:auto!important;width:100%!important;height:auto!important;margin:0!important;padding:18px 0 14px!important}
    .bottom{position:fixed!important;z-index:80!important;right:0!important;left:0!important;bottom:0!important;top:auto!important;width:100%!important;height:auto!important;min-height:72px!important;display:grid!important;grid-template-columns:repeat(5,1fr)!important;padding:7px max(8px,env(safe-area-inset-right)) calc(7px + env(safe-area-inset-bottom)) max(8px,env(safe-area-inset-left))!important;overflow:hidden!important;background:rgba(255,253,248,.97)!important;border:0!important;border-top:1px solid var(--line)!important;box-shadow:0 -8px 25px rgba(30,60,48,.06)!important;transform:none!important}
    .bottom:before{display:none!important;content:none!important}
    .bottom>.nav{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:3px!important;width:auto!important;min-width:0!important;min-height:54px!important;margin:0!important;padding:5px 2px!important;border:0!important;border-radius:12px!important;font-size:12px!important;line-height:1.2!important;white-space:nowrap!important}
    .bottom>.nav i{width:auto!important;height:auto!important;font-size:21px!important;line-height:1!important}
    .bottom>.nav.active{background:transparent!important;color:var(--green)!important;font-weight:850!important;box-shadow:none!important}
    .bottom>.nav.active:after{display:none!important}
    #home.active{display:block!important;width:100%!important;max-width:100%!important;overflow:visible!important}
    #home.active>*{max-width:100%!important}
  }
  `;document.head.appendChild(s)
 }
 function clean(){if(matchMedia('(max-width:959px)').matches){const x=document.getElementById('desktopExtraNav');if(x)x.style.display='none'}}
 function init(){inject();clean();addEventListener('resize',clean)}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();