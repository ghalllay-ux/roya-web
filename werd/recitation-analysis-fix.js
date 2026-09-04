// Werd recitation analysis reliability bridge — v130
(function(){
  if(window.__werdRecitationAnalysisFix)return;
  window.__werdRecitationAnalysisFix=true;
  const originalFetch=window.fetch.bind(window);
  function ayahMatch(raw){
    try{
      const u=new URL(typeof raw==='string'?raw:raw?.url,location.href);
      const m=u.pathname.match(/\/ayah\/(\d+):(\d+)\/quran-uthmani\/?$/);
      return m?{surah:Number(m[1]),ayah:Number(m[2])}:null;
    }catch(_){return null}
  }
  function asAlQuranPayload(text,surah,ayah,source){
    return new Response(JSON.stringify({code:200,status:'OK',data:{text,numberInSurah:ayah,surah:{number:surah},source}}),{
      status:200,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}
    });
  }
  window.fetch=async function(input,init){
    const hit=ayahMatch(input);
    if(!hit)return originalFetch(input,init);
    try{
      const local=await originalFetch(`/api/ayah/${hit.surah}/${hit.ayah}`,{method:'GET',cache:'no-store',credentials:'same-origin'});
      if(local.ok){
        const j=await local.json();
        if(j?.text)return asAlQuranPayload(String(j.text),hit.surah,hit.ayah,j.source||'werd');
      }
    }catch(e){console.warn('Werd local ayah bridge',e)}
    return originalFetch(input,init);
  };

  // Give the user visible feedback if analysis remains in a loading state too long.
  document.addEventListener('click',e=>{
    const b=e.target?.closest?.('#rtestAnalyze');if(!b||b.disabled)return;
    const before=b.textContent;
    setTimeout(()=>{
      if(b.textContent==='جاري المقارنة…'&&document.getElementById('rtestAnalysis')?.style.display!=='block'){
        b.disabled=false;b.textContent='تحليل التسميع';
        try{typeof toast==='function'&&toast('تعذر إكمال التحليل. اضغط تحليل التسميع مرة أخرى.')}catch(_){}
      }
    },12000);
  },false);
})();
