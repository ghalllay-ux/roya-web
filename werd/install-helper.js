// Smart PWA install assistant for Werd — v111
(function(){
  let installPrompt=null;
  const $=id=>document.getElementById(id);
  const ua=navigator.userAgent||'';
  const isIOS=/iPhone|iPad|iPod/i.test(ua);
  const isChromeIOS=/CriOS/i.test(ua);

  function standalone(){
    return !!(window.matchMedia?.('(display-mode: standalone)').matches||navigator.standalone===true);
  }
  function toastSafe(msg){
    try{if(typeof toast==='function')return toast(msg)}catch(_){}
    const t=$('toast');if(t){t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}
  }
  function injectStyle(){
    if($('werdInstallHelperStyle'))return;
    const s=document.createElement('style');s.id='werdInstallHelperStyle';s.textContent=`
      .werd-install-overlay{position:fixed;inset:0;z-index:12000;background:rgba(5,33,24,.48);backdrop-filter:blur(6px);display:grid;place-items:end center;padding:18px;opacity:0;pointer-events:none;transition:.2s ease}
      .werd-install-overlay.show{opacity:1;pointer-events:auto}.werd-install-sheet{width:min(560px,100%);background:var(--card);color:var(--ink);border:1px solid var(--line);border-radius:28px;padding:18px;box-shadow:0 24px 70px rgba(9,48,35,.28);transform:translateY(20px);transition:.22s ease}
      .werd-install-overlay.show .werd-install-sheet{transform:translateY(0)}.werd-install-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.werd-install-brand{display:flex;align-items:center;gap:11px}.werd-install-logo{width:48px;height:48px;border-radius:16px;background:var(--green);color:#f7e6bb;display:grid;place-items:center;font-weight:900;font-size:20px}.werd-install-close{width:40px;height:40px;border:1px solid var(--line);border-radius:13px;background:var(--card);color:var(--ink);font-size:20px}
      .werd-install-sheet h3{margin:15px 0 6px;font-size:22px}.werd-install-lead{margin:0 0 14px;color:var(--muted);line-height:1.8;font-size:13px}.werd-install-steps{display:grid;gap:9px}.werd-install-step{display:grid;grid-template-columns:34px 1fr;gap:10px;align-items:center;border:1px solid var(--line);border-radius:17px;padding:11px 12px;background:linear-gradient(135deg,var(--card),color-mix(in srgb,var(--sage) 32%,var(--card)))}.werd-install-step b{display:grid;place-items:center;width:34px;height:34px;border-radius:11px;background:var(--green);color:#fff}.werd-install-step span{font-size:13px;line-height:1.7}.werd-install-actions{display:grid;grid-template-columns:1fr;gap:9px;margin-top:15px}.werd-install-done{border:0;border-radius:16px;background:var(--green);color:#fff;font-weight:900;padding:13px 15px}.werd-install-note{margin-top:10px;color:var(--muted);font-size:11px;line-height:1.7}
      #installCard.werd-install-ready #installBtn{background:var(--green);color:#fff;border-color:var(--green);font-weight:900}
      @media(max-width:430px){.werd-install-overlay{padding:10px}.werd-install-sheet{border-radius:24px}}
    `;document.head.appendChild(s);
  }
  function ensureModal(){
    injectStyle();let ov=$('werdInstallOverlay');if(ov)return ov;
    ov=document.createElement('div');ov.id='werdInstallOverlay';ov.className='werd-install-overlay';ov.innerHTML=`<div class="werd-install-sheet" role="dialog" aria-modal="true" aria-labelledby="werdInstallTitle"><div class="werd-install-head"><div class="werd-install-brand"><div class="werd-install-logo">ورد</div><div><b>تثبيت ورد</b><div class="muted">كتطبيق على الشاشة الرئيسية</div></div></div><button class="werd-install-close" id="werdInstallClose" type="button">×</button></div><h3 id="werdInstallTitle">تثبيت ورد على iPhone</h3><p class="werd-install-lead" id="werdInstallLead"></p><div class="werd-install-steps" id="werdInstallSteps"></div><div class="werd-install-actions"><button class="werd-install-done" id="werdInstallDone" type="button">فهمت</button></div><div class="werd-install-note" id="werdInstallNote"></div></div>`;
    document.body.appendChild(ov);
    const close=()=>ov.classList.remove('show');$('werdInstallClose').onclick=close;$('werdInstallDone').onclick=close;ov.addEventListener('click',e=>{if(e.target===ov)close()});
    return ov;
  }
  function showIOSGuide(){
    const ov=ensureModal();
    $('werdInstallLead').textContent=isChromeIOS?'على iPhone لا يسمح Chrome للموقع ببدء التثبيت تلقائيًا. استخدم قائمة المشاركة مرة واحدة لإضافة ورد إلى الشاشة الرئيسية.':'على iPhone لا تسمح Apple للموقع ببدء تثبيت PWA تلقائيًا. الإضافة تتم من قائمة المشاركة.';
    $('werdInstallSteps').innerHTML='<div class="werd-install-step"><b>1</b><span>اضغط أيقونة <strong>المشاركة ⬆️</strong> في شريط المتصفح.</span></div><div class="werd-install-step"><b>2</b><span>اختر <strong>«إضافة إلى الشاشة الرئيسية»</strong>.</span></div><div class="werd-install-step"><b>3</b><span>اضغط <strong>«إضافة»</strong>. بعدها افتح ورد من الأيقونة مثل أي تطبيق.</span></div>';
    $('werdInstallNote').textContent='هذه هي طريقة iOS الرسمية؛ ورد لا يعرض زر «تثبيت مباشر» على iPhone حتى لا يوحي بوظيفة غير متاحة.';
    ov.classList.add('show');
  }
  async function nativeInstall(){
    if(standalone()){toastSafe('ورد مثبت بالفعل ✓');return}
    if(!installPrompt){toastSafe('انتظر لحظة ثم اضغط «تثبيت التطبيق» مرة أخرى');return}
    try{
      installPrompt.prompt();
      const choice=await installPrompt.userChoice;
      installPrompt=null;
      if(choice?.outcome==='accepted')toastSafe('تم بدء تثبيت ورد ✓');
      else toastSafe('يمكنك تثبيت ورد لاحقًا');
    }catch(e){console.warn('Werd install prompt',e);toastSafe('تعذر فتح نافذة التثبيت الآن')}
  }
  function configure(){
    const card=$('installCard'),btn=$('installBtn'),hint=$('installHint');if(!card||!btn||!hint)return setTimeout(configure,200);
    if(standalone()){card.style.display='none';return}
    card.style.display='block';card.classList.add('werd-install-ready');
    if(isIOS){
      btn.textContent='عرض طريقة التثبيت';
      hint.textContent='iPhone: التثبيت المباشر من زر داخل الموقع غير متاح في iOS.';
      btn.onclick=showIOSGuide;
    }else{
      btn.textContent=installPrompt?'تثبيت التطبيق':'تجهيز التثبيت…';
      hint.textContent=installPrompt?'اضغط لتثبيت ورد مباشرة كتطبيق مستقل.':'سيظهر زر التثبيت المباشر فور جاهزية المتصفح.';
      btn.disabled=!installPrompt;
      btn.onclick=nativeInstall;
    }
  }
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;const btn=$('installBtn');if(btn)btn.disabled=false;setTimeout(configure,0)});
  window.addEventListener('appinstalled',()=>{installPrompt=null;$('werdInstallOverlay')?.classList.remove('show');if($('installCard'))$('installCard').style.display='none';toastSafe('تم تثبيت ورد بنجاح ✓')});
  window.matchMedia?.('(display-mode: standalone)').addEventListener?.('change',configure);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(configure,350));else setTimeout(configure,350);
  window.addEventListener('pageshow',()=>setTimeout(configure,180));
})();
