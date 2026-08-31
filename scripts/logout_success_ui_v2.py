from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
old="alert('تم تسجيل الخروج')"
new="showLogoutSuccessToast()"
if old not in s and new not in s:
    raise SystemExit('Logout alert anchor not found')
if old in s:
    s=s.replace(old,new,1)
marker='roya-logout-toast-v2'
if marker not in s:
    insert=r'''
<style id="roya-logout-toast-v2">
.logoutToast{position:fixed;z-index:30000;left:50%;top:22px;transform:translateX(-50%);width:min(390px,calc(100% - 28px));direction:rtl;padding:14px 15px;border:1px solid rgba(255,255,255,.11);border-radius:20px;background:linear-gradient(145deg,rgba(20,25,58,.98),rgba(8,12,33,.99));box-shadow:0 24px 70px rgba(0,0,0,.55);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);display:flex;align-items:center;gap:12px;animation:logoutToastIn .28s cubic-bezier(.2,.8,.2,1)}
.logoutToastIcon{width:46px;height:46px;min-width:46px;border-radius:15px;display:grid;place-items:center;background:linear-gradient(145deg,#a8f1ce,#56d89c);color:#082117;font-size:22px;font-weight:900;box-shadow:0 10px 26px rgba(53,211,145,.18)}
.logoutToastText{flex:1}.logoutToastText b{display:block;color:#fff;font-size:15px;margin-bottom:3px}.logoutToastText span{color:#aeb5d2;font-size:12px}.logoutToastClose{border:0;background:rgba(255,255,255,.06);color:#c9cee2;width:32px;height:32px;border-radius:10px;cursor:pointer}
@keyframes logoutToastIn{from{opacity:0;transform:translate(-50%,-14px) scale(.97)}to{opacity:1;transform:translate(-50%,0) scale(1)}}
@media(max-width:520px){.logoutToast{top:calc(12px + env(safe-area-inset-top));border-radius:18px}}
</style>
<script>
function showLogoutSuccessToast(){
  var old=document.getElementById('logoutSuccessToast');if(old)old.remove();
  var el=document.createElement('div');el.id='logoutSuccessToast';el.className='logoutToast';
  el.innerHTML='<div class="logoutToastIcon">✓</div><div class="logoutToastText"><b>تم تسجيل الخروج بنجاح</b><span>نراك قريبًا في رؤيا</span></div><button type="button" class="logoutToastClose" aria-label="إغلاق">×</button>';
  el.querySelector('button').addEventListener('click',function(){el.remove()});
  document.body.appendChild(el);setTimeout(function(){if(el.isConnected)el.remove()},3200);
}
</script>
'''
    s=s.replace('</body>',insert+'</body>',1)
p.write_text(s,encoding='utf-8')
print('Safe logout toast patch applied')
