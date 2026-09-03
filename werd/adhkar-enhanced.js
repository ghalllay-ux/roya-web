// Werd Adhkar experience — smart countdown + progress v113
(function(){
  const $=id=>document.getElementById(id);
  let timer=null, observer=null, updating=false;

  function injectStyle(){
    if($('werdAdhkarEnhancedStyle'))return;
    const s=document.createElement('style');s.id='werdAdhkarEnhancedStyle';s.textContent=`
      #adhkar .werd-adhkar-dashboard{margin:0 0 14px;display:grid;gap:10px}
      #adhkar .werd-adhkar-next{position:relative;overflow:hidden;border:1px solid color-mix(in srgb,var(--green) 18%,var(--line));border-radius:24px;padding:17px;background:linear-gradient(135deg,color-mix(in srgb,var(--sage) 52%,var(--card)),var(--card));box-shadow:0 9px 28px rgba(15,91,69,.07)}
      #adhkar .werd-adhkar-next:after{content:'◌';position:absolute;left:14px;top:-20px;font-size:108px;line-height:1;color:color-mix(in srgb,var(--green) 8%,transparent);pointer-events:none}
      #adhkar .werd-adhkar-kicker{font-size:12px;color:var(--muted);margin-bottom:5px}.werd-adhkar-nextrow{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;position:relative;z-index:1}
      #adhkar .werd-adhkar-next h4{margin:0;font-size:22px;color:var(--green)}#adhkar .werd-adhkar-countdown{font-variant-numeric:tabular-nums;font-weight:900;font-size:25px;direction:ltr;letter-spacing:.5px;color:var(--ink)}
      #adhkar .werd-adhkar-nextmeta{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;position:relative;z-index:1}.werd-adhkar-pill{border:1px solid var(--line);border-radius:999px;padding:6px 9px;background:color-mix(in srgb,var(--card) 88%,transparent);font-size:11px;color:var(--muted)}
      #adhkar .werd-adhkar-progressbox{border:1px solid var(--line);border-radius:21px;padding:13px 14px;background:var(--card)}#adhkar .werd-adhkar-progresshead{display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:12px;color:var(--muted)}#adhkar .werd-adhkar-progresshead b{color:var(--ink);font-size:14px}
      #adhkar .werd-adhkar-bar{height:8px;background:color-mix(in srgb,var(--sage) 65%,var(--card));border-radius:999px;overflow:hidden;margin-top:10px}#adhkar .werd-adhkar-bar span{display:block;height:100%;width:0;background:var(--green);border-radius:inherit;transition:width .35s ease}
      #adhkar .werd-adhkar-actions{display:grid;grid-template-columns:1fr auto;gap:9px;margin-top:11px}#adhkar .werd-adhkar-resume{border:0;border-radius:15px;background:var(--green);color:#fff;padding:11px 14px;font-weight:900;font-size:13px}#adhkar .werd-adhkar-schedule{border:1px solid var(--line);border-radius:15px;background:var(--card);color:var(--ink);padding:11px 12px;font-weight:800;font-size:12px}
      #adhkar .chips{display:grid!important;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:14px}#adhkar .chip[data-type]{min-height:62px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;border-radius:19px!important}#adhkar .werd-chip-sub{display:block;font-size:10px;font-weight:700;opacity:.72;direction:ltr;font-variant-numeric:tabular-nums}
      #adhkar #adhkarList>.card{border-radius:23px;transition:.2s ease}#adhkar #adhkarList>.card.werd-first-pending{outline:2px solid color-mix(in srgb,var(--green) 35%,transparent);outline-offset:2px}
      #adhkar .werd-dhikr-index{display:inline-flex;align-items:center;gap:5px;font-size:10px;color:var(--muted);margin-bottom:5px}
      @media(max-width:380px){#adhkar .werd-adhkar-nextrow{align-items:flex-start;flex-direction:column}#adhkar .werd-adhkar-countdown{font-size:22px}#adhkar .werd-adhkar-actions{grid-template-columns:1fr}}
      @media(prefers-reduced-motion:reduce){#adhkar .werd-adhkar-bar span{transition:none}}
    `;document.head.appendChild(s);
  }

  function timeFor(type){
    try{
      const configured=state?.notifications?.[type]?.time;
      if(/^\d{1,2}:\d{2}$/.test(configured||''))return configured;
    }catch(_){}
    return type==='morning'?'06:30':'18:00';
  }
  function targetFor(type,now=new Date()){
    const [h,m]=timeFor(type).split(':').map(Number),t=new Date(now);t.setHours(h,m,0,0);if(t<=now)t.setDate(t.getDate()+1);return t;
  }
  function pad(n){return String(n).padStart(2,'0')}
  function countdown(target,now=new Date()){
    const sec=Math.max(0,Math.floor((target-now)/1000)),h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }
  function formatClock(v){
    const [h,m]=String(v).split(':').map(Number),d=new Date();d.setHours(h,m||0,0,0);
    try{return new Intl.DateTimeFormat('ar-SA',{hour:'numeric',minute:'2-digit'}).format(d)}catch(_){return v}
  }
  function itemList(type){
    try{
      const morning=type==='morning';return (Array.isArray(adhkar)?adhkar:[]).filter(x=>{const t=Number(x.type);return t===0||(morning?t===1:t===2)}).slice(0,24);
    }catch(_){return []}
  }
  function progress(type){
    const items=itemList(type);let done=0;
    try{items.forEach((x,i)=>{const key=`${type}:${x.order??i}`;if(state?.adhkarDone?.[key])done++})}catch(_){}
    if(!items.length&&type===currentType()){
      const cards=[...document.querySelectorAll('#adhkarList>.card')];return{done:cards.filter(c=>/تم الذكر|مكتمل/.test(c.textContent||'')).length,total:cards.length};
    }
    return{done,total:items.length};
  }
  function currentType(){
    try{return currentAdhkarType==='evening'?'evening':'morning'}catch(_){return document.querySelector('#adhkar .chip.active')?.dataset.type==='evening'?'evening':'morning'}
  }
  function nextWird(now=new Date()){
    const a={type:'morning',target:targetFor('morning',now)},b={type:'evening',target:targetFor('evening',now)};return a.target<=b.target?a:b;
  }
  function label(type){return type==='morning'?'ورد الصباح':'ورد المساء'}

  function ensureDashboard(){
    const page=$('adhkar');if(!page)return null;injectStyle();let dash=$('werdAdhkarDashboard');if(dash)return dash;
    const chips=page.querySelector('.chips');if(!chips)return null;
    dash=document.createElement('div');dash.id='werdAdhkarDashboard';dash.className='werd-adhkar-dashboard';dash.innerHTML=`
      <div class="werd-adhkar-next">
        <div class="werd-adhkar-kicker">الورد القادم</div>
        <div class="werd-adhkar-nextrow"><h4 id="werdAdhkarNextName">ورد الصباح</h4><div class="werd-adhkar-countdown" id="werdAdhkarCountdown">00:00:00</div></div>
        <div class="werd-adhkar-nextmeta"><span class="werd-adhkar-pill" id="werdAdhkarNextAt">الموعد —</span><span class="werd-adhkar-pill">يتحدث تلقائيًا حسب وقت جهازك</span></div>
      </div>
      <div class="werd-adhkar-progressbox">
        <div class="werd-adhkar-progresshead"><b id="werdAdhkarProgressTitle">إنجاز ورد الصباح</b><span id="werdAdhkarProgressText">0 / 0</span></div>
        <div class="werd-adhkar-bar"><span id="werdAdhkarProgressBar"></span></div>
        <div class="werd-adhkar-actions"><button type="button" class="werd-adhkar-resume" id="werdAdhkarResume">ابدأ الورد</button><button type="button" class="werd-adhkar-schedule" id="werdAdhkarSchedule">موعده ٦:٣٠ ص</button></div>
      </div>`;
    chips.parentNode.insertBefore(dash,chips);
    $('werdAdhkarResume').addEventListener('click',resumeCurrent);
    $('werdAdhkarSchedule').addEventListener('click',()=>{try{if(typeof go==='function'){go('home');setTimeout(()=>$('werdNotificationsCard')?.scrollIntoView({behavior:'smooth',block:'center'}),180)}}catch(_){}});
    for(const type of ['morning','evening']){
      const chip=page.querySelector(`.chip[data-type="${type}"]`);if(chip&&!chip.querySelector('.werd-chip-sub')){const sp=document.createElement('span');sp.className='werd-chip-sub';sp.dataset.werdType=type;chip.appendChild(sp)}
    }
    return dash;
  }
  function resumeCurrent(){
    const cards=[...document.querySelectorAll('#adhkarList>.card')];
    cards.forEach(c=>c.classList.remove('werd-first-pending'));
    const pending=cards.find(c=>!/تم الذكر ✓/.test(c.textContent||'')&&!/مكتمل/.test(c.querySelector('button')?.textContent||''));
    const target=pending||cards[0];if(!target)return;
    target.classList.add('werd-first-pending');target.scrollIntoView({behavior:'smooth',block:'center'});
    setTimeout(()=>target.classList.remove('werd-first-pending'),1800);
  }
  function decorateCards(){
    const cards=[...document.querySelectorAll('#adhkarList>.card')];cards.forEach((card,i)=>{
      if(card.querySelector('.werd-dhikr-index'))return;const row=card.querySelector('.row');if(!row)return;const info=document.createElement('div');info.className='werd-dhikr-index';info.textContent=`${i+1} من ${cards.length}`;row.parentNode.insertBefore(info,row);
    });
  }
  function update(){
    if(updating)return;updating=true;
    try{
      if(!ensureDashboard())return;
      const now=new Date(),next=nextWird(now),type=currentType(),p=progress(type),pct=p.total?Math.round(p.done/p.total*100):0;
      $('werdAdhkarNextName').textContent=label(next.type);$('werdAdhkarCountdown').textContent=countdown(next.target,now);$('werdAdhkarNextAt').textContent=`الموعد ${formatClock(timeFor(next.type))}`;
      $('werdAdhkarProgressTitle').textContent=`إنجاز ${label(type)}`;$('werdAdhkarProgressText').textContent=`${p.done} / ${p.total} • ${pct}٪`;$('werdAdhkarProgressBar').style.width=pct+'%';
      const resume=$('werdAdhkarResume');if(resume)resume.textContent=p.total&&p.done>=p.total?'تم الورد ✓':(p.done?'أكمل الورد':'ابدأ الورد');
      $('werdAdhkarSchedule').textContent=`موعده ${formatClock(timeFor(type))}`;
      for(const t of ['morning','evening']){const sp=document.querySelector(`#adhkar .werd-chip-sub[data-werd-type="${t}"]`),pp=progress(t);if(sp)sp.textContent=`${formatClock(timeFor(t))} • ${pp.done}/${pp.total}`}
      decorateCards();
    }finally{updating=false}
  }
  function install(){
    const page=$('adhkar');if(!page)return setTimeout(install,250);ensureDashboard();update();
    page.querySelectorAll('.chip[data-type]').forEach(ch=>ch.addEventListener('click',()=>setTimeout(update,30)));
    const list=$('adhkarList');if(list&&!observer){observer=new MutationObserver(()=>setTimeout(update,0));observer.observe(list,{childList:true,subtree:true})}
    timer=setInterval(update,1000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)update()});window.addEventListener('pageshow',update);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
