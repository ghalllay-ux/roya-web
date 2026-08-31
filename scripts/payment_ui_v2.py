from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')

marker='/* roya-payment-ui-v2 */'
if marker not in s:
    css=r'''<style>
/* roya-payment-ui-v2 */
#royaCheckoutPage{--pay-bg:#070916;--pay-card:#0f1428;--pay-line:rgba(255,255,255,.09);--pay-text:#f7f7fb;--pay-muted:#aeb5cc;--pay-gold:#f0c96d;background:radial-gradient(circle at 85% -10%,rgba(116,77,220,.28),transparent 32%),radial-gradient(circle at 10% 20%,rgba(55,112,255,.10),transparent 24%),linear-gradient(160deg,#060815 0%,#090d1d 55%,#080a16 100%)!important;color:var(--pay-text);padding:max(18px,env(safe-area-inset-top)) 16px max(30px,env(safe-area-inset-bottom))!important;font-family:system-ui,-apple-system,BlinkMacSystemFont,"SF Arabic","Segoe UI",Tahoma,Arial,sans-serif!important}
#royaCheckoutPage *{box-sizing:border-box}
#royaCheckoutPage .roya-pay-wrap{width:min(1040px,100%);margin:0 auto}
#royaCheckoutPage .roya-pay-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:2px 0 18px}
#royaCheckoutPage .roya-pay-brand{display:flex;align-items:center;gap:10px;font-weight:900;font-size:20px}
#royaCheckoutPage .roya-pay-logo{width:42px;height:42px;border-radius:15px;display:grid;place-items:center;background:linear-gradient(145deg,#211c49,#12162d);border:1px solid rgba(240,201,109,.24);box-shadow:0 10px 28px rgba(0,0,0,.25)}
#royaCheckoutPage .roya-pay-back{appearance:none;border:1px solid var(--pay-line);background:rgba(255,255,255,.045);color:#e8eaf3;border-radius:14px;padding:10px 14px;font:inherit;font-weight:800;cursor:pointer}
#royaCheckoutPage .roya-pay-shell{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(300px,.85fr);gap:16px;align-items:start}
#royaCheckoutPage .roya-pay-main,#royaCheckoutPage .roya-pay-summary{background:linear-gradient(165deg,rgba(18,24,49,.98),rgba(10,14,31,.99));border:1px solid var(--pay-line);border-radius:26px;box-shadow:0 28px 80px rgba(0,0,0,.34);overflow:hidden}
#royaCheckoutPage .roya-pay-head{padding:24px 24px 18px;border-bottom:1px solid var(--pay-line)}
#royaCheckoutPage .roya-pay-kicker{display:inline-flex;align-items:center;gap:7px;color:#d7c38d;background:rgba(240,201,109,.07);border:1px solid rgba(240,201,109,.14);border-radius:999px;padding:6px 10px;font-size:11px;font-weight:900;margin-bottom:11px}
#royaCheckoutPage .roya-pay-title{margin:0;font-size:26px;line-height:1.25;letter-spacing:-.5px}
#royaCheckoutPage .roya-pay-sub{margin:8px 0 0;color:var(--pay-muted);font-size:13px;line-height:1.8}
#royaCheckoutPage .roya-pay-trust{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;padding:14px 24px;border-bottom:1px solid var(--pay-line);background:rgba(255,255,255,.018)}
#royaCheckoutPage .roya-pay-trust div{min-height:58px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.025);border-radius:14px;padding:10px;display:flex;align-items:center;gap:8px;color:#cfd4e6;font-size:11px;line-height:1.45}
#royaCheckoutPage .roya-pay-trust b{color:#fff;display:block;font-size:11px}
#royaCheckoutPage .roya-pay-form{padding:22px 24px 24px}
#royaCheckoutPage .roya-pay-secure{display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid rgba(91,214,157,.14);background:rgba(53,163,112,.055);border-radius:15px;padding:11px 12px;margin-bottom:15px;color:#cde8db;font-size:11px}
#royaCheckoutPage .roya-pay-summary{padding:20px;position:sticky;top:18px}
#royaCheckoutPage .roya-pay-summary h2{font-size:15px;margin:0 0 14px;color:#dfe2ef}
#royaCheckoutPage .roya-plan-box{border-radius:20px;padding:17px;background:linear-gradient(150deg,rgba(141,107,255,.13),rgba(240,201,109,.055));border:1px solid rgba(141,107,255,.18)}
#royaCheckoutPage .roya-plan-name{font-size:18px;font-weight:900;line-height:1.45}
#royaCheckoutPage .roya-plan-price{font-size:31px;font-weight:950;color:#f4d887;margin-top:12px;letter-spacing:-1px}
#royaCheckoutPage .roya-plan-price small{font-size:12px;color:#bfc5d8;font-weight:700}
#royaCheckoutPage .roya-summary-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 2px;border-bottom:1px solid rgba(255,255,255,.065);font-size:12px;color:#b8bfd4}
#royaCheckoutPage .roya-summary-row strong{color:#f3f4f8}
#royaCheckoutPage .roya-why{margin-top:15px;padding:14px;border-radius:17px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.065);color:#aeb5ca;font-size:11px;line-height:1.8}
#royaCheckoutPage .roya-why strong{display:block;color:#e8eaf2;font-size:12px;margin-bottom:5px}
#royaCheckoutPage .roya-moyasar-label{font-size:12px;font-weight:900;color:#e9ebf5;margin:0 0 10px}
#royaCheckoutPage .mysr-form{min-height:120px}
#royaCheckoutPage .mysr-form input,#royaCheckoutPage .mysr-form select{border-radius:12px!important}
#royaCheckoutPage .mysr-form button{border-radius:14px!important;min-height:50px!important;font-weight:900!important}
#royaCheckoutPage .roya-pay-foot{text-align:center;color:#737c98;font-size:10px;line-height:1.75;margin-top:14px}
@media(max-width:760px){#royaCheckoutPage{padding-left:12px!important;padding-right:12px!important}#royaCheckoutPage .roya-pay-shell{grid-template-columns:1fr}#royaCheckoutPage .roya-pay-summary{position:static;order:-1}#royaCheckoutPage .roya-pay-main,#royaCheckoutPage .roya-pay-summary{border-radius:22px}#royaCheckoutPage .roya-pay-head{padding:20px 18px 16px}#royaCheckoutPage .roya-pay-title{font-size:23px}#royaCheckoutPage .roya-pay-trust{padding:12px 18px;gap:7px}#royaCheckoutPage .roya-pay-trust div{display:block;text-align:center;padding:9px 5px;font-size:9px}#royaCheckoutPage .roya-pay-trust span{display:block;font-size:16px;margin-bottom:3px}#royaCheckoutPage .roya-pay-form{padding:18px}#royaCheckoutPage .roya-pay-summary{padding:16px}#royaCheckoutPage .roya-plan-price{font-size:28px}}
</style>'''
    s=s.replace('</head>',css+'\n</head>',1)

fn=s.index('async function startPremiumCheckout(planId){')
start=s.index("  page.style.cssText=",fn)
html_start=s.index("  page.innerHTML=`",start)
html_end=s.index("`;\n  document.body.appendChild(page);",html_start)+2

new_style="  page.style.cssText='min-height:100vh';"
new_html=r'''  page.innerHTML=`<div class="roya-pay-wrap">
    <div class="roya-pay-top">
      <div class="roya-pay-brand"><div class="roya-pay-logo">🌙</div><span>رؤيا</span></div>
      <button class="roya-pay-back" type="button" onclick="leaveCheckoutPage()">عودة</button>
    </div>
    <div class="roya-pay-shell">
      <section class="roya-pay-main" aria-label="إتمام الدفع">
        <div class="roya-pay-head">
          <div class="roya-pay-kicker">🔒 إتمام دفع آمن</div>
          <h1 class="roya-pay-title">أكمل طلبك بثقة</h1>
          <p class="roya-pay-sub">أدخل بيانات الدفع في النموذج الآمن أدناه. تتم معالجة بيانات البطاقة مباشرة عبر بوابة ميسر.</p>
        </div>
        <div class="roya-pay-trust">
          <div><span>🛡️</span><span><b>معالجة آمنة</b>عبر بوابة ميسر</span></div>
          <div><span>🔐</span><span><b>خصوصية البطاقة</b>لا نخزن بياناتها</span></div>
          <div><span>✓</span><span><b>تأكيد واضح</b>بعد نجاح العملية</span></div>
        </div>
        <div class="roya-pay-form">
          <div class="roya-pay-secure"><span>🔒 اتصال آمن ومشفّر</span><span>الدفع بالريال السعودي</span></div>
          <div class="roya-moyasar-label">بيانات الدفع</div>
          <div class="mysr-form"></div>
          <div class="roya-pay-foot">لن يتم تنفيذ الطلب إلا بعد اكتمال عملية الدفع بنجاح. بالمتابعة أنت توافق على شروط الخدمة وسياسة الخصوصية.</div>
        </div>
      </section>
      <aside class="roya-pay-summary" aria-label="ملخص الطلب">
        <h2>ملخص الطلب</h2>
        <div class="roya-plan-box">
          <div style="font-size:11px;color:#aeb5cc;margin-bottom:5px">الخيار المحدد</div>
          <div class="roya-plan-name">${escapeHtml(plan.name_ar)}</div>
          <div class="roya-plan-price">${Number(plan.price_sar).toFixed(2)} <small>ر.س</small></div>
        </div>
        <div class="roya-summary-row"><span>المبلغ</span><strong>${Number(plan.price_sar).toFixed(2)} ر.س</strong></div>
        <div class="roya-summary-row"><span>العملة</span><strong>SAR</strong></div>
        <div class="roya-summary-row"><span>بوابة الدفع</span><strong>ميسر</strong></div>
        <div class="roya-why"><strong>لماذا هذه الصفحة أكثر أمانًا؟</strong>بيانات الدفع الحساسة يتم إدخالها داخل نموذج مزود الدفع، ولا يعرض رؤيا رقم بطاقتك الكامل أو رمز التحقق.</div>
      </aside>
    </div>
  </div>`'''

s=s[:start]+new_style+'\n'+new_html+s[html_end:]
p.write_text(s,encoding='utf-8')
print('Roya premium trusted payment UI v2 applied')
