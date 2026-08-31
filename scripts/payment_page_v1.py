from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
start=s.index('async function startPremiumCheckout(planId){')
end=s.index('\nasync function handleMoyasarReturn(){',start)
new=r'''async function startPremiumCheckout(planId){
  if(!currentUser){openAuth();return}
  if(!/^https?:$/.test(location.protocol)){
    alert('الدفع التجريبي يحتاج فتح الموقع من رابط ويب http/https حتى يستطيع ميسر الرجوع إلى صفحة النتيجة بعد 3D Secure.');
    return;
  }

  const {data:plan,error:planError}=await sb.from('subscription_plans')
    .select('id,name_ar,price_sar,billing_period,is_active')
    .eq('id',planId).eq('is_active',true).single();
  if(planError||!plan){alert('تعذر تحميل الباقة.');return}

  localStorage.setItem('roya_pending_plan',planId);
  history.pushState({royaCheckout:true},'',`${location.pathname}?checkout=${encodeURIComponent(planId)}`);

  document.querySelector('.shell')?.style.setProperty('display','none');
  document.querySelector('nav')?.style.setProperty('display','none');
  document.getElementById('royaCheckoutPage')?.remove();

  const page=document.createElement('main');
  page.id='royaCheckoutPage';
  page.setAttribute('dir','rtl');
  page.style.cssText='min-height:100vh;background:radial-gradient(circle at 80% -10%,#312060 0,transparent 34%),linear-gradient(145deg,#070b24,#11103c);color:#f8f7fb;padding:18px 14px 38px;font-family:system-ui,-apple-system,Segoe UI,Tahoma,Arial,sans-serif';
  page.innerHTML=`<div style="width:min(520px,100%);margin:auto">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <div style="display:flex;align-items:center;gap:10px"><div class="mark" style="width:40px;height:40px">◐</div><b style="font-size:20px">رؤيا</b></div>
      <button class="ghost" onclick="leaveCheckoutPage()">العودة</button>
    </div>
    <section style="background:linear-gradient(155deg,rgba(20,25,58,.98),rgba(8,12,33,.99));border:1px solid rgba(242,213,138,.2);border-radius:24px;overflow:hidden;box-shadow:0 30px 90px rgba(0,0,0,.45)">
      <div style="padding:19px 20px 15px;border-bottom:1px solid rgba(255,255,255,.06)"><div style="color:#d9bc77;font-size:11px;font-weight:800">رؤيا Premium</div><h1 style="font-size:22px;margin:5px 0">${escapeHtml(plan.name_ar)}</h1><div style="display:flex;gap:7px;align-items:center;color:#a9aec8;font-size:12px"><strong style="font-size:20px;color:#f2d58a">${Number(plan.price_sar)} ر.س</strong><span>•</span><span>صفحة دفع آمنة</span></div></div>
      <div style="padding:16px 20px 21px"><div style="padding:10px 11px;border-radius:13px;background:rgba(214,173,91,.07);border:1px solid rgba(214,173,91,.16);font-size:11px;color:#cfd3e8;line-height:1.65;margin-bottom:13px"><b>🔒 دفع مشفّر وآمن</b><br>بيانات البطاقة تُعالج مباشرة عبر ميسر.</div><div class="mysr-form"></div><div style="text-align:center;color:#747d9f;font-size:9px;line-height:1.6;margin-top:11px">بالإكمال أنت توافق على تنفيذ عملية الدفع للخطة المحددة عبر ميسر.</div></div>
    </section>
  </div>`;
  document.body.appendChild(page);

  const callback=new URL(location.origin+location.pathname);
  callback.searchParams.set('payment_return','1');

  try{
    Moyasar.init({
      element:'#royaCheckoutPage .mysr-form',
      amount:Math.round(Number(plan.price_sar)*100),
      currency:'SAR',
      description:`اشتراك رؤيا - ${plan.name_ar}`,
      publishable_api_key:'pk_test_rkBnvVzFvzJiEuZN53iJUuh2Rmg7a7dSdT9Awhkf',
      callback_url:callback.toString(),
      language:'ar',
      methods:['creditcard'],
      supported_networks:['mada','visa','mastercard'],
      fixed_width:false,
      metadata:{user_id:currentUser.id,plan_id:plan.id},
      on_completed:function(payment){if(payment?.id)localStorage.setItem('roya_pending_payment',payment.id)},
      on_failure:function(error){console.error('Moyasar payment error',error)}
    });
  }catch(e){
    console.error(e);
    page.querySelector('.mysr-form').innerHTML='<div style="padding:18px;text-align:center;color:#a9aec8">تعذر تشغيل نموذج الدفع. حاول مرة أخرى.</div>';
  }
}

function leaveCheckoutPage(){
  document.getElementById('royaCheckoutPage')?.remove();
  document.querySelector('.shell')?.style.removeProperty('display');
  document.querySelector('nav')?.style.removeProperty('display');
  history.replaceState({},'',location.pathname);
}

function closePaymentModal(){leaveCheckoutPage()}
'''
s=s[:start]+new+s[end:]

old="window.addEventListener('load', async ()=>{\n  try{\n    await refreshUser();\n    await handleMoyasarReturn();\n  }catch(e){console.error('Payment return handler',e)}\n});"
newload="window.addEventListener('load', async ()=>{\n  try{\n    await refreshUser();\n    await handleMoyasarReturn();\n    const checkoutPlan=new URLSearchParams(location.search).get('checkout');\n    if(checkoutPlan&&!new URLSearchParams(location.search).has('payment_return')) await startPremiumCheckout(checkoutPlan);\n  }catch(e){console.error('Payment route handler',e)}\n});"
if old in s:
    s=s.replace(old,newload,1)

p.write_text(s,encoding='utf-8')
print('Dedicated checkout now renders inside index without cross-page redirect')
