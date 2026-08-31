from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
old="""    const {data,error}=await sb.functions.invoke('transcribe-voice',{body:form});
    if(error)throw error;
    const text=String(data?.text||'').trim();"""
new="""    const {data:sessionData}=await sb.auth.getSession();
    const token=sessionData?.session?.access_token;
    if(!token)throw new Error('AUTH_SESSION_MISSING');
    const response=await fetch(SUPABASE_URL+'/functions/v1/transcribe-voice',{
      method:'POST',
      headers:{Authorization:'Bearer '+token,apikey:SUPABASE_PUBLISHABLE_KEY},
      body:form
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok){
      const detail=String(data?.details||data?.error||'TRANSCRIPTION_FAILED');
      throw new Error(detail);
    }
    const text=String(data?.text||'').trim();"""
if old in s:
    s=s.replace(old,new,1)
else:
    print('warning: v8 invoke block not found')
old2="""    console.error('voice transcription',e);
    finishVoiceRecordingError('تعذر تحويل التسجيل إلى نص. أعد المحاولة بتسجيل أقصر وواضح.');"""
new2="""    console.error('voice transcription',e);
    const raw=String(e?.message||'');
    let msg='تعذر تحويل التسجيل إلى نص. حاول مرة أخرى.';
    if(raw.includes('AUTH_SESSION_MISSING')||raw.toLowerCase().includes('jwt')) msg='انتهت جلسة الدخول. سجّل الدخول من جديد ثم حاول مرة أخرى.';
    else if(raw.toLowerCase().includes('format')||raw.toLowerCase().includes('codec')||raw.toLowerCase().includes('audio')) msg='لم يتمكن النظام من قراءة صيغة التسجيل. اضغط «إعادة التسجيل» وحاول مرة أخرى.';
    finishVoiceRecordingError(msg);"""
if old2 in s:
    s=s.replace(old2,new2,1)
marker='/* roya-voice-input-v9 */'
css=r'''
/* roya-voice-input-v9 */
.royaVoiceActions{grid-template-columns:1fr 1fr}.royaVoiceStart:not(:disabled){box-shadow:0 8px 22px rgba(207,165,67,.14)}.royaVoiceStop:not(:disabled){border-color:rgba(255,107,107,.28);color:#ffd0d0}.royaVoiceSheet p{max-width:420px}
'''
if marker not in s:
    s=s.replace('</style>',css+'\n</style>',1)
p.write_text(s,encoding='utf-8')
print('Roya voice upload v9 applied')
