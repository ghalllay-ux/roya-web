from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
start=s.find('function voice(){')
end=s.find('\nfunction showRoyaNotice', start)
if start!=-1 and end!=-1:
    new="""let royaSpeechRecognition=null;
let royaSpeechListening=false;
function voice(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){
    showRoyaNotice('🎙️','التسجيل الصوتي','متصفحك لا يدعم التحويل الصوتي المباشر حاليًا. جرّب أحدث إصدار من Safari أو Chrome.');
    return;
  }
  if(royaSpeechListening&&royaSpeechRecognition){
    royaSpeechRecognition.stop();
    return;
  }
  const target=document.getElementById('dream');
  if(!target)return;
  const recognition=new SR();
  royaSpeechRecognition=recognition;
  recognition.lang='ar-SA';
  recognition.continuous=true;
  recognition.interimResults=true;
  let committed='';
  const original=target.value.trim();
  recognition.onstart=()=>{
    royaSpeechListening=true;
    showVoiceRecorder();
  };
  recognition.onresult=(event)=>{
    let interim='';
    for(let i=event.resultIndex;i<event.results.length;i++){
      const t=event.results[i][0]?.transcript||'';
      if(event.results[i].isFinal) committed+=(committed?' ':'')+t.trim();
      else interim+=(interim?' ':'')+t.trim();
    }
    const joined=[original,committed,interim].filter(Boolean).join(original?' ':'');
    target.value=joined.trim();
    target.dispatchEvent(new Event('input',{bubbles:true}));
    const live=document.getElementById('royaVoiceLive');
    if(live) live.textContent=interim||committed||'أستمع الآن…';
  };
  recognition.onerror=(e)=>{
    royaSpeechListening=false;
    closeVoiceRecorder();
    const msg=e.error==='not-allowed'?'اسمح للموقع باستخدام الميكروفون من إعدادات المتصفح ثم حاول مرة أخرى.':e.error==='no-speech'?'لم أسمع صوتًا واضحًا. حاول التحدث مرة أخرى.':'تعذر بدء التسجيل الصوتي الآن.';
    showRoyaNotice('🎙️','تعذر التسجيل',msg);
  };
  recognition.onend=()=>{
    royaSpeechListening=false;
    royaSpeechRecognition=null;
    closeVoiceRecorder();
  };
  try{recognition.start()}catch(e){console.error(e)}
}
function showVoiceRecorder(){
  document.getElementById('royaVoiceOverlay')?.remove();
  const overlay=document.createElement('div');
  overlay.id='royaVoiceOverlay';
  overlay.className='royaVoiceOverlay show';
  overlay.innerHTML=`<div class=\"royaVoiceSheet\"><div class=\"royaVoiceHandle\"></div><div class=\"royaVoiceMic\"><span>🎙️</span></div><h3>أستمع إلى رؤياك</h3><p id=\"royaVoiceLive\">ابدأ بالتحدث… وسيظهر النص مباشرة.</p><button class=\"primary royaVoiceStop\" onclick=\"stopVoiceInput()\">إيقاف التسجيل</button></div>`;
  document.body.appendChild(overlay);
}
function stopVoiceInput(){if(royaSpeechRecognition)royaSpeechRecognition.stop()}
function closeVoiceRecorder(){document.getElementById('royaVoiceOverlay')?.remove()}
"""
    s=s[:start]+new+s[end+1:]
marker='/* roya-voice-input-v6 */'
css=r'''
/* roya-voice-input-v6 */
.royaVoiceOverlay{position:fixed;inset:0;z-index:12500;display:flex;align-items:flex-end;justify-content:center;background:rgba(3,5,15,.56);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}.royaVoiceSheet{width:min(500px,100%);padding:12px 20px calc(18px + env(safe-area-inset-bottom));text-align:center;border-radius:28px 28px 0 0;background:linear-gradient(180deg,#171b36,#0d1128);border:1px solid rgba(255,255,255,.07);border-bottom:0;box-shadow:0 -18px 60px rgba(0,0,0,.36)}.royaVoiceHandle{width:38px;height:4px;border-radius:99px;background:rgba(255,255,255,.17);margin:0 auto 18px}.royaVoiceMic{width:68px;height:68px;margin:0 auto 13px;border-radius:50%;display:grid;place-items:center;background:rgba(119,101,218,.15);box-shadow:0 0 0 10px rgba(119,101,218,.055);animation:royaVoicePulse 1.5s ease-in-out infinite}.royaVoiceMic span{font-size:29px}.royaVoiceSheet h3{margin:0 0 8px;font-size:20px}.royaVoiceSheet p{min-height:44px;margin:0 auto 17px;max-width:390px;color:#aeb5cc;line-height:1.7;font-size:13px}.royaVoiceStop{width:100%;min-height:48px;border-radius:15px}@keyframes royaVoicePulse{0%,100%{transform:scale(1);box-shadow:0 0 0 8px rgba(119,101,218,.05)}50%{transform:scale(1.04);box-shadow:0 0 0 15px rgba(119,101,218,.025)}}
'''
if marker not in s:
    s=s.replace('</style>',css+'\n</style>',1)
p.write_text(s,encoding='utf-8')
print('Roya Arabic voice input v6 applied')
