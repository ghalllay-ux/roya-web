// Keep direct voice recitation independent from Memorization Tracker and account login — v102
(function(){
  const $=id=>document.getElementById(id);
  const IS_CHROME_IOS=/CriOS/i.test(navigator.userAgent||'');
  let applying=false,observer=null,reloadRequested=false;

  function directActive(){
    return !!($('rtestDirectBtn')?.classList.contains('active')&&$('rtestDirectPanel')?.classList.contains('show'));
  }
  function setDisabled(btn,value){if(btn&&btn.disabled!==value)btn.disabled=value}
  function setHtml(el,html){if(el&&el.innerHTML!==html)el.innerHTML=html}
  function selectedLabel(){
    const s=$('rtestDirectSurah'),f=$('rtestDirectFrom'),t=$('rtestDirectTo');
    const surah=s?.options?.[s.selectedIndex]?.text?.replace(/^\d+\.\s*/, '')||'السورة المختارة';
    const from=Number(f?.value)||1,to=Math.max(from,Number(t?.value)||from);
    return from===to?`${surah} • الآية ${from}`:`${surah} • من ${from} إلى ${to}`;
  }
  function ensureChromeFallback(){
    if(!IS_CHROME_IOS||$('werdChromeRecitationStyle')||reloadRequested)return;
    reloadRequested=true;
    const s=document.createElement('script');s.src='./chrome-recitation-fallback.js?v=102';s.dataset.werdChromeFallbackReload='1';
    s.onload=()=>{reloadRequested=false;setTimeout(apply,80)};
    s.onerror=()=>{reloadRequested=false;setTimeout(apply,800)};
    document.body.appendChild(s);
  }

  function apply(){
    if(applying||!directActive())return;
    const start=$('rtestStart'),support=$('rtestSupport'),avail=$('rtestAvailable');
    if(!start||!support)return;
    applying=true;
    try{
      if(avail)avail.textContent=`جاهز للتسميع مباشرة: ${selectedLabel()}`;
      if(IS_CHROME_IOS){
        if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){
          setDisabled(start,true);
          setHtml(support,'<span>⚠️</span><div><b>التسجيل الصوتي غير متاح في هذا الإصدار من Chrome.</b><br>حدّث Chrome ثم أعد المحاولة.</div>');
          return;
        }
        ensureChromeFallback();
        if(!$('werdChromeRecitationStyle')){
          setDisabled(start,true);
          setHtml(support,'<span>☁️</span><div><b>جاري تجهيز التسميع السحابي…</b><br>الخدمة تعمل بدون تسجيل دخول.</div>');
          return;
        }
        setDisabled(start,false);
        if(start.textContent!=='ابدأ جلسة التسميع')start.textContent='ابدأ جلسة التسميع';
        setHtml(support,'<span>🎙️</span><div><b>جاهز للتسميع مباشرة بدون تسجيل ✓</b><br>اختر الآية وابدأ. التسجيل الصوتي مؤقت للتحويل فقط ولا يُحفظ.</div>');
      }else{
        const native=!!(window.SpeechRecognition||window.webkitSpeechRecognition);
        if(native){
          setDisabled(start,false);
          if(start.textContent!=='ابدأ جلسة التسميع')start.textContent='ابدأ جلسة التسميع';
          setHtml(support,'<span>🎙️</span><div><b>جاهز للتسميع المباشر ✓</b><br>لا تحتاج إلى تسجيل الدخول أو إضافة الآية إلى متابعة الحفظ قبل بدء التسميع.</div>');
        }
      }
    }finally{applying=false}
  }

  function install(){
    const page=$('recitationTest');
    if(!page)return setTimeout(install,250);
    if(observer)return;
    observer=new MutationObserver(()=>{if(directActive())setTimeout(apply,0)});
    observer.observe(page,{subtree:true,childList:true,attributes:true,attributeFilter:['disabled','class']});
    document.addEventListener('click',e=>{if(e.target?.closest?.('#rtestDirectBtn,[data-rscope]'))setTimeout(apply,40)});
    document.addEventListener('change',e=>{if(e.target?.closest?.('#rtestDirectSurah,#rtestDirectFrom,#rtestDirectTo'))setTimeout(apply,0)});
    setInterval(()=>{if(directActive())apply()},500);
    setTimeout(apply,80);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
