// Werd password recovery UI — v1
(function(){
  const $=id=>document.getElementById(id);
  let recoveryOpen=false;
  function notify(m){try{typeof toast==='function'?toast(m):console.log(m)}catch(_){console.log(m)}}
  function validEmail(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||'').trim())}
  function addStyle(){
    if($('werdAuthRecoveryStyle'))return;
    const s=document.createElement('style');s.id='werdAuthRecoveryStyle';s.textContent=`
      .werd-forgot-btn{display:block;width:100%;margin-top:10px;border:0;background:transparent;color:var(--green);font:inherit;font-weight:850;text-decoration:underline;text-underline-offset:4px;padding:8px;cursor:pointer}
      .werd-recovery-overlay{position:fixed;inset:0;z-index:10050;background:rgba(15,32,25,.48);backdrop-filter:blur(8px);display:grid;place-items:center;padding:20px;direction:rtl}
      .werd-recovery-card{width:min(440px,100%);background:var(--card,#fffdf7);color:var(--ink,#173d31);border:1px solid rgba(172,138,76,.32);border-radius:28px;padding:24px;box-shadow:0 24px 70px rgba(0,0,0,.22)}
      .werd-recovery-card h3{margin:0 0 8px;color:var(--green,#17654d);font-size:24px}.werd-recovery-card p{margin:0 0 16px;color:var(--muted,#68766f);line-height:1.8}
      .werd-recovery-card input{width:100%;box-sizing:border-box;border:1px solid var(--line,#ded8cb);background:var(--card,#fff);color:var(--ink,#173d31);border-radius:15px;padding:13px 14px;font:inherit;margin:6px 0}
      .werd-recovery-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:12px}.werd-recovery-actions button{min-height:46px}
    `;document.head.appendChild(s)
  }
  function injectForgot(){
    addStyle();
    const out=$('signedOutBox');if(!out||$('werdForgotPassword'))return;
    const btn=document.createElement('button');btn.type='button';btn.id='werdForgotPassword';btn.className='werd-forgot-btn';btn.textContent='نسيت كلمة المرور؟';btn.onclick=requestReset;
    out.appendChild(btn)
  }
  async function requestReset(){
    const email=String($('authEmail')?.value||'').trim();
    if(!validEmail(email)){notify('أدخل بريد الحساب أولًا');$('authEmail')?.focus();return}
    const b=$('werdForgotPassword');if(b){b.disabled=true;b.textContent='جاري إرسال رابط الاستعادة…'}
    try{
      let result=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});
      if(result?.error){
        console.warn('Werd recovery redirect retry',result.error);
        result=await sb.auth.resetPasswordForEmail(email)
      }
      if(result?.error)throw result.error;
      notify('تم إرسال رابط تغيير كلمة المرور إلى بريدك ✓');
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
  function install(){injectForgot();setInterval(injectForgot,1200);try{sb.auth.onAuthStateChange((event)=>{if(event==='PASSWORD_RECOVERY')setTimeout(openRecovery,0)})}catch(e){console.warn('Werd recovery listener',e)}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
