from pathlib import Path
import re

p=Path('index.html')
s=p.read_text(encoding='utf-8')

# Ensure logout uses the confirmation UI instead of a browser alert.
s=s.replace("alert('تم تسجيل الخروج')","showLogoutSuccessToast()")

# Remove previous logout success UI versions so the newest design always wins.
s=re.sub(r'\n?<style id="roya-logout-toast-v2">[\s\S]*?</style>\s*<script>[\s\S]*?function showLogoutSuccessToast\(\)[\s\S]*?</script>\s*','\n',s,count=1)
s=re.sub(r'\n?<style id="roya-logout-success-v3">[\s\S]*?</style>\s*<script>[\s\S]*?function showLogoutSuccessToast\(\)[\s\S]*?</script>\s*','\n',s,count=1)

insert=r'''
<style id="roya-logout-success-v3">
.royaLogoutBackdrop{position:fixed;inset:0;z-index:40000;display:grid;place-items:center;padding:20px;background:radial-gradient(circle at 50% 12%,rgba(123,97,255,.16),transparent 34%),rgba(2,5,18,.78);backdrop-filter:blur(18px) saturate(125%);-webkit-backdrop-filter:blur(18px) saturate(125%);animation:royaLogoutFade .22s ease-out}
.royaLogoutCard{position:relative;width:min(420px,100%);overflow:hidden;text-align:center;padding:32px 26px 24px;border-radius:30px;border:1px solid rgba(242,213,138,.20);background:linear-gradient(155deg,rgba(20,25,58,.98),rgba(8,12,33,.99));box-shadow:0 42px 120px rgba(0,0,0,.62),inset 0 0 0 1px rgba(255,255,255,.025);animation:royaLogoutRise .28s cubic-bezier(.2,.8,.2,1)}
.royaLogoutCard:before{content:'';position:absolute;inset:0 0 auto;height:145px;background:radial-gradient(circle at 50% -10%,rgba(123,211,168,.22),transparent 52%);pointer-events:none}
.royaLogoutIconWrap{position:relative;width:86px;height:86px;margin:0 auto 18px;border-radius:27px;display:grid;place-items:center;background:linear-gradient(145deg,rgba(123,211,168,.18),rgba(123,211,168,.07));border:1px solid rgba(123,211,168,.25);box-shadow:0 18px 42px rgba(25,160,104,.16)}
.royaLogoutIcon{width:54px;height:54px;border-radius:18px;display:grid;place-items:center;background:linear-gradient(145deg,#baf4d8,#63dda7);color:#082117;font-size:28px;font-weight:950;box-shadow:0 10px 28px rgba(53,211,145,.22)}
.royaLogoutEyebrow{position:relative;color:#9fe2c0;font-size:12px;font-weight:850;letter-spacing:.2px;margin-bottom:7px}.royaLogoutCard h3{position:relative;margin:0;color:#fff;font-size:24px;line-height:1.45}.royaLogoutCard p{position:relative;margin:9px auto 0;max-width:320px;color:#aeb5d2;font-size:13px;line-height:1.9}
.royaLogoutDivider{height:1px;margin:22px 0 18px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.10),transparent)}
.royaLogoutDone{width:100%;min-height:50px;border:0;border-radius:16px;cursor:pointer;background:linear-gradient(135deg,#b98b3d,#f0d083);color:#18111c;font-weight:900;font-size:14px;box-shadow:0 12px 30px rgba(214,173,91,.18);transition:.18s ease}.royaLogoutDone:hover{transform:translateY(-1px);filter:brightness(1.04)}
.royaLogoutSecure{display:flex;justify-content:center;gap:7px;align-items:center;margin-top:14px;color:#737b9d;font-size:10px}.royaLogoutSecure span{color:#8f97b8}
@keyframes royaLogoutFade{from{opacity:0}to{opacity:1}}@keyframes royaLogoutRise{from{opacity:0;transform:translateY(14px) scale(.975)}to{opacity:1;transform:none}}
@media(max-width:520px){.royaLogoutBackdrop{padding:14px;align-items:end}.royaLogoutCard{border-radius:28px 28px 22px 22px;padding:28px 20px 22px;margin-bottom:max(8px,env(safe-area-inset-bottom))}.royaLogoutCard h3{font-size:22px}.royaLogoutIconWrap{width:78px;height:78px;border-radius:24px}}
</style>
<script>
function showLogoutSuccessToast(){
  document.getElementById('royaLogoutSuccess')?.remove();
  var overlay=document.createElement('div');
  overlay.id='royaLogoutSuccess';
  overlay.className='royaLogoutBackdrop';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  overlay.setAttribute('aria-label','تم تسجيل الخروج بنجاح');
  overlay.innerHTML='<div class="royaLogoutCard"><div class="royaLogoutIconWrap"><div class="royaLogoutIcon">✓</div></div><div class="royaLogoutEyebrow">تم تأمين جلستك</div><h3>تم تسجيل الخروج بنجاح</h3><p>تم إنهاء جلستك على هذا الجهاز بأمان. نراك قريبًا في رؤيا.</p><div class="royaLogoutDivider"></div><button type="button" class="royaLogoutDone">حسنًا</button><div class="royaLogoutSecure">🔒 <span>تم إنهاء الجلسة بأمان</span></div></div>';
  overlay.querySelector('.royaLogoutDone').addEventListener('click',function(){overlay.remove()});
  overlay.addEventListener('click',function(e){if(e.target===overlay)overlay.remove()});
  document.addEventListener('keydown',function esc(e){if(e.key==='Escape'){overlay.remove();document.removeEventListener('keydown',esc)}});
  document.body.appendChild(overlay);
  setTimeout(function(){overlay.querySelector('.royaLogoutDone')?.focus()},60);
}
</script>
'''

s=s.replace('</body>',insert+'\n</body>',1)
p.write_text(s,encoding='utf-8')
print('Premium logout success modal v3 applied')
