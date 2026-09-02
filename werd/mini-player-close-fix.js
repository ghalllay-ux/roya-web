// Werd mini-player close control — works with standard and native iOS audio.
(function(){
  function stopAndClose(e){
    if(e){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation?.()}
    try{window.werdListeningAudio?.pause()}catch(_){}
    try{if(window.werdListeningAudio){window.werdListeningAudio.removeAttribute?.('src');window.werdListeningAudio.load?.()}}catch(_){}
    const mini=document.getElementById('werdMiniPlayer');
    if(mini)mini.classList.remove('show');
    document.body.classList.remove('has-mini-player');
    ['listenPlay','miniPlay'].forEach(id=>{const b=document.getElementById(id);if(b)b.textContent='▶'});
    const status=document.getElementById('listenStatus');if(status)status.textContent='متوقف';
  }
  function install(){
    const mini=document.getElementById('werdMiniPlayer');if(!mini)return;
    let close=document.getElementById('miniClose');
    if(!close){
      close=document.createElement('button');close.id='miniClose';close.type='button';close.className='mini-close';close.setAttribute('aria-label','إغلاق مشغل الاستماع');close.title='إغلاق';close.textContent='×';mini.appendChild(close);
    }
    if(!close.dataset.bound){
      close.dataset.bound='1';
      close.addEventListener('click',stopAndClose,true);
      close.addEventListener('touchend',stopAndClose,{capture:true,passive:false});
    }
    if(!document.getElementById('miniCloseStyle')){
      const s=document.createElement('style');s.id='miniCloseStyle';s.textContent='.mini-player{padding-inline-start:44px!important}.mini-player .mini-close{position:absolute!important;inset-inline-start:8px!important;top:8px!important;width:30px!important;height:30px!important;border-radius:50%!important;background:rgba(255,255,255,.16)!important;color:#fff!important;font-size:23px!important;line-height:28px!important;display:grid!important;place-items:center!important;z-index:3!important}';document.head.appendChild(s);
    }
  }
  const mo=new MutationObserver(install);mo.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();