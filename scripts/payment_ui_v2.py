from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')

marker = '/* payment-balanced-compact-ui-v5 */'
css = r'''
/* payment-balanced-compact-ui-v5 */
.paymentOverlay{padding:12px!important;align-items:center!important}
.paymentPanel{width:min(430px,calc(100vw - 24px))!important;max-height:89vh!important;border-radius:21px!important;box-shadow:0 28px 75px rgba(0,0,0,.58)!important}
.paymentPanel:before{height:90px!important;opacity:.72!important}
.paymentHead{padding:14px 15px 12px!important}.paymentHeadRow{gap:9px!important}.paymentBrand{gap:9px!important}.paymentBrandIcon{width:35px!important;height:35px!important;border-radius:11px!important;font-size:17px!important}.paymentEyebrow{font-size:9px!important;margin-bottom:2px!important}.paymentTitle{font-size:18px!important;line-height:1.24!important}.paymentMeta{gap:5px!important;margin-top:4px!important;font-size:10px!important}.paymentMeta strong{font-size:14px!important}.paymentPill{padding:3px 6px!important;font-size:8.5px!important}.paymentClose{width:32px!important;height:32px!important;border-radius:10px!important;font-size:15px!important}
.paymentBody{padding:12px 15px 16px!important}.paymentStatus{gap:7px!important;margin-bottom:10px!important;padding:8px 9px!important;border-radius:11px!important;font-size:10px!important;line-height:1.5!important}.paymentStatusIcon{width:22px!important;height:22px!important;min-width:22px!important;border-radius:7px!important;font-size:11px!important}.paymentStatus b{font-size:10px!important}
.paymentSecureRow{gap:5px!important;margin-bottom:10px!important}.paymentSecureItem{padding:5px 4px!important;border-radius:9px!important;font-size:8px!important;line-height:1.3!important}.paymentSecureItem b{font-size:9px!important;margin-bottom:1px!important}
.paymentPanel .mysr-form{font-size:11px!important}.paymentPanel .mysr-form input,.paymentPanel .mysr-form select{min-height:40px!important;border-radius:11px!important;font-size:12px!important}.paymentPanel .mysr-form label{font-size:10px!important}.paymentPanel .mysr-form button,.paymentPanel .mysr-form .mysr-form-button{min-height:41px!important;border-radius:11px!important;font-size:12px!important}.paymentFoot{margin-top:8px!important;font-size:8px!important;line-height:1.4!important}
.paymentResultCard{max-width:440px!important;margin:9px auto!important;padding:18px 17px!important;border-radius:20px!important}.paymentResultIcon{width:46px!important;height:46px!important;margin-bottom:8px!important;border-radius:15px!important;font-size:21px!important}.paymentResultCard h2{font-size:20px!important;margin:5px 0!important}.paymentResultCard p{max-width:370px!important;margin:5px auto 12px!important;font-size:12px!important;line-height:1.65!important}.paymentResultCard button{padding:9px 14px!important;font-size:12px!important}
@media(max-width:640px){.paymentOverlay{padding:8px!important}.paymentPanel{width:min(410px,calc(100vw - 16px))!important;max-height:90vh!important;border-radius:20px!important}.paymentHead{padding:12px 13px 10px!important}.paymentBody{padding:11px 13px 13px!important}.paymentBrandIcon{width:33px!important;height:33px!important}.paymentTitle{font-size:17px!important}.paymentSecureItem{font-size:7.5px!important}.paymentSecureItem b{font-size:8.5px!important}.paymentResultCard{max-width:390px!important;padding:16px 14px!important}}
'''

if marker not in s:
    s = s.replace('</style>', css + '\n</style>', 1)

p.write_text(s, encoding='utf-8')
print('Balanced compact payment UI v5 applied')
