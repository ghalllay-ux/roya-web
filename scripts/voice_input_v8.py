from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
start=s.find('let royaMediaRecorder=null;')
end=s.find('\nfunction showRoyaNotice', start)
if start!=-1 and end!=-1:
    new="""let royaMediaRecorder=null;
let royaVoiceStream=null;
let royaVoiceChunks=[];
let royaVoiceTimer=null;
let royaVoiceStartedAt=0;
let royaVoiceBusy=false;

function voice(){
  if(!currentUser){
    showRoyaNotice('🔐','سجّل الدخول أولًا','التسجيل الصوتي مرتبط بحسابك حتى يتم تحويل الصوت إلى نص بأمان.');
    setTimeout(()=>openAuth(),350);
    return;
  }
  if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){
    showRoyaNotice('🎙️','التسجيل غير مدعوم','حدّث Safari إلى أحدث إصدار ثم حاول مرة أخرى.');
    return;
  }
  openVoiceRecorderReady();
}

function openVoiceRecorderReady(){
  stopVoiceTracksOnly();
  royaMediaRecorder=null;royaVoiceChunks=[];
  clearInterval(royaVoiceTimer);royaVoiceTimer=null;
  document.getElementById('royaVoiceOverlay')?.remove();
  const overlay=document.createElement('div');
  overlay.id='royaVoiceOverlay';overlay.className='royaVoiceOverlay show';
  overlay.innerHTML=`<div class=\"royaVoiceSheet\"><div class=\"royaVoiceHandle\"></div><div class=\"royaVoiceMic royaVoiceMicIdle\"><span>🎙️</span></div><h3>التسجيل الصوتي</h3><p id=\"royaVoiceLive\">اضغط «بدء التسجيل» عندما تكون مستعدًا.</p><div id=\"royaVoiceTime\" class=\"royaVoiceTime\">00:00</div><div class=\"royaVoiceActions\"><button id=\"royaVoiceStartBtn\" class=\"primary royaVoiceStart\" onclick=\"startRoyaVoiceRecording()\">بدء التسجيل</button><button id=\"royaVoiceStopBtn\" class=\"secondary royaVoiceStop\" onclick=\"stopVoiceInput()\" disabled>إيقاف التسجيل</button></div><button class=\"royaVoiceCancel\" onclick=\"cancelRoyaVoice()\">إلغاء</button></div>`;
  document.body.appendChild(overlay);
}

async function startRoyaVoiceRecording(){
  if(royaVoiceBusy||royaMediaRecorder?.state==='recording')return;
  const startBtn=document.getElementById('royaVoiceStartBtn');
  const stopBtn=document.getElementById('royaVoiceStopBtn');
  const live=document.getElementById('royaVoiceLive');
  try{
    royaVoiceBusy=true;
    if(startBtn){startBtn.disabled=true;startBtn.textContent='جارٍ فتح الميكروفون…'}
    const stream=await navigator.mediaDevices.getUserMedia({audio:true,video:false});
    royaVoiceStream=stream;
    let mime='';
    for(const candidate of ['audio/mp4','audio/webm;codecs=opus','audio/webm']){
      try{if(MediaRecorder.isTypeSupported?.(candidate)){mime=candidate;break}}catch(_){ }
    }
    let recorder;
    try{recorder=mime?new MediaRecorder(stream,{mimeType:mime}):new MediaRecorder(stream)}catch(_){recorder=new MediaRecorder(stream)}
    royaMediaRecorder=recorder;royaVoiceChunks=[];
    recorder.ondataavailable=e=>{if(e.data&&e.data.size>0)royaVoiceChunks.push(e.data)};
    recorder.onerror=e=>{console.error('voice recorder error',e);finishVoiceRecordingError('تعذر تسجيل الصوت من الميكروفون.');};
    recorder.onstop=async()=>{
      clearInterval(royaVoiceTimer);royaVoiceTimer=null;
      stopVoiceTracksOnly();
      const type=recorder.mimeType||mime||'audio/webm';
      const blob=new Blob(royaVoiceChunks,{type});
      royaVoiceChunks=[];royaMediaRecorder=null;
      if(blob.size<800){finishVoiceRecordingError('لم يتم التقاط تسجيل كافٍ. حاول مرة أخرى وتحدث بعد بدء العداد.');return}
      await transcribeRoyaVoice(blob);
    };
    recorder.start();
    royaVoiceStartedAt=Date.now();updateVoiceTimer();
    royaVoiceTimer=setInterval(updateVoiceTimer,1000);
    document.querySelector('.royaVoiceMic')?.classList.remove('royaVoiceMicIdle');
    document.querySelector('.royaVoiceMic')?.classList.add('royaVoiceMicRecording');
    if(live)live.textContent='يتم التسجيل الآن… تحدث بوضوح ثم اضغط «إيقاف التسجيل».';
    if(startBtn){startBtn.textContent='جاري التسجيل';startBtn.disabled=true}
    if(stopBtn)stopBtn.disabled=false;
    setTimeout(()=>{if(royaMediaRecorder?.state==='recording')stopVoiceInput()},90000);
  }catch(e){
    console.error('microphone permission',e);
    stopVoiceTracksOnly();
    royaMediaRecorder=null;
    if(startBtn){startBtn.disabled=false;startBtn.textContent='بدء التسجيل'}
    if(stopBtn)stopBtn.disabled=true;
    const denied=e?.name==='NotAllowedError'||e?.name==='SecurityError';
    const msg=denied?'اسمح لموقع رؤيا باستخدام الميكروفون من إعدادات Safari ثم اضغط «بدء التسجيل» مرة أخرى.':'تعذر فتح الميكروفون الآن. حاول مرة أخرى.';
    if(live)live.textContent=msg;
  }finally{royaVoiceBusy=false}
}

function updateVoiceTimer(){
  const el=document.getElementById('royaVoiceTime');if(!el)return;
  const sec=Math.max(0,Math.floor((Date.now()-royaVoiceStartedAt)/1000));
  el.textContent=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');
}

function stopVoiceInput(){
  if(royaMediaRecorder?.state==='recording'){
    const stopBtn=document.getElementById('royaVoiceStopBtn');
    if(stopBtn){stopBtn.disabled=true;stopBtn.textContent='جارٍ تجهيز الصوت…'}
    const live=document.getElementById('royaVoiceLive');if(live)live.textContent='تم إيقاف التسجيل. جارٍ تجهيز الملف…';
    try{royaMediaRecorder.stop()}catch(e){console.error(e);finishVoiceRecordingError('تعذر إنهاء التسجيل بشكل صحيح. حاول مرة أخرى.');}
  }
}

function cancelRoyaVoice(){
  try{if(royaMediaRecorder?.state==='recording')royaMediaRecorder.stop()}catch(_){ }
  royaMediaRecorder=null;royaVoiceChunks=[];clearInterval(royaVoiceTimer);royaVoiceTimer=null;stopVoiceTracksOnly();closeVoiceRecorder();
}

function stopVoiceTracksOnly(){
  try{royaVoiceStream?.getTracks()?.forEach(t=>t.stop())}catch(_){ }
  royaVoiceStream=null;
}

async function transcribeRoyaVoice(blob){
  const live=document.getElementById('royaVoiceLive');if(live)live.textContent='جارٍ تحويل صوتك إلى نص…';
  const startBtn=document.getElementById('royaVoiceStartBtn');if(startBtn)startBtn.style.display='none';
  const stopBtn=document.getElementById('royaVoiceStopBtn');if(stopBtn){stopBtn.disabled=true;stopBtn.textContent='جارٍ التحويل…'}
  try{
    const form=new FormData();
    const ext=(blob.type||'').includes('mp4')?'m4a':(blob.type||'').includes('ogg')?'ogg':'webm';
    form.append('audio',blob,'roya-voice.'+ext);
    const {data,error}=await sb.functions.invoke('transcribe-voice',{body:form});
    if(error)throw error;
    const text=String(data?.text||'').trim();
    if(!text)throw new Error('empty transcription');
    const target=document.getElementById('dream');
    if(target){target.value=[target.value.trim(),text].filter(Boolean).join(target.value.trim()?' ':'');target.dispatchEvent(new Event('input',{bubbles:true}));}
    closeVoiceRecorder();
    showRoyaNotice('✓','تم تحويل التسجيل','تمت إضافة كلامك إلى خانة الرؤيا بنجاح.');
  }catch(e){
    console.error('voice transcription',e);
    finishVoiceRecordingError('تعذر تحويل التسجيل إلى نص. أعد المحاولة بتسجيل أقصر وواضح.');
  }
}

function finishVoiceRecordingError(message){
  clearInterval(royaVoiceTimer);royaVoiceTimer=null;stopVoiceTracksOnly();royaMediaRecorder=null;royaVoiceChunks=[];
  const live=document.getElementById('royaVoiceLive');if(live)live.textContent=message;
  const startBtn=document.getElementById('royaVoiceStartBtn');if(startBtn){startBtn.style.display='';startBtn.disabled=false;startBtn.textContent='إعادة التسجيل'}
  const stopBtn=document.getElementById('royaVoiceStopBtn');if(stopBtn){stopBtn.disabled=true;stopBtn.textContent='إيقاف التسجيل'}
  document.querySelector('.royaVoiceMic')?.classList.remove('royaVoiceMicRecording');
  document.querySelector('.royaVoiceMic')?.classList.add('royaVoiceMicIdle');
}
function closeVoiceRecorder(){document.getElementById('royaVoiceOverlay')?.remove()}
"""
    s=s[:start]+new+s[end+1:]
marker='/* roya-voice-input-v8 */'
css=r'''
/* roya-voice-input-v8 */
.royaVoiceActions{display:grid;grid-template-columns:1fr 1fr;gap:9px;width:100%;margin-top:2px}.royaVoiceStart,.royaVoiceStop{min-height:48px;border-radius:15px}.royaVoiceStop:disabled,.royaVoiceStart:disabled{opacity:.55;cursor:default}.royaVoiceCancel{width:100%;margin-top:9px;min-height:42px;border:0;background:transparent;color:#9299b8;font-weight:700}.royaVoiceMicIdle{animation:none!important;box-shadow:0 0 0 8px rgba(119,101,218,.035)!important;opacity:.82}.royaVoiceMicRecording{animation:royaVoicePulse 1.2s ease-in-out infinite!important}.royaVoiceMicRecording:after{content:'';position:absolute;width:10px;height:10px;border-radius:50%;background:#ff6b6b;transform:translate(24px,-24px);box-shadow:0 0 0 4px rgba(255,107,107,.12)}.royaVoiceMic{position:relative}
@media(max-width:380px){.royaVoiceActions{grid-template-columns:1fr}.royaVoiceCancel{margin-top:5px}}
'''
if marker not in s:
    s=s.replace('</style>',css+'\n</style>',1)
p.write_text(s,encoding='utf-8')
print('Roya voice explicit controls v8 applied')
