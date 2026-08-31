from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
marker='roya-auth-modal-center-v6'
if marker not in s:
    css=r'''
<style id="roya-auth-modal-center-v6">
@media(max-width:800px){
  #authModal.modal.show,#resetPasswordModal.modal.show{
    display:grid!important;
    place-items:center!important;
    align-items:center!important;
    justify-items:center!important;
    padding:18px!important;
  }
  #authModal .modalbox,#resetPasswordModal .modalbox{
    width:min(460px,100%)!important;
    max-height:calc(100dvh - 36px)!important;
    margin:auto!important;
    border-radius:27px!important;
    border:1px solid #3b4268!important;
    padding:22px 18px!important;
    animation:royaAuthCenterV6 .24s cubic-bezier(.2,.8,.2,1)!important;
  }
  #authModal .modalbox:before,#resetPasswordModal .modalbox:before{display:none!important}
}
@keyframes royaAuthCenterV6{from{opacity:0;transform:translateY(8px) scale(.975)}to{opacity:1;transform:none}}
</style>
'''
    s=s.replace('</head>',css+'</head>',1)
p.write_text(s,encoding='utf-8')
print('Final auth modal center override v6 applied')
