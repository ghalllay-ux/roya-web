from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
marker='/* roya-mobile-app-v1 */'
css=r'''
/* roya-mobile-app-v1 */
@media(max-width:800px){
 html{background:#080b20} body{background:radial-gradient(circle at 85% -4%,rgba(123,97,255,.22),transparent 29%),linear-gradient(180deg,#080b20,#0d1130 56%,#080b20);-webkit-tap-highlight-color:transparent}
 .shell{padding:14px 13px calc(102px + env(safe-area-inset-bottom));max-width:520px;margin:auto}
 header{position:sticky;top:0;z-index:9;margin:0 -4px 13px;padding:8px 4px 10px;background:linear-gradient(180deg,rgba(8,11,32,.96) 65%,rgba(8,11,32,0));backdrop-filter:blur(14px)}
 .brand{gap:9px}.mark{width:38px;height:38px;border-radius:13px;font-size:20px;box-shadow:0 8px 24px #0005}.brand b{font-size:20px}.brand small{display:none}.ghost{padding:8px 11px;border-radius:12px;font-size:12px;background:rgba(17,22,50,.88)}
 .hero{display:block}.hero>.panel:first-child{padding:19px 16px 16px;border-radius:24px;background:linear-gradient(155deg,rgba(20,25,58,.92),rgba(10,15,39,.96));box-shadow:0 18px 48px rgba(0,0,0,.28)}
 .kicker{font-size:11px;letter-spacing:.1px}.hero h1{font-size:31px;line-height:1.18;margin:8px 0 10px;letter-spacing:-.5px}.hero p{font-size:13px;line-height:1.8;margin:0}
 .dreambox{margin-top:15px;padding:12px;border-radius:17px;background:rgba(7,11,31,.9)}textarea{min-height:112px;font-size:14px;line-height:1.75}.actions{gap:7px}.primary,.secondary{min-height:42px;border-radius:13px;padding:10px 13px;font-size:12px}.dreambox .actions .primary{flex:1}.dreambox .actions .secondary{padding-inline:11px}.dreambox #counter{width:100%;text-align:left!important;margin:0!important;font-size:10px!important}
 .privacy{margin-top:12px;padding:11px 12px;border-radius:14px;gap:9px}.privacy b{font-size:12px}.privacy p{font-size:10px!important;line-height:1.55!important;margin-top:2px!important}
 .side{margin-top:12px;padding:16px!important;border-radius:20px!important}.side h3{font-size:14px}.steps{grid-template-columns:repeat(2,1fr);gap:7px;margin-top:11px}.step{display:block;padding:10px;border-radius:14px;min-height:88px}.num{width:26px;min-width:26px;height:26px;border-radius:9px;font-size:11px;margin-bottom:7px}.step b{font-size:11px}.step span{font-size:9px;line-height:1.4}
 .section{margin-top:18px}.sectionTitle{align-items:center;margin-bottom:9px}.sectionTitle h2{font-size:16px}.sectionTitle span{font-size:9px;padding:4px 7px;border-radius:999px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.05)}
 .cards{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.card{padding:12px 9px;border-radius:16px;min-width:0}.card .icon{font-size:19px}.card h3{font-size:11px;margin:7px 0 4px}.card p{font-size:9px;line-height:1.5}.card .secondary{font-size:9px;padding:7px 6px;min-height:34px;width:100%}
 .pricing{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;gap:9px;padding:2px 1px 7px;scrollbar-width:none}.pricing::-webkit-scrollbar{display:none}.pricing .price{flex:0 0 78%;scroll-snap-align:center;padding:18px 13px;border-radius:19px}.pricing .price h3{font-size:15px}.pricing .amount{font-size:29px;margin:8px 0}.pricing .badge{top:9px;left:9px;font-size:8px;padding:4px 6px}.pricing .primary,.pricing .secondary{width:100%}
 #demoFlow .cards{grid-template-columns:repeat(3,1fr)}#workspace{padding:15px!important;border-radius:18px!important}
 nav{bottom:calc(8px + env(safe-area-inset-bottom));width:calc(100% - 20px);max-width:480px;border-radius:20px;padding:6px;background:rgba(10,14,37,.88);border-color:rgba(255,255,255,.09);box-shadow:0 16px 44px rgba(0,0,0,.5);backdrop-filter:blur(24px) saturate(140%)}nav button{padding:8px 4px 6px;border-radius:14px;font-size:15px;transition:.18s}nav button small{font-size:8px}nav button.active{background:linear-gradient(145deg,rgba(123,97,255,.22),rgba(214,173,91,.11));box-shadow:inset 0 0 0 1px rgba(242,213,138,.09)}
 .modal{padding:10px;align-items:center}.modalbox{width:min(430px,100%);max-height:88vh;padding:17px 15px;border-radius:21px}.modalbox h2{font-size:19px}.option{padding:11px;border-radius:13px;font-size:12px}.progress{margin:10px 0 16px}.close{width:32px;height:32px;border-radius:10px}
 .paymentOverlay{align-items:center!important;padding:8px!important}.paymentPanel{width:min(420px,calc(100vw - 16px))!important;max-height:91vh!important;border-radius:21px!important}.paymentHead{padding:13px 14px 11px!important}.paymentBody{padding:11px 14px 14px!important}.paymentTitle{font-size:17px!important}.paymentBrandIcon{width:34px!important;height:34px!important}.paymentPanel .mysr-form input,.paymentPanel .mysr-form select{min-height:42px!important;font-size:12px!important}.paymentPanel .mysr-form button,.paymentPanel .mysr-form .mysr-form-button{min-height:43px!important;font-size:12px!important}
}
@media(max-width:380px){.hero h1{font-size:28px}.steps{grid-template-columns:1fr 1fr}.cards{gap:5px}.card{padding:10px 7px}.pricing .price{flex-basis:84%}}
'''
if marker not in s:
    s=s.replace('</style>',css+'\n</style>',1)
p.write_text(s,encoding='utf-8')
print('Roya premium mobile app UI v1 applied')
