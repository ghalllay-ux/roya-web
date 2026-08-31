from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')

marker = '/* payment-compact-ui-v3 */'
css = r'''
/* payment-compact-ui-v3 */
.paymentOverlay{padding:14px;background:radial-gradient(circle at 50% 5%,rgba(123,97,255,.12),transparent 30%),rgba(2,5,18,.86);backdrop-filter:blur(16px) saturate(120%);-webkit-backdrop-filter:blur(16px) saturate(120%)}
.paymentPanel{width:min(470px,100%);max-height:90vh;border-radius:24px;border-color:rgba(242,213,138,.18);box-shadow:0 30px 90px rgba(0,0,0,.58),0 0 0 1px rgba(255,255,255,.025) inset}
.paymentPanel:before{height:105px;opacity:.8}
.paymentHead{padding:17px 18px 14px}.paymentHeadRow{gap:10px;align-items:center}.paymentBrand{gap:10px}.paymentBrandIcon{width:38px;height:38px;border-radius:12px;font-size:18px;box-shadow:0 7px 18px rgba(0,0,0,.22)}
.paymentEyebrow{font-size:10px;margin-bottom:2px}.paymentTitle{font-size:19px;line-height:1.25}.paymentMeta{gap:6px;margin-top:5px;font-size:11px}.paymentMeta strong{font-size:15px!important}.paymentPill{padding:3px 7px;font-size:9px}
.paymentClose{width:34px;height:34px;border-radius:11px;font-size:16px}.paymentBody{padding:15px 18px 18px}.paymentStatus{gap:8px;margin-bottom:11px;padding:9px 10px;border-radius:13px;font-size:11px;line-height:1.55}.paymentStatusIcon{width:24px;height:24px;min-width:24px;border-radius:8px;font-size:12px}.paymentStatus b{font-size:11px}
.paymentSecureRow{grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:11px}.paymentSecureItem{padding:6px 5px;border-radius:10px;font-size:9px;line-height:1.35}.paymentSecureItem b{font-size:10px;margin-bottom:1px;white-space:nowrap}
.paymentPanel .mysr-form{font-size:12px!important}.paymentPanel .mysr-form input,.paymentPanel .mysr-form select{min-height:43px!important;border-radius:12px!important;font-size:13px!important}.paymentPanel .mysr-form label{font-size:11px!important}.paymentPanel .mysr-form button,.paymentPanel .mysr-form .mysr-form-button{min-height:44px!important;border-radius:12px!important;font-size:13px!important;box-shadow:0 9px 22px rgba(214,173,91,.14)!important}
.paymentFoot{margin-top:10px;font-size:9px;line-height:1.5}.paymentResultCard{max-width:520px;margin:10px auto;padding:22px 20px;border-radius:22px;box-shadow:0 20px 55px rgba(0,0,0,.24)}.paymentResultIcon{width:52px;height:52px;margin-bottom:10px;border-radius:17px;font-size:23px}.paymentResultCard h2{font-size:22px;margin:6px 0}.paymentResultCard p{max-width:430px;margin:6px auto 14px;font-size:13px;line-height:1.75}
@media(max-width:640px){.paymentOverlay{padding:8px;align-items:center}.paymentPanel{width:min(440px,100%);max-height:92vh;border-radius:22px}.paymentHead{padding:14px 15px 12px}.paymentBody{padding:13px 15px 16px}.paymentBrandIcon{width:35px;height:35px;border-radius:11px}.paymentTitle{font-size:17px}.paymentSecureRow{grid-template-columns:repeat(3,1fr);gap:5px}.paymentSecureItem{padding:6px 3px;font-size:8px}.paymentSecureItem b{font-size:9px}.paymentResultCard{padding:19px 15px;border-radius:20px}.paymentResultIcon{width:48px;height:48px;border-radius:15px}}
'''

if marker not in s:
    s = s.replace('</style>', css + '\n</style>', 1)

p.write_text(s, encoding='utf-8')
print('Compact premium payment UI v3 applied')
