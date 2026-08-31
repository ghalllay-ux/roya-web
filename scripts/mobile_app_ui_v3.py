from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
marker='/* roya-mobile-native-v3 */'
css=r'''
/* roya-mobile-native-v3 */
@media(max-width:800px){
 html,body{overscroll-behavior-y:none}body{min-height:100dvh;background:#080b20}
 .shell{max-width:500px;padding:calc(8px + env(safe-area-inset-top)) 12px calc(94px + env(safe-area-inset-bottom));}
 header{top:0;margin:0 -12px 10px;padding:8px 14px 11px;border-bottom:1px solid rgba(255,255,255,.055);background:rgba(8,11,32,.88);-webkit-backdrop-filter:blur(24px) saturate(150%);backdrop-filter:blur(24px) saturate(150%)}
 .mark{width:36px;height:36px;border-radius:12px}.brand b{font-size:19px}.ghost{min-height:38px;padding:8px 12px;border-radius:12px}
 .hero>.panel:first-child{border-radius:22px;padding:18px 15px 15px;border-color:rgba(255,255,255,.075);box-shadow:none}.hero h1{font-size:29px;letter-spacing:-.8px}.hero p{font-size:12.5px;line-height:1.75}
 .dreambox{padding:11px;border-radius:16px;border-color:rgba(255,255,255,.08)}textarea{min-height:122px;font-size:16px;line-height:1.7}textarea::placeholder{color:#747d9d}
 .primary,.secondary,.ghost,.option,nav button{touch-action:manipulation}.primary,.secondary{min-height:44px}.dreambox .actions .primary{font-size:13px}
 .side{border-radius:19px!important}.steps{grid-template-columns:1fr 1fr}.step{min-height:80px}
 .cards{grid-template-columns:1fr 1fr;gap:9px}.card{padding:13px 11px;border-radius:17px}.card h3{font-size:12px}.card p{font-size:10px}
 .pricing{margin-inline:-12px;padding:2px 12px 8px;scroll-padding-inline:12px}.pricing .price{flex:0 0 86%;scroll-snap-align:start;padding:19px 15px}.pricing .amount{font-size:31px}
 nav{bottom:calc(7px + env(safe-area-inset-bottom));width:calc(100% - 16px);max-width:484px;padding:5px;border-radius:22px;background:rgba(12,16,42,.91);box-shadow:0 12px 40px rgba(0,0,0,.48);-webkit-backdrop-filter:blur(26px) saturate(160%);backdrop-filter:blur(26px) saturate(160%)}nav button{min-height:52px;padding:7px 3px 5px;border-radius:17px;font-size:17px}nav button small{display:block;margin-top:2px;font-size:9px}nav button.active{background:rgba(123,97,255,.18);box-shadow:inset 0 0 0 1px rgba(255,255,255,.07)}
 .modal{align-items:end;padding:0;background:rgba(2,5,18,.66);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}.modalbox{width:100%;max-width:500px;max-height:88dvh;border-radius:27px 27px 0 0;padding:18px 16px calc(18px + env(safe-area-inset-bottom));border-bottom:0;animation:royaSheetUp .25s cubic-bezier(.2,.8,.2,1)}.modalbox:before{content:'';display:block;width:38px;height:4px;border-radius:99px;background:rgba(255,255,255,.18);margin:-7px auto 12px}.option{min-height:48px;font-size:13px}
 /* Login/recovery dialogs stay centered instead of becoming bottom sheets. */
 #authModal,#resetPasswordModal{align-items:center!important;justify-content:center!important;padding:18px!important}
 #authModal .modalbox,#resetPasswordModal .modalbox{width:min(460px,100%)!important;max-height:calc(100dvh - 36px)!important;border-radius:27px!important;border-bottom:1px solid rgba(255,255,255,.08)!important;padding:22px 18px!important;margin:auto!important;animation:royaModalCenter .24s cubic-bezier(.2,.8,.2,1)!important}
 #authModal .modalbox:before,#resetPasswordModal .modalbox:before{display:none!important}
 .checkoutStandalone{min-height:100dvh!important;padding-top:env(safe-area-inset-top)!important;padding-bottom:env(safe-area-inset-bottom)!important}.checkoutWrap{width:100%!important;max-width:500px!important;padding:10px 12px 22px!important}.checkoutCard{border-radius:22px!important}.checkoutTop{position:sticky;top:0;z-index:5;padding:8px 0!important;background:rgba(8,11,32,.88);-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px)}
 .logoutToast{top:calc(9px + env(safe-area-inset-top));width:calc(100% - 20px);max-width:460px;border-radius:18px}
}
@keyframes royaSheetUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
@keyframes royaModalCenter{from{opacity:0;transform:translateY(8px) scale(.975)}to{opacity:1;transform:none}}
@media(max-width:380px){.shell{padding-inline:10px}.hero h1{font-size:27px}.cards{grid-template-columns:1fr 1fr}.pricing{margin-inline:-10px;padding-inline:10px}.pricing .price{flex-basis:90%}}
'''
if marker not in s:
    s=s.replace('</style>',css+'\n</style>',1)
p.write_text(s,encoding='utf-8')
print('Roya mobile native-like UI v3 applied with centered auth modal')
