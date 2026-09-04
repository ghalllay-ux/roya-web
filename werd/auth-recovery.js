// Werd password recovery + premium auth UI — v2
(function(){
  const $=id=>document.getElementById(id);
  let recoveryOpen=false;
  function notify(m){try{typeof toast==='function'?toast(m):console.log(m)}catch(_){console.log(m)}}
  function validEmail(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||'').trim())}
  function addStyle(){
    if($('werdAuthRecoveryStyle'))return;
    const s=document.createElement('style');s.id='werdAuthRecoveryStyle';s.textContent=`
      #signedOutBox.werd-auth-modern{position:relative}
      #signedOutBox.werd-auth-modern>b{display:block;font-size:22px;font-weight:950;letter-spacing:-.2px;color:var(--green);margin-bottom:7px}
      #signedOutBox.werd-auth-modern>p{line-height:1.85;margin:0 0 14px}
      .werd-auth-fields{display:grid!important;gap:11px!important;margin-top:14px!important}
      .werd-auth-input{width:100%!important;min-height:58px!important;box-sizing:border-box!important;border:1.4px solid rgba(176,151,104,.32)!important;background:linear-gradient(180deg,rgba(255,255,255,.92),rgba(255,252,245,.94))!important;color:var(--ink)!important;border-radius:18px!important;padding:0 17px!important;font:inherit!important;font-size:16px!important;outline:none!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.75),0 4px 14px rgba(52,77,62,.035)!important;transition:border-color .18s ease,box-shadow .18s ease,transform .18s ease}
      .werd-auth-input:focus{border-color:rgba(21,103,75,.65)!important;box-shadow:0 0 0 4px rgba(21,103,75,.09),0 7px 18px rgba(29,82,62,.06)!important}
      .werd-auth-main-actions{display:grid!important;grid-template-columns:1fr!important;gap:0!important;margin:3px 0 0!important;width:100%!important}
      .werd-auth-login{width:100%!important;min-height:58px!important;margin:0!important;border:0!important;border-radius:19px!important;background:linear-gradient(135deg,#0f6549,#155d47)!important;color:#fff!important;font-size:18px!important;font-weight:950!important;letter-spacing:-.1px!important;box-shadow:0 11px 25px rgba(15,91,69,.18),inset 0 1px 0 rgba(255,255,255,.18)!important;transition:transform .16s ease,box-shadow .16s ease,filter .16s ease!important}
      .werd-auth-login:active{transform:scale(.985)!important;box-shadow:0 5px 15px rgba(15,91,69,.16)!important}
      .werd-auth-secondary-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px;width:100%}
      .werd-auth-signup,.werd-forgot-btn{width:100%!important;min-height:50px!important;margin:0!important;border-radius:16px!important;font:inherit!important;font-size:14px!important;font-weight:900!important;cursor:pointer!important;transition:transform .16s ease,background .16s ease,border-color .16s ease!important}
      .werd-auth-signup{border:1.3px solid rgba(15,91,69,.28)!important;background:rgba(15,91,69,.055)!important;color:var(--green)!important;padding:10px 12px!important}
      .werd-forgot-btn{display:block!important;border:1.3px solid rgba(176,151,104,.34)!important;background:rgba(190,157,94,.075)!important;color:var(--green)!important;text-decoration:none!important;padding:10px 12px!important}
      .werd-auth-signup:active,.werd-forgot-btn:active{transform:scale(.975)}
      .werd-auth-login:disabled,.werd-auth-signup:disabled,.werd-forgot-btn:disabled{opacity:.58!important;cursor:wait!important}
      body.dark .werd-auth-input{background:linear-gradient(180deg,rgba(31,58,48,.95),rgba(24,48,40,.98))!important;border-color:rgba(213,183,120,.22)!important;color:#f4ead5!important}
      body.dark .werd-auth-signup{background:rgba(48,122,92,.12)!important;border-color:rgba(113,181,150,.25)!important;color:#e8d6a9!important}
      body.dark .werd-forgot-btn{background:rgba(195,160,91,.08)!important;border-color:rgba(210,176,109,.22)!important;color:#e8d6a9!important}
      .werd-recovery-overlay{position:fixed;inset:0;z-index:10050;background:rgba(15,32,25,.48);backdrop-filter:blur(9px);-webkit-backdrop-filter:blur(9px);display:grid;place-items:center;padding:20px;direction:rtl}
      .werd-recovery-card{width:min(440px,100%);background:var(--card,#fffdf7);color:var(--ink,#173d31);border:1px solid rgba(172,138,76,.32);border-radius:28px;padding:24px;box-shadow:0 24px 70px rgba(0,0,0,.22)}
      .werd-recovery-card h3{margin:0 0 8px;color:var(--green,#17654d);font-size:24px}.werd-recovery-card p{margin:0 0 16px;color:var(--muted,#68766f);line-height:1.8}
      .werd-recovery-card input{width:100%;box-sizing:border-box;border:1px solid var(--line,#ded8cb);background:var(--card,#fff);color:var(--ink,#173d31);border-radius:15px;padding:13px 14px;font:inherit;margin:6px 0}
      .werd-recovery-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:12px}.werd-recovery-actions button{min-height:46px}
      @media(max-width:380px){.werd-auth-secondary-row{grid-template-columns:1fr}.werd-auth-login{min-height:56px!important}.werd-auth-signup,.werd-forgot-btn{min-height:48px!important}}
    `;document.head.appendChild(s)
  }
  function polishAuth(){
    addStyle();
    const out=$('signedOutBox'),email=$('authEmail'),password=$('authPassword');if(!out||!email||!password)return;
    out.classList.add('werd-auth-modern');
    email.classList.add('werd-auth-input');password.classList.add('werd-auth-input');
    email.placeholder='البريد الإلكتروني';password.placeholder='كلمة المرور';
    const fields=email.parentElement;if(fields)fields.classList.add('werd-auth-fields');
    const login=out.querySelector('button[onclick*="cloudLogin"]'),signup=out.querySelector('button[onclick*="cloudSignup"]'),forgot=$('werdForgotPassword');
    if(!login||!signup||!forgot)return;
    const actions=login.parentElement;actions?.classList.add('werd-auth-main-actions');
    login.classList.add('werd-auth-login');login.textContent='تسجيل الدخول';
    signup.classList.add('werd-auth-signup');signup.textContent='إنشاء حساب';
    let secondary=$('werdAuthSecondaryActions');
    if(!secondary){secondary=document.createElement('div');secondary.id='werdAuthSecondaryActions';secondary.className='werd-auth-secondary-row';actions?.insertAdjacentElement('afterend',secondary)}
    if(signup.parentElement!==secondary)secondary.appendChild(signup);
    if(forgot.parentElement!==secondary)secondary.appendChild(forgot)
  }
  function injectForgot(){
    addStyle();
    const out=$('signedOutBox');if(!out)return;
    if(!$('werdForgotPassword')){const btn=document.createElement('button');btn.type='button';btn.id='werdForgotPassword';btn.className='werd-forgot-btn';btn.textContent='نسيت كلمة المرور؟';btn.onclick=requestReset;out.appendChild(btn)}
    polishAuth()
  }
  async function requestReset(){
    const email=String($('authEmail')?.value||'').trim();
    if(!validEmail(email)){notify('أدخل بريد الحساب أولًا');$('authEmail')?.focus();return}
    const b=$('werdForgotPassword');if(b){b.disabled=true;b.textContent='جاري إرسال الرابط…'}
    try{
      let result=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});
      if(result?.error){console.warn('Werd recovery redirect retry',result.error);result=await sb.auth.resetPasswordForEmail(email)}
      if(result?.error)throw result.error;notify('تم إرسال رابط تغيير كلمة المرور إلى بريدك ✓')
    }catch(e){console.error('Werd password reset',e);notify('تعذر إرسال رابط الاستعادة الآن')}
    finally{if(b){b.disabled=false;b.textContent='نسيت كلمة المرور؟'}}
  }
  function closeRecovery(){const x=$('werdRecoveryOverlay');if(x)x.remove();recoveryOpen=false}
  function openRecovery(){
    if(recoveryOpen||$('werdRecoveryOverlay'))return;recoveryOpen=true;addStyle();
    const d=document.createElement('div');d.id='werdRecoveryOverlay';d.className='werd-recovery-overlay';d.innerHTML=`<div class="werd-recovery-card" role="dialog" aria-modal="true"><h3>تعيين كلمة مرور جديدة</h3><p>أدخل كلمة مرور جديدة لحساب «ورد». يجب أن تكون 6 أحرف على الأقل.</p><input id="werdNewPassword" type="password" autocomplete="new-password" minlength="6" placeholder="كلمة المرور الجديدة"><input id="werdNewPassword2" type="password" autocomplete="new-password" minlength="6" placeholder="تأكيد كلمة المرور"><div class="werd-recovery-actions"><button class="primary" id="werdSaveNewPassword" type="button">حفظ كلمة المرور</button><button class="smallbtn" id="werdCancelRecovery" type="button">إلغاء</button></div></div>`;document.body.appendChild(d);
    $('werdCancelRecovery').onclick=closeRecovery;$('werdSaveNewPassword').onclick=saveNewPassword;setTimeout(()=>$('werdNewPassword')?.focus(),100)
  }
  async function saveNewPassword(){
    const p=$('werdNewPassword')?.value||'',p2=$('werdNewPassword2')?.value||'';
    if(p.length<6)return notify('كلمة المرور يجب أن تكون 6 أحرف على الأقل');if(p!==p2)return notify('كلمتا المرور غير متطابقتين');
    const b=$('werdSaveNewPassword');b.disabled=true;b.textContent='جاري الحفظ…';
    try{const {error}=await sb.auth.updateUser({password:p});if(error)throw error;notify('تم تغيير كلمة المرور بنجاح ✓');closeRecovery();setTimeout(()=>{try{if(typeof renderAuth==='function')renderAuth()}catch(_){}},100)}
    catch(e){console.error('Werd update password',e);notify('تعذر تغيير كلمة المرور • افتح رابط الاستعادة من جديد')}
    finally{if(b){b.disabled=false;b.textContent='حفظ كلمة المرور'}}
  }
  function install(){injectForgot();setInterval(injectForgot,1000);try{sb.auth.onAuthStateChange((event)=>{if(event==='PASSWORD_RECOVERY')setTimeout(openRecovery,0)})}catch(e){console.warn('Werd recovery listener',e)}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
