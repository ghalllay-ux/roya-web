from pathlib import Path
import re

p=Path('index.html')
s=p.read_text(encoding='utf-8')

# Remove older logout UI injected by this patch.
s=re.sub(r'\n?<style id="roya-logout-toast-v2">[\s\S]*?</style>\s*<script>[\s\S]*?function showLogoutSuccessToast\(\)[\s\S]*?</script>\s*','\n',s,count=1)
s=re.sub(r'\n?<style id="roya-logout-success-v3">[\s\S]*?</style>\s*<script>[\s\S]*?function showLogoutSuccessToast\(\)[\s\S]*?</script>\s*','\n',s,count=1)
s=re.sub(r'\n?<style id="roya-logout-confirm-v4">[\s\S]*?</style>\s*<script>[\s\S]*?function requestRoyaLogout\(\)[\s\S]*?</script>\s*','\n',s,count=1)

insert=r'''
<style id="roya-logout-confirm-v4">
.royaLogoutBackdrop{position:fixed;inset:0;z-index:40000;display:grid;place-items:center;padding:20px;background:radial-gradient(circle at 50% 12%,rgba(123,97,255,.17),transparent 35%),rgba(2,5,18,.80);backdrop-filter:blur(18px) saturate(125%);-webkit-backdrop-filter:blur(18px) saturate(125%);animation:royaLogoutFade .2s ease-out}
.royaLogoutCard{position:relative;width:min(430px,100%);overflow:hidden;text-align:center;padding:31px 26px 24px;border-radius:30px;border:1px solid rgba(242,213,138,.20);background:linear-gradient(155deg,rgba(20,25,58,.99),rgba(8,12,33,.99));box-shadow:0 42px 120px rgba(0,0,0,.64),inset 0 0 0 1px rgba(255,255,255,.025);animation:royaLogoutRise .26s cubic-bezier(.2,.8,.2,1)}
.royaLogoutCard:before{content:'';position:absolute;inset:0 0 auto;height:145px;background:radial-gradient(circle at 50% -10%,rgba(242,213,138,.16),transparent 54%);pointer-events:none}
.royaLogoutIconWrap{position:relative;width:82px;height:82px;margin:0 auto 17px;border-radius:26px;display:grid;place-items:center;background:linear-gradient(145deg,rgba(242,213,138,.14),rgba(123,97,255,.08));border:1px solid rgba(242,213,138,.22);box-shadow:0 18px 42px rgba(0,0,0,.22)}
.royaLogoutIcon{font-size:34px;line-height:1}.royaLogoutEyebrow{position:relative;color:#d8bb77;font-size:12px;font-weight:850;margin-bottom:7px}.royaLogoutCard h3{position:relative;margin:0;color:#fff;font-size:24px;line-height:1.45}.royaLogoutCard p{position:relative;margin:9px auto 0;max-width:330px;color:#aeb5d2;font-size:13px;line-height:1.9}
.royaLogoutActions{position:relative;display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:23px}.royaLogoutYes,.royaLogoutNo{min-height:51px;border-radius:16px;cursor:pointer;font-weight:900;font-size:14px;transition:.18s ease}.royaLogoutYes{border:0;background:linear-gradient(135deg,#b98b3d,#f0d083);color:#18111c;box-shadow:0 12px 30px rgba(214,173,91,.18)}.royaLogoutNo{border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.055);color:#e7e9f3}.royaLogoutYes:hover,.royaLogoutNo:hover{transform:translateY(-1px);filter:brightness(1.05)}.royaLogoutSecure{display:flex;justify-content:center;gap:7px;align-items:center;margin-top:14px;color:#737b9d;font-size:10px}
@keyframes royaLogoutFade{from{opacity:0}to{opacity:1}}@keyframes royaLogoutRise{from{opacity:0;transform:translateY(14px) scale(.975)}to{opacity:1;transform:none}}
@media(max-width:520px){.royaLogoutBackdrop{padding:14px;align-items:end}.royaLogoutCard{border-radius:28px 28px 22px 22px;padding:28px 20px 22px;margin-bottom:max(8px,env(safe-area-inset-bottom))}.royaLogoutCard h3{font-size:22px}.royaLogoutActions{grid-template-columns:1fr 1fr}.royaLogoutIconWrap{width:76px;height:76px}}
</style>
<script>
function closeRoyaLogoutConfirm(){document.getElementById('royaLogoutConfirm')?.remove()}
function requestRoyaLogout(){
  document.getElementById('royaLogoutConfirm')?.remove();
  var overlay=document.createElement('div');
  overlay.id='royaLogoutConfirm';overlay.className='royaLogoutBackdrop';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','تأكيد تسجيل الخروج');
  overlay.innerHTML='<div class="royaLogoutCard"><div class="royaLogoutIconWrap"><div class="royaLogoutIcon">↪</div></div><div class="royaLogoutEyebrow">تأكيد تسجيل الخروج</div><h3>هل تريد تسجيل الخروج؟</h3><p>سيتم إنهاء جلستك الحالية على هذا الجهاز، ويمكنك تسجيل الدخول مرة أخرى في أي وقت.</p><div class="royaLogoutActions"><button type="button" class="royaLogoutYes">نعم، تسجيل الخروج</button><button type="button" class="royaLogoutNo">لا، البقاء</button></div><div class="royaLogoutSecure">🔒 <span>لن يتم حذف أي من رؤاك أو بيانات حسابك</span></div></div>';
  overlay.querySelector('.royaLogoutNo').addEventListener('click',closeRoyaLogoutConfirm);
  overlay.querySelector('.royaLogoutYes').addEventListener('click',async function(){var yes=this;yes.disabled=true;yes.textContent='جارٍ تسجيل الخروج…';try{await sb.auth.signOut();currentUser=null;await refreshUser();closeRoyaLogoutConfirm();}catch(e){yes.disabled=false;yes.textContent='نعم، تسجيل الخروج';console.error(e)}});
  overlay.addEventListener('click',function(e){if(e.target===overlay)closeRoyaLogoutConfirm()});
  document.addEventListener('keydown',function esc(e){if(e.key==='Escape'){closeRoyaLogoutConfirm();document.removeEventListener('keydown',esc)}});
  document.body.appendChild(overlay);setTimeout(function(){overlay.querySelector('.royaLogoutNo')?.focus()},50);
}
</script>
'''
s=s.replace('</body>',insert+'\n</body>',1)

# Replace the existing authenticated header click behavior with confirmation-first flow.
pat=r"document\.getElementById\('authBtn'\)\.addEventListener\('click',async\(e\)=>\{if\(currentUser\)\{e\.stopImmediatePropagation\(\);await sb\.auth\.signOut\(\);await refreshUser\(\);(?:showLogoutSuccessToast\(\);)?\}\}\);"
replacement="document.getElementById('authBtn').addEventListener('click',(e)=>{if(currentUser){e.stopImmediatePropagation();e.preventDefault();requestRoyaLogout();}});"
s,n=re.subn(pat,replacement,s,count=1)
if n!=1:
    raise SystemExit('Authenticated logout handler anchor not found')

p.write_text(s,encoding='utf-8')
print('Premium logout confirmation v4 applied')
