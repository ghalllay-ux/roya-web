from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
old="""    const response=await fetch(SUPABASE_URL+'/functions/v1/transcribe-voice',{
      method:'POST',
      headers:{Authorization:'Bearer '+token,apikey:SUPABASE_PUBLISHABLE_KEY,'x-roya-diag':diagId},
      body:form
    });"""
new="""    const endpoint=SUPABASE_URL+'/functions/v1/transcribe-voice';
    // Safari-safe request: keep headers limited to those explicitly allowed by the Edge Function CORS policy.
    // The diagnostic id remains client-side and is shown if the request fails before POST reaches Supabase.
    let response;
    try{
      response=await fetch(endpoint,{
        method:'POST',
        mode:'cors',
        credentials:'omit',
        cache:'no-store',
        headers:{Authorization:'Bearer '+token,apikey:SUPABASE_PUBLISHABLE_KEY},
        body:form
      });
    }catch(fetchErr){
      throw new Error('ROYA_DIAG|'+diagId+'|NETWORK|SAFARI_FETCH_FAILED');
    }"""
if old not in s:
    raise SystemExit('v10 fetch block not found')
s=s.replace(old,new,1)
marker='/* roya-voice-safari-upload-v11 */'
if marker not in s:
    s=s.replace('</style>',marker+'\n</style>',1)
p.write_text(s,encoding='utf-8')
print('Roya Safari voice upload v11 applied')
