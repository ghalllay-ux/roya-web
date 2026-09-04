// Keep the prayer page visually stable while GPS/prayer data updates change content height.
(function(){
  let stopActiveGuard=null;

  function currentScrollY(){
    const scroller=document.scrollingElement||document.documentElement;
    return Number(window.scrollY||window.pageYOffset||scroller?.scrollTop||0);
  }

  function beginStabilityGuard(button){
    if(typeof stopActiveGuard==='function')stopActiveGuard();
    const prayer=document.getElementById('prayer');
    const anchor=document.getElementById('wpLocateAction')||button?.closest?.('.prayer-location-pro')||button;
    if(!prayer||!anchor||!anchor.isConnected)return;

    const targetTop=anchor.getBoundingClientRect().top;
    let active=true,correcting=false,raf=0,interval=0,ttl=0;

    function restore(){
      if(!active||!anchor.isConnected)return;
      const delta=anchor.getBoundingClientRect().top-targetTop;
      if(!Number.isFinite(delta)||Math.abs(delta)<0.75)return;
      correcting=true;
      const scroller=document.scrollingElement||document.documentElement;
      const oldBehavior=scroller?.style?.scrollBehavior||'';
      if(scroller?.style)scroller.style.scrollBehavior='auto';
      window.scrollTo(0,Math.max(0,currentScrollY()+delta));
      if(scroller?.style)scroller.style.scrollBehavior=oldBehavior;
      requestAnimationFrame(()=>{correcting=false});
    }

    function schedule(){
      if(!active)return;
      cancelAnimationFrame(raf);
      raf=requestAnimationFrame(restore);
    }

    const mutationObserver=new MutationObserver(schedule);
    mutationObserver.observe(prayer,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','style']});

    const resizeObserver=typeof ResizeObserver==='function'?new ResizeObserver(schedule):null;
    if(resizeObserver){
      resizeObserver.observe(anchor);
      ['prayerTimes','prayerStatus','nextPrayerName','nextPrayerTime','nextPrayerCountdown'].forEach(id=>{
        const el=document.getElementById(id);if(el)resizeObserver.observe(el);
      });
    }

    function cleanup(){
      if(!active)return;
      active=false;
      cancelAnimationFrame(raf);
      clearInterval(interval);clearTimeout(ttl);
      mutationObserver.disconnect();resizeObserver?.disconnect();
      window.removeEventListener('touchstart',userCancel);
      window.removeEventListener('wheel',userCancel);
      window.removeEventListener('pointerdown',userCancel);
      if(stopActiveGuard===cleanup)stopActiveGuard=null;
    }

    function userCancel(){
      if(!correcting)cleanup();
    }

    // The original tap has already finished when these listeners are installed.
    setTimeout(()=>{
      if(!active)return;
      window.addEventListener('touchstart',userCancel,{passive:true,once:true});
      window.addEventListener('wheel',userCancel,{passive:true,once:true});
      window.addEventListener('pointerdown',userCancel,{passive:true,once:true});
    },0);

    // GPS may take ~11 seconds, then prayer data still needs to render.
    interval=setInterval(restore,140);
    ttl=setTimeout(cleanup,18000);
    stopActiveGuard=cleanup;
    restore();
  }

  function injectStyle(){
    if(document.getElementById('werdPrayerScrollStabilityStyle'))return;
    const style=document.createElement('style');
    style.id='werdPrayerScrollStabilityStyle';
    style.textContent='#prayer #prayerTimes,#prayer #prayerStatus,#prayer .prayer-location-pro{overflow-anchor:none!important}';
    document.head.appendChild(style);
  }

  function boot(){
    injectStyle();
    document.addEventListener('click',event=>{
      const button=event.target?.closest?.('#locatePrayerBtn');
      if(button)beginStabilityGuard(button);
    },true);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
