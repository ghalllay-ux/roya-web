from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
start=s.find('let royaSpeechRecognition=null;')
end=s.find('\nfunction showRoyaNotice', start)
if start==-1:
    start=s.find('function voice(){')
if start!=-1 and end!=-1:
    new="""let royaMediaRecorder=null;
let royaVoiceStream=null;
let royaVoiceChunks=[];
let royaVoiceTimer=null;
let royaVoiceStartedAt=0;
let royaVoiceBusy=false;

async function voice(){
  if(royaVoiceBusy)return;
  if(royaMediaRecorder&&royaMediaRecorder.state==='recording'){
    stopVoiceInput();
    return;
  }
  if(!currentUser){
    showRoyaNotice('🔐','سجّل الدخول أولًا','التسجيل الصوتي مرتبط بحسابك حتى يتم تحويل الصوت إلى نص بأمان.');
    setTimeout(()=>openAuth(),350);
    return;
  }
  if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){
    showRoyaNotice('🎙️','التسجيل غير مدعوم','حدّث Safari إلى أحدث إصدار ثم حاول مرة أخرى.');
    return;
  }
  try{
    royaVoiceBusy=true;
    const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});
    royaVoiceStream=stream;
    let mime='';
    for(const candidate of ['audio/mp4','audio/webm;codecs=opus','audio/webm']){
      if(MediaRecorder.isTypeSupported?.(candidate)){mime=candidate;break}
    }
    const recorder=mime?new MediaRecorder(stream,{mimeType:mime}):new MediaRecorder(stream);
    royaMediaRecorder=recorder;
    royaVoiceChunks=[];
    recorder.ondataavailable=e=>{if(e.data?.size)royaVoiceChunks.push(e.data)};
    recorder.onerror=e=>{console.error('voice recorder error',e);finishVoiceRecordingError('تعذر تسجيل الصوت من الميكروفون.');};
    recorder.onstop=async()=>{
      clearInterval(royaVoiceTimer);royaVoiceTimer=null;
      royaVoiceStream?.getTracks().forEach(t=>t.stop());royaVoiceStream=null;
      const blob=new Blob(royaVoiceChunks,{type:recorder.mimeType||mime||'audio/webm'});
      royaVoiceChunks=[];royaMediaRecorder=null;
      if(blob.size<1000){finishVoiceRecordingError('لم يتم التقاط صوت واضح. حاول مرة أخرى.');return}
      await transcribeRoyaVoice(blob);
    };
    recorder.start(500);
    royaVoiceStartedAt=Date.now();
    showVoiceRecorder();
    updateVoiceTimer();
    royaVoiceTimer=setInterval(updateVoiceTimer,1000);
    setTimeout(()=>{if(royaMediaRecorder?.state==='recording')stopVoiceInput()},90000);
  }catch(e){
    console.error('microphone permission',e);
    const denied=e?.name==='NotAllowedError'||e?.name==='SecurityError';
    showRoyaNotice('🎙️','تعذر فتح الميكروفون',denied?'اسمح لموقع رؤيا باستخدام الميكروفون من إعدادات Safari ثم حاول مرة أخرى.':'تعذر بدء التسجيل الصوتي الآن.');
  }finally{
    royaVoiceBusy=false;
  }
}

function showVoiceRecorder(){
  document.getElementById('royaVoiceOverlay')?.remove();
  const overlay=document.createElement('div');
  overlay.id='royaVoiceOverlay';overlay.className='royaVoiceOverlay show';
  overlay.innerHTML=`<div class=\"royaVoiceSheet\"><div class=\"royaVoiceHandle\"></div><div class=\"royaVoiceMic\"><span>🎙️</span></div><h3>أسجّل رؤياك الآن</h3><p id=\"royaVoiceLive\">تحدث بوضوح، ثم اضغط «إنهاء وتحويل للنص».</p><div id=\"royaVoiceTime\" class=\"royaVoiceTime\">00:00</div><button class=\"primary royaVoiceStop\" onclick=\"stopVoiceInput()\">إنهاء وتحويل للنص</button></div>`;
  document.body.appendChild(overlay);
}
function updateVoiceTimer(){
  const el=document.getElementById('royaVoiceTime');if(!el)return;
  const sec=Math.floor((Date.now()-royaVoiceStartedAt)/1000);
  el.textContent=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');
}
function stopVoiceInput(){
  if(royaMediaRecorder?.state==='recording'){
    const btn=document.querySelector('.royaVoiceStop');if(btn){btn.disabled=true;btn.textContent='جارٍ تجهيز الصوت…'}
    royaMediaRecorder.stop();
  }
}
async function transcribeRoyaVoice(blob){
  const live=document.getElementById('royaVoiceLive');if(live)live.textContent='جارٍ تحويل صوتك إلى نص…';
  const btn=document.querySelector('.royaVoiceStop');if(btn){btn.disabled=true;btn.textContent='جارٍ التحويل…'}
  try{
    const form=new FormData();
    const ext=(blob.type||'').includes('mp4')?'m4a':(blob.type||'').includes('ogg')?'ogg':'webm';
    form.append('audio',blob,'roya-voice.'+ext);
    const {data,error}=await sb.functions.invoke('transcribe-voice',{body:form});
    if(error)throw error;
    const text=String(data?.text||'').trim();
    if(!text)throw new Error('empty transcription');
    const target=document.getElementById('dream');
    if(target){target.value=[target.value.trim(),text].filter(Boolean).join(target.value.trim()?' ':'');target.dispatchEvent(new Event('input',{bubbles:true}));target.focus();}
    closeVoiceRecorder();
    showRoyaNotice('✓','تم تحويل التسجيل','تمت إضافة كلامك إلى خانة الرؤيا بنجاح.');
  }catch(e){
    console.error('voice transcription',e);
    finishVoiceRecordingError('تعذر تحويل التسجيل إلى نص. حاول مرة أخرى بعد لحظات.');
  }
}
function finishVoiceRecordingError(message){
  clearInterval(royaVoiceTimer);royaVoiceTimer=null;
  royaVoiceStream?.getTracks().forEach(t=>t.stop());royaVoiceStream=null;royaMediaRecorder=null;
  closeVoiceRecorder();showRoyaNotice('🎙️','تعذر التسجيل',message);
}
function closeVoiceRecorder(){document.getElementById('royaVoiceOverlay')?.remove()}
"""
    s=s[:start]+new+s[end+1:]
marker='/* roya-voice-input-v7 */'
css=r'''
/* roya-voice-input-v7 */
.royaVoiceTime{display:inline-flex;align-items:center;justify-content:center;min-width:74px;height:34px;margin:0 auto 15px;padding:0 12px;border-radius:999px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.06);color:#d9dcef;font-variant-numeric:tabular-nums;font-size:13px;font-weight:750;letter-spacing:.6px}.royaVoiceStop:disabled{opacity:.72;cursor:wait}.royaVoiceMic{animation:royaVoicePulse 1.35s ease-in-out infinite}
'''
if marker not in s:
    s=s.replace('</style>',css+'\n</style>',1)
p.write_text(s,encoding='utf-8')
print('Roya MediaRecorder voice transcription v7 applied')
