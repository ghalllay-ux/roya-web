from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')

# 1) Add "forgot password" action to the existing auth modal.
old_actions = '<div class="actions" style="margin-top:16px"><button class="primary" onclick="signIn()">دخول</button><button class="secondary" onclick="signUp()">إنشاء حساب</button></div>'
new_actions = '<div class="actions" style="margin-top:16px"><button class="primary" onclick="signIn()">دخول</button><button class="secondary" onclick="signUp()">إنشاء حساب</button><button class="secondary" onclick="requestPasswordReset()">نسيت كلمة المرور؟</button></div>'
if 'onclick="requestPasswordReset()"' not in s:
    if old_actions not in s:
        raise SystemExit('Auth actions block not found')
    s = s.replace(old_actions, new_actions, 1)

# 2) Add a dedicated password-reset modal.
anchor = '<div class="modal" id="modal">'
reset_modal = '''<div class="modal" id="resetPasswordModal"><div class="modalbox"><button class="close" onclick="resetPasswordModal.classList.remove('show')">×</button>
<div class="kicker">أمان الحساب</div><h2>تعيين كلمة مرور جديدة</h2>
<p style="color:#a9aec8;line-height:1.8">اكتب كلمة مرور جديدة لحسابك.</p>
<div class="dreambox"><input id="resetNewPassword" type="password" minlength="8" autocomplete="new-password" style="width:100%;background:transparent;border:0;outline:0;color:white;padding:10px" placeholder="كلمة المرور الجديدة"></div>
<div class="actions" style="margin-top:16px"><button class="primary" onclick="updateRecoveredPassword()">حفظ كلمة المرور</button></div>
<p id="resetPasswordMsg" style="color:#a9aec8;font-size:13px;line-height:1.7"></p></div></div>
'''
if 'id="resetPasswordModal"' not in s:
    if anchor not in s:
        raise SystemExit('Modal anchor not found')
    s = s.replace(anchor, reset_modal + anchor, 1)

# 3) Add recovery functions immediately after sign-up function.
needle = "async function signUp(){const email=document.getElementById('authEmail').value.trim(),password=document.getElementById('authPassword').value;const m=document.getElementById('authMsg');m.textContent='جارٍ إنشاء الحساب…';const {error}=await sb.auth.signUp({email,password});m.textContent=error?error.message:'تم إنشاء الحساب. إذا كان تأكيد البريد مفعّلًا، افتح رسالة التأكيد ثم سجّل الدخول.'}"
functions = r'''
async function requestPasswordReset(){
  const email=document.getElementById('authEmail').value.trim();
  const m=document.getElementById('authMsg');
  if(!email){m.textContent='اكتب بريدك الإلكتروني أولًا.';document.getElementById('authEmail').focus();return}
  m.textContent='جارٍ إرسال رابط الاستعادة…';
  const redirectTo='https://roya-web.pages.dev/';
  const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo});
  m.textContent=error?error.message:'تم إرسال رابط استعادة كلمة المرور إلى بريدك. افتح الرسالة واضغط الرابط.';
}
async function updateRecoveredPassword(){
  const password=document.getElementById('resetNewPassword').value;
  const m=document.getElementById('resetPasswordMsg');
  if(password.length<8){m.textContent='يجب أن تكون كلمة المرور 8 أحرف على الأقل.';return}
  m.textContent='جارٍ حفظ كلمة المرور الجديدة…';
  const {error}=await sb.auth.updateUser({password});
  if(error){m.textContent=error.message;return}
  m.textContent='تم تحديث كلمة المرور بنجاح.';
  setTimeout(()=>{document.getElementById('resetPasswordModal').classList.remove('show');history.replaceState({},'',location.pathname);},700);
}
function openPasswordRecovery(){
  const modal=document.getElementById('resetPasswordModal');
  if(modal){document.getElementById('resetPasswordMsg').textContent='';document.getElementById('resetNewPassword').value='';modal.classList.add('show');setTimeout(()=>document.getElementById('resetNewPassword').focus(),80)}
}
'''
if 'async function requestPasswordReset()' not in s:
    if needle not in s:
        raise SystemExit('signUp function anchor not found')
    s = s.replace(needle, needle + functions, 1)

# Keep the already-installed recovery flow pinned to the Cloudflare production URL.
s = s.replace("const redirectTo=location.origin+'/';", "const redirectTo='https://roya-web.pages.dev/';")

# 4) React to Supabase PASSWORD_RECOVERY while preserving normal auth refresh.
old_listener = "sb.auth.onAuthStateChange(()=>setTimeout(refreshUser,0));refreshUser();"
new_listener = "sb.auth.onAuthStateChange((event)=>{setTimeout(refreshUser,0);if(event==='PASSWORD_RECOVERY')setTimeout(openPasswordRecovery,50)});refreshUser();"
if "event==='PASSWORD_RECOVERY'" not in s:
    if old_listener not in s:
        raise SystemExit('Auth state listener anchor not found')
    s = s.replace(old_listener, new_listener, 1)

p.write_text(s, encoding='utf-8')
print('Roya password recovery patch applied')
