// Shareable monthly memorization achievement report for Werd
(function(){
  const WD=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
  let view=new Date(new Date().getFullYear(),new Date().getMonth(),1);

  function pad(n){return String(n).padStart(2,'0')}
  function localDate(d=new Date()){return`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`}
  function atDate(v){return new Date(`${v}T12:00:00`)}
  function monthKey(d=view){return`${d.getFullYear()}-${pad(d.getMonth()+1)}`}
  function daysInMonth(d=view){return new Date(d.getFullYear(),d.getMonth()+1,0).getDate()}
  function fmtMonth(d=view){try{return new Intl.DateTimeFormat('ar-SA',{month:'long',year:'numeric'}).format(d)}catch(e){return monthKey(d)}}
  function fmtNum(n){try{return Number(n||0).toLocaleString('ar-SA')}catch(e){return String(n||0)}}
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

  function tracker(){
    if(!state.memorizationTracker||typeof state.memorizationTracker!=='object'||Array.isArray(state.memorizationTracker))state.memorizationTracker={};
    state.memorizationTracker={version:1,items:{},history:[],recitationHistory:[],...state.memorizationTracker};
    if(!state.memorizationTracker.items||typeof state.memorizationTracker.items!=='object'||Array.isArray(state.memorizationTracker.items))state.memorizationTracker.items={};
    if(!Array.isArray(state.memorizationTracker.history))state.memorizationTracker.history=[];
    if(!Array.isArray(state.memorizationTracker.recitationHistory))state.memorizationTracker.recitationHistory=[];
    return state.memorizationTracker;
  }
  function daily(){
    if(!state.dailyMemPlan||typeof state.dailyMemPlan!=='object'||Array.isArray(state.dailyMemPlan))state.dailyMemPlan={};
    state.dailyMemPlan={version:1,settings:{minutes:30,newGoal:3,cursorGlobal:null,autoCursor:true},days:{},history:[],...state.dailyMemPlan};
    if(!state.dailyMemPlan.days||typeof state.dailyMemPlan.days!=='object'||Array.isArray(state.dailyMemPlan.days))state.dailyMemPlan.days={};
    return state.dailyMemPlan;
  }
  function goal(){return state.longTermMemGoal&&typeof state.longTermMemGoal==='object'&&!Array.isArray(state.longTermMemGoal)?state.longTermMemGoal:null}
  function items(){return Object.values(tracker().items).filter(x=>x&&!x.archived)}
  function historiesOn(date){return tracker().history.filter(h=>h&&(String(h.date||'')===date||String(h.at||'').slice(0,10)===date))}

  function planStatus(plan){
    if(!plan)return null;
    const date=String(plan.date||''),created=String(plan.createdAt||`${date}T00:00:00`),hs=historiesOn(date).filter(h=>String(h.at||`${date}T12:00:00`)>=created),ids=new Set(hs.map(h=>h.id).filter(Boolean));
    const review=(plan.review||[]).filter(x=>ids.has(x.id)).length,weak=(plan.weak||[]).filter(x=>ids.has(x.id)).length,fresh=(plan.confirmedFresh||[]).filter(id=>(plan.fresh||[]).some(x=>x.id===id)).length,total=(plan.review||[]).length+(plan.weak||[]).length+(plan.fresh||[]).length,done=review+weak+fresh;
    return{review,weak,fresh,total,done,pct:total?Math.round(done/total*100):100,complete:total>0&&done>=total};
  }
  function monthDates(d=view){const out=[];for(let i=1;i<=daysInMonth(d);i++)out.push(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(i)}`);return out}
  function monthStats(d=view){
    const today=localDate(),dates=monthDates(d),rows=dates.map(date=>{const plan=daily().days[date]||null,status=planStatus(plan);return{date,plan,status,history:historiesOn(date)}}),eligible=rows.filter(x=>x.date<=today&&x.plan),total=eligible.reduce((n,x)=>n+(x.status?.total||0),0),done=eligible.reduce((n,x)=>n+(x.status?.done||0),0),completed=eligible.filter(x=>x.status?.complete).length,missed=eligible.filter(x=>x.date<today&&!x.status?.complete).length;
    const fresh=eligible.reduce((n,x)=>n+(x.status?.fresh||0),0),reviewSet=new Set();for(const x of rows)for(const h of x.history)if(h.id)reviewSet.add(`${x.date}|${h.id}`);
    return{rows,eligible,total,done,completed,missed,fresh,reviews:reviewSet.size,adherence:total?Math.round(done/total*100):0};
  }
  function activityEvents(d=view){
    const key=monthKey(d),events=[];
    for(const h of tracker().history){const at=String(h?.at||'');if(at.slice(0,7)===key)events.push({at,type:'review'})}
    for(const x of items()){const at=String(x?.createdAt||'');if(at.slice(0,7)===key)events.push({at,type:'fresh'})}
    return events;
  }
  function quality(d=view){
    const events=activityEvents(d);if(events.length<5)return{enough:false,count:events.length,bestDay:null,bestTime:null};
    const days=Array(7).fill(0),slots={الفجر:0,الصباح:0,الظهر:0,المساء:0,الليل:0};
    for(const e of events){const x=new Date(e.at);if(Number.isNaN(x.getTime()))continue;days[x.getDay()]++;const h=x.getHours(),slot=h>=4&&h<8?'الفجر':h>=8&&h<12?'الصباح':h>=12&&h<17?'الظهر':h>=17&&h<22?'المساء':'الليل';slots[slot]++}
    const di=days.indexOf(Math.max(...days)),time=Object.entries(slots).sort((a,b)=>b[1]-a[1])[0];return{enough:true,count:events.length,bestDay:WD[di],bestTime:time?.[1]?time[0]:null};
  }
  function bestStreak(stats){let best=0,cur=0;for(const x of stats.rows){if(x.plan&&x.status?.complete){cur++;best=Math.max(best,cur)}else if(x.plan&&x.date<=localDate())cur=0}return best}
  function goalInfo(){
    const g=goal();if(!g||!g.active||!Number(g.rangeStart)||!Number(g.rangeEnd))return null;const set=new Set();for(const x of items()){const n=Number(x.global);if(n>=Number(g.rangeStart)&&n<=Number(g.rangeEnd))set.add(n)}const total=Number(g.rangeEnd)-Number(g.rangeStart)+1,done=set.size;return{label:g.label||'هدف الحفظ',targetDate:g.targetDate||'',pct:total?Math.round(done/total*100):100,done,total}}
  function data(){const stats=monthStats(),q=quality(),g=goalInfo();return{month:fmtMonth(),key:monthKey(),stats,q,streak:bestStreak(stats),goal:g}}

  function injectStyles(){if(document.getElementById('werdAchievementReportStyle'))return;const s=document.createElement('style');s.id='werdAchievementReportStyle';s.textContent=`
    .arep-hero{background:linear-gradient(145deg,var(--green),#173f34);color:#fff;border-radius:26px;padding:20px;overflow:hidden;position:relative}.arep-hero:after{content:'ورْد';position:absolute;left:-8px;bottom:-25px;font-size:90px;font-weight:900;opacity:.045}.arep-title{font-size:21px;font-weight:900}.arep-sub{font-size:10px;opacity:.74;margin-top:3px}.arep-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:15px}.arep-stat{background:rgba(255,255,255,.1);border-radius:15px;padding:10px;text-align:center}.arep-stat b{display:block;font-size:20px}.arep-stat small{font-size:8px;opacity:.76}.arep-bar{height:8px;background:rgba(255,255,255,.16);border-radius:99px;overflow:hidden;margin-top:14px}.arep-bar span{display:block;height:100%;background:#f0d39b;border-radius:99px}.arep-nav{display:flex;align-items:center;justify-content:space-between;gap:8px}.arep-insights{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.arep-insight{background:var(--sage);border-radius:16px;padding:12px;text-align:center}.arep-insight b{display:block;font-size:16px}.arep-insight small{display:block;color:var(--muted);font-size:8px;margin-top:3px}.arep-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.arep-actions button{margin:0}.arep-privacy{font-size:9px;line-height:1.8;color:var(--muted);text-align:center}.arep-goal{border:1px solid var(--line);border-radius:17px;padding:12px}.arep-goal-bar{height:7px;background:var(--sage);border-radius:99px;overflow:hidden;margin-top:8px}.arep-goal-bar span{display:block;height:100%;background:var(--green)}@media(max-width:390px){.arep-grid{grid-template-columns:1fr 1fr}.arep-insights{grid-template-columns:1fr}.arep-actions{grid-template-columns:1fr}}
  `;document.head.appendChild(s)}

  function inject(){
    injectStyles();tracker();daily();const main=document.querySelector('main');if(!main)return;
    if(!document.getElementById('achievementReport')){const sec=document.createElement('section');sec.className='page';sec.id='achievementReport';sec.innerHTML=`
      <div class="section-title"><h3>تقرير الإنجاز</h3><button class="smallbtn" id="arepBack">الإنجاز الشهري</button></div>
      <div class="card"><div class="arep-nav"><button class="smallbtn" id="arepPrev">‹ السابق</button><b id="arepMonth">—</b><button class="smallbtn" id="arepNext">التالي ›</button></div></div>
      <div class="arep-hero" id="arepPreview" style="margin-top:10px"><div class="row"><div><div class="arep-title">تقرير إنجاز الحفظ</div><div class="arep-sub" id="arepSub">—</div></div><div style="font-size:25px;font-weight:900">وَرْد</div></div><div class="arep-grid"><div class="arep-stat"><b id="arepAdh">0٪</b><small>الالتزام</small></div><div class="arep-stat"><b id="arepFresh">0</b><small>حفظ جديد</small></div><div class="arep-stat"><b id="arepReview">0</b><small>مراجعة</small></div><div class="arep-stat"><b id="arepDays">0</b><small>أيام مكتملة</small></div></div><div class="arep-bar"><span id="arepBar" style="width:0"></span></div></div>
      <div class="card" style="margin-top:10px"><div class="arep-insights"><div class="arep-insight"><small>أفضل يوم</small><b id="arepBestDay">—</b></div><div class="arep-insight"><small>أفضل وقت</small><b id="arepBestTime">—</b></div><div class="arep-insight"><small>أطول سلسلة</small><b id="arepStreak">0 يوم</b></div></div></div>
      <div class="arep-goal" id="arepGoal" style="margin-top:10px;display:none"><div class="row"><div><b id="arepGoalLabel">الهدف الحالي</b><div class="muted" id="arepGoalMeta">—</div></div><b id="arepGoalPct">0٪</b></div><div class="arep-goal-bar"><span id="arepGoalBar" style="width:0"></span></div></div>
      <div class="card" style="margin-top:10px"><b>مشاركة التقرير</b><div class="muted" style="margin-top:4px">صورة عمودية عالية الدقة مناسبة للمشاركة، أو نسخة للطباعة والحفظ بصيغة PDF من نافذة الطباعة.</div><div class="arep-actions" style="margin-top:11px"><button class="primary" id="arepShare">↗ مشاركة صورة</button><button class="secondary" id="arepSaveImage">⇩ حفظ صورة</button><button class="secondary" id="arepPdf">▤ طباعة / حفظ PDF</button><button class="smallbtn" id="arepCopy">نسخ الملخص</button></div></div>
      <div class="arep-privacy" style="margin-top:10px">التقرير يشارك الأرقام الإجمالية فقط ولا يضيف بريدك الإلكتروني أو اسم حسابك أو تسجيلات التسميع.</div>`;main.appendChild(sec)}
    addEntries();wire();render();
  }
  function addEntries(){
    const mg=document.querySelector('#more .more-grid');if(mg&&!document.getElementById('moreAchievementReport')){const b=document.createElement('button');b.className='more-tile';b.id='moreAchievementReport';b.innerHTML='<span class="mi">↗</span><b>تقرير الإنجاز</b><small>صورة ومشاركة وPDF</small>';b.onclick=openReport;mg.insertBefore(b,mg.firstChild)}
    [['#monthlyMemDashboard .section-title','arepFromMonth'],['#longTermMemGoal .section-title','arepFromGoal']].forEach(([q,id])=>{const host=document.querySelector(q);if(host&&!document.getElementById(id)){const b=document.createElement('button');b.className='smallbtn';b.id=id;b.textContent='↗ تقرير';b.onclick=openReport;host.appendChild(b)}})
  }
  function wire(){
    const $=id=>document.getElementById(id);$('arepBack').onclick=()=>window.openWerdMonthlyMemDashboard?.();$('arepPrev').onclick=()=>{view=new Date(view.getFullYear(),view.getMonth()-1,1);render()};$('arepNext').onclick=()=>{const now=new Date();const n=new Date(view.getFullYear(),view.getMonth()+1,1);if(n<=new Date(now.getFullYear(),now.getMonth(),1)){view=n;render()}else toast('لا توجد بيانات لشهر مستقبلي')};$('arepShare').onclick=shareImage;$('arepSaveImage').onclick=saveImage;$('arepPdf').onclick=printPdf;$('arepCopy').onclick=copySummary;
  }
  function openReport(){view=new Date(new Date().getFullYear(),new Date().getMonth(),1);go('achievementReport');render()}window.openWerdAchievementReport=openReport;

  function render(){
    const d=data(),s=d.stats,q=d.q;const $=id=>document.getElementById(id);if(!$('arepMonth'))return;$('arepMonth').textContent=d.month;$('arepSub').textContent=d.month;$('arepAdh').textContent=`${fmtNum(s.adherence)}٪`;$('arepFresh').textContent=fmtNum(s.fresh);$('arepReview').textContent=fmtNum(s.reviews);$('arepDays').textContent=fmtNum(s.completed);$('arepBar').style.width=`${s.adherence}%`;$('arepBestDay').textContent=q.enough?(q.bestDay||'—'):'بيانات غير كافية';$('arepBestTime').textContent=q.enough?(q.bestTime||'—'):'بيانات غير كافية';$('arepStreak').textContent=`${fmtNum(d.streak)} يوم`;
    const gb=$('arepGoal');if(d.goal){gb.style.display='block';$('arepGoalLabel').textContent=d.goal.label;$('arepGoalMeta').textContent=d.goal.targetDate?`الموعد المستهدف ${d.goal.targetDate}`:'هدف نشط';$('arepGoalPct').textContent=`${fmtNum(d.goal.pct)}٪`;$('arepGoalBar').style.width=`${d.goal.pct}%`}else gb.style.display='none';
  }

  function summaryText(d=data()){const s=d.stats,q=d.q,g=d.goal;return`تقرير إنجاز الحفظ - ${d.month}\nالالتزام: ${s.adherence}٪\nالحفظ الجديد: ${s.fresh} آية\nالمراجعة: ${s.reviews} آية\nالأيام المكتملة: ${s.completed}\nأطول سلسلة: ${d.streak} يوم${q.enough?`\nأفضل يوم: ${q.bestDay}\nأفضل وقت: ${q.bestTime}`:''}${g?`\nالهدف الحالي: ${g.label} - ${g.pct}٪`:''}\n\nوَرْد`}

  function rr(ctx,x,y,w,h,r,fill,stroke){r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke()}}
  function text(ctx,t,x,y,size,weight='400',color='#173f34',align='right'){ctx.fillStyle=color;ctx.font=`${weight} ${size}px system-ui,-apple-system,"Segoe UI",Arial,sans-serif`;ctx.textAlign=align;ctx.direction='rtl';ctx.fillText(String(t),x,y)}
  function canvasReport(d=data()){
    const c=document.createElement('canvas');c.width=1080;c.height=1350;const ctx=c.getContext('2d'),s=d.stats,q=d.q,g=d.goal;ctx.fillStyle='#f7f1e5';ctx.fillRect(0,0,c.width,c.height);
    const grad=ctx.createLinearGradient(0,0,1080,520);grad.addColorStop(0,'#173f34');grad.addColorStop(1,'#245744');rr(ctx,54,54,972,520,34,grad);text(ctx,'وَرْد',950,132,50,'900','#f8f2e7');text(ctx,'تقرير إنجاز الحفظ',950,208,54,'900','#ffffff');text(ctx,d.month,950,258,28,'500','rgba(255,255,255,.78)');
    const cards=[['الالتزام',`${s.adherence}٪`],['حفظ جديد',`${s.fresh} آية`],['مراجعة',`${s.reviews} آية`],['أيام مكتملة',`${s.completed}`]];for(let i=0;i<4;i++){const col=i%2,row=Math.floor(i/2),x=570-col*454,y=310+row*116;rr(ctx,x,y,400,92,20,'rgba(255,255,255,.10)');text(ctx,cards[i][0],x+365,y+34,20,'500','rgba(255,255,255,.72)');text(ctx,cards[i][1],x+365,y+72,31,'800','#fff')}
    rr(ctx,109,530,862,12,6,'rgba(255,255,255,.17)');rr(ctx,109,530,Math.max(12,862*s.adherence/100),12,6,'#f0d39b');
    text(ctx,'مؤشرات الشهر',950,670,34,'800','#173f34');const insight=[['أفضل يوم',q.enough?(q.bestDay||'—'):'بيانات غير كافية'],['أفضل وقت',q.enough?(q.bestTime||'—'):'بيانات غير كافية'],['أطول سلسلة',`${d.streak} يوم`]];for(let i=0;i<3;i++){const x=730-i*315;rr(ctx,x,710,275,145,24,'#e5ecdf');text(ctx,insight[i][0],x+238,756,20,'500','#66786e');text(ctx,insight[i][1],x+238,812,29,'800','#173f34')}
    text(ctx,'ملخص الالتزام',950,945,34,'800','#173f34');rr(ctx,109,982,862,160,25,'#fffaf1','#e6ddcf');text(ctx,`أنجزت ${s.done} من ${s.total} مهمة مخططة خلال الشهر`,930,1035,25,'700','#173f34');text(ctx,`أيام لم تكتمل خطتها: ${s.missed}`,930,1080,22,'500','#66786e');
    if(g){text(ctx,`${g.label} • ${g.pct}٪`,930,1125,22,'700','#173f34')}else{text(ctx,'لا يوجد هدف طويل المدى نشط حاليًا',930,1125,22,'500','#66786e')}
    text(ctx,'رحلة هادئة، تقدم ثابت',950,1255,24,'700','#173f34');text(ctx,'تطبيق وَرْد',130,1255,24,'700','#173f34','left');return c;
  }
  function blobFromCanvas(c){return new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(new Error('blob')),'image/png',.96))}
  async function makePng(){const d=data(),c=canvasReport(d),blob=await blobFromCanvas(c),name=`werd-achievement-${d.key}.png`;return{d,blob,name}}
  async function saveImage(){try{const {blob,name}=await makePng(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);toast('تم تجهيز صورة التقرير ✓')}catch(e){console.error(e);toast('تعذر إنشاء صورة التقرير على هذا الجهاز')}}
  async function shareImage(){try{const {d,blob,name}=await makePng(),file=new File([blob],name,{type:'image/png'}),payload={title:`إنجازي في ورد - ${d.month}`,text:`تقرير إنجاز الحفظ في ورد - ${d.month}`,files:[file]};if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){await navigator.share(payload);return}if(navigator.share){await navigator.share({title:payload.title,text:payload.text});return}await saveImage();toast('المشاركة المباشرة غير مدعومة؛ تم تجهيز الصورة بدلًا منها')}catch(e){if(e?.name!=='AbortError'){console.error(e);toast('تعذر فتح المشاركة الآن')}}}
  async function copySummary(){const t=summaryText();try{await navigator.clipboard.writeText(t);toast('تم نسخ ملخص التقرير ✓')}catch(e){const ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();toast('تم نسخ ملخص التقرير ✓')}}

  function printHtml(d=data()){
    const s=d.stats,q=d.q,g=d.goal;return`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>تقرير ورد - ${esc(d.month)}</title><style>@page{size:A4;margin:14mm}*{box-sizing:border-box}body{font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;background:#fffaf1;color:#173f34;margin:0}.sheet{max-width:820px;margin:auto}.hero{background:#173f34;color:#fff;border-radius:26px;padding:28px}.top{display:flex;justify-content:space-between;align-items:start}.brand{font-size:28px;font-weight:900}.title{font-size:32px;font-weight:900;margin-top:35px}.sub{opacity:.72;margin-top:5px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-top:25px}.stat{background:rgba(255,255,255,.1);padding:16px;border-radius:18px}.stat b{font-size:24px;display:block}.stat small{opacity:.72}.bar{height:9px;background:rgba(255,255,255,.16);border-radius:99px;overflow:hidden;margin-top:22px}.bar span{display:block;height:100%;background:#f0d39b;width:${s.adherence}%}.card{border:1px solid #e6ddcf;border-radius:20px;padding:20px;margin-top:14px;background:#fff}.ins{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.ibox{background:#e5ecdf;padding:16px;border-radius:16px}.ibox small{color:#66786e;display:block}.ibox b{font-size:20px}.goalbar{height:7px;background:#e5ecdf;border-radius:99px;overflow:hidden;margin-top:8px}.goalbar span{display:block;height:100%;background:#245744;width:${g?.pct||0}%}.foot{margin-top:30px;text-align:center;color:#66786e;font-size:12px}@media print{body{background:#fff}.sheet{max-width:none}}</style></head><body><div class="sheet"><div class="hero"><div class="top"><div><div class="brand">وَرْد</div></div><div>${esc(d.month)}</div></div><div class="title">تقرير إنجاز الحفظ</div><div class="sub">ملخص شهري من تقدمك الفعلي</div><div class="grid"><div class="stat"><b>${s.adherence}٪</b><small>الالتزام</small></div><div class="stat"><b>${s.fresh}</b><small>حفظ جديد</small></div><div class="stat"><b>${s.reviews}</b><small>مراجعة</small></div><div class="stat"><b>${s.completed}</b><small>أيام مكتملة</small></div></div><div class="bar"><span></span></div></div><div class="card"><div class="ins"><div class="ibox"><small>أفضل يوم</small><b>${esc(q.enough?(q.bestDay||'—'):'بيانات غير كافية')}</b></div><div class="ibox"><small>أفضل وقت</small><b>${esc(q.enough?(q.bestTime||'—'):'بيانات غير كافية')}</b></div><div class="ibox"><small>أطول سلسلة</small><b>${d.streak} يوم</b></div></div></div><div class="card"><b>الالتزام بالخطة</b><p>تم إنجاز ${s.done} من ${s.total} مهمة مخططة. عدد الأيام التي كانت لها خطة ولم تكتمل: ${s.missed}.</p></div>${g?`<div class="card"><b>${esc(g.label)}</b><p>التقدم الحالي ${g.pct}٪${g.targetDate?` • الموعد المستهدف ${esc(g.targetDate)}`:''}</p><div class="goalbar"><span></span></div></div>`:''}<div class="foot">تطبيق وَرْد • التقرير لا يتضمن اسم الحساب أو البريد الإلكتروني أو تسجيلات التسميع.</div></div></body></html>`}
  function printPdf(){const w=window.open('','_blank');if(!w)return toast('اسمح بفتح نافذة الطباعة لحفظ التقرير PDF');w.document.open();w.document.write(printHtml());w.document.close();setTimeout(()=>{try{w.focus();w.print()}catch(e){}},350)}

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inject);else inject();
})();
