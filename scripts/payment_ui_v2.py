from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')

marker = '/* payment-ultra-compact-ui-v4 */'
css = r'''
/* payment-ultra-compact-ui-v4 */
.paymentOverlay{padding:10px!important;align-items:center!important}
.paymentPanel{width:min(390px,calc(100vw - 20px))!important;max-height:86vh!important;border-radius:19px!important;box-shadow:0 24px 65px rgba(0,0,0,.56)!important}
.paymentPanel:before{height:78px!important;opacity:.65!important}
.paymentHead{padding:12px 13px 10px!important}.paymentHeadRow{gap:8px!important}.paymentBrand{gap:8px!important}.paymentBrandIcon{width:31px!important;height:31px!important;border-radius:10px!important;font-size:15px!important}.paymentEyebrow{font-size:8px!important;margin-bottom:1px!important}.paymentTitle{font-size:16px!important;line-height:1.2!important}.paymentMeta{gap:4px!important;margin-top:3px!important;font-size:9px!important}.paymentMeta strong{font-size:13px!important}.paymentPill{padding:2px 5px!important;font-size:8px!important}.paymentClose{width:29px!important;height:29px!important;border-radius:9px!important;font-size:14px!important}
.paymentBody{padding:10px 13px 13px!important}.paymentStatus{gap:6px!important;margin-bottom:8px!important;padding:7px 8px!important;border-radius:10px!important;font-size:9px!important;line-height:1.4!important}.paymentStatusIcon{width:20px!important;height:20px!important;min-width:20px!important;border-radius:6px!important;font-size:10px!important}.paymentStatus b{font-size:9px!important}
.paymentSecureRow{gap:4px!important;margin-bottom:8px!important}.paymentSecureItem{padding:4px 3px!important;border-radius:8px!important;font-size:7px!important;line-height:1.25!important}.paymentSecureItem b{font-size:8px!important;margin-bottom:0!important}
.paymentPanel .mysr-form{font-size:10px!important}.paymentPanel .mysr-form input,.paymentPanel .mysr-form select{min-height:37px!important;border-radius:10px!important;font-size:11px!important}.paymentPanel .mysr-form label{font-size:9px!important}.paymentPanel .mysr-form button,.paymentPanel .mysr-form .mysr-form-button{min-height:38px!important;border-radius:10px!important;font-size:11px!important}.paymentFoot{margin-top:7px!important;font-size:7px!important;line-height:1.35!important}
.paymentResultCard{max-width:400px!important;margin:8px auto!important;padding:16px 15px!important;border-radius:18px!important}.paymentResultIcon{width:42px!important;height:42px!important;margin-bottom:7px!important;border-radius:13px!important;font-size:19px!important}.paymentResultCard h2{font-size:18px!important;margin:4px 0!important}.paymentResultCard p{max-width:340px!important;margin:4px auto 10px!important;font-size:11px!important;line-height:1.6!important}.paymentResultCard button{padding:8px 13px!important;font-size:11px!important}
@media(max-width:640px){.paymentOverlay{padding:7px!important}.paymentPanel{width:min(370px,calc(100vw - 14px))!important;max-height:88vh!important;border-radius:18px!important}.paymentHead{padding:10px 11px 8px!important}.paymentBody{padding:9px 11px 11px!important}.paymentBrandIcon{width:29px!important;height:29px!important}.paymentTitle{font-size:15px!important}.paymentSecureItem{font-size:6.5px!important}.paymentSecureItem b{font-size:7.5px!important}.paymentResultCard{max-width:360px!important;padding:14px 12px!important}}
'''

if marker not in s:
    s = s.replace('</style>', css + '\n</style>', 1)

p.write_text(s, encoding='utf-8')
print('Ultra compact payment UI v4 applied')
