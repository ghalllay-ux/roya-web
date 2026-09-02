// Monthly memorization achievement dashboard for Werd
(function(){
  const COUNTS=[7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
  const WD=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
  let view=new Date(new Date().getFullYear(),new Date().getMonth(),1),timer=null,selectedDate=null;

  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function pad(n){return String(n).padStart(2,'0')}
  function localDate(d=new Date()){return`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`}
  function atDate(v){return new Date(`${v}T12:00:00`)}
  function monthKey(d){return`${d.getFullYear()}-${pad(d.getMonth()+1)}`}
  function isCurrentMonth(d){const n=new Date();return d.getFullYear()===n.getFullYear()&&d.getMonth()===n.getMonth()}
  function daysInMonth(d){return new Date(d.getFullYear(),d.getMonth()+1,0).getDate()}
  function fmtMonth(d){try{return new Intl.DateTimeFormat('ar-SA',{month:'long',year:'numeric'}).format(d)}catch(e){return monthKey(d)}}
  function fmtDay(v){try{return new Intl.DateTimeFormat('ar-SA',{weekday:'long',day:'numeric',month:'long'}).format(atDate(v))}catch(e){return v}}
  function globalStart(s){let n=1;for(let i=0;i<s-1;i++)n+=COUNTS[i]||0;return n}
  function itemGlobal(x){return Number(x?.global)||globalStart(Number(x?.surah)||1)+(Number(x?.ayah)||1)-1}

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
    state.dailyMemPlan.settings={minutes:30,newGoal:3,cursorGlobal:null,autoCursor:true,...(state.dailyMemPlan.settings||{})};
    if(!state.dailyMemPlan.days||typeof state.dailyMemPlan.days!=='object'||Array.isArray(state.dailyMemPlan.days))state.dailyMemPlan.days={};
    if(!Array.isArray(state.dailyMemPlan.history))state.dailyMemPlan.history=[];
    return state.dailyMemPlan;
  }
  function goal(){return state.longTermMemGoal&&typeof state.longTermMemGoal==='object'&&!Array.isArray(state.longTermMemGoal)?state.longTermMemGoal:null}
  function items(){return Object.values(tracker().items).filter(x=>x&&!x.archived)}
  function history(){return tracker().history.filter(Boolean)}

  function planStatus(plan){
    if(!plan)return null;const created=String(plan.createdAt||`${plan.date}T00:00:00`),hs=history().filter(h=>h&&String(h.at||'')>=created),ids=new Set(hs.map(h=>h.id));
    const review=(plan.review||[]).filter(x=>ids.has(x.id)).length,weak=(plan.weak||[]).filter(x=>ids.has(x.id)).length,fresh=(plan.confirmedFresh||[]).filter(id=>(plan.fresh||[]).some(x=>x.id===id)).length,total=(plan.review||[]).length+(plan.weak||[]).length+(plan.fresh||[]).length,done=review+weak+fresh;
    return{review,weak,fresh,total,done,pct:total?Math.round(done/total*100):100,complete:total>0&&done>=total};
  }
  function historiesOn(date){return history().filter(h=>String(h.date||String(h.at||'').slice(0,10))===date)}
  function dayData(date){
    const p=daily().days[date]||null,s=planStatus(p),today=localDate(),past=date<today,future=date>today,hs=historiesOn(date),uniqueReviews=new Set(hs.map(h=>h.id).filter(Boolean)).size,fresh=s?.fresh||0;
    let kind='none';if(future)kind='future';else if(!p)kind=hs.length?'activity':'none';else if(s?.complete)kind='complete';else if(date===today)kind='today';else if((s?.done||0)>0)kind='partial';else if(past)kind='missed';
    return{date,plan:p,status:s,history:hs,uniqueReviews,fresh,kind};
  }
  function monthDates(d=view){const out=[],n=daysInMonth(d);for(let day=1;day<=n;day++)out.push(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(day)}`);return out}
  function monthStats(d=view){
    const dates=monthDates(d),today=localDate(),rows=dates.map(dayData),eligible=rows.filter(x=>x.date<=today&&x.plan),totalTasks=eligible.reduce((n,x)=>n+(x.status?.total||0),0),doneTasks=eligible.reduce((n,x)=>n+(x.status?.done||0),0),completed=eligible.filter(x=>x.status?.complete).length,missed=eligible.filter(x=>x.date<today&&!x.status?.complete).length,partial=eligible.filter(x=>x.status&&x.status.done>0&&!x.status.complete).length;
    const fresh=rows.reduce((n,x)=>n+x.fresh,0),reviewKeys=new Set();for(const x of rows)for(const h of x.history)if(h.id)reviewKeys.add(`${x.date}|${h.id}`);
    const adherence=totalTasks?Math.round(doneTasks/totalTasks*100):(eligible.length?0:0),events=rows.flatMap(x=>x.history),active=rows.filter(x=>x.fresh||x.history.length).length;
    return{dates,rows,eligible,totalTasks,doneTasks,completed,missed,partial,fresh,reviews:reviewKeys.size,adherence,events,active};
  }

  function quality(stats){
    const events=stats.events;if(events.length<5)return{bestDay:null,bestTime:null,count:events.length};
    const days=Array(7).fill(0),slots={الفجر:0,الصباح:0,الظهر:0,المساء:0,الليل:0};
    for(const e of events){const d=new Date(e.at||`${e.date}T12:00:00`);if(Number.isNaN(d.getTime()))continue;days[d.getDay()]++;const h=d.getHours();const k=h>=4&&h<8?'الفجر':h>=8&&h<12?'الصباح':h>=12&&h<17?'الظهر':h>=17&&h<22?'المساء':'الليل';slots[k]++}
    const di=days.indexOf(Math.max(...days)),slot=Object.entries(slots).sort((a,b)=>b[1]-a[1])[0];return{bestDay:WD[di],bestDayCount:days[di],bestTime:slot?.[1]?slot[0]:null,bestTimeCount:slot?.[1]||0,count:events.length};
  }
  function longestCompleteStreak(stats){let best=0,cur=0;for(const x of stats.rows){if(x.plan&&x.status?.complete){cur++;best=Math.max(best,cur)}else if(x.date<=localDate()&&x.plan)cur=0}return best}
  function weeklyBars(stats){
    const bins=[];for(let i=0;i<stats.rows.length;i+=7){const group=stats.rows.slice(i,i+7),planned=group.filter(x=>x.plan&&x.date<=localDate()),total=planned.reduce((n,x)=>n+(x.status?.total||0),0),done=planned.reduce((n,x)=>n+(x.status?.done||0),0);bins.push({label:`أ${bins.length+1}`,pct:total?Math.round(done/total*100):0,fresh:group.reduce((n,x)=>n+x.fresh,0),reviews:group.reduce((n,x)=>n+x.uniqueReviews,0)})}return bins;
  }

  function forecastNext(stats){
    const next=new Date(view.getFullYear(),view.getMonth()+1,1),days=daysInMonth(next),elapsed=isCurrentMonth(view)?Math.max(1,new Date().getDate()):daysInMonth(view),planned=stats.eligible.length,set=daily().settings;
    let freshDay,reviewDay,activityRatio;
    if(planned>=3){freshDay=stats.fresh/planned;reviewDay=stats.reviews/planned;activityRatio=Math.max(.25,Math.min(1,planned/elapsed))}
    else{const tp=daily().days[localDate()];freshDay=tp?.fresh?.length??Math.max(0,Number(set.newGoal)||0);reviewDay=tp?.review?.length??Math.max(1,Math.floor((Number(set.minutes)||30)*.42/2.2));activityRatio=planned?Math.max(.4,planned/elapsed):.7}
    const fresh=Math.round(freshDay*days*activityRatio),reviews=Math.round(reviewDay*days*activityRatio),adherence=stats.eligible.length?stats.adherence:Math.round(activityRatio*100);
    return{month:fmtMonth(next),fresh,reviews,adherence,days,source:planned>=3?'من أدائك الفعلي':'تقدير أولي من إعدادات خطتك'};
  }
  function goalInfo(){
    const g=goal();if(!g||!g.active||!Number(g.rangeStart)||!Number(g.rangeEnd))return null;const set=new Set();for(const x of items()){const n=itemGlobal(x);if(n>=g.rangeStart&&n<=g.rangeEnd)set.add(n)}const total=g.rangeEnd-g.rangeStart+1,done=set.size,remaining=Math.max(0,total-done);return{label:g.label||'هدف الحفظ',targetDate:g.targetDate,total,done,remaining,pct:total?Math.round(done/total*100):100};
  }

  function injectStyles(){if(document.getElementById('werdMonthlyDashStyle'))return;const s=document.createElement('style');s.id='werdMonthlyDashStyle';s.textContent=`
    .mmon-hero{background:linear-gradient(145deg,var(--green),#173f34);color:#fff;border-radius:24px;padding:19px}.mmon-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:13px}.mmon-stat{background:rgba(255,255,255,.1);border-radius:15px;padding:9px;text-align:center}.mmon-stat b{display:block;font-size:20px}.mmon-stat small{font-size:8px;opacity:.76}.mmon-progress{height:9px;background:rgba(255,255,255,.17);border-radius:99px;overflow:hidden;margin-top:13px}.mmon-progress span{display:block;height:100%;background:#f0d39b;border-radius:99px;transition:width .3s}.mmon-nav{display:flex;align-items:center;justify-content:space-between;gap:8px}.mmon-week,.mmon-cal{display:grid;grid-template-columns:repeat(7,1fr);gap:5px}.mmon-week span{text-align:center;color:var(--muted);font-size:8px}.mmon-cell{min-height:58px;border:1px solid var(--line);border-radius:13px;background:var(--card);padding:6px;text-align:right;color:var(--ink)}.mmon-cell.blank{visibility:hidden}.mmon-cell.complete{background:rgba(74,126,98,.13);border-color:rgba(74,126,98,.35)}.mmon-cell.partial{background:rgba(190,143,75,.11);border-color:rgba(190,143,75,.35)}.mmon-cell.missed{background:rgba(169,83,73,.08);border-color:rgba(169,83,73,.25)}.mmon-cell.today{box-shadow:0 0 0 2px var(--green) inset}.mmon-cell.activity{background:var(--sage)}.mmon-cell.future{opacity:.48}.mmon-cell b{font-size:12px}.mmon-cell small{display:block;font-size:7px;color:var(--muted);margin-top:5px;line-height:1.5}.mmon-cell.sel{outline:2px solid var(--green);outline-offset:1px}.mmon-insights{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.mmon-insight{background:var(--sage);border-radius:16px;padding:12px;text-align:center}.mmon-insight b{display:block;font-size:17px}.mmon-insight small{font-size:9px;color:var(--muted)}.mmon-bars{height:135px;display:flex;align-items:end;gap:8px;padding-top:12px}.mmon-bar{flex:1;text-align:center}.mmon-bar-track{height:100px;background:var(--sage);border-radius:10px;display:flex;align-items:end;overflow:hidden}.mmon-bar-fill{width:100%;background:var(--green);min-height:2px;border-radius:10px 10px 0 0}.mmon-bar small{font-size:8px;color:var(--muted)}.mmon-forecast{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.mmon-fbox{border:1px solid var(--line);border-radius:15px;padding:11px;text-align:center}.mmon-fbox b{display:block;font-size:19px}.mmon-key{display:flex;gap:8px;flex-wrap:wrap;font-size:8px;color:var(--muted)}.mmon-dot{width:8px;height:8px;border-radius:50%;display:inline-block;margin-left:3px}.mmon-detail{line-height:1.8}.mmon-home{margin-top:10px}@media(max-width:420px){.mmon-grid{grid-template-columns:1fr 1fr}.mmon-cell{min-height:49px;padding:5px}.mmon-cell small{font-size:6px}.mmon-insights,.mmon-forecast{grid-template-columns:1fr}}
  `;document.head.appendChild(s)}

  function inject(){
    injectStyles();tracker();daily();const main=document.querySelector('main');if(!main)return;
    if(!document.getElementById('monthlyMemDashboard')){const sec=document.createElement('section');sec.className='page';sec.id='monthlyMemDashboard';sec.innerHTML=`
      <div class="section-title"><h3>الإنجاز الشهري للحفظ</h3><button class="smallbtn" id="mmonBack">خطة اليوم</button></div>
      <div class="mmon-hero"><div class="row"><div><b style="font-size:18px">حصيلة الشهر</b><div style="font-size:10px;opacity:.72" id="mmonHeroMonth">—</div></div><span style="font-size:27px">📅</span></div><div class="mmon-grid"><div class="mmon-stat"><b id="mmonAdh">0٪</b><small>الالتزام</small></div><div class="mmon-stat"><b id="mmonFresh">0</b><small>حفظ جديد</small></div><div class="mmon-stat"><b id="mmonReviews">0</b><small>آيات راجعتها</small></div><div class="mmon-stat"><b id="mmonDays">0</b><small>أيام مكتملة</small></div></div><div class="mmon-progress"><span id="mmonBar" style="width:0"></span></div></div>
      <div class="card" style="margin-top:10px"><div class="mmon-nav"><button class="smallbtn" id="mmonPrev">‹ السابق</button><b id="mmonMonth">—</b><div><button class="smallbtn" id="mmonToday">هذا الشهر</button><button class="smallbtn" id="mmonNext">التالي ›</button></div></div><div class="mmon-week" style="margin-top:12px">${['ح','ن','ث','ر','خ','ج','س'].map(x=>`<span>${x}</span>`).join('')}</div><div class="mmon-cal" id="mmonCal" style="margin-top:5px"></div><div class="mmon-key" style="margin-top:10px"><span><i class="mmon-dot" style="background:rgba(74,126,98,.55)"></i>مكتمل</span><span><i class="mmon-dot" style="background:rgba(190,143,75,.55)"></i>جزئي</span><span><i class="mmon-dot" style="background:rgba(169,83,73,.4)"></i>فاتت الخطة</span></div></div>
      <div class="card mmon-detail" id="mmonDetail" style="display:none;margin-top:10px"></div>
      <div class="section-title"><h3>نمط أدائك</h3><span id="mmonDataNote">—</span></div><div class="mmon-insights"><div class="mmon-insight"><small>أفضل يوم</small><b id="mmonBestDay">—</b></div><div class="mmon-insight"><small>أفضل وقت</small><b id="mmonBestTime">—</b></div><div class="mmon-insight"><small>أطول سلسلة مكتملة</small><b id="mmonStreak">0 يوم</b></div></div>
      <div class="section-title"><h3>الالتزام أسبوعيًا</h3><span>نسبة المهام</span></div><div class="card"><div class="mmon-bars" id="mmonBars"></div></div>
      <div class="section-title"><h3>توقع الشهر القادم</h3><span id="mmonForecastMonth">—</span></div><div class="card"><div class="mmon-forecast"><div class="mmon-fbox"><small>حفظ جديد متوقع</small><b id="mmonFFresh">0</b><span class="muted">آية</span></div><div class="mmon-fbox"><small>مراجعات متوقعة</small><b id="mmonFReview">0</b><span class="muted">آية</span></div><div class="mmon-fbox"><small>التزام متوقع</small><b id="mmonFAdh">0٪</b><span class="muted" id="mmonFSource">تقديري</span></div></div></div>
      <div class="card" id="mmonGoal" style="display:none;margin-top:10px"></div>`;main.appendChild(sec)}
    addEntries();addHomeCard();wire();renderAll();startWatch();
  }

  function addEntries(){
    const mg=document.querySelector('#more .more-grid');if(mg&&!document.getElementById('moreMonthlyMem')){const b=document.createElement('button');b.className='more-tile';b.id='moreMonthlyMem';b.innerHTML='<span class="mi">📅</span><b>الإنجاز الشهري</b><small>تقويم وتحليل وتوقعات الحفظ</small>';b.onclick=open;mg.insertBefore(b,mg.firstChild)}
    [['#dailyMemPlan .section-title','mmonFromDaily'],['#weeklyMemPlan .section-title','mmonFromWeekly'],['#longTermMemGoal .section-title','mmonFromGoal'],['#memorizationTracker .section-title','mmonFromTracker']].forEach(([q,id])=>{const host=document.querySelector(q);if(host&&!document.getElementById(id)){const b=document.createElement('button');b.className='smallbtn';b.id=id;b.textContent='📅 شهري';b.onclick=open;host.appendChild(b)}})
  }
  function addHomeCard(){const home=document.getElementById('home');if(!home||document.getElementById('mmonHome'))return;const c=document.createElement('div');c.className='card mmon-home';c.id='mmonHome';c.innerHTML='<div class="row"><div><b>إنجاز الحفظ هذا الشهر</b><div class="muted" id="mmonHomeSub">—</div></div><button class="smallbtn" id="mmonHomeBtn">التفاصيل</button></div>';home.insertBefore(c,home.firstChild);document.getElementById('mmonHomeBtn').onclick=open}
  function wire(){
    const $=id=>document.getElementById(id);$('mmonBack').onclick=()=>window.openWerdDailyMemPlan?.();$('mmonPrev').onclick=()=>{view=new Date(view.getFullYear(),view.getMonth()-1,1);selectedDate=null;renderAll()};$('mmonNext').onclick=()=>{if(isCurrentMonth(view))return;const n=new Date(view.getFullYear(),view.getMonth()+1,1),now=new Date();view=n>new Date(now.getFullYear(),now.getMonth(),1)?new Date(now.getFullYear(),now.getMonth(),1):n;selectedDate=null;renderAll()};$('mmonToday').onclick=()=>{const n=new Date();view=new Date(n.getFullYear(),n.getMonth(),1);selectedDate=localDate();renderAll()};$('mmonCal').addEventListener('click',e=>{const b=e.target.closest('[data-mmon-date]');if(!b)return;selectedDate=b.dataset.mmonDate;renderCalendar(monthStats());renderDetail()})
  }
  function open(){const n=new Date();view=new Date(n.getFullYear(),n.getMonth(),1);selectedDate=localDate();go('monthlyMemDashboard');renderAll()}window.openWerdMonthlyMemDashboard=open;

  function renderAll(){if(!document.getElementById('monthlyMemDashboard'))return;const st=monthStats(),q=quality(st),fc=forecastNext(st),g=goalInfo();
    document.getElementById('mmonHeroMonth').textContent=fmtMonth(view);document.getElementById('mmonMonth').textContent=fmtMonth(view);document.getElementById('mmonAdh').textContent=`${st.adherence}٪`;document.getElementById('mmonFresh').textContent=st.fresh;document.getElementById('mmonReviews').textContent=st.reviews;document.getElementById('mmonDays').textContent=st.completed;document.getElementById('mmonBar').style.width=`${st.adherence}%`;document.getElementById('mmonNext').disabled=isCurrentMonth(view);
    document.getElementById('mmonBestDay').textContent=q.bestDay||'بيانات غير كافية';document.getElementById('mmonBestTime').textContent=q.bestTime||'بيانات غير كافية';document.getElementById('mmonStreak').textContent=`${longestCompleteStreak(st)} يوم`;document.getElementById('mmonDataNote').textContent=q.count<5?`${q.count}/5 أنشطة للتحليل`:`${q.count} نشاطًا`;
    document.getElementById('mmonForecastMonth').textContent=fc.month;document.getElementById('mmonFFresh').textContent=fc.fresh;document.getElementById('mmonFReview').textContent=fc.reviews;document.getElementById('mmonFAdh').textContent=`${fc.adherence}٪`;document.getElementById('mmonFSource').textContent=fc.source;
    renderCalendar(st);renderDetail();renderBars(st);renderGoal(g);const hs=document.getElementById('mmonHomeSub');if(hs&&isCurrentMonth(view))hs.textContent=`التزام ${st.adherence}٪ • ${st.fresh} آية جديدة • ${st.completed} أيام مكتملة`;
  }
  function renderCalendar(st){const box=document.getElementById('mmonCal');if(!box)return;const first=new Date(view.getFullYear(),view.getMonth(),1).getDay(),rows=st?.rows||monthStats().rows,cells=[];for(let i=0;i<first;i++)cells.push('<div class="mmon-cell blank"></div>');for(const x of rows){const d=Number(x.date.slice(-2)),s=x.status,meta=[];if(x.fresh)meta.push(`+${x.fresh} حفظ`);if(x.uniqueReviews)meta.push(`↻${x.uniqueReviews}`);if(s?.total)meta.push(`${s.pct}٪`);cells.push(`<button class="mmon-cell ${x.kind} ${selectedDate===x.date?'sel':''}" data-mmon-date="${x.date}"><b>${d}</b><small>${meta.join(' • ')||'—'}</small></button>`)}box.innerHTML=cells.join('')}
  function renderDetail(){const box=document.getElementById('mmonDetail');if(!box)return;if(!selectedDate||!selectedDate.startsWith(monthKey(view))){box.style.display='none';return}const x=dayData(selectedDate),s=x.status,p=x.plan;box.style.display='block';let title=x.kind==='complete'?'مكتمل ✓':x.kind==='partial'?'إنجاز جزئي':x.kind==='missed'?'لم تكتمل الخطة':x.kind==='today'?'خطة اليوم':x.history.length?'نشاط بدون خطة محفوظة':'لا توجد خطة مسجلة';box.innerHTML=`<div class="row"><div><b>${esc(fmtDay(selectedDate))}</b><div class="muted">${title}</div></div><button class="smallbtn" id="mmonDetailOpen">فتح خطة اليوم</button></div>${p?`<div style="margin-top:9px">${s.done} من ${s.total} مهمة • ${s.pct}٪<br><span class="muted">مراجعة ${s.review}/${(p.review||[]).length} • تقوية ${s.weak}/${(p.weak||[]).length} • حفظ جديد ${s.fresh}/${(p.fresh||[]).length}</span></div>`:`<div class="muted" style="margin-top:9px">${x.history.length?`${x.uniqueReviews} آية تمت مراجعتها في هذا اليوم.`:'الأيام التي لم تُنشأ لها خطة لا تُحسب كأيام فائتة.'}</div>`}`;document.getElementById('mmonDetailOpen').onclick=()=>window.openWerdDailyMemPlan?.()}
  function renderBars(st){const box=document.getElementById('mmonBars');if(!box)return;box.innerHTML=weeklyBars(st).map(x=>`<div class="mmon-bar"><div class="mmon-bar-track"><div class="mmon-bar-fill" style="height:${x.pct}%"></div></div><b style="font-size:10px">${x.pct}٪</b><small>${x.label}</small></div>`).join('')}
  function renderGoal(g){const box=document.getElementById('mmonGoal');if(!box)return;if(!g){box.style.display='none';return}box.style.display='block';box.innerHTML=`<div class="row"><div><b>🎯 ${esc(g.label)}</b><div class="muted">${g.done} من ${g.total} • ${g.pct}٪ • متبقٍ ${g.remaining}</div></div><button class="smallbtn" id="mmonGoalBtn">فتح الهدف</button></div><div class="muted" style="margin-top:7px">الموعد المستهدف: ${g.targetDate?esc(fmtDay(g.targetDate)):'—'}</div>`;document.getElementById('mmonGoalBtn').onclick=()=>window.openWerdLongTermMemGoal?.()}
  function startWatch(){if(timer)return;timer=setInterval(()=>{if(!document.hidden&&isCurrentMonth(view))renderAll()},30000);document.addEventListener('visibilitychange',()=>{if(!document.hidden&&document.getElementById('monthlyMemDashboard')?.classList.contains('active'))renderAll()})}

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inject);else inject();
})();