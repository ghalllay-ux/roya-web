from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')

marker = '/* payment-premium-ui-v2 */'
css = r'''
/* payment-premium-ui-v2 */
.paymentOverlay{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:24px;background:radial-gradient(circle at 50% 8%,rgba(123,97,255,.18),transparent 34%),rgba(2,5,18,.82);backdrop-filter:blur(18px) saturate(125%);-webkit-backdrop-filter:blur(18px) saturate(125%);animation:royaPayFade .22s ease-out}
.paymentPanel{position:relative;width:min(610px,100%);max-height:92vh;overflow:auto;padding:0;border:1px solid rgba(242,213,138,.22);border-radius:30px;background:linear-gradient(155deg,rgba(20,25,58,.98),rgba(8,12,33,.99));box-shadow:0 42px 120px rgba(0,0,0,.62),0 0 0 1px rgba(255,255,255,.035) inset;scrollbar-width:thin;scrollbar-color:#4b456c transparent;animation:royaPayRise .28s cubic-bezier(.2,.8,.2,1)}
.paymentPanel:before{content:'';position:absolute;inset:0 0 auto;height:150px;pointer-events:none;background:radial-gradient(circle at 82% 0,rgba(242,213,138,.16),transparent 48%),linear-gradient(180deg,rgba(123,97,255,.10),transparent)}
.paymentHead{position:relative;padding:26px 28px 20px;border-bottom:1px solid rgba(255,255,255,.06)}
.paymentHeadRow{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.paymentBrand{display:flex;gap:13px;align-items:center}
.paymentBrandIcon{width:48px;height:48px;display:grid;place-items:center;border-radius:16px;background:linear-gradient(145deg,#2f275f,#161a3d);border:1px solid rgba(242,213,138,.23);box-shadow:0 10px 28px rgba(0,0,0,.25);color:var(--gold2);font-size:22px}
.paymentEyebrow{color:#d9bc77;font-size:12px;font-weight:800;letter-spacing:.2px;margin-bottom:4px}.paymentTitle{margin:0;font-size:24px;line-height:1.35;color:#fff}
.paymentMeta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:8px;color:#aeb4d0;font-size:13px}.paymentPill{display:inline-flex;align-items:center;gap:6px;padding:5px 9px;border:1px solid rgba(123,211,168,.22);border-radius:999px;background:rgba(123,211,168,.08);color:#a7e8c8;font-size:11px;font-weight:700}
.paymentClose{border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.055);color:#d9dced;width:40px;height:40px;border-radius:13px;cursor:pointer;transition:.2s ease;font-size:18px;line-height:1}.paymentClose:hover{transform:translateY(-1px);background:rgba(255,255,255,.10);border-color:rgba(242,213,138,.25);color:#fff}
.paymentBody{position:relative;padding:22px 28px 28px}.paymentStatus{display:flex;gap:11px;align-items:flex-start;margin:0 0 18px;padding:13px 14px;border-radius:16px;background:linear-gradient(135deg,rgba(214,173,91,.09),rgba(123,97,255,.055));border:1px solid rgba(214,173,91,.17);color:#cfd3e8;line-height:1.7;font-size:13px}
.paymentStatusIcon{width:28px;height:28px;min-width:28px;border-radius:9px;display:grid;place-items:center;background:rgba(214,173,91,.12);color:#f0d083}.paymentSecureRow{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:0 0 17px}.paymentSecureItem{padding:9px 10px;border-radius:13px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.055);color:#9299b8;font-size:11px;text-align:center}.paymentSecureItem b{display:block;color:#dfe2f3;font-size:12px;margin-bottom:2px}
.paymentPanel .mysr-form{max-width:none!important;width:100%!important;margin:0!important}.paymentPanel .mysr-form input,.paymentPanel .mysr-form select{border-radius:14px!important;min-height:48px!important;background:#0b1028!important;border-color:#30375e!important;color:#fff!important;box-shadow:none!important;transition:border-color .18s ease,box-shadow .18s ease!important}.paymentPanel .mysr-form input:focus,.paymentPanel .mysr-form select:focus{border-color:#8f78ff!important;box-shadow:0 0 0 3px rgba(123,97,255,.12)!important}.paymentPanel .mysr-form label{color:#cdd1e5!important;font-weight:650!important}.paymentPanel .mysr-form button,.paymentPanel .mysr-form .mysr-form-button{border-radius:15px!important;min-height:50px!important;font-weight:850!important;background:linear-gradient(135deg,#b98b3d,#f0d083)!important;color:#18111c!important;border:0!important;box-shadow:0 12px 30px rgba(214,173,91,.18)!important;transition:transform .18s ease,filter .18s ease!important}.paymentPanel .mysr-form button:hover,.paymentPanel .mysr-form .mysr-form-button:hover{transform:translateY(-1px);filter:brightness(1.04)}
.paymentFoot{display:flex;justify-content:center;align-items:center;gap:8px;margin-top:16px;color:#747d9f;font-size:11px;text-align:center}.paymentResultCard{max-width:720px;margin:12px auto;padding:30px;border-radius:28px;background:linear-gradient(150deg,rgba(20,25,58,.96),rgba(10,14,34,.96));border:1px solid rgba(242,213,138,.18);box-shadow:0 26px 70px rgba(0,0,0,.28);text-align:center}.paymentResultIcon{width:68px;height:68px;margin:0 auto 14px;border-radius:22px;display:grid;place-items:center;font-size:30px;background:linear-gradient(145deg,#2a235d,#11183b);border:1px solid rgba(242,213,138,.23);color:var(--gold2)}.paymentResultCard h2{font-size:27px;margin:8px 0}.paymentResultCard p{max-width:540px;margin:8px auto 18px;color:#a9aec8;line-height:1.9}
@keyframes royaPayFade{from{opacity:0}to{opacity:1}}@keyframes royaPayRise{from{opacity:0;transform:translateY(14px) scale(.985)}to{opacity:1;transform:none}}
@media(max-width:640px){.paymentOverlay{padding:10px;align-items:flex-end}.paymentPanel{border-radius:26px 26px 18px 18px;max-height:94vh}.paymentHead{padding:20px 18px 16px}.paymentBody{padding:18px}.paymentBrandIcon{width:43px;height:43px;border-radius:14px}.paymentTitle{font-size:20px}.paymentSecureRow{grid-template-columns:1fr}.paymentSecureItem{text-align:right}.paymentResultCard{padding:24px 18px;border-radius:23px}}
'''
if marker not in s:
    s = s.replace('</style>', css + '\n</style>', 1)

old = '''overlay.innerHTML=`<div class="paymentPanel" dir="rtl">
    <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">
      <div>
        <div class="kicker">دفع تجريبي</div>
        <h2 style="margin:6px 0">${escapeHtml(plan.name_ar)}</h2>
        <p style="color:#a9aec8">${Number(plan.price_sar)} ر.س • بيئة ${cfg.mode==='test'?'اختبار':'حقيقية'}</p>
      </div>
      <button class="secondary" style="padding:8px 11px" onclick="closePaymentModal()">إغلاق</button>
    </div>
    <div class="paymentStatus" style="margin:12px 0 16px">
      لن نرسل بيانات بطاقتك إلى خوادم «رؤيا». نموذج ميسر يتولى إنشاء عملية الدفع مباشرة.
    </div>
    <div class="mysr-form"></div>
  </div>`;'''
new = '''overlay.innerHTML=`<div class="paymentPanel" dir="rtl" role="dialog" aria-modal="true" aria-label="إتمام الدفع">
    <div class="paymentHead"><div class="paymentHeadRow"><div class="paymentBrand"><div class="paymentBrandIcon">◐</div><div>
      <div class="paymentEyebrow">رؤيا Premium</div><h2 class="paymentTitle">${escapeHtml(plan.name_ar)}</h2>
      <div class="paymentMeta"><strong style="color:#f2d58a;font-size:17px">${Number(plan.price_sar)} ر.س</strong><span>•</span><span class="paymentPill">● ${cfg.mode==='test'?'وضع الاختبار':'دفع آمن'}</span></div>
    </div></div><button class="paymentClose" onclick="closePaymentModal()" aria-label="إغلاق">×</button></div></div>
    <div class="paymentBody">
      <div class="paymentStatus"><div class="paymentStatusIcon">🔒</div><div><b style="display:block;color:#eef0f8;margin-bottom:2px">دفع مشفّر وآمن</b>بيانات البطاقة تُعالج مباشرة عبر ميسر ولا تمر عبر خوادم «رؤيا».</div></div>
      <div class="paymentSecureRow"><div class="paymentSecureItem"><b>🔐 اتصال مشفّر</b>حماية أثناء الدفع</div><div class="paymentSecureItem"><b>💳 ميسر</b>بوابة دفع معتمدة</div><div class="paymentSecureItem"><b>✓ تفعيل فوري</b>بعد تأكيد العملية</div></div>
      <div class="mysr-form"></div><div class="paymentFoot">بالإكمال أنت توافق على تنفيذ عملية الدفع للخطة المحددة عبر ميسر.</div>
    </div></div>`;'''
if old in s:
    s = s.replace(old, new, 1)
elif 'paymentHeadRow' not in s:
    raise SystemExit('Payment modal template not found')

pairs = [
("""ws(`<div class="kicker">نتيجة الدفع</div><h2>تعذر التحقق من العملية</h2><p style="color:#a9aec8;line-height:1.8">لم نجد رقم العملية أو الخطة المرتبطة بها. لم يتم تفعيل Premium.</p>`);""", """ws(`<div class="paymentResultCard"><div class="paymentResultIcon">!</div><div class="kicker">نتيجة الدفع</div><h2>تعذر التحقق من العملية</h2><p>لم نجد رقم العملية أو الخطة المرتبطة بها. لم يتم تفعيل Premium.</p><button class="secondary" onclick="showAccount()">العودة إلى الحساب</button></div>`);"""),
("""ws(`<div class="kicker">نتيجة الدفع</div><h2>جارٍ التحقق من ميسر…</h2><p style="color:#a9aec8">لن يتم تفعيل الاشتراك قبل تأكيد الخادم لحالة الدفع والمبلغ والعملة.</p>`);""", """ws(`<div class="paymentResultCard"><div class="paymentResultIcon">⌛</div><div class="kicker">نتيجة الدفع</div><h2>جارٍ التحقق من ميسر…</h2><p>نتحقق من حالة العملية والمبلغ والعملة قبل تفعيل Premium على حسابك.</p></div>`);"""),
("""ws(`<div class="kicker">نتيجة الدفع</div><h2>لم يتم تأكيد الدفع</h2><p style="color:#a9aec8;line-height:1.8">لم نفعّل Premium لأن التحقق من عملية ميسر لم ينجح.</p><button class="secondary" onclick="showAccount()">العودة إلى الحساب</button>`);""", """ws(`<div class="paymentResultCard"><div class="paymentResultIcon">×</div><div class="kicker">نتيجة الدفع</div><h2>لم يتم تأكيد الدفع</h2><p>لم نفعّل Premium لأن التحقق من عملية ميسر لم ينجح.</p><button class="secondary" onclick="showAccount()">العودة إلى الحساب</button></div>`);"""),
("""ws(`<div class="kicker">تم الدفع بنجاح</div><h2>تم تفعيل Premium ✓</h2><p style="color:#a9aec8;line-height:1.8">تم التحقق من ميسر وتفعيل باقة ${escapeHtml(data?.plan?.name_ar||'Premium')} على حسابك.</p><button class="primary" onclick="showAccount()">عرض اشتراكي</button>`);""", """ws(`<div class="paymentResultCard"><div class="paymentResultIcon">✓</div><div class="kicker">تم الدفع بنجاح</div><h2>تم تفعيل Premium</h2><p>تم التحقق من ميسر وتفعيل باقة ${escapeHtml(data?.plan?.name_ar||'Premium')} على حسابك بنجاح.</p><button class="primary" onclick="showAccount()">عرض اشتراكي</button></div>`);""")
]
for a, b in pairs:
    if a in s:
        s = s.replace(a, b, 1)

p.write_text(s, encoding='utf-8')
print('Premium payment UI v2 applied')
