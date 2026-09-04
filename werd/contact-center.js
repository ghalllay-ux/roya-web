// Werd contact form + protected admin inbox — v2
(function(){
  const $=id=>document.getElementById(id);
  const CATS={question:'استفسار',suggestion:'اقتراح',issue:'مشكلة',feedback:'ملاحظة',other:'أخرى'};
  const STATUS={new:'جديدة',read:'مقروءة',replied:'تم الرد',closed:'مغلقة'};
  const CONTACT_KEY='werd_contact_client_v1';
  let isAdmin=false,adminChecked=false,currentMessages=[],activeFilter='all';

  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]))}
  function notify(m){try{typeof toast==='function'?toast(m):console.log(m)}catch(_){console.log(m)}}
  function fmtDate(v){try{return new Intl.DateTimeFormat('ar-SA',{dateStyle:'medium',timeStyle:'short'}).format(new Date(v))}catch(_){return String(v||'')}}
  function rawContactToken(){
    let v='';try{v=localStorage.getItem(CONTACT_KEY)||''}catch(_){}
    if(v&&v.length>=24)return v;
    try{v=crypto.randomUUID?`${crypto.randomUUID()}-${crypto.randomUUID()}`:`${Date.now()}-${Math.random()}-${Math.random()}`}catch(_){v=`${Date.now()}-${Math.random()}-${Math.random()}`}
    try{localStorage.setItem(CONTACT_KEY,v)}catch(_){}
    return v;
  }
  async function sha256Hex(v){const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(v)));return Array.from(new Uint8Array(d)).map(b=>b.toString(16).padStart(2,'0')).join('')}
  async function contactClientKey(){if(!crypto?.subtle)throw new Error('secure_crypto_unavailable');return sha256Hex(rawContactToken())}
  function css(){
    if($('werdContactStyle'))return;
    const s=document.createElement('style');s.id='werdContactStyle';s.textContent=`
      .werd-contact{margin:26px 0 16px;padding:22px;border:1px solid rgba(24,99,73,.14);border-radius:28px;background:linear-gradient(145deg,rgba(255,255,255,.95),rgba(239,245,238,.9));box-shadow:0 16px 42px rgba(20,76,58,.07)}body.dark .werd-contact{background:linear-gradient(145deg,rgba(25,52,43,.96),rgba(34,66,55,.94))}.werd-contact-head{display:flex;gap:13px;align-items:center;margin-bottom:16px}.werd-contact-icon{width:56px;height:56px;border-radius:19px;display:grid;place-items:center;background:var(--green);color:white;font-size:25px}.werd-contact-head b{display:block;font-size:20px;color:var(--green)}.werd-contact-head small{color:var(--muted);font-size:11px}.werd-contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.werd-contact-field{display:grid;gap:6px}.werd-contact-field.full{grid-column:1/-1}.werd-contact-field label{font-size:11px;color:var(--muted);font-weight:800}.werd-contact-field input,.werd-contact-field select,.werd-contact-field textarea{width:100%;box-sizing:border-box;border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:14px;padding:12px;font:inherit}.werd-contact-field textarea{min-height:120px;resize:vertical;line-height:1.8}.werd-contact-submit{width:100%;margin-top:11px}.werd-contact-note{font-size:10px;line-height:1.7;color:var(--muted);margin-top:10px}.werd-hp{position:absolute!important;left:-99999px!important;opacity:0!important;pointer-events:none!important}.contact-admin-badge{display:inline-grid;place-items:center;min-width:21px;height:21px;padding:0 5px;border-radius:999px;background:#b33;color:#fff;font-size:10px;margin-inline-start:6px}.contact-admin-toolbar{display:flex;gap:7px;overflow:auto;margin-bottom:12px}.contact-admin-toolbar button{white-space:nowrap}.contact-admin-card{border:1px solid var(--line);background:var(--card);border-radius:18px;padding:14px;margin-bottom:9px}.contact-admin-card.new{outline:2px solid rgba(30,118,83,.18);background:linear-gradient(180deg,var(--card),rgba(43,128,91,.05))}.contact-admin-meta{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.contact-admin-meta small{color:var(--muted)}.contact-admin-message{margin-top:11px;line-height:1.9;white-space:pre-wrap}.contact-admin-contact{margin-top:8px;padding:8px 10px;border-radius:12px;background:var(--sage);font-size:11px}.contact-admin-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:11px}.contact-admin-actions button{font-size:10px;padding:9px 5px}.contact-admin-note{width:100%;box-sizing:border-box;margin-top:9px;border:1px solid var(--line);border-radius:12px;background:var(--card);color:var(--ink);padding:10px;min-height:70px}.contact-admin-empty{text-align:center;padding:34px 15px;color:var(--muted)}.contact-admin-lock{text-align:center;padding:22px}.contact-admin-lock input{width:100%;box-sizing:border-box;border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:14px;padding:12px;text-align:center;direction:ltr;letter-spacing:1px;margin:10px 0}.contact-status{display:inline-flex;padding:4px 8px;border-radius:999px;background:var(--sage);font-size:9px;font-weight:900}@media(max-width:520px){.werd-contact-grid{grid-template-columns:1fr}.werd-contact-field.full{grid-column:auto}.contact-admin-actions{grid-template-columns:1fr 1fr}.contact-admin-actions .wide{grid-column:1/-1}}
    `;document.head.appendChild(s)
  }

  function injectContact(){
    const home=$('home');if(!home||$('werdContactBox'))return;
    const box=document.createElement('div');box.id='werdContactBox';box.className='werd-contact';box.innerHTML=`
      <div class="werd-contact-head"><div class="werd-contact-icon">✉️</div><div><b>تواصل معنا</b><small>يسعدنا استقبال استفسارك أو اقتراحك لتحسين «ورد»</small></div></div>
      <form id="werdContactForm" novalidate>
        <div class="werd-contact-grid">
          <div class="werd-contact-field"><label for="werdContactName">الاسم <span class="muted">(اختياري)</span></label><input id="werdContactName" maxlength="120" autocomplete="name" placeholder="اسمك"></div>
          <div class="werd-contact-field"><label for="werdContactWay">وسيلة التواصل <span class="muted">(اختياري)</span></label><input id="werdContactWay" maxlength="180" inputmode="email" placeholder="بريد أو رقم للتواصل"></div>
          <div class="werd-contact-field full"><label for="werdContactCategory">نوع الرسالة</label><select id="werdContactCategory"><option value="question">استفسار</option><option value="suggestion">اقتراح</option><option value="issue">مشكلة</option><option value="feedback">ملاحظة</option><option value="other">أخرى</option></select></div>
          <div class="werd-contact-field full"><label for="werdContactMessage">الرسالة</label><textarea id="werdContactMessage" minlength="2" maxlength="3000" required placeholder="اكتب رسالتك هنا…"></textarea></div>
          <input class="werd-hp" id="werdContactWebsite" tabindex="-1" autocomplete="off" aria-hidden="true">
        </div>
        <button class="primary werd-contact-submit" id="werdContactSend" type="submit">إرسال الرسالة</button>
        <div class="werd-contact-note">🔒 تُستخدم البيانات المرسلة فقط لمراجعة رسالتك والتواصل معك عند الحاجة.</div>
      </form>`;
    home.appendChild(box);
    $('werdContactForm').addEventListener('submit',sendMessage)
  }

  function injectAdminPage(){
    const main=document.querySelector('main');if(!main||$('werdContactAdmin'))return;
    const sec=document.createElement('section');sec.className='page';sec.id='werdContactAdmin';sec.innerHTML=`
      <div class="section-title"><h3>إدارة التواصل</h3><button class="smallbtn" id="contactAdminBack" type="button">المزيد</button></div>
      <div class="card" id="contactAdminGate"><div class="contact-admin-lock"><div style="font-size:36px">🔐</div><b>صندوق رسائل «ورد»</b><div class="muted" id="contactAdminGateText" style="margin-top:7px">جاري التحقق من صلاحية الإدارة…</div><div id="contactAdminClaim" style="display:none"><input id="contactAdminCode" placeholder="رمز تفعيل الإدارة"><button class="primary" id="contactAdminClaimBtn" style="width:100%">تفعيل لوحة الإدارة</button></div></div></div>
      <div id="contactAdminContent" style="display:none">
        <div class="card"><div class="row"><div><b>صندوق الرسائل</b><div class="muted" id="contactAdminCount">—</div></div><button class="smallbtn" id="contactAdminRefresh">تحديث</button></div></div></div>
        <div class="contact-admin-toolbar" id="contactAdminFilters" style="margin-top:10px"><button class="chip active" data-cfilter="all">الكل</button><button class="chip" data-cfilter="new">الجديدة</button><button class="chip" data-cfilter="read">المقروءة</button><button class="chip" data-cfilter="replied">تم الرد</button><button class="chip" data-cfilter="closed">المغلقة</button></div>
        <div id="contactAdminList"><div class="card contact-admin-empty">جاري تحميل الرسائل…</div></div>
      </div>`;main.appendChild(sec);
    $('contactAdminBack').onclick=()=>go('more');$('contactAdminRefresh').onclick=loadMessages;$('contactAdminClaimBtn').onclick=claimAdmin;
    document.querySelectorAll('[data-cfilter]').forEach(b=>b.onclick=()=>{activeFilter=b.dataset.cfilter;document.querySelectorAll('[data-cfilter]').forEach(x=>x.classList.toggle('active',x===b));renderMessages()})
  }

  function injectAdminTile(){
    const grid=document.querySelector('#more .more-grid');if(!grid||$('contactAdminTile'))return;
    const b=document.createElement('button');b.className='more-tile';b.id='contactAdminTile';b.type='button';b.innerHTML='<span class="mi">✉️</span><b>إدارة التواصل <span id="contactUnreadBadge" class="contact-admin-badge" style="display:none">0</span></b><small>صندوق الرسائل الواردة</small>';b.onclick=()=>openAdmin();grid.appendChild(b)
  }

  async function sendMessage(e){
    e.preventDefault();if($('werdContactWebsite')?.value)return;
    const message=$('werdContactMessage').value.trim(),name=$('werdContactName').value.trim(),contact=$('werdContactWay').value.trim(),category=$('werdContactCategory').value;
    if(message.length<2)return notify('اكتب رسالتك أولًا');
    const btn=$('werdContactSend');btn.disabled=true;btn.textContent='جاري الإرسال…';
    try{
      let userId=null;try{userId=(await sb.auth.getSession())?.data?.session?.user?.id||null}catch(_){}
      const clientKey=await contactClientKey();
      const {error}=await sb.from('werd_contact_messages').insert({user_id:userId,sender_name:name,sender_contact:contact,category,message,status:'new',admin_note:'',client_key:clientKey});
      if(error)throw error;$('werdContactForm').reset();notify('تم إرسال رسالتك بنجاح ✓')
    }catch(err){console.error('Werd contact send',err);const m=String(err?.message||'').toLowerCase();notify(m.includes('rate')||m.includes('too many')||m.includes('429')?'تم إرسال عدة رسائل مؤخرًا • حاول بعد قليل':'تعذر إرسال الرسالة الآن • حاول مرة أخرى')}
    finally{btn.disabled=false;btn.textContent='إرسال الرسالة'}
  }

  async function checkAdmin(){
    adminChecked=true;isAdmin=false;
    try{
      const ses=(await sb.auth.getSession())?.data?.session;if(!ses){updateGate(false,false);return false}
      const {data,error}=await sb.rpc('is_werd_admin');if(error)throw error;isAdmin=!!data;updateGate(true,isAdmin);if(isAdmin)await loadMessages();return isAdmin
    }catch(e){console.warn('Werd admin check',e);updateGate(false,false,true);return false}
  }
  function updateGate(signedIn,admin,failed=false){
    const gate=$('contactAdminGate'),content=$('contactAdminContent'),txt=$('contactAdminGateText'),claim=$('contactAdminClaim');if(!gate)return;
    if(admin){gate.style.display='none';content.style.display='block';claim.style.display='none';return}
    gate.style.display='block';content.style.display='none';
    if(failed){txt.textContent='تعذر التحقق من الصلاحية الآن.';claim.style.display='none'}
    else if(!signedIn){txt.innerHTML='سجّل الدخول إلى حساب «ورد» أولًا من الصفحة الرئيسية، ثم عد لتفعيل الإدارة.';claim.style.display='none'}
    else{txt.textContent='الحساب مسجّل. أدخل رمز تفعيل الإدارة لأول مرة فقط.';claim.style.display='block'}
  }
  async function claimAdmin(){
    const code=$('contactAdminCode').value.trim();if(!code)return notify('أدخل رمز تفعيل الإدارة');const b=$('contactAdminClaimBtn');b.disabled=true;b.textContent='جاري التفعيل…';
    try{const {data,error}=await sb.rpc('claim_werd_admin',{p_code:code});if(error)throw error;if(!data)return notify('رمز التفعيل غير صحيح أو تم تفعيل إدارة أخرى');notify('تم تفعيل إدارة التواصل ✓');$('contactAdminCode').value='';await checkAdmin()}
    catch(e){console.error('Werd claim admin',e);notify('تعذر تفعيل الإدارة الآن')}
    finally{b.disabled=false;b.textContent='تفعيل لوحة الإدارة'}
  }

  async function openAdmin(){go('werdContactAdmin');await checkAdmin()}
  window.openWerdContactAdmin=openAdmin;

  async function loadMessages(){
    if(!isAdmin)return;const list=$('contactAdminList');if(list)list.innerHTML='<div class="card contact-admin-empty">جاري تحميل الرسائل…</div>';
    try{
      const {data,error}=await sb.from('werd_contact_messages').select('id,sender_name,sender_contact,category,message,status,admin_note,created_at,read_at,closed_at').order('created_at',{ascending:false}).limit(200);if(error)throw error;currentMessages=data||[];renderMessages();updateBadge()
    }catch(e){console.error('Werd inbox',e);if(list)list.innerHTML='<div class="card contact-admin-empty">تعذر تحميل صندوق الرسائل الآن.</div>'}
  }
  function renderMessages(){
    const list=$('contactAdminList');if(!list)return;const rows=activeFilter==='all'?currentMessages:currentMessages.filter(x=>x.status===activeFilter);const unread=currentMessages.filter(x=>x.status==='new').length;if($('contactAdminCount'))$('contactAdminCount').textContent=`${currentMessages.length} رسالة • ${unread} جديدة`;
    if(!rows.length){list.innerHTML='<div class="card contact-admin-empty">لا توجد رسائل في هذا التصنيف.</div>';return}
    list.innerHTML=rows.map(x=>`<div class="contact-admin-card ${x.status==='new'?'new':''}" data-msg="${x.id}"><div class="contact-admin-meta"><div><b>${esc(x.sender_name||'زائر ورد')}</b><div><span class="contact-status">${STATUS[x.status]||x.status}</span> <span class="muted">${CATS[x.category]||'أخرى'}</span></div></div><small>${esc(fmtDate(x.created_at))}</small></div><div class="contact-admin-message">${esc(x.message)}</div>${x.sender_contact?`<div class="contact-admin-contact">وسيلة التواصل: <b>${esc(x.sender_contact)}</b></div>`:''}<textarea class="contact-admin-note" data-note="${x.id}" placeholder="ملاحظة إدارية…">${esc(x.admin_note||'')}</textarea><div class="contact-admin-actions"><button class="smallbtn" data-action="read" data-id="${x.id}">✓ مقروءة</button><button class="smallbtn" data-action="replied" data-id="${x.id}">↩ تم الرد</button><button class="smallbtn" data-action="closed" data-id="${x.id}">إغلاق</button><button class="secondary wide" data-action="save-note" data-id="${x.id}" style="margin:0">حفظ الملاحظة</button></div></div>`).join('');
    list.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>handleAction(b.dataset.id,b.dataset.action))
  }
  async function handleAction(id,action){
    if(!isAdmin)return;const item=currentMessages.find(x=>x.id===id);if(!item)return;
    try{
      if(action==='save-note'){
        const note=document.querySelector(`[data-note="${CSS.escape(id)}"]`)?.value||'';const {error}=await sb.from('werd_contact_messages').update({admin_note:note,updated_at:new Date().toISOString()}).eq('id',id);if(error)throw error;item.admin_note=note;notify('تم حفظ الملاحظة ✓');return
      }
      const patch={status:action,updated_at:new Date().toISOString()};if(action==='read'&&!item.read_at)patch.read_at=new Date().toISOString();if(action==='replied'&&!item.read_at)patch.read_at=new Date().toISOString();if(action==='closed')patch.closed_at=new Date().toISOString();const {error}=await sb.from('werd_contact_messages').update(patch).eq('id',id);if(error)throw error;Object.assign(item,patch);renderMessages();updateBadge();notify('تم تحديث حالة الرسالة ✓')
    }catch(e){console.error('Werd message update',e);notify('تعذر تحديث الرسالة الآن')}
  }
  function updateBadge(){const badge=$('contactUnreadBadge');if(!badge)return;const n=currentMessages.filter(x=>x.status==='new').length;badge.textContent=String(n);badge.style.display=isAdmin&&n?'inline-grid':'none'}

  function install(){
    if(typeof sb==='undefined'||typeof go!=='function')return setTimeout(install,180);css();injectContact();injectAdminPage();injectAdminTile();checkAdmin();
    try{sb.auth.onAuthStateChange(()=>setTimeout(checkAdmin,120))}catch(_){}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  window.addEventListener('pageshow',()=>setTimeout(()=>{injectContact();injectAdminPage();injectAdminTile();if(adminChecked)checkAdmin()},120));
})();