from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
old="function voice(){alert('التسجيل الصوتي سيُفعّل عند ربط خدمة تحويل الصوت إلى نص.')}"
new="""function voice(){
  showRoyaNotice('🎙️','التسجيل الصوتي','سيُفعّل قريبًا عند ربط خدمة تحويل الصوت إلى نص.');
}
function showRoyaNotice(icon,title,message){
  document.getElementById('royaNoticeOverlay')?.remove();
  const overlay=document.createElement('div');
  overlay.id='royaNoticeOverlay';
  overlay.className='royaNoticeOverlay';
  overlay.innerHTML=`<div class=\"royaNoticeSheet\" role=\"dialog\" aria-modal=\"true\"><div class=\"royaNoticeHandle\"></div><div class=\"royaNoticeIcon\">${icon}</div><h3>${title}</h3><p>${message}</p><button class=\"primary royaNoticeBtn\" onclick=\"closeRoyaNotice()\">حسنًا</button></div>`;
  overlay.addEventListener('click',e=>{if(e.target===overlay)closeRoyaNotice()});
  document.body.appendChild(overlay);
  requestAnimationFrame(()=>overlay.classList.add('show'));
}
function closeRoyaNotice(){
  const el=document.getElementById('royaNoticeOverlay');
  if(!el)return;
  el.classList.remove('show');
  setTimeout(()=>el.remove(),180);
}"""
if old in s:
    s=s.replace(old,new,1)
marker='/* roya-mobile-native-notice-v5 */'
css=r'''
/* roya-mobile-native-notice-v5 */
.royaNoticeOverlay{position:fixed;inset:0;z-index:12000;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(3,5,15,.58);opacity:0;transition:opacity .18s ease;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}.royaNoticeOverlay.show{opacity:1}.royaNoticeSheet{width:min(390px,100%);padding:22px 20px 18px;text-align:center;border-radius:25px;background:linear-gradient(160deg,#181d39,#0e122a);border:1px solid rgba(255,255,255,.08);box-shadow:0 28px 80px rgba(0,0,0,.48);transform:translateY(10px) scale(.985);transition:transform .2s ease}.royaNoticeOverlay.show .royaNoticeSheet{transform:none}.royaNoticeHandle{display:none}.royaNoticeIcon{width:48px;height:48px;margin:0 auto 11px;display:grid;place-items:center;border-radius:16px;background:rgba(119,101,218,.12);font-size:22px}.royaNoticeSheet h3{margin:0 0 7px;font-size:19px}.royaNoticeSheet p{margin:0 auto 17px;max-width:310px;color:#aeb5cc;line-height:1.75;font-size:13px}.royaNoticeBtn{width:100%;min-height:45px}
@media(max-width:800px){.royaNoticeOverlay{align-items:flex-end;padding:0}.royaNoticeSheet{width:100%;max-width:500px;border-radius:27px 27px 0 0;padding:12px 18px calc(17px + env(safe-area-inset-bottom));transform:translateY(35px);box-shadow:0 -18px 60px rgba(0,0,0,.38)}.royaNoticeHandle{display:block;width:38px;height:4px;border-radius:99px;background:rgba(255,255,255,.17);margin:0 auto 14px}.royaNoticeIcon{width:46px;height:46px;border-radius:15px}.royaNoticeSheet h3{font-size:18px}.royaNoticeSheet p{font-size:13px;margin-bottom:15px}.royaNoticeBtn{min-height:47px;border-radius:15px}}
'''
if marker not in s:
    s=s.replace('</style>',css+'\n</style>',1)
p.write_text(s,encoding='utf-8')
print('Roya native voice notice v5 applied')
