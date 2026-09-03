// Werd Adhkar experience — guided sequential session + repeat counter + countdown v115
(function(){
  const $=id=>document.getElementById(id);
  let timer=null,observer=null,updating=false,decorating=false,autoAdvance=false;

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
      #adhkar .werd-session-head{display:grid;grid-template-columns:54px 1fr 54px;align-items:center;gap:9px;margin:0 0 11px}
      #adhkar .werd-session-nav{width:54px;height:48px;border:1px solid var(--line);border-radius:16px;background:var(--card);color:var(--green);font-size:22px;font-weight:900;display:grid;place-items:center;touch-action:manipulation}
      #adhkar .werd-session-nav:disabled{opacity:.32}.werd-session-position{text-align:center;min-width:0}.werd-session-position b{display:block;font-size:14px;color:var(--ink)}.werd-session-position span{display:block;font-size:10px;color:var(--muted);margin-top:3px}
      #adhkar .werd-session-line{height:5px;border-radius:999px;background:color-mix(in srgb,var(--sage) 65%,var(--card));overflow:hidden;margin-top:7px}#adhkar .werd-session-line span{display:block;height:100%;background:var(--green);border-radius:inherit;transition:width .25s ease}
      #adhkar #adhkarList>.card{border-radius:25px;transition:opacity .18s ease,transform .18s ease;padding-top:18px}#adhkar #adhkarList>.card[hidden]{display:none!important}#adhkar #adhkarList>.card.werd-session-current{animation:werdDhikrIn .22s ease both}
      @keyframes werdDhikrIn{from{opacity:.35;transform:translateY(7px)}to{opacity:1;transform:none}}
      #adhkar .werd-dhikr-index{display:inline-flex;align-items:center;gap:5px;font-size:11px;color:var(--muted);margin-bottom:7px}
      #adhkar .werd-repeat-btn{display:flex;align-items:center;gap:10px;border:1px solid color-mix(in srgb,var(--green) 22%,var(--line));background:color-mix(in srgb,var(--sage) 44%,var(--card));color:var(--ink);border-radius:19px;padding:7px 9px 7px 13px;min-height:58px;min-width:132px;cursor:pointer;transition:.18s ease;touch-action:manipulation}
      #adhkar .werd-repeat-btn:active{transform:scale(.97)}#adhkar .werd-repeat-btn.is-done{background:color-mix(in srgb,var(--green) 12%,var(--card));border-color:color-mix(in srgb,var(--green) 34%,var(--line))}
      #adhkar .werd-repeat-num{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:var(--green);color:#fff;font-size:22px;font-weight:950;font-variant-numeric:tabular-nums;flex:0 0 auto;box-shadow:0 5px 14px rgba(15,91,69,.16)}
      #adhkar .werd-repeat-copy{display:flex;flex-direction:column;align-items:flex-start;line-height:1.3;text-align:right}#adhkar .werd-repeat-copy b{font-size:13px}#adhkar .werd-repeat-copy small{font-size:10px;color:var(--muted);margin-top:2px;white-space:nowrap}
      #adhkar .werd-repeat-btn.is-done .werd-repeat-num{font-size:19px}#adhkar .werd-session-complete{text-align:center;padding:28px 20px;border:1px solid var(--line);border-radius:25px;background:linear-gradient(145deg,color-mix(in srgb,var(--sage) 45%,var(--card)),var(--card));margin-top:8px}#adhkar .werd-session-complete .icon{font-size:42px}#adhkar .werd-session-complete h4{font-size:21px;color:var(--green);margin:8px 0 5px}#adhkar .werd-session-complete p{color:var(--muted);font-size:12px;margin:0 0 14px}
      #adhkar .werd-session-complete button{border:0;border-radius:15px;background:var(--green);color:#fff;padding:11px 17px;font-weight:900}
      @media(max-width:380px){#adhkar .werd-adhkar-nextrow{align-items:flex-start;flex-direction:column}#adhkar .werd-adhkar-countdown{font-size:22px}#adhkar .werd-adhkar-actions{grid-template-columns:1fr}#adhkar .werd-repeat-btn{min-width:118px}.werd-session-position b{font-size:13px}}
      @media(prefers-reduced-motion:reduce){#adhkar .werd-adhkar-bar span,#adhkar .werd-session-line span,#adhkar .werd-repeat-btn{transition:none}#adhkar #adhkarList>.card.werd-session-current{animation:none}}
    `;document.head.appendChild(s);
  }

  function timeFor(type){try{const v=state?.notifications?.[type]?.time;if(/^\d{1,2}:\d{2}$/.test(v||''))return v}catch(_){}return type==='morning'?'06:30':'18:00'}
  function targetFor(type,now=new Date()){const [h,m]=timeFor(type).split(':').map(Number),t=new Date(now);t.setHours(h,m,0,0);if(t<=now)t.setDate(t.getDate()+1);return t}
  function pad(n){return String(n).padStart(2,'0')}
  function countdown(target,now=new Date()){const sec=Math.max(0,Math.floor((target-now)/1000)),h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;return `${pad(h)}:${pad(m)}:${pad(s)}`}
  function formatClock(v){const [h,m]=String(v).split(':').map(Number),d=new Date();d.setHours(h,m||0,0,0);try{return new Intl.DateTimeFormat('ar-SA',{hour:'numeric',minute:'2-digit'}).format(d)}catch(_){return v}}
  function currentType(){try{return currentAdhkarType==='evening'?'evening':'morning'}catch(_){return document.querySelector('#adhkar .chip.active')?.dataset.type==='evening'?'evening':'morning'}}
  function itemList(type){try{const morning=type==='morning';return (Array.isArray(adhkar)?adhkar:[]).filter(x=>{const t=Number(x.type);return t===0||(morning?t===1:t===2)}).slice(0,24)}catch(_){return []}}
  function label(type){return type==='morning'?'ورد الصباح':'ورد المساء'}
  function today(){try{return typeof todayKey==='function'?todayKey():new Date().toISOString().slice(0,10)}catch(_){return new Date().toISOString().slice(0,10)}}

  function ensureSessionState(){
    const d=today();
    try{
      if(!state.adhkarDone||typeof state.adhkarDone!=='object')state.adhkarDone={};
      if(!state.adhkarRepeatRemaining||typeof state.adhkarRepeatRemaining!=='object')state.adhkarRepeatRemaining={};
      if(!state.adhkarSessionIndex||typeof state.adhkarSessionIndex!=='object')state.adhkarSessionIndex={morning:0,evening:0};
      if(state.adhkarRepeatDate!==d){state.adhkarRepeatRemaining={};state.adhkarRepeatDate=d;state.adhkarSessionIndex={morning:0,evening:0};state.adhkarSessionDate=d}
      if(state.adhkarSessionDate!==d){state.adhkarSessionIndex={morning:0,evening:0};state.adhkarSessionDate=d}
    }catch(_){}
  }
  function keyFor(type,x,i){return `${type}:${x?.order??i}`}
  function targetCount(x){return Math.max(1,Number(x?.count)||1)}
  function remainingFor(key,target){ensureSessionState();try{if(state.adhkarDone[key])return 0;const n=Number(state.adhkarRepeatRemaining[key]);if(Number.isFinite(n)&&n>=0)return Math.min(target,n)}catch(_){}return target}
  function progress(type){const items=itemList(type);let done=0;items.forEach((x,i)=>{try{if(state.adhkarDone[keyFor(type,x,i)])done++}catch(_){}});return{done,total:items.length}}
  function firstPendingIndex(type){const items=itemList(type);for(let i=0;i<items.length;i++){try{if(!state.adhkarDone[keyFor(type,items[i],i)])return i}catch(_){return i}}return Math.max(0,items.length-1)}
  function sessionIndex(type){ensureSessionState();const max=Math.max(0,itemList(type).length-1);let n=Number(state.adhkarSessionIndex?.[type]);if(!Number.isFinite(n))n=firstPendingIndex(type);return Math.max(0,Math.min(max,n))}
  function setSessionIndex(type,index,shouldSave=true){ensureSessionState();const max=Math.max(0,itemList(type).length-1);state.adhkarSessionIndex[type]=Math.max(0,Math.min(max,Number(index)||0));if(shouldSave){try{if(typeof save==='function')save()}catch(_){}}}
  function nextWird(now=new Date()){const a={type:'morning',target:targetFor('morning',now)},b={type:'evening',target:targetFor('evening',now)};return a.target<=b.target?a:b}

  function ensureDashboard(){
    const page=$('adhkar');if(!page)return null;injectStyle();let dash=$('werdAdhkarDashboard');const chips=page.querySelector('.chips');if(!chips)return null;
    if(!dash){
      dash=document.createElement('div');dash.id='werdAdhkarDashboard';dash.className='werd-adhkar-dashboard';dash.innerHTML=`
        <div class="werd-adhkar-next"><div class="werd-adhkar-kicker">الورد القادم</div><div class="werd-adhkar-nextrow"><h4 id="werdAdhkarNextName">ورد الصباح</h4><div class="werd-adhkar-countdown" id="werdAdhkarCountdown">00:00:00</div></div><div class="werd-adhkar-nextmeta"><span class="werd-adhkar-pill" id="werdAdhkarNextAt">الموعد —</span><span class="werd-adhkar-pill">حسب وقت جهازك</span></div></div>
        <div class="werd-adhkar-progressbox"><div class="werd-adhkar-progresshead"><b id="werdAdhkarProgressTitle">إنجاز ورد الصباح</b><span id="werdAdhkarProgressText">0 / 0</span></div><div class="werd-adhkar-bar"><span id="werdAdhkarProgressBar"></span></div><div class="werd-adhkar-actions"><button type="button" class="werd-adhkar-resume" id="werdAdhkarResume">ابدأ الورد</button><button type="button" class="werd-adhkar-schedule" id="werdAdhkarSchedule">موعده ٦:٣٠ ص</button></div></div>`;
      chips.parentNode.insertBefore(dash,chips);
      $('werdAdhkarResume').addEventListener('click',()=>{const type=currentType();setSessionIndex(type,firstPendingIndex(type));showCurrentCard(true)});
      $('werdAdhkarSchedule').addEventListener('click',()=>{try{if(typeof go==='function'){go('home');setTimeout(()=>$('werdNotificationsCard')?.scrollIntoView({behavior:'smooth',block:'center'}),180)}}catch(_){}});
    }
    for(const type of ['morning','evening']){const chip=page.querySelector(`.chip[data-type="${type}"]`);if(chip&&!chip.querySelector('.werd-chip-sub')){const sp=document.createElement('span');sp.className='werd-chip-sub';sp.dataset.werdType=type;chip.appendChild(sp)}}
    ensureSessionNav();return dash;
  }

  function ensureSessionNav(){
    const list=$('adhkarList');if(!list)return null;let nav=$('werdAdhkarSessionNav');if(nav)return nav;
    nav=document.createElement('div');nav.id='werdAdhkarSessionNav';nav.className='werd-session-head';nav.innerHTML=`
      <button type="button" class="werd-session-nav" id="werdDhikrPrev" aria-label="الذكر السابق">‹</button>
      <div class="werd-session-position"><b id="werdDhikrPosition">1 من 1</b><span id="werdDhikrState">جلسة ورد مركزة</span><div class="werd-session-line"><span id="werdDhikrSessionLine"></span></div></div>
      <button type="button" class="werd-session-nav" id="werdDhikrNext" aria-label="الذكر التالي">›</button>`;
    list.parentNode.insertBefore(nav,list);
    $('werdDhikrPrev').addEventListener('click',()=>moveSession(-1));$('werdDhikrNext').addEventListener('click',()=>moveSession(1));return nav;
  }

  function moveSession(delta){
    const type=currentType(),items=itemList(type),idx=sessionIndex(type),next=Math.max(0,Math.min(items.length-1,idx+delta));if(next===idx)return;
    setSessionIndex(type,next);showCurrentCard(true);
  }
  function showCurrentCard(scroll=false){
    const type=currentType(),cards=[...document.querySelectorAll('#adhkarList>.card')],items=itemList(type);if(!cards.length)return;
    const idx=sessionIndex(type);cards.forEach((card,i)=>{card.hidden=i!==idx;card.classList.toggle('werd-session-current',i===idx)});
    const prev=$('werdDhikrPrev'),next=$('werdDhikrNext');if(prev)prev.disabled=idx<=0;if(next)next.disabled=idx>=cards.length-1;
    if($('werdDhikrPosition'))$('werdDhikrPosition').textContent=`${idx+1} من ${cards.length}`;
    const item=items[idx],key=keyFor(type,item,idx),done=!!state?.adhkarDone?.[key];if($('werdDhikrState'))$('werdDhikrState').textContent=done?'مكتمل ✓ • يمكنك الرجوع أو المتابعة':'أكمل الذكر ثم تنتقل تلقائيًا للتالي';
    if($('werdDhikrSessionLine'))$('werdDhikrSessionLine').style.width=(cards.length?((idx+1)/cards.length*100):0)+'%';
    if(scroll){const nav=$('werdAdhkarSessionNav');(nav||cards[idx])?.scrollIntoView({behavior:'smooth',block:'start'})}
  }

  function handleRepeat(key,target,index){
    ensureSessionState();let remaining=remainingFor(key,target);if(remaining<=0)return;remaining=Math.max(0,remaining-1);state.adhkarRepeatRemaining[key]=remaining;
    if(remaining===0)state.adhkarDone[key]=true;else delete state.adhkarDone[key];
    try{if(typeof save==='function')save()}catch(_){}
    if(navigator.vibrate)navigator.vibrate(remaining===0?[22,35,22]:18);
    try{if(typeof toast==='function')toast(remaining===0?'تم إكمال الذكر ✓':`باقي ${remaining} ${remaining===1?'مرة':'مرات'}`)}catch(_){}
    if(remaining===0){
      const type=currentType(),items=itemList(type);if(index<items.length-1){state.adhkarSessionIndex[type]=index+1;autoAdvance=true}else autoAdvance=false;
    }
    try{if(typeof renderAdhkar==='function')renderAdhkar()}catch(_){}
    setTimeout(()=>{decorateCards();update();showCurrentCard(remaining===0&&index<itemList(currentType()).length-1);autoAdvance=false},35);
  }

  function decorateCards(){
    if(decorating)return;decorating=true;
    try{
      ensureSessionState();ensureSessionNav();const type=currentType(),items=itemList(type),cards=[...document.querySelectorAll('#adhkarList>.card')];
      cards.forEach((card,i)=>{
        const x=items[i];if(!x)return;const key=keyFor(type,x,i),target=targetCount(x),remaining=remainingFor(key,target),done=remaining===0||!!state.adhkarDone[key];
        let info=card.querySelector('.werd-dhikr-index');if(!info){const row=card.querySelector('.row');if(row){info=document.createElement('div');info.className='werd-dhikr-index';row.parentNode.insertBefore(info,row)}}if(info)info.textContent=`الذكر ${i+1} من ${cards.length}`;
        const rows=card.querySelectorAll('.row'),bottom=rows[rows.length-1];if(!bottom)return;
        [...bottom.querySelectorAll('button')].filter(b=>!b.classList.contains('werd-repeat-btn')).forEach(b=>b.remove());
        let btn=bottom.querySelector('.werd-repeat-btn');if(!btn){btn=document.createElement('button');btn.type='button';btn.className='werd-repeat-btn';bottom.appendChild(btn)}
        btn.classList.toggle('is-done',done);btn.disabled=done;const html=`<span class="werd-repeat-num">${done?'✓':remaining}</span><span class="werd-repeat-copy"><b>${done?'مكتمل':'باقي '+remaining}</b><small>${done?'أتممت الذكر':'اضغط بعد كل قراءة'}</small></span>`;if(btn.innerHTML!==html)btn.innerHTML=html;btn.onclick=done?null:()=>handleRepeat(key,target,i);
        const badge=card.querySelector('.badge'),text=target===1?'مرة واحدة':`المطلوب ${target} مرات`;if(badge)badge.textContent=text;
      });
      showCurrentCard(false);
    }finally{decorating=false}
  }

  function update(){
    if(updating)return;updating=true;
    try{
      if(!ensureDashboard())return;ensureSessionState();decorateCards();const now=new Date(),next=nextWird(now),type=currentType(),p=progress(type),pct=p.total?Math.round(p.done/p.total*100):0;
      $('werdAdhkarNextName').textContent=label(next.type);$('werdAdhkarCountdown').textContent=countdown(next.target,now);$('werdAdhkarNextAt').textContent=`الموعد ${formatClock(timeFor(next.type))}`;
      $('werdAdhkarProgressTitle').textContent=`إنجاز ${label(type)}`;$('werdAdhkarProgressText').textContent=`${p.done} / ${p.total} • ${pct}٪`;$('werdAdhkarProgressBar').style.width=pct+'%';
      const resume=$('werdAdhkarResume');if(resume)resume.textContent=p.total&&p.done>=p.total?'تم الورد ✓':(p.done?'أكمل الورد':'ابدأ الورد');$('werdAdhkarSchedule').textContent=`موعده ${formatClock(timeFor(type))}`;
      for(const t of ['morning','evening']){const sp=document.querySelector(`#adhkar .werd-chip-sub[data-werd-type="${t}"]`),pp=progress(t);if(sp)sp.textContent=`${formatClock(timeFor(t))} • ${pp.done}/${pp.total}`}
      if(p.total&&p.done>=p.total)showCompletion(type);
      else $('werdAdhkarSessionComplete')?.remove();
    }finally{updating=false}
  }

  function showCompletion(type){
    const list=$('adhkarList');if(!list||$('werdAdhkarSessionComplete'))return;const box=document.createElement('div');box.id='werdAdhkarSessionComplete';box.className='werd-session-complete';box.innerHTML=`<div class="icon">🌿</div><h4>تم ${label(type)} بالكامل</h4><p>بارك الله في وردك. يمكنك مراجعة أي ذكر بالسابق والتالي.</p><button type="button">مراجعة الورد</button>`;list.insertAdjacentElement('afterend',box);box.querySelector('button').onclick=()=>{setSessionIndex(type,0);box.remove();showCurrentCard(true)};
  }

  function install(){
    const page=$('adhkar');if(!page)return setTimeout(install,250);ensureDashboard();update();
    page.querySelectorAll('.chip[data-type]').forEach(ch=>{if(ch.dataset.werdSessionBound)return;ch.dataset.werdSessionBound='1';ch.addEventListener('click',()=>setTimeout(()=>{ensureSessionState();decorateCards();update();showCurrentCard(false)},45))});
    const list=$('adhkarList');if(list&&!observer){observer=new MutationObserver(muts=>{if(decorating)return;if(muts.some(m=>m.type==='childList'&&[...m.addedNodes,...m.removedNodes].some(n=>n.nodeType===1&&n.parentNode===list)))setTimeout(()=>{decorateCards();update();if(autoAdvance)showCurrentCard(true)},0)});observer.observe(list,{childList:true})}
    timer=setInterval(update,1000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)update()});window.addEventListener('pageshow',update);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
