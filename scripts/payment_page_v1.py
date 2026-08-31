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
  localStorage.setItem('roya_pending_plan',planId);
  const target=new URL('payment.html',location.href);
  target.searchParams.set('plan',planId);
  location.href=target.toString();
}

function closePaymentModal(){
  if(history.length>1)history.back(); else location.href='./';
}
'''
s=s[:start]+new+s[end:]
p.write_text(s,encoding='utf-8')
print('Checkout now routes to dedicated payment page')
