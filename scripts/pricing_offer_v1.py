from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')

marker='/* roya-pricing-offer-70-v1 */'
css=r'''
/* roya-pricing-offer-70-v1 */
.offerBadge70{display:inline-flex;align-items:center;gap:4px;background:linear-gradient(135deg,#f2d58a,#d6ad5b);color:#21172a;border-radius:999px;padding:4px 8px;font-size:10px;font-weight:900;box-shadow:0 5px 14px rgba(214,173,91,.18)}
.oldPrice{display:inline-block;color:#777f9f;text-decoration:line-through;text-decoration-thickness:1.5px;font-size:13px;margin-inline-start:6px;font-weight:600}.offerLine{min-height:23px;display:flex;justify-content:center;align-items:center;gap:5px;flex-wrap:wrap;margin:5px 0 -3px}.price .amount{margin:8px 0}.priceOfferNote{font-size:10px;color:#d7c18c;margin-top:2px}
'''
if marker not in s:
    s=s.replace('</style>',css+'\n</style>',1)

old="""const plans=(plansRes.data||[]);
const planCards=plans.map(p=>{
  const active=isPremium&&activePlan?.id===p.id;
  const suffix=p.billing_period==='monthly'?'شهريًا':p.billing_period==='annual'?'سنويًا':'مرة واحدة';
  return `<div class=\"card price ${p.id==='annual'?'pop':''}\" style=\"${active?'border-color:#d6ad5b;box-shadow:0 0 0 1px rgba(214,173,91,.25) inset':''}\">
    ${p.id==='annual'?'<span class=\"badge\">الأكثر اختيارًا</span>':''}
    <h3>${escapeHtml(p.name_ar)}</h3>
    <div class=\"amount\">${Number(p.price_sar)} <small>ر.س</small></div>
    <p>${suffix} • حتى ${Number(p.monthly_interpretation_limit||100)} تفسيرًا شهريًا ضمن الاستخدام العادل.</p>
    ${active?'<button class=\"primary\" disabled>خطتك الحالية ✓</button>':`<button class=\"${p.id==='annual'?'primary':'secondary'}\" onclick=\"startPremiumCheckout('${p.id}')\">اختيار الخطة</button>`}
  </div>`;
}).join('');"""
new="""const plans=(plansRes.data||[]);
const planCards=plans.map(p=>{
  const active=isPremium&&activePlan?.id===p.id;
  const suffix=p.billing_period==='monthly'?'شهريًا':p.billing_period==='annual'?'سنويًا':'مرة واحدة';
  const offerPrice=Number(p.price_sar);
  const originalPrice=Math.round((offerPrice/0.30)*100)/100;
  return `<div class=\"card price ${p.id==='annual'?'pop':''}\" style=\"${active?'border-color:#d6ad5b;box-shadow:0 0 0 1px rgba(214,173,91,.25) inset':''}\">
    ${p.id==='annual'?'<span class=\"badge\">الأكثر اختيارًا</span>':''}
    <h3>${escapeHtml(p.name_ar)}</h3>
    <div class=\"offerLine\"><span class=\"offerBadge70\">خصم 70%</span><span class=\"oldPrice\">${originalPrice.toFixed(2)} ر.س</span></div>
    <div class=\"amount\">${offerPrice} <small>ر.س</small></div>
    <div class=\"priceOfferNote\">سعر العرض الحالي</div>
    <p>${suffix} • حتى ${Number(p.monthly_interpretation_limit||100)} تفسيرًا شهريًا ضمن الاستخدام العادل.</p>
    ${active?'<button class=\"primary\" disabled>خطتك الحالية ✓</button>':`<button class=\"${p.id==='annual'?'primary':'secondary'}\" onclick=\"startPremiumCheckout('${p.id}')\">اختيار الخطة</button>`}
  </div>`;
}).join('');"""
if old not in s:
    raise SystemExit('pricing block not found')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
print('70% pricing offer UI applied')
