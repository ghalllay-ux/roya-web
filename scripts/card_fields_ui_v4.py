from pathlib import Path

p=Path('payment.html')
s=p.read_text(encoding='utf-8')
marker='/* roya-card-fields-premium-v4 */'
if marker in s:
    print('Premium card UI already applied')
    raise SystemExit(0)
css=r'''
/* roya-card-fields-premium-v4 */
.mysr-form{direction:rtl!important;width:100%!important;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Tahoma,Arial,sans-serif!important}
.mysr-form form{display:grid!important;gap:14px!important}
.mysr-form label,.mysr-form .mysr-form-label{display:block!important;color:#dfe3f4!important;font-size:12px!important;font-weight:800!important;margin:0 3px 7px!important;letter-spacing:.1px!important}
.mysr-form input,.mysr-form select,.mysr-form .mysr-form-input{width:100%!important;min-height:58px!important;border:1px solid rgba(179,188,226,.18)!important;border-radius:17px!important;background:linear-gradient(180deg,rgba(255,255,255,.075),rgba(255,255,255,.035))!important;color:#fff!important;padding:0 17px!important;font-size:16px!important;outline:none!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.045),0 8px 24px rgba(0,0,0,.12)!important;transition:border-color .18s ease,box-shadow .18s ease,background .18s ease!important;-webkit-appearance:none!important;appearance:none!important}
.mysr-form input::placeholder{color:#747d9f!important;opacity:1!important}
.mysr-form input:focus,.mysr-form select:focus,.mysr-form .mysr-form-input:focus-within{border-color:rgba(242,213,138,.72)!important;background:rgba(255,255,255,.085)!important;box-shadow:0 0 0 4px rgba(214,173,91,.11),0 12px 32px rgba(0,0,0,.18)!important}
.mysr-form .mysr-form-row{gap:12px!important}
.mysr-form button[type=submit],.mysr-form .mysr-form-button{min-height:58px!important;border:0!important;border-radius:17px!important;background:linear-gradient(135deg,#d3a950,#f2d58a)!important;color:#171326!important;font-size:16px!important;font-weight:950!important;box-shadow:0 14px 34px rgba(214,173,91,.20)!important;cursor:pointer!important;transition:transform .15s ease,filter .15s ease!important}
.mysr-form button[type=submit]:active,.mysr-form .mysr-form-button:active{transform:scale(.985)!important}
.mysr-form .mysr-form-error,.mysr-form [class*=error]{font-size:11px!important;border-radius:10px!important}
.mysr-form img{max-height:25px!important}
.pay{position:relative}.pay:before{content:'بيانات البطاقة';display:block;color:#f8f7fb;font-size:18px;font-weight:900;margin:2px 0 14px}.pay:after{content:'🔒 بيانات بطاقتك تُرسل مباشرة إلى ميسر ولا يتم حفظها في رؤيا';display:block;text-align:center;color:#858eae;font-size:10px;line-height:1.7;margin-top:14px}
@media(max-width:800px){.mysr-form input,.mysr-form select,.mysr-form .mysr-form-input{min-height:56px!important;border-radius:16px!important;font-size:16px!important}.mysr-form button[type=submit],.mysr-form .mysr-form-button{min-height:56px!important;border-radius:16px!important}.pay:before{font-size:17px}}
'''
if '</style>' not in s:
    raise SystemExit('payment style tag not found')
s=s.replace('</style>',css+'\n</style>',1)
p.write_text(s,encoding='utf-8')
print('Premium card fields UI v4 applied')
