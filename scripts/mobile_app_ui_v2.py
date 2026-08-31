from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
marker='/* roya-mobile-app-v2 */'
if marker not in s:
    css=r'''
/* roya-mobile-app-v2 */
@media(max-width:800px){
 html{scroll-behavior:smooth;background:#070a1d}
 body{background:radial-gradient(circle at 78% -8%,rgba(123,97,255,.24),transparent 30%),radial-gradient(circle at 10% 18%,rgba(214,173,91,.08),transparent 26%),linear-gradient(180deg,#080b20 0%,#0a0f2a 52%,#070a1d 100%);overscroll-behavior-y:none}
 .shell{padding:12px 12px calc(112px + env(safe-area-inset-bottom));max-width:560px}
 header{top:0;margin:0 -2px 12px;padding:8px 2px 12px;background:linear-gradient(180deg,rgba(7,10,29,.98) 58%,rgba(7,10,29,.72) 80%,transparent);backdrop-filter:blur(20px) saturate(140%);-webkit-backdrop-filter:blur(20px) saturate(140%)}
 .brand{gap:10px}.mark{width:40px;height:40px;border-radius:14px;font-size:20px;border-color:rgba(242,213,138,.18);box-shadow:0 10px 26px rgba(0,0,0,.34)}.brand b{font-size:21px;letter-spacing:-.2px}.ghost{min-height:38px;padding:8px 12px;border-radius:13px;font-size:12px;border-color:rgba(255,255,255,.08);background:rgba(16,22,50,.82);backdrop-filter:blur(12px)}
 .hero>.panel:first-child{padding:20px 16px 16px;border-radius:24px;border-color:rgba(255,255,255,.08);background:linear-gradient(160deg,rgba(20,25,58,.96),rgba(8,13,35,.96));box-shadow:0 18px 55px rgba(0,0,0,.32)}
 .hero h1{font-size:clamp(29px,8.7vw,36px);line-height:1.14;margin:7px 0 9px;letter-spacing:-.7px}.hero p{font-size:13.5px;line-height:1.75;color:#b6bbd4}.kicker{font-size:10px;letter-spacing:.25px}
 .dreambox{margin-top:14px;padding:11px;border-radius:18px;border-color:rgba(255,255,255,.07);background:rgba(6,10,28,.92);box-shadow:inset 0 1px 0 rgba(255,255,255,.025)}
 textarea{min-height:126px;font-size:15px;line-height:1.7}.actions{gap:8px}.primary,.secondary{min-height:44px;border-radius:14px;padding:10px 14px;font-size:12px}.dreambox .actions .primary{flex:1 1 58%}.dreambox .actions .secondary{flex:0 0 auto}.dreambox #counter{font-size:10px!important;opacity:.78}
 .privacy{padding:12px 13px;border-radius:15px;background:linear-gradient(145deg,rgba(13,24,50,.9),rgba(10,17,39,.92));border-color:rgba(255,255,255,.065)}
 .side{margin-top:11px;padding:15px!important;border-radius:20px!important;background:linear-gradient(155deg,rgba(16,22,52,.86),rgba(9,14,34,.9))!important}.steps{grid-template-columns:1fr 1fr;gap:8px}.step{min-height:92px;padding:11px;border-radius:15px;background:rgba(15,22,50,.78);border-color:rgba(255,255,255,.06)}.step b{font-size:11px}.step span{font-size:9px;line-height:1.45}.num{width:27px;min-width:27px;height:27px}
 .section{margin-top:19px}.sectionTitle{margin-bottom:10px}.sectionTitle h2{font-size:17px}.sectionTitle span{font-size:9px;max-width:48%;text-align:left}
 .cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.card{padding:14px 12px;border-radius:18px;min-height:126px;background:linear-gradient(155deg,rgba(16,22,50,.88),rgba(10,15,37,.92));border-color:rgba(255,255,255,.07)}.card .icon{font-size:21px}.card h3{font-size:12px;margin:8px 0 5px}.card p{font-size:9.5px;line-height:1.55}.card .secondary{font-size:9.5px;min-height:34px;padding:7px 8px;margin-top:8px}
 .pricing{gap:10px;padding:3px 3px 8px;scroll-padding-inline:12px}.pricing .price{flex:0 0 86%;padding:19px 14px;border-radius:21px;scroll-snap-align:center;background:linear-gradient(155deg,rgba(17,23,53,.95),rgba(9,14,35,.96))}.pricing .price h3{font-size:15px}.pricing .amount{font-size:31px}.pricing .badge{font-size:8px}.pricing .primary,.pricing .secondary{min-height:43px}
 #workspace{padding:14px!important;border-radius:18px!important}.paymentResultCard{margin:8px 0!important;padding:22px 15px!important;border-radius:22px!important}.paymentResultCard h2{font-size:22px!important}.paymentResultIcon{width:60px!important;height:60px!important;border-radius:19px!important}
 nav{bottom:calc(8px + env(safe-area-inset-bottom));width:calc(100% - 18px);max-width:510px;padding:6px 7px;border-radius:22px;background:rgba(8,12,31,.9);border-color:rgba(255,255,255,.10);box-shadow:0 18px 48px rgba(0,0,0,.5);backdrop-filter:blur(26px) saturate(155%);-webkit-backdrop-filter:blur(26px) saturate(155%)}
 nav button{min-height:48px;padding:7px 4px 6px;border-radius:15px;font-size:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}nav button small{font-size:8.5px;line-height:1.1}nav button.active{background:linear-gradient(145deg,rgba(123,97,255,.24),rgba(214,173,91,.09));box-shadow:inset 0 0 0 1px rgba(242,213,138,.08),0 8px 20px rgba(0,0,0,.18)}
 .modal{padding:10px;align-items:flex-end}.modalbox{width:min(460px,100%);max-height:90vh;padding:18px 15px calc(18px + env(safe-area-inset-bottom));border-radius:24px 24px 18px 18px;border-color:rgba(255,255,255,.09);box-shadow:0 -18px 55px rgba(0,0,0,.48)}.modalbox h2{font-size:20px}.option{padding:12px;border-radius:14px;font-size:12px}.close{width:34px;height:34px}
 .checkoutStandalone{min-height:100dvh!important;padding:12px 10px calc(20px + env(safe-area-inset-bottom))!important}.checkoutWrap{width:100%!important;max-width:520px!important}.checkoutCard{border-radius:23px!important}.checkoutTop{padding:12px 4px!important}.checkoutBody{padding:16px!important}.checkoutTrust{grid-template-columns:1fr!important;gap:7px!important}
 .logoutToast{top:calc(10px + env(safe-area-inset-top))!important;width:calc(100% - 22px)!important;max-width:500px!important}
}
@media(max-width:390px){
 .shell{padding-inline:10px}.hero>.panel:first-child{padding:18px 14px 14px}.hero h1{font-size:29px}.cards{grid-template-columns:1fr 1fr;gap:7px}.card{min-height:118px;padding:12px 10px}.pricing .price{flex-basis:91%}.modalbox{padding-inline:13px}
}
'''
    s=s.replace('</style>',css+'\n</style>',1)
p.write_text(s,encoding='utf-8')
print('Roya mobile app UI v2 applied')
