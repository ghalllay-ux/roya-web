// Werd contact anti-spam layer — v1
(function(){
  const STORAGE_KEY='werd_contact_client_v1';
  const $=id=>document.getElementById(id);
  function notify(m){try{typeof toast==='function'?toast(m):console.log(m)}catch(_){console.log(m)}}
  function rawToken(){
    let v='';try{v=localStorage.getItem(STORAGE_KEY)||''}catch(_){}
    if(v&&v.length>=24)return v;
    try{v=crypto.randomUUID?`${crypto.randomUUID()}-${crypto.randomUUID()}`:`${Date.now()}-${Math.random()}-${Math.random()}`}catch(_){v=`${Date.now()}-${Math.random()}-${Math.random()}`}
    try{localStorage.setItem(STORAGE_KEY,v)}catch(_){}
    return v;
  }
  async function sha256Hex(v){
    if(!crypto?.subtle)throw new Error('secure_crypto_unavailable');
    const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(v)));
    return Array.from(new Uint8Array(d)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }
  async function secureSend(e){
    e.preventDefault();e.stopImmediatePropagation();
    if($('werdContactWebsite')?.value)return;
    const message=String($('werdContactMessage')?.value||'').trim();
    const name=String($('werdContactName')?.value||'').trim();
    const contact=String($('werdContactWay')?.value||'').trim();
    const category=String($('werdContactCategory')?.value||'question');
    if(message.length<2)return notify('اكتب رسالتك أولًا');
    const btn=$('werdContactSend');if(btn){btn.disabled=true;btn.textContent='جاري الإرسال…'}
    try{
      let userId=null;try{userId=(await sb.auth.getSession())?.data?.session?.user?.id||null}catch(_){}
      const clientKey=await sha256Hex(rawToken());
      const {error}=await sb.from('werd_contact_messages').insert({user_id:userId,sender_name:name,sender_contact:contact,category,message,status:'new',admin_note:'',client_key:clientKey});
      if(error)throw error;
      $('werdContactForm')?.reset();notify('تم إرسال رسالتك بنجاح ✓');
    }catch(err){
      console.error('Werd secure contact send',err);
      const m=String(err?.message||'').toLowerCase();
      notify(m.includes('rate')||m.includes('too many')||m.includes('spam')?'تم إرسال عدة رسائل مؤخرًا • حاول بعد قليل':'تعذر إرسال الرسالة الآن • حاول مرة أخرى');
    }finally{if(btn){btn.disabled=false;btn.textContent='إرسال الرسالة'}}
  }
  function bind(){
    const form=$('werdContactForm');if(!form||form.dataset.werdSecureContact==='1')return;
    form.dataset.werdSecureContact='1';form.addEventListener('submit',secureSend,true);
  }
  function install(){bind();let tries=0;const t=setInterval(()=>{tries++;bind();if($('werdContactForm')||tries>60)clearInterval(t)},250)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  window.addEventListener('pageshow',()=>setTimeout(bind,80));
})();