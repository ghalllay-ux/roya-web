// Reliable PWA install assistant for Werd — v110
(function(){
  let installPrompt=null;
  const $=id=>document.getElementById(id);
  const ua=navigator.userAgent||'';
  const isIOS=/iPhone|iPad|iPod/i.test(ua);
  const isChromeIOS=/CriOS/i.test(ua);
  const isSafariIOS=isIOS&&!isChromeIOS;

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
      .werd-install-sheet h3{margin:15px 0 6px;font-size:22px}.werd-install-lead{margin:0 0 14px;color:var(--muted);line-height:1.8;font-size:13px}.werd-install-steps{display:grid;gap:9px}.werd-install-step{display:grid;grid-template-columns:34px 1fr;gap:10px;align-items:center;border:1px solid var(--line);border-radius:17px;padding:11px 12px;background:linear-gradient(135deg,var(--card),color-mix(in srgb,var(--sage) 32%,var(--card)))}.werd-install-step b{display:grid;place-items:center;width:34px;height:34px;border-radius:11px;background:var(--green);color:#fff}.werd-install-step span{font-size:13px;line-height:1.7}.werd-install-actions{display:grid;grid-template-columns:1fr auto;gap:9px;margin-top:15px}.werd-install-share{border:0;border-radius:16px;background:var(--green);color:#fff;font-weight:900;padding:13px 15px}.werd-install-later{border:1px solid var(--line);border-radius:16px;background:var(--card);color:var(--ink);font-weight:800;padding:13px}.werd-install-note{margin-top:10px;color:var(--muted);font-size:11px;line-height:1.7}
      #installCard.werd-install-ready #installBtn{background:var(--green);color:#fff;border-color:var(--green);font-weight:900}
      @media(max-width:430px){.werd-install-overlay{padding:10px}.werd-install-sheet{border-radius:24px}.werd-install-actions{grid-template-columns:1fr}.werd-install-later{order:2}}
    `;document.head.appendChild(s);
  }
  function ensureModal(){
    injectStyle();let ov=$('werdInstallOverlay');if(ov)return ov;
    ov=document.createElement('div');ov.id='werdInstallOverlay';ov.className='werd-install-overlay';ov.innerHTML=`<div class="werd-install-sheet" role="dialog" aria-modal="true" aria-labelledby="werdInstallTitle"><div class="werd-install-head"><div class="werd-install-brand"><div class="werd-install-logo">ورد</div><div><b>تثبيت ورد</b><div class="muted">كتطبيق على الشاشة الرئيسية</div></div></div><button class="werd-install-close" id="werdInstallClose" type="button">×</button></div><h3 id="werdInstallTitle">ثبّت ورد في ثوانٍ</h3><p class="werd-install-lead" id="werdInstallLead"></p><div class="werd-install-steps" id="werdInstallSteps"></div><div class="werd-install-actions"><button class="werd-install-share" id="werdInstallShare" type="button">فتح قائمة المشاركة</button><button class="werd-install-later" id="werdInstallLater" type="button">لاحقًا</button></div><div class="werd-install-note" id="werdInstallNote"></div></div>`;
    document.body.appendChild(ov);
    const close=()=>ov.classList.remove('show');$('werdInstallClose').onclick=close;$('werdInstallLater').onclick=close;ov.addEventListener('click',e=>{if(e.target===ov)close()});
    return ov;
  }
  function showIOSGuide(){
    const ov=ensureModal();
    $('werdInstallLead').textContent=isChromeIOS?'أنت تستخدم Chrome على iPhone. افتح قائمة المشاركة ثم أضف ورد إلى الشاشة الرئيسية.':'على iPhone يتم التثبيت من قائمة المشاركة الخاصة بالمتصفح.';
    $('werdInstallSteps').innerHTML='<div class="werd-install-step"><b>1</b><span>اضغط <strong>فتح قائمة المشاركة</strong> أو أيقونة المشاركة ⬆️ بجانب عنوان الموقع.</span></div><div class="werd-install-step"><b>2</b><span>اختر <strong>«إضافة إلى الشاشة الرئيسية»</strong>.</span></div><div class="werd-install-step"><b>3</b><span>اضغط <strong>«إضافة»</strong>، ثم افتح «ورد» من الأيقونة الجديدة.</span></div>';
    $('werdInstallShare').style.display='block';$('werdInstallShare').textContent='فتح قائمة المشاركة ⬆️';
    $('werdInstallNote').textContent='إذا لم يظهر خيار «إضافة إلى الشاشة الرئيسية» داخل القائمة المفتوحة، استخدم زر المشاركة الموجود في شريط المتصفح ثم مرّر قائمة الإجراءات للأسفل.';
    $('werdInstallShare').onclick=async()=>{
      if(!navigator.share){toastSafe('اضغط أيقونة المشاركة ⬆️ بجانب عنوان الموقع');return}
      try{await navigator.share({title:'ورد | قرآن وأذكار',text:'ثبّت تطبيق ورد على الشاشة الرئيسية',url:location.origin+location.pathname});}
      catch(e){if(e?.name!=='AbortError')toastSafe('اضغط أيقونة المشاركة ⬆️ بجانب عنوان الموقع')}
    };
    ov.classList.add('show');
  }
  async function nativeInstall(){
    if(standalone()){toastSafe('ورد مثبت بالفعل ✓');return}
    if(!installPrompt){showGenericGuide();return}
    try{installPrompt.prompt();const choice=await installPrompt.userChoice;installPrompt=null;if(choice?.outcome==='accepted'){toastSafe('تم بدء تثبيت ورد ✓')}else toastSafe('يمكنك تثبيت ورد لاحقًا')}
    catch(e){console.warn('Werd install prompt',e);showGenericGuide()}
  }
  function showGenericGuide(){
    const ov=ensureModal();$('werdInstallLead').textContent='المتصفح لم يجهز نافذة التثبيت التلقائي بعد. يمكنك تثبيت ورد من قائمة المتصفح.';$('werdInstallSteps').innerHTML='<div class="werd-install-step"><b>1</b><span>افتح قائمة المتصفح أو المشاركة.</span></div><div class="werd-install-step"><b>2</b><span>اختر <strong>تثبيت التطبيق</strong> أو <strong>إضافة إلى الشاشة الرئيسية</strong>.</span></div><div class="werd-install-step"><b>3</b><span>أكد التثبيت لفتح ورد كتطبيق مستقل.</span></div>';$('werdInstallShare').style.display=navigator.share?'block':'none';$('werdInstallShare').textContent='فتح المشاركة';$('werdInstallShare').onclick=async()=>{try{await navigator.share?.({title:'ورد | قرآن وأذكار',url:location.href})}catch(_){}};$('werdInstallNote').textContent='قد تختلف تسمية خيار التثبيت قليلًا حسب المتصفح.';ov.classList.add('show');
  }
  function configure(){
    const card=$('installCard'),btn=$('installBtn'),hint=$('installHint');if(!card||!btn||!hint)return setTimeout(configure,200);
    if(standalone()){card.style.display='none';return}
    card.style.display='block';card.classList.add('werd-install-ready');
    if(isIOS){btn.textContent='تثبيت التطبيق';hint.textContent=isChromeIOS?'على iPhone: اضغط الزر وسنفتح لك خطوات التثبيت من Chrome.':'على iPhone: اضغط الزر لفتح خطوات إضافة ورد إلى الشاشة الرئيسية.';btn.onclick=showIOSGuide;}
    else{btn.textContent=installPrompt?'تثبيت الآن':'تثبيت التطبيق';hint.textContent=installPrompt?'ورد جاهز للتثبيت كتطبيق مستقل.':'اضغط لعرض طريقة التثبيت المناسبة لمتصفحك.';btn.onclick=nativeInstall;}
  }
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;setTimeout(configure,0)});
  window.addEventListener('appinstalled',()=>{installPrompt=null;$('werdInstallOverlay')?.classList.remove('show');if($('installCard'))$('installCard').style.display='none';toastSafe('تم تثبيت ورد بنجاح ✓')});
  window.matchMedia?.('(display-mode: standalone)').addEventListener?.('change',configure);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(configure,350));else setTimeout(configure,350);
  window.addEventListener('pageshow',()=>setTimeout(configure,180));
})();
