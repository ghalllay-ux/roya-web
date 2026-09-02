// Smart seven-day memorization forecast and load balancing for Werd
(function(){
  const COUNTS=[7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
  let timer=null,juzSeq=0;

  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function localDate(d=new Date()){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return`${y}-${m}-${day}`}
  function atDate(v){return new Date(`${v}T12:00:00`)}
  function addDays(v,n){const d=typeof v==='string'?atDate(v):new Date(v);d.setDate(d.getDate()+Number(n||0));return localDate(d)}
  function clamp(n,a,b){return Math.max(a,Math.min(b,Number(n)||0))}
  function mastery(n){return Math.max(1,Math.min(5,Number(n)||1))}
  function globalStart(s){let n=1;for(let i=0;i<s-1;i++)n+=COUNTS[i]||0;return n}
  function toGlobal(s,a){return globalStart(Number(s))+Number(a)-1}
  function fromGlobal(g){g=clamp(g,1,6236);let acc=0;for(let s=1;s<=114;s++){const c=COUNTS[s-1]||0;if(g<=acc+c)return{surah:s,ayah:g-acc,global:g};acc+=c}return{surah:114,ayah:6,global:6236}}
  function surahName(n){try{const list=(typeof surahs!=='undefined'&&Array.isArray(surahs)&&surahs.length)?surahs:((typeof fallbackSurahs!=='undefined'&&Array.isArray(fallbackSurahs))?fallbackSurahs:[]);return list.find(x=>Number(x.number)===Number(n))?.name||`سورة ${n}`}catch(e){return`سورة ${n}`}}
  function fmtDate(v,opts={weekday:'short',day:'numeric',month:'short'}){try{return new Intl.DateTimeFormat('ar-SA',opts).format(atDate(v))}catch(e){return v}}

  function tracker(){
    if(!state.memorizationTracker||typeof state.memorizationTracker!=='object'||Array.isArray(state.memorizationTracker))state.memorizationTracker={};
    state.memorizationTracker={version:1,items:{},history:[],recitationHistory:[],settings:{reminderEnabled:true,reminderTime:'19:30',dailyGoal:5},...state.memorizationTracker};
    if(!state.memorizationTracker.items||typeof state.memorizationTracker.items!=='object'||Array.isArray(state.memorizationTracker.items))state.memorizationTracker.items={};
    if(!Array.isArray(state.memorizationTracker.history))state.memorizationTracker.history=[];
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
  function weekly(){if(!state.weeklyMemPlan||typeof state.weeklyMemPlan!=='object'||Array.isArray(state.weeklyMemPlan))state.weeklyMemPlan={};state.weeklyMemPlan={version:1,lastViewed:null,...state.weeklyMemPlan};return state.weeklyMemPlan}
  function items(){return Object.values(tracker().items).filter(x=>x&&!x.archived)}

  function baseAllocation(minutes,newGoal){minutes=clamp(minutes,10,120);newGoal=clamp(newGoal,0,15);let fresh=Math.min(newGoal,Math.max(newGoal?1:0,Math.floor(minutes*.34/4))),review=Math.max(1,Math.floor(minutes*.42/2.2)),weak=Math.max(1,Math.floor(minutes*.24/3));if(minutes<=15){review=Math.min(review,3);weak=Math.min(weak,1);fresh=Math.min(fresh,1)}return{fresh,review,weak}}
  function weakScore(item){const t=tracker(),id=item.id||`${item.surah}:${item.ayah}`,h=t.history.filter(x=>x&&x.id===id).slice(0,6);let score=(5-mastery(item.mastery))*14+Math.min(18,(Number(item.lapses)||0)*5);for(const x of h)score+=x.rating==='again'?12:x.rating==='hard'?6:x.rating==='good'?-3:x.rating==='easy'?-5:0;return Math.round(clamp(score,0,100))}
  function weakPool(){return items().map(x=>({...x,id:x.id||`${x.surah}:${x.ayah}`,weakness:weakScore(x)})).filter(x=>x.weakness>=20).sort((a,b)=>b.weakness-a.weakness)}

  function forecast(){
    const ds=daily(),set=ds.settings,today=localDate(),alloc=baseAllocation(set.minutes,set.newGoal),all=items(),weak=weakPool();
    const scheduled=all.map(x=>({...x,id:x.id||`${x.surah}:${x.ayah}`,next:String(x.nextReview||today)})).sort((a,b)=>a.next.localeCompare(b.next));
    const pending=[],seen=new Set(),out=[];let weakCursor=0;
    for(let i=0;i<7;i++){
      const date=addDays(today,i);
      for(const x of scheduled){if(!seen.has(x.id)&&x.next<=date){seen.add(x.id);pending.push(x)}}
      const backlogBefore=pending.length,cap=Math.max(1,alloc.review),pressure=backlogBefore/cap;
      let fresh=alloc.fresh,mode='متوازن';
      if(set.newGoal===0)fresh=0;
      else if(pressure>=2){fresh=0;mode='مراجعة مكثفة'}
      else if(pressure>=1.25){fresh=Math.min(fresh,1);mode='تخفيف قوي'}
      else if(pressure>=.75){fresh=Math.min(fresh,Math.max(1,Math.ceil(alloc.fresh*.6)));mode='تخفيف تلقائي'}
      const reviews=Math.min(pending.length,cap);pending.splice(0,reviews);
      let weakCount=0;while(weakCount<alloc.weak&&weakCursor<weak.length){const w=weak[weakCursor++];if(!scheduled.some(x=>x.id===w.id&&x.next<=date))weakCount++}
      out.push({date,reviews,weak:weakCount,fresh,backlogBefore,backlogAfter:pending.length,pressure,mode,minutes:set.minutes});
    }
    return out;
  }

  function planDayStatus(plan){
    if(!plan)return null;const t=tracker(),created=String(plan.createdAt||`${plan.date}T00:00:00`),hist=t.history.filter(h=>h&&h.date===plan.date&&String(h.at||'')>=created),ids=new Set(hist.map(h=>h.id));const review=(plan.review||[]).filter(x=>ids.has(x.id)).length,weak=(plan.weak||[]).filter(x=>ids.has(x.id)).length,fresh=(plan.confirmedFresh||[]).filter(id=>(plan.fresh||[]).some(x=>x.id===id)).length,total=(plan.review||[]).length+(plan.weak||[]).length+(plan.fresh||[]).length,done=review+weak+fresh;return{total,done,pct:total?Math.round(done/total*100):100}}
  function adherence(){
    const ds=daily(),today=localDate(),days=[];let done=0,total=0,completeDays=0,plannedDays=0;
    for(let i=6;i>=0;i--){const date=addDays(today,-i),p=ds.days[date],s=planDayStatus(p);if(!s)continue;plannedDays++;done+=s.done;total+=s.total;if(s.total&&s.done===s.total)completeDays++;days.push({date,...s})}
    return{pct:total?Math.round(done/total*100):0,completeDays,plannedDays,days}
  }
  function streak(){const ds=daily(),today=localDate();let n=0;for(let i=0;i<60;i++){const date=addDays(today,-i),s=planDayStatus(ds.days[date]);if(!s||!s.total||s.done<s.total){if(i===0)continue;break}n++}return n}
  function cursor(){const ds=daily(),set=ds.settings;if(Number(set.cursorGlobal))return clamp(set.cursorGlobal,1,6236);const used=items().map(x=>Number(x.global)||toGlobal(x.surah,x.ayah)).filter(Boolean);if(used.length)return clamp(Math.max(...used)+1,1,6236);const p=state.memorization||{};return clamp(toGlobal(Number(p.surah)||1,Number(p.fromAyah)||1),1,6236)}
  function actualPace(){
    const ds=daily();if(Number(ds.settings.newGoal)===0)return{pace:0,basis:'الخطة الحالية مراجعة فقط'};const today=localDate();let fresh=0,planDays=0;
    for(let i=0;i<14;i++){const p=ds.days[addDays(today,-i)];if(!p)continue;planDays++;fresh+=Array.isArray(p.confirmedFresh)?p.confirmedFresh.length:0}
    if(planDays>=3&&fresh>0)return{pace:Math.max(.25,fresh/planDays),basis:'متوسط إنجازك الفعلي'};
    const f=forecast()[0]?.fresh??baseAllocation(ds.settings.minutes,ds.settings.newGoal).fresh;return{pace:f>0?Math.max(.25,f):0,basis:'هدفك الحالي'}
  }
  function etaInfo(){const g=cursor(),p=fromGlobal(g),pace=actualPace(),remaining=(COUNTS[p.surah-1]||1)-p.ayah+1,days=pace.pace>0?Math.ceil(remaining/pace.pace):null;return{global:g,...p,name:surahName(p.surah),pace:pace.pace,basis:pace.basis,surahRemaining:remaining,surahDays:days,surahDate:days===null?null:addDays(localDate(),days)}}

  function generateFresh(count,current=[]){const existing=new Set(items().map(x=>x.id||`${x.surah}:${x.ayah}`));for(const x of current)existing.add(x.id);const out=[],last=current.length?Math.max(...current.map(x=>Number(x.global)||toGlobal(x.surah,x.ayah))):cursor()-1;let g=Math.max(cursor(),last+1),guard=0;while(out.length<count&&g<=6236&&guard<7000){const p=fromGlobal(g),id=`${p.surah}:${p.ayah}`;if(!existing.has(id)){out.push({...p,id,surahName:surahName(p.surah)});existing.add(id)}g++;guard++}return out}
  function applyAdaptiveToday(f0){
    const ds=daily(),plan=ds.days[localDate()];if(!plan||!Array.isArray(plan.fresh)||!f0)return;const confirmed=new Set(plan.confirmedFresh||[]),target=Math.max(Number(f0.fresh)||0,confirmed.size),before=plan.fresh.map(x=>x.id).join('|');let next=[];
    for(const x of plan.fresh)if(confirmed.has(x.id))next.push(x);
    for(const x of plan.fresh){if(next.length>=target)break;if(!confirmed.has(x.id))next.push(x)}
    next.sort((a,b)=>(Number(a.global)||0)-(Number(b.global)||0));if(next.length<target)next.push(...generateFresh(target-next.length,next));
    plan.fresh=next;const after=next.map(x=>x.id).join('|'),old=plan.adaptiveLoad||{},metaChanged=old.mode!==f0.mode||Number(old.backlog)!==Number(f0.backlogBefore)||Number(old.desiredFresh)!==Number(f0.fresh);if(before!==after||metaChanged){plan.adaptiveLoad={mode:f0.mode,backlog:f0.backlogBefore,desiredFresh:f0.fresh,adjustedAt:new Date().toISOString()};save()}
  }

  async function loadJuzEta(info){const seq=++juzSeq,box=document.getElementById('wplanJuzEta');if(!box)return;if(info.pace<=0){box.innerHTML='<b>الجزء الحالي</b><div class="muted">الخطة الحالية مراجعة فقط؛ فعّل الحفظ الجديد لإظهار موعد تقديري لنهاية الجزء.</div>';return}box.innerHTML='<span class="muted">جاري حساب نهاية الجزء من المصحف الموثوق…</span>';try{const a=await fetch(`${API_QURAN}/ayah/${info.global}/quran-uthmani`);if(!a.ok)throw 0;const aj=await a.json(),juz=Number(aj?.data?.juz);if(!juz)throw 0;const r=await fetch(`${API_QURAN}/juz/${juz}/quran-uthmani`);if(!r.ok)throw 0;const j=await r.json(),ayahs=j?.data?.ayahs||[],last=Number(ayahs[ayahs.length-1]?.number);if(seq!==juzSeq||!last)return;const remaining=Math.max(0,last-info.global+1),days=Math.ceil(remaining/info.pace);box.innerHTML=`<b>الجزء ${juz}</b><div class="muted">متبقٍ تقريبًا ${remaining} آية • نحو ${days} يوم • ${esc(fmtDate(addDays(localDate(),days),{day:'numeric',month:'long'}))}</div>`}catch(e){if(seq===juzSeq)box.innerHTML='<span class="muted">يظهر تقدير نهاية الجزء عند توفر اتصال بالإنترنت.</span>'}}

  function injectStyles(){if(document.getElementById('werdWeeklyPlanStyle'))return;const s=document.createElement('style');s.id='werdWeeklyPlanStyle';s.textContent=`
    .wplan-hero{background:linear-gradient(145deg,var(--green),#173f34);color:#fff;border-radius:24px;padding:19px}.wplan-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:13px}.wplan-stat{background:rgba(255,255,255,.1);border-radius:15px;padding:10px;text-align:center}.wplan-stat b{display:block;font-size:21px}.wplan-stat small{font-size:9px;opacity:.75}.wplan-days{display:grid;gap:8px}.wplan-day{border:1px solid var(--line);border-radius:17px;padding:11px;background:var(--card)}.wplan-day.today{border-color:var(--green);box-shadow:0 0 0 1px var(--green) inset}.wplan-day-head{display:flex;justify-content:space-between;gap:8px;align-items:center}.wplan-load{font-size:9px;border-radius:99px;padding:4px 8px;background:var(--sage)}.wplan-tasks{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:9px}.wplan-task{background:var(--sage);border-radius:12px;padding:8px;text-align:center}.wplan-task b{display:block;font-size:17px}.wplan-task small{font-size:8px;color:var(--muted)}.wplan-backlog{font-size:9px;color:var(--muted);margin-top:7px}.wplan-eta{display:grid;grid-template-columns:1fr 1fr;gap:8px}.wplan-eta-box{background:var(--sage);border-radius:16px;padding:12px}.wplan-eta-box b{display:block;margin-bottom:4px}.wplan-meter{height:7px;background:var(--line);border-radius:99px;overflow:hidden}.wplan-meter span{display:block;height:100%;background:var(--green);border-radius:99px}.wplan-home{margin-top:12px}@media(max-width:380px){.wplan-grid,.wplan-eta{grid-template-columns:1fr}.wplan-tasks{grid-template-columns:1fr 1fr 1fr}}
  `;document.head.appendChild(s)}

  function inject(){injectStyles();weekly();const main=document.querySelector('main');if(!main)return;if(!document.getElementById('weeklyMemPlan')){const sec=document.createElement('section');sec.className='page';sec.id='weeklyMemPlan';sec.innerHTML=`
    <div class="section-title"><h3>الجدول الأسبوعي للحفظ</h3><button class="smallbtn" id="wplanBack">خطة اليوم</button></div>
    <div class="wplan-hero"><div class="row"><div><b style="font-size:18px">الأيام السبعة القادمة</b><div style="font-size:10px;opacity:.72;margin-top:3px">توقع متجدد حسب حمل المراجعة وإنجازك</div></div><span style="font-size:27px">📅</span></div><div class="wplan-grid"><div class="wplan-stat"><b id="wplanAdherence">0٪</b><small>التزام آخر 7 أيام</small></div><div class="wplan-stat"><b id="wplanStreak">0</b><small>أيام مكتملة متصلة</small></div><div class="wplan-stat"><b id="wplanFreshWeek">0</b><small>حفظ جديد متوقع</small></div></div></div>
    <div class="card" style="margin-top:10px"><div class="row"><div><b>التخفيف التلقائي مفعل</b><div class="muted">إذا زادت المراجعات المتراكمة، تقل كمية الحفظ الجديد تلقائيًا حتى يعود الحمل لمستواه الطبيعي.</div></div><span>⚖️</span></div><button class="secondary" id="wplanToday" style="width:100%;margin-top:10px">فتح خطة اليوم</button></div>
    <div class="section-title"><h3>خطة الأسبوع</h3><button class="smallbtn" id="wplanRefresh">↻ تحديث</button></div><div class="wplan-days" id="wplanDays"></div>
    <div class="section-title"><h3>توقع التقدم</h3><span id="wplanPace">—</span></div><div class="wplan-eta"><div class="wplan-eta-box" id="wplanSurahEta"></div><div class="wplan-eta-box" id="wplanJuzEta"></div></div>
    <div class="section-title"><h3>الالتزام الأخير</h3><span id="wplanAdMeta">—</span></div><div class="card" id="wplanAdherenceList"></div>
    <div class="muted" style="font-size:9px;line-height:1.7;margin-top:10px">توقعات الأيام المقبلة مبنية على المراجعات المجدولة حاليًا. قد تتغير بعد تقييماتك الجديدة لأن «ورد» يعيد جدولة المراجعة حسب مستوى الإتقان.</div>`;main.appendChild(sec)}addEntries();addHomeCard();wire();renderAll();startWatch()}

  function addEntries(){const mg=document.querySelector('#more .more-grid');if(mg&&!document.getElementById('moreWeeklyPlan')){const b=document.createElement('button');b.className='more-tile';b.id='moreWeeklyPlan';b.innerHTML='<span class="mi">📅</span><b>الجدول الأسبوعي</b><small>7 أيام وتخفيف تلقائي للحمل</small>';b.onclick=open;mg.insertBefore(b,mg.firstChild)}const d=document.querySelector('#dailyMemPlan .section-title');if(d&&!document.getElementById('weeklyFromDaily')){const b=document.createElement('button');b.className='smallbtn';b.id='weeklyFromDaily';b.textContent='📅 الأسبوع';b.onclick=open;d.appendChild(b)}const t=document.querySelector('#memorizationTracker .section-title');if(t&&!document.getElementById('weeklyFromTracker')){const b=document.createElement('button');b.className='smallbtn';b.id='weeklyFromTracker';b.textContent='📅 الأسبوع';b.onclick=open;t.appendChild(b)}}
  function addHomeCard(){const home=document.getElementById('home');if(!home||document.getElementById('wplanHome'))return;const c=document.createElement('div');c.className='card wplan-home';c.id='wplanHome';c.innerHTML='<div class="row"><div><b>أسبوع الحفظ</b><div class="muted" id="wplanHomeSub">—</div></div><button class="smallbtn" id="wplanHomeBtn">فتح</button></div>';home.insertBefore(c,home.firstChild);document.getElementById('wplanHomeBtn').onclick=open}
  function wire(){document.getElementById('wplanBack').onclick=()=>window.openWerdDailyMemPlan?.();document.getElementById('wplanToday').onclick=()=>window.openWerdDailyMemPlan?.();document.getElementById('wplanRefresh').onclick=()=>{renderAll();toast('تم تحديث توقع الأسبوع ✓')}}
  function open(){weekly().lastViewed=new Date().toISOString();save();go('weeklyMemPlan');renderAll()}window.openWerdWeeklyMemPlan=open;

  function renderAll(){if(!document.getElementById('weeklyMemPlan'))return;const f=forecast();applyAdaptiveToday(f[0]);const ad=adherence(),str=streak(),freshWeek=f.reduce((s,x)=>s+x.fresh,0),today=localDate();document.getElementById('wplanAdherence').textContent=`${ad.pct}٪`;document.getElementById('wplanStreak').textContent=str;document.getElementById('wplanFreshWeek').textContent=freshWeek;document.getElementById('wplanDays').innerHTML=f.map(x=>`<div class="wplan-day ${x.date===today?'today':''}"><div class="wplan-day-head"><div><b>${esc(fmtDate(x.date,{weekday:'long',day:'numeric',month:'short'}))}</b>${x.date===today?'<div class="muted">اليوم • التنفيذ من خطة اليوم</div>':''}</div><span class="wplan-load">${esc(x.mode)}</span></div><div class="wplan-tasks"><div class="wplan-task"><b>${x.fresh}</b><small>حفظ جديد</small></div><div class="wplan-task"><b>${x.reviews}</b><small>مراجعة</small></div><div class="wplan-task"><b>${x.weak}</b><small>تقوية</small></div></div>${x.backlogBefore?`<div class="wplan-backlog">الحمل قبل التوزيع: ${x.backlogBefore} مراجعة • المتبقي المتوقع بعد الحصة: ${x.backlogAfter}</div>`:'<div class="wplan-backlog">لا يوجد تراكم مراجعات متوقع في بداية اليوم.</div>'}</div>`).join('');
    const eta=etaInfo(),pace=Math.round(eta.pace*10)/10;document.getElementById('wplanPace').textContent=eta.pace>0?`${pace} آية/يوم • ${eta.basis}`:eta.basis;document.getElementById('wplanSurahEta').innerHTML=eta.pace>0?`<b>${esc(eta.name)}</b><div class="muted">من الآية ${eta.ayah} • متبقٍ ${eta.surahRemaining} آية</div><div style="margin-top:6px">نحو <b style="display:inline">${eta.surahDays} يوم</b> • ${esc(fmtDate(eta.surahDate,{day:'numeric',month:'long'}))}</div>`:`<b>${esc(eta.name)}</b><div class="muted">متبقٍ ${eta.surahRemaining} آية. الخطة الحالية مراجعة فقط؛ لا يوجد موعد إنهاء محسوب للحفظ الجديد.</div>`;loadJuzEta(eta);
    document.getElementById('wplanAdMeta').textContent=ad.plannedDays?`${ad.completeDays}/${ad.plannedDays} أيام مكتملة`:'بانتظار بيانات';const box=document.getElementById('wplanAdherenceList');box.innerHTML=ad.days.length?ad.days.map(x=>`<div style="padding:9px 0;border-bottom:1px solid var(--line)"><div class="row"><b>${esc(fmtDate(x.date,{weekday:'short',day:'numeric'}))}</b><span>${x.pct}٪</span></div><div class="wplan-meter" style="margin-top:6px"><span style="width:${x.pct}%"></span></div></div>`).join(''):'<div class="muted" style="padding:12px 0">ستظهر نسبة الالتزام بعد استخدام خطة الحفظ اليومية.</div>';
    const hs=document.getElementById('wplanHomeSub');if(hs)hs.textContent=`${ad.pct}٪ التزام • ${f[0]?.fresh||0} جديد + ${f[0]?.reviews||0} مراجعة اليوم`}
  function startWatch(){if(timer)return;timer=setInterval(()=>{if(!document.hidden)renderAll()},60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)renderAll()})}

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inject);else inject();
})();