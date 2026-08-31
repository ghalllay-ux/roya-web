from pathlib import Path
import re

p=Path('index.html')
s=p.read_text(encoding='utf-8')

# 1) Replace homepage subscriptions with credit packages.
start=s.find('<section class="section"><div class="sectionTitle"><h2>رؤيا Premium</h2>')
end=s.find('<section class="section" id="demoFlow">', start)
if start!=-1 and end!=-1:
    credit_home='''<section class="section"><div class="sectionTitle"><h2>شحن رصيد التفسيرات</h2><span>ادفع مرة واحدة واستخدم رصيدك وقتما تريد</span></div><div class="pricing">
<div class="card price"><h3>10 تفسيرات</h3><div class="amount">5 <small>ر.س</small></div><div class="priceOfferNote">رصيد لا يرتبط باشتراك شهري</div><button class="secondary" onclick="startPremiumCheckout('credits_5')">اشحن 10 تفسيرات</button></div>
<div class="card price pop"><span class="badge">الأكثر اختيارًا</span><h3>25 تفسيرًا</h3><div class="amount">10 <small>ر.س</small></div><div class="priceOfferNote">أفضل قيمة للاستخدام المتكرر</div><button class="primary" onclick="startPremiumCheckout('credits_10')">اشحن 25 تفسيرًا</button></div>
<div class="card price"><h3>60 تفسيرًا</h3><div class="amount">20 <small>ر.س</small></div><div class="priceOfferNote">أكبر رصيد بأفضل تكلفة</div><button class="secondary" onclick="startPremiumCheckout('credits_20')">اشحن 60 تفسيرًا</button></div>
</div></section>\n\n'''
    s=s[:start]+credit_home+s[end:]

# 2) Make checkout use package ids and standalone payment page.
fstart=s.find('async function startPremiumCheckout(')
fend=s.find('\nasync function handleMoyasarReturn(){', fstart)
if fstart!=-1 and fend!=-1:
    redirect=r'''async function startPremiumCheckout(packageId){
  if(!currentUser){openAuth();return}
  localStorage.setItem('roya_pending_credit_package',packageId);
  location.href='payment.html?package='+encodeURIComponent(packageId);
}

function leaveCheckoutPage(){location.href='./'}
function closePaymentModal(){location.href='./'}
'''
    s=s[:fstart]+redirect+s[fend:]

# 3) Payment return now verifies and adds credit, not a subscription.
hstart=s.find('async function handleMoyasarReturn(){')
hend=s.find('\nwindow.addEventListener(\'load\'', hstart)
if hstart!=-1 and hend!=-1:
    handler=r'''async function handleMoyasarReturn(){
  const params=new URLSearchParams(location.search);
  if(!params.has('payment_return') && !params.get('id'))return;
  const paymentId=params.get('id')||localStorage.getItem('roya_pending_payment')||'';
  const packageId=localStorage.getItem('roya_pending_credit_package')||'';
  if(!currentUser){openAuth();return}
  if(!paymentId||!packageId){
    ws(`<div class="paymentResultCard"><div class="paymentResultIcon">×</div><div class="kicker">نتيجة الدفع</div><h2>تعذر إكمال العملية</h2><p>لم نجد بيانات باقة الشحن أو رقم العملية.</p><button class="secondary" onclick="showAccount()">العودة إلى الحساب</button></div>`);
    return;
  }
  ws(`<div class="paymentResultCard"><div class="paymentResultIcon">⌛</div><div class="kicker">نتيجة الدفع</div><h2>جارٍ التحقق من ميسر…</h2><p>نتحقق من حالة العملية والمبلغ والعملة قبل إضافة الرصيد إلى حسابك.</p></div>`);
  const {data,error}=await sb.functions.invoke('verify-moyasar-payment',{body:{payment_id:paymentId,package_id:packageId}});
  if(error||!data?.ok){
    ws(`<div class="paymentResultCard"><div class="paymentResultIcon">×</div><div class="kicker">نتيجة الدفع</div><h2>لم يتم تأكيد الدفع</h2><p>لم تتم إضافة الرصيد لأن التحقق من عملية ميسر لم ينجح.</p><button class="secondary" onclick="showAccount()">العودة إلى الحساب</button></div>`);
    console.error(error||data);return;
  }
  localStorage.removeItem('roya_pending_payment');
  localStorage.removeItem('roya_pending_credit_package');
  history.replaceState({},'',location.pathname);
  const added=Number(data.added||0), balance=Number(data.balance||0);
  ws(`<div class="paymentResultCard"><div class="paymentResultIcon">✓</div><div class="kicker">تم الدفع بنجاح</div><h2>${added>0?`تمت إضافة ${added} تفسيرًا إلى رصيدك`:'تم التحقق من العملية'}</h2><p>رصيدك الحالي: <b>${balance} تفسيرًا</b>. يمكنك استخدامه وقتما تريد.</p><button class="primary" onclick="showAccount()">عرض رصيدي</button></div>`);
}
'''
    s=s[:hstart]+handler+s[hend:]

# 4) Replace account subscription data with wallet + packages.
show=s.find('async function showAccount(btn){')
data_start=s.find('const now=new Date();',show)
data_end=s.find('\n\nws(`<div class="kicker">الحساب</div>',data_start)
if show!=-1 and data_start!=-1 and data_end!=-1:
    account_data=r'''const [dreamCountRes,walletRes,packagesRes]=await Promise.all([
  sb.from('dreams').select('id',{count:'exact',head:true}),
  sb.from('user_credit_wallets').select('balance,lifetime_purchased,lifetime_used').eq('user_id',currentUser.id).maybeSingle(),
  sb.from('credit_packages').select('id,name,price_sar,credits,active,sort_order').eq('active',true).order('sort_order')
]);

const balance=Number(walletRes.data?.balance??1);
const lifetimePurchased=Number(walletRes.data?.lifetime_purchased??0);
const lifetimeUsed=Number(walletRes.data?.lifetime_used??0);
const dreamCount=dreamCountRes.count??0;
const email=currentUser.email||'حساب مسجل';
const planBadge='رصيد';
const planName=`${balance} تفسير`;
const monthlyLimit=Math.max(1,balance+lifetimeUsed);
const used=lifetimeUsed;
const remaining=balance;
const pct=monthlyLimit?Math.min(100,Math.round((used/monthlyLimit)*100)):0;
const plans=(packagesRes.data||[]);
const planCards=plans.map(p=>`<div class="card price ${p.id==='credits_10'?'pop':''}">
  ${p.id==='credits_10'?'<span class="badge">الأكثر اختيارًا</span>':''}
  <h3>${escapeHtml(p.name)}</h3>
  <div class="amount">${Number(p.price_sar)} <small>ر.س</small></div>
  <p>${Number(p.credits)} تفسيرًا تُضاف مباشرة إلى رصيدك بعد تأكيد الدفع.</p>
  <button class="${p.id==='credits_10'?'primary':'secondary'}" onclick="startPremiumCheckout('${p.id}')">شحن الرصيد</button>
</div>`).join('');'''
    s=s[:data_start]+account_data+s[data_end:]

# Account wording.
s=s.replace('<small style="color:#a9aec8">الخطة الحالية</small>','<small style="color:#a9aec8">رصيدك الحالي</small>')
s=s.replace("<p>${isPremium?(activePlan?.billing_period==='lifetime'?'اشتراك مدى الحياة فعّال.':`اشتراك فعّال${activeSub?.current_period_end?` حتى ${new Date(activeSub.current_period_end).toLocaleDateString('ar-SA')}`:''}.`):'الحساب يستخدم الخطة المجانية حاليًا.'}</p>","<p>كل تفسير مكتمل يخصم رصيدًا واحدًا. لا يوجد تجديد شهري تلقائي.</p>")
s=s.replace('المتبقي هذا الشهر','الرصيد المتاح')
s=s.replace('${remaining} <small>من ${monthlyLimit}</small>','${balance} <small>تفسير</small>')
s=s.replace('استخدمت ${used} تفسيرًا هذا الشهر.','استخدمت ${lifetimeUsed} تفسيرًا إجمالًا، واشتريت ${lifetimePurchased} تفسيرًا.')
s=s.replace('<h2 style="font-size:19px">رؤيا Premium</h2><span>الاشتراك مرتبط بحسابك في قاعدة البيانات</span>','<h2 style="font-size:19px">شحن الرصيد</h2><span>اختر الباقة المناسبة لك</span>')
s=s.replace('محرك الاشتراكات جاهز. زر الدفع لن ينفّذ أي خصم قبل ربط حساب بوابة دفع معتمد والتحقق من العملية من الخادم.','الدفع يتم عبر ميسر، ولا يضاف الرصيد إلا بعد التحقق من نجاح العملية والمبلغ من الخادم.')
s=s.replace('نسترجع الخطة والاستهلاك وإعدادات البيانات.','نسترجع رصيدك واستهلاكك وإعدادات البيانات.')

# Remove legacy checkout-route reopen logic if present.
s=s.replace("    const checkoutPlan=new URLSearchParams(location.search).get('checkout');\n    if(checkoutPlan&&!new URLSearchParams(location.search).has('payment_return')) await startPremiumCheckout(checkoutPlan);\n",'')

p.write_text(s,encoding='utf-8')

# 5) Build standalone credit payment page from existing public config.
url_m=re.search(r"const\s+SUPABASE_URL\s*=\s*['\"]([^'\"]+)['\"]",s)
key_m=re.search(r"const\s+SUPABASE_PUBLISHABLE_KEY\s*=\s*['\"]([^'\"]+)['\"]",s)
moy_m=re.search(r"publishable_api_key\s*:\s*['\"]([^'\"]+)['\"]",s)
if not(url_m and key_m and moy_m): raise SystemExit('Public checkout config not found')
SUPABASE_URL,SUPABASE_KEY,MOYASAR_KEY=url_m.group(1),key_m.group(1),moy_m.group(1)

payment=f'''<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>شحن الرصيد | رؤيا</title><link rel="stylesheet" href="https://cdn.moyasar.com/mpf/1.15.0/moyasar.css"><script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script><script src="https://cdn.moyasar.com/mpf/1.15.0/moyasar.js"></script><style>*{{box-sizing:border-box}}body{{margin:0;min-height:100vh;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Tahoma,Arial,sans-serif;background:radial-gradient(circle at 80% -10%,#3a246d 0,transparent 34%),linear-gradient(145deg,#06091f,#111039 58%,#080b25);color:#f8f7fb}}.wrap{{width:min(1180px,calc(100% - 28px));margin:auto;padding:28px 0 48px}}.top{{display:flex;align-items:center;justify-content:space-between;margin-bottom:22px}}.brand{{display:flex;align-items:center;gap:12px;font-weight:900;font-size:22px}}.logo{{width:44px;height:44px;border-radius:15px;display:grid;place-items:center;background:linear-gradient(145deg,#6f48d6,#d6ae61)}}.back{{border:1px solid #ffffff19;background:#ffffff0a;color:#dddff1;border-radius:12px;padding:10px 14px;text-decoration:none}}.grid{{display:grid;grid-template-columns:.88fr 1.35fr;gap:18px}}.card{{background:linear-gradient(155deg,rgba(22,27,63,.98),rgba(8,12,33,.99));border:1px solid rgba(242,213,138,.15);border-radius:26px;box-shadow:0 30px 90px rgba(0,0,0,.42);overflow:hidden}}.summary,.pay{{padding:27px}}.eyebrow{{color:#d9bc77;font-size:12px;font-weight:900}}h1{{font-size:27px;margin:7px 0 8px}}.muted{{color:#9ea5c5;font-size:13px;line-height:1.8}}.package{{margin-top:22px;padding:17px;border:1px solid #ffffff12;background:#ffffff08;border-radius:18px}}.package-row{{display:flex;justify-content:space-between;align-items:center;gap:10px}}.price{{font-size:29px;font-weight:950;color:#f2d58a}}.trust{{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:17px}}.trust div{{padding:10px 8px;text-align:center;border:1px solid #ffffff0d;background:#ffffff06;border-radius:12px;font-size:10px;color:#aeb4d0}}.secure{{display:flex;gap:10px;align-items:center;padding:12px 13px;background:rgba(214,173,91,.07);border:1px solid rgba(214,173,91,.16);border-radius:14px;margin:0 0 18px;color:#cfd3e8;font-size:12px}}.mysr-form{{max-width:none!important}}.foot{{text-align:center;color:#747d9f;font-size:10px;line-height:1.7;margin-top:13px}}.loading{{padding:30px;text-align:center;color:#aeb4d0}}@media(max-width:800px){{.wrap{{padding-top:16px}}.grid{{grid-template-columns:1fr}}.summary,.pay{{padding:20px}}h1{{font-size:23px}}.price{{font-size:25px}}}}</style></head><body><main class="wrap"><header class="top"><div class="brand"><div class="logo">◐</div><span>رؤيا</span></div><a class="back" href="./">العودة</a></header><section class="grid"><aside class="card summary"><div class="eyebrow">شحن رصيد التفسيرات</div><h1>إتمام الدفع</h1><div class="muted">ادفع مرة واحدة فقط. لا يوجد اشتراك أو تجديد تلقائي، وسيضاف الرصيد بعد التحقق من عملية الدفع.</div><div class="package"><div class="package-row"><div><strong id="packageName">جاري تحميل الباقة…</strong><div class="muted" id="packageHint">سيضاف الرصيد إلى حسابك بعد التأكيد</div></div><div class="price" id="packagePrice">—</div></div></div><div class="trust"><div>🔒 اتصال آمن</div><div>🛡️ ميسر</div><div> Apple Pay</div></div></aside><section class="card pay"><div class="secure">🔐 <span>اختر البطاقة أو Apple Pay على الأجهزة المدعومة.</span></div><div id="form"><div class="loading">جاري تجهيز صفحة الدفع…</div></div><div class="foot">لن يُضاف الرصيد إلا بعد التحقق من حالة الدفع والمبلغ والعملة من الخادم.</div></section></section></main><script>const SUPABASE_URL={SUPABASE_URL!r};const SUPABASE_KEY={SUPABASE_KEY!r};const MOYASAR_KEY={MOYASAR_KEY!r};const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{{auth:{{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}}});(async()=>{{const packageId=new URLSearchParams(location.search).get('package')||localStorage.getItem('roya_pending_credit_package');const {{data:sessionData}}=await sb.auth.getSession();const user=sessionData?.session?.user;if(!user){{location.replace('./?login=1');return}}if(!packageId){{location.replace('./');return}}const {{data:pkg,error}}=await sb.from('credit_packages').select('id,name,price_sar,credits,active').eq('id',packageId).eq('active',true).single();if(error||!pkg){{document.getElementById('form').innerHTML='<div class="loading">تعذر تحميل باقة الشحن.</div>';return}}localStorage.setItem('roya_pending_credit_package',pkg.id);document.getElementById('packageName').textContent=pkg.name;document.getElementById('packageHint').textContent=Number(pkg.credits)+' تفسيرًا ستضاف إلى رصيدك';document.getElementById('packagePrice').textContent=Number(pkg.price_sar).toFixed(2).replace('.00','')+' ر.س';document.getElementById('form').innerHTML='<div class="mysr-form"></div>';const callback=new URL('./',location.href);callback.searchParams.set('payment_return','1');Moyasar.init({{element:'.mysr-form',amount:Math.round(Number(pkg.price_sar)*100),currency:'SAR',description:`شحن رصيد رؤيا - ${{pkg.name}}`,publishable_api_key:MOYASAR_KEY,callback_url:callback.toString(),language:'ar',methods:['creditcard','applepay'],supported_networks:['mada','visa','mastercard'],apple_pay:{{country:'SA',label:'رؤيا',validate_merchant_url:'https://api.moyasar.com/v1/applepay/initiate'}},fixed_width:false,metadata:{{user_id:user.id,package_id:pkg.id}},on_completed:function(payment){{if(payment?.id)localStorage.setItem('roya_pending_payment',payment.id)}},on_failure:function(err){{console.error('Moyasar payment error',err)}}}})}})().catch(e=>{{console.error(e);document.getElementById('form').innerHTML='<div class="loading">تعذر تجهيز الدفع. حاول مرة أخرى.</div>'}});</script></body></html>'''
Path('payment.html').write_text(payment,encoding='utf-8')
print('Credit packages UI and checkout applied')
