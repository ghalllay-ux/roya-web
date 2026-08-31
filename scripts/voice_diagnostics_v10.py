from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
old="""    const response=await fetch(SUPABASE_URL+'/functions/v1/transcribe-voice',{
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
new="""    const diagId='RV-'+Date.now().toString(36).slice(-6).toUpperCase();
    const response=await fetch(SUPABASE_URL+'/functions/v1/transcribe-voice',{
      method:'POST',
      headers:{Authorization:'Bearer '+token,apikey:SUPABASE_PUBLISHABLE_KEY,'x-roya-diag':diagId},
      body:form
    });
    const sbCode=response.headers.get('sb-error-code')||'';
    const rawBody=await response.text();
    let data={};
    try{data=rawBody?JSON.parse(rawBody):{}}catch(_){data={error:rawBody||'INVALID_RESPONSE'}}
    if(!response.ok){
      const serverCode=String(data?.code||data?.error||sbCode||('HTTP_'+response.status));
      throw new Error('ROYA_DIAG|'+diagId+'|'+response.status+'|'+serverCode);
    }
    const text=String(data?.text||'').trim();
    if(!text)throw new Error('ROYA_DIAG|'+diagId+'|200|EMPTY_TEXT');"""
if old not in s:
    raise SystemExit('v9 fetch block not found')
s=s.replace(old,new,1)
old2="""    const raw=String(e?.message||'');
    let msg='تعذر تحويل التسجيل إلى نص. حاول مرة أخرى.';
    if(raw.includes('AUTH_SESSION_MISSING')||raw.toLowerCase().includes('jwt')) msg='انتهت جلسة الدخول. سجّل الدخول من جديد ثم حاول مرة أخرى.';
    else if(raw.toLowerCase().includes('format')||raw.toLowerCase().includes('codec')||raw.toLowerCase().includes('audio')) msg='لم يتمكن النظام من قراءة صيغة التسجيل. اضغط «إعادة التسجيل» وحاول مرة أخرى.';
    finishVoiceRecordingError(msg);"""
new2="""    const raw=String(e?.message||'');
    let msg='تعذر تحويل التسجيل إلى نص. حاول مرة أخرى.';
    if(raw.includes('AUTH_SESSION_MISSING')||raw.toLowerCase().includes('jwt')) msg='انتهت جلسة الدخول. سجّل الدخول من جديد ثم حاول مرة أخرى.';
    else if(raw.startsWith('ROYA_DIAG|')){
      const parts=raw.split('|');
      const id=parts[1]||'—', status=parts[2]||'—', code=parts[3]||'UNKNOWN';
      msg='تعذر تحويل الصوت إلى نص. رمز التشخيص: '+id+' · '+status+' · '+code;
    }else if(raw.toLowerCase().includes('format')||raw.toLowerCase().includes('codec')||raw.toLowerCase().includes('audio')) msg='لم يتمكن النظام من قراءة صيغة التسجيل. اضغط «إعادة التسجيل» وحاول مرة أخرى.';
    finishVoiceRecordingError(msg);"""
if old2 not in s:
    raise SystemExit('v9 error block not found')
s=s.replace(old2,new2,1)
marker='/* roya-voice-diagnostics-v10 */'
if marker not in s:
    s=s.replace('</style>',marker+'\n</style>',1)
p.write_text(s,encoding='utf-8')
print('Roya voice diagnostics v10 applied')
