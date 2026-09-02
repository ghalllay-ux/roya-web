// Long-term memorization goal and adaptive target pacing for Werd
(function(){
  const COUNTS=[7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
  const MAX_GLOBAL=6236;
  const QURAN_API=(typeof API_QURAN!=='undefined'&&API_QURAN)?API_QURAN:'https://api.alquran.cloud/v1';
  let timer=null,resolving=false;

  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function localDate(d=new Date()){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return`${y}-${m}-${day}`}
  function atDate(v){return new Date(`${v}T12:00:00`)}
  function addDays(v,n){const d=typeof v==='string'?atDate(v):new Date(v);d.setDate(d.getDate()+Number(n||0));return localDate(d)}
  function daysBetween(a,b){return Math.round((atDate(b)-atDate(a))/86400000)}
  function clamp(n,a,b){return Math.max(a,Math.min(b,Number(n)||0))}
  function globalStart(s){let n=1;for(let i=0;i<s-1;i++)n+=COUNTS[i]||0;return n}
  function toGlobal(s,a){return globalStart(Number(s))+Number(a)-1}
  function fromGlobal(g){g=clamp(g,1,MAX_GLOBAL);let acc=0;for(let s=1;s<=114;s++){const c=COUNTS[s-1]||0;if(g<=acc+c)return{surah:s,ayah:g-acc,global:g};acc+=c}return{surah:114,ayah:6,global:MAX_GLOBAL}}
  function surahName(n){try{const list=(typeof surahs!=='undefined'&&Array.isArray(surahs)&&surahs.length)?surahs:((typeof fallbackSurahs!=='undefined'&&Array.isArray(fallbackSurahs))?fallbackSurahs:[]);return list.find(x=>Number(x.number)===Number(n))?.name||`سورة ${n}`}catch(e){return`سورة ${n}`}}
  function fmtDate(v,opts={day:'numeric',month:'long',year:'numeric'}){try{return new Intl.DateTimeFormat('ar-SA',opts).format(atDate(v))}catch(e){return v}}

  function tracker(){
    if(!state.memorizationTracker||typeof state.memorizationTracker!=='object'||Array.isArray(state.memorizationTracker))state.memorizationTracker={};
    state.memorizationTracker={version:1,items:{},history:[],...state.memorizationTracker};
    if(!state.memorizationTracker.items||typeof state.memorizationTracker.items!=='object'||Array.isArray(state.memorizationTracker.items))state.memorizationTracker.items={};
    return state.memorizationTracker;
  }
  function daily(){
    if(!state.dailyMemPlan||typeof state.dailyMemPlan!=='object'||Array.isArray(state.dailyMemPlan))state.dailyMemPlan={};
    state.dailyMemPlan={version:1,settings:{minutes:30,newGoal:3,cursorGlobal:null,autoCursor:true},days:{},history:[],...state.dailyMemPlan};
    state.dailyMemPlan.settings={minutes:30,newGoal:3,cursorGlobal:null,autoCursor:true,...(state.dailyMemPlan.settings||{})};
    if(!state.dailyMemPlan.days||typeof state.dailyMemPlan.days!=='object'||Array.isArray(state.dailyMemPlan.days))state.dailyMemPlan.days={};
    return state.dailyMemPlan;
  }
  function goalBox(){
    if(!state.longTermMemGoal||typeof state.longTermMemGoal!=='object'||Array.isArray(state.longTermMemGoal))state.longTermMemGoal={};
    state.longTermMemGoal={version:1,active:false,autoAdjust:true,history:[],...state.longTermMemGoal};
    if(!Array.isArray(state.longTermMemGoal.history))state.longTermMemGoal.history=[];
    return state.longTermMemGoal;
  }
  function items(){return Object.values(tracker().items).filter(x=>x&&!x.archived)}
  function itemGlobal(x){return Number(x.global)||toGlobal(Number(x.surah),Number(x.ayah))}
  function activeGoal(){const g=goalBox();return g.active&&Number(g.rangeStart)&&Number(g.rangeEnd)&&g.targetDate?g:null}
  function inGoal(x,g=activeGoal()){if(!g)return false;const n=itemGlobal(x);return n>=Number(g.rangeStart)&&n<=Number(g.rangeEnd)}
  function memorizedSet(g){const set=new Set();for(const x of items())if(inGoal(x,g))set.add(itemGlobal(x));return set}

  function status(g=activeGoal()||goalBox()){
    if(!g||!Number(g.rangeStart)||!Number(g.rangeEnd)||!g.targetDate)return null;
    const total=Math.max(0,Number(g.rangeEnd)-Number(g.rangeStart)+1),mem=memorizedSet(g).size,remaining=Math.max(0,total-mem),today=localDate(),rawDays=daysBetween(today,g.targetDate),daysInclusive=Math.max(1,rawDays+1),required=remaining?remaining/daysInclusive:0,requiredCeil=remaining?Math.ceil(required):0;
    const createdDate=g.createdDate||localDate(new Date(g.createdAt||Date.now())),base=clamp(g.baselineMemorized||0,0,total),span=Math.max(1,daysBetween(createdDate,g.targetDate)+1),elapsed=clamp(daysBetween(createdDate,today)+1,0,span),expected=Math.round(base+(total-base)*(elapsed/span)),delta=mem-expected;
    const createdAt=String(g.createdAt||`${createdDate}T00:00:00`),newSince=items().filter(x=>inGoal(x,g)&&String(x.createdAt||'')>=createdAt).length,elapsedDays=Math.max(1,daysBetween(createdDate,today)+1),pace=newSince/elapsedDays,projectDays=remaining&&pace>0?Math.ceil(remaining/pace):0,projected=remaining&&pace>0?addDays(today,Math.max(0,projectDays-1)):remaining?null:today;
    let track='على المسار';if(rawDays<0&&remaining)track='تجاوز الموعد';else if(delta>=2)track='متقدم';else if(delta<=-2)track='متأخر';
    return{total,memorized:mem,remaining,today,rawDays,daysInclusive,required,requiredCeil,expected,delta,pace,projected,track,pct:total?Math.round(mem/total*100):100};
  }

  function reviewCapacity(minutes){return Math.max(1,Math.floor(clamp(minutes,10,120)*.42/2.2))}
  function freshCapacity(minutes,goal){minutes=clamp(minutes,10,120);goal=clamp(goal,0,15);let fresh=Math.min(goal,Math.max(goal?1:0,Math.floor(minutes*.34/4)));if(minutes<=15)fresh=Math.min(fresh,1);return fresh}
  function dueCount(){const today=localDate();return items().filter(x=>String(x.nextReview||today)<=today).length}
  function adaptiveFresh(minutes,desired){let fresh=freshCapacity(minutes,desired);const pressure=dueCount()/reviewCapacity(minutes);if(pressure>=2)fresh=0;else if(pressure>=1.25)fresh=Math.min(fresh,1);else if(pressure>=.75)fresh=Math.min(fresh,Math.max(1,Math.ceil(fresh*.6)));return{fresh,pressure}}

  function goalCursor(g,existing){const ds=daily(),c=Number(ds.settings.cursorGlobal);if(c>=g.rangeStart&&c<=g.rangeEnd&&!existing.has(c))return c;for(let n=g.rangeStart;n<=g.rangeEnd;n++)if(!existing.has(n))return n;return g.rangeEnd+1}
  function nextGoalFresh(g,count,preserve=[]){
    const existing=memorizedSet(g),keep=preserve.filter(Boolean),keepIds=new Set(keep.map(x=>x.id||`${x.surah}:${x.ayah}`)),out=[...keep],wanted=Math.max(keep.length,Number(count)||0);let n=goalCursor(g,existing),guard=0;
    function tryAdd(global){if(out.length>=wanted||global<g.rangeStart||global>g.rangeEnd||existing.has(global))return;const p=fromGlobal(global),id=`${p.surah}:${p.ayah}`;if(keepIds.has(id))return;out.push({...p,id,surahName:surahName(p.surah)});keepIds.add(id)}
    while(out.length<wanted&&guard<=g.rangeEnd-g.rangeStart+2){tryAdd(n);n++;if(n>g.rangeEnd)n=g.rangeStart;guard++}
    return out;
  }

  function ensureDailyOption(n){const sel=document.getElementById('dplanNew');if(!sel||n<0)return;if(![...sel.options].some(o=>Number(o.value)===Number(n))){const o=document.createElement('option');o.value=String(n);o.textContent=`${n} آية • هدف طويل المدى`;sel.appendChild(o)}}
  function applyGoalToPlans(opts={}){
    const g=activeGoal(),st=status(g);if(!g||!st)return;
    if(!st.remaining){completeGoal();return}
    const ds=daily(),desired=clamp(st.requiredCeil,1,15);if(g.autoAdjust!==false){ensureDailyOption(desired);ds.settings.newGoal=desired}
    const today=localDate(),plan=ds.days[today],load=adaptiveFresh(ds.settings.minutes,desired);
    if(plan&&Array.isArray(plan.fresh)){
      const confirmed=new Set(plan.confirmedFresh||[]),preserve=plan.fresh.filter(x=>confirmed.has(x.id));
      const before=plan.fresh.map(x=>x.id).join('|'),next=nextGoalFresh(g,Math.max(load.fresh,preserve.length),preserve),after=next.map(x=>x.id).join('|');
      plan.fresh=next;plan.longTermGoal={label:g.label,requiredDaily:st.requiredCeil,scheduledFresh:Math.max(0,next.length-preserve.length),pressure:Number(load.pressure.toFixed(2)),updatedAt:new Date().toISOString()};
      if(before!==after||opts.force)plan.adaptiveLoad={...(plan.adaptiveLoad||{}),longTermGoal:true,goalLabel:g.label,desiredFresh:st.requiredCeil,adjustedAt:new Date().toISOString()};
    }
    save();
  }

  async function resolveRange(type,target){
    if(type==='quran')return{rangeStart:1,rangeEnd:MAX_GLOBAL,label:'القرآن كاملًا'};
    if(type==='surah'){
      const s=clamp(target,1,114),start=globalStart(s),end=start+(COUNTS[s-1]||1)-1;return{rangeStart:start,rangeEnd:end,label:surahName(s),targetNumber:s};
    }
    const j=clamp(target,1,30),r=await fetch(`${QURAN_API}/juz/${j}/quran-uthmani`);if(!r.ok)throw new Error('juz');const data=await r.json(),ayahs=data?.data?.ayahs||[];if(!ayahs.length)throw new Error('juz');const first=Number(ayahs[0]?.number),last=Number(ayahs[ayahs.length-1]?.number);if(!first||!last)throw new Error('juz');return{rangeStart:first,rangeEnd:last,label:`الجزء ${j}`,targetNumber:j};
  }

  function defaultDate(){return addDays(localDate(),89)}
  function restorePreviousGoal(){const g=goalBox(),ds=daily();if(Number.isFinite(Number(g.previousNewGoal)))ds.settings.newGoal=Number(g.previousNewGoal);save()}
  function completeGoal(){const g=goalBox();if(!g.active||g.completedAt)return;g.completedAt=new Date().toISOString();g.active=false;g.history.unshift({type:'completed',at:g.completedAt,label:g.label,targetDate:g.targetDate});if(g.history.length>30)g.history.length=30;restorePreviousGoal();save();renderAll();toast('اكتمل هدف الحفظ الطويل المدى 🎉')}
  function cancelGoal(){const g=goalBox();if(!g.active)return;g.cancelledAt=new Date().toISOString();g.history.unshift({type:'cancelled',at:g.cancelledAt,label:g.label,targetDate:g.targetDate});if(g.history.length>30)g.history.length=30;g.active=false;restorePreviousGoal();save();renderAll();toast('تم إيقاف الهدف طويل المدى')}

  async function saveGoal(){
    if(resolving)return;const type=document.getElementById('ltgType').value,target=type==='surah'?Number(document.getElementById('ltgSurah').value):type==='juz'?Number(document.getElementById('ltgJuz').value):null,date=document.getElementById('ltgDate').value,auto=document.getElementById('ltgAuto').checked;
    if(!date)return toast('اختر تاريخًا مستهدفًا');if(daysBetween(localDate(),date)<1)return toast('اختر تاريخًا بعد اليوم');
    const btn=document.getElementById('ltgSave');resolving=true;btn.disabled=true;btn.textContent=type==='juz'?'جاري تحديد حدود الجزء…':'جاري إنشاء الهدف…';
    try{
      const range=await resolveRange(type,target),g=goalBox(),wasActive=g.active,previous=wasActive?g.previousNewGoal:daily().settings.newGoal,temp={...g,...range,type,targetDate:date,autoAdjust:auto,active:true,completedAt:null,cancelledAt:null,createdAt:new Date().toISOString(),createdDate:localDate(),previousNewGoal:previous};temp.baselineMemorized=memorizedSet(temp).size;state.longTermMemGoal=temp;save();applyGoalToPlans({force:true});renderAll();toast('تم إنشاء هدف الحفظ وربطه بالخطة ✓')
    }catch(e){console.error(e);toast(type==='juz'?'تعذر تحديد حدود الجزء الآن؛ يلزم اتصال بالإنترنت عند إنشاء هدف الجزء.':'تعذر إنشاء الهدف الآن')}
    finally{resolving=false;btn.disabled=false;btn.textContent='حفظ وربط الهدف بالخطة'}
  }

  function injectStyles(){if(document.getElementById('werdLongGoalStyle'))return;const s=document.createElement('style');s.id='werdLongGoalStyle';s.textContent=`
    .ltg-hero{background:linear-gradient(145deg,var(--green),#173f34);color:#fff;border-radius:24px;padding:19px}.ltg-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:13px}.ltg-stat{background:rgba(255,255,255,.1);border-radius:15px;padding:9px;text-align:center}.ltg-stat b{display:block;font-size:20px}.ltg-stat small{font-size:8px;opacity:.76}.ltg-progress{height:9px;background:rgba(255,255,255,.17);border-radius:99px;overflow:hidden;margin-top:13px}.ltg-progress span{display:block;height:100%;background:#f0d39b;border-radius:99px;transition:width .3s}.ltg-form{display:grid;grid-template-columns:1fr 1fr;gap:9px}.ltg-field label{display:block;font-size:10px;color:var(--muted);margin-bottom:5px}.ltg-field select,.ltg-field input{width:100%;border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:13px;padding:10px}.ltg-status{padding:12px;border-radius:16px;background:var(--sage)}.ltg-status strong{font-size:17px}.ltg-metrics{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ltg-metric{border:1px solid var(--line);border-radius:15px;padding:10px}.ltg-metric b{display:block;font-size:16px}.ltg-actions{display:flex;gap:7px;flex-wrap:wrap}.ltg-home{margin-top:12px}.ltg-warn{font-size:10px;line-height:1.75;border-radius:14px;padding:10px;background:color-mix(in srgb,var(--sage) 65%,transparent)}@media(max-width:400px){.ltg-grid{grid-template-columns:1fr 1fr}.ltg-form,.ltg-metrics{grid-template-columns:1fr}}
  `;document.head.appendChild(s)}

  function inject(){
    injectStyles();goalBox();const main=document.querySelector('main');if(!main)return;
    if(!document.getElementById('longTermMemGoal')){const sec=document.createElement('section');sec.className='page';sec.id='longTermMemGoal';sec.innerHTML=`
      <div class="section-title"><h3>هدف الحفظ طويل المدى</h3><button class="smallbtn" id="ltgBack">خطة اليوم</button></div>
      <div class="ltg-hero"><div class="row"><div><b style="font-size:18px" id="ltgHeroTitle">حدد وجهتك</b><div style="font-size:10px;opacity:.73;margin-top:3px" id="ltgHeroSub">سورة أو جزء أو القرآن كاملًا</div></div><span style="font-size:28px">🎯</span></div><div class="ltg-grid"><div class="ltg-stat"><b id="ltgPct">0٪</b><small>التقدم</small></div><div class="ltg-stat"><b id="ltgMem">0</b><small>محفوظ</small></div><div class="ltg-stat"><b id="ltgRemain">—</b><small>متبقٍ</small></div><div class="ltg-stat"><b id="ltgDaily">—</b><small>مطلوب يوميًا</small></div></div><div class="ltg-progress"><span id="ltgBar" style="width:0"></span></div></div>
      <div class="card" style="margin-top:10px"><b>إعداد الهدف</b><div class="ltg-form" style="margin-top:10px"><div class="ltg-field"><label>نوع الهدف</label><select id="ltgType"><option value="surah">سورة</option><option value="juz">جزء</option><option value="quran">القرآن كاملًا</option></select></div><div class="ltg-field" id="ltgSurahField"><label>السورة</label><select id="ltgSurah"></select></div><div class="ltg-field" id="ltgJuzField" style="display:none"><label>الجزء</label><select id="ltgJuz">${Array.from({length:30},(_,i)=>`<option value="${i+1}">الجزء ${i+1}</option>`).join('')}</select></div><div class="ltg-field"><label>التاريخ المستهدف</label><input type="date" id="ltgDate"></div></div><label style="display:flex;gap:7px;align-items:center;margin-top:11px;font-size:11px"><input type="checkbox" id="ltgAuto" checked> ضبط هدف الحفظ الجديد تلقائيًا حسب الموعد</label><button class="primary" id="ltgSave" style="width:100%;margin-top:11px">حفظ وربط الهدف بالخطة</button><button class="secondary" id="ltgCancel" style="width:100%;margin-top:7px;display:none">إيقاف الهدف الحالي</button></div>
      <div class="section-title"><h3>حالة المسار</h3><span id="ltgTrack">—</span></div><div class="card" id="ltgStatus"><div class="muted" style="padding:10px 0">أنشئ هدفًا لبدء حساب المسار.</div></div>
      <div class="section-title"><h3>التنفيذ</h3><span>الخطة المرتبطة</span></div><div class="card"><div class="ltg-actions"><button class="smallbtn" id="ltgDailyBtn">🗓 خطة اليوم</button><button class="smallbtn" id="ltgWeeklyBtn">▦ الجدول الأسبوعي</button><button class="smallbtn" id="ltgTrackerBtn">📈 متابعة الحفظ</button></div><div class="ltg-warn" id="ltgCapacity" style="margin-top:10px">سيظهر هنا تقييم قدرة خطتك الحالية على الوصول للموعد.</div></div>`;main.appendChild(sec)}
    addEntries();addHomeCard();wire();syncForm();applyGoalToPlans();renderAll();startWatch();
  }

  function addEntries(){
    const mg=document.querySelector('#more .more-grid');if(mg&&!document.getElementById('moreLongGoal')){const b=document.createElement('button');b.className='more-tile';b.id='moreLongGoal';b.innerHTML='<span class="mi">🎯</span><b>هدف الحفظ</b><small>موعد ومسار طويل المدى</small>';b.onclick=open;mg.insertBefore(b,mg.firstChild)}
    [['#dailyMemPlan .section-title','ltgFromDaily'],['#weeklyMemPlan .section-title','ltgFromWeekly'],['#memorizationTracker .section-title','ltgFromTracker']].forEach(([q,id])=>{const host=document.querySelector(q);if(host&&!document.getElementById(id)){const b=document.createElement('button');b.className='smallbtn';b.id=id;b.textContent='🎯 الهدف';b.onclick=open;host.appendChild(b)}})
    const weeklyPage=document.getElementById('weeklyMemPlan');if(weeklyPage&&!document.getElementById('ltgWeeklyCard')){const card=document.createElement('div');card.className='card';card.id='ltgWeeklyCard';card.style.marginTop='10px';card.innerHTML='<div class="row"><div><b>الهدف طويل المدى</b><div class="muted" id="ltgWeeklyText">لا يوجد هدف نشط</div></div><button class="smallbtn" id="ltgWeeklyOpen">فتح</button></div>';const hero=weeklyPage.querySelector('.wplan-hero');hero?.after(card);document.getElementById('ltgWeeklyOpen').onclick=open}
  }
  function addHomeCard(){const home=document.getElementById('home');if(!home||document.getElementById('ltgHome'))return;const c=document.createElement('div');c.className='card ltg-home';c.id='ltgHome';c.innerHTML='<div class="row"><div><b>🎯 هدف الحفظ</b><div class="muted" id="ltgHomeSub">لا يوجد هدف نشط</div></div><button class="smallbtn" id="ltgHomeBtn">فتح</button></div><div style="height:6px;background:var(--line);border-radius:99px;overflow:hidden;margin-top:9px"><span id="ltgHomeBar" style="display:block;height:100%;width:0;background:var(--green)"></span></div>';home.insertBefore(c,home.firstChild);document.getElementById('ltgHomeBtn').onclick=open}

  function wire(){
    document.getElementById('ltgBack').onclick=()=>window.openWerdDailyMemPlan?.();document.getElementById('ltgType').onchange=syncType;document.getElementById('ltgSave').onclick=saveGoal;document.getElementById('ltgCancel').onclick=cancelGoal;document.getElementById('ltgDailyBtn').onclick=()=>window.openWerdDailyMemPlan?.();document.getElementById('ltgWeeklyBtn').onclick=()=>window.openWerdWeeklyMemPlan?.();document.getElementById('ltgTrackerBtn').onclick=()=>window.openWerdMemorizationTracker?.();
  }
  function syncType(){const type=document.getElementById('ltgType').value;document.getElementById('ltgSurahField').style.display=type==='surah'?'block':'none';document.getElementById('ltgJuzField').style.display=type==='juz'?'block':'none'}
  function syncForm(){const list=(typeof surahs!=='undefined'&&Array.isArray(surahs)&&surahs.length)?surahs:Array.from({length:114},(_,i)=>({number:i+1,name:surahName(i+1)})),sel=document.getElementById('ltgSurah');sel.innerHTML=list.map(x=>`<option value="${x.number}">${x.number}. ${esc(x.name)}</option>`).join('');const g=goalBox();document.getElementById('ltgType').value=g.type||'surah';if(g.type==='surah'&&g.targetNumber)sel.value=String(g.targetNumber);if(g.type==='juz'&&g.targetNumber)document.getElementById('ltgJuz').value=String(g.targetNumber);document.getElementById('ltgDate').min=addDays(localDate(),1);document.getElementById('ltgDate').value=g.targetDate&&daysBetween(localDate(),g.targetDate)>=1?g.targetDate:defaultDate();document.getElementById('ltgAuto').checked=g.autoAdjust!==false;syncType()}
  function open(){go('longTermMemGoal');syncForm();renderAll()}window.openWerdLongTermMemGoal=open;

  function capacityText(st,g){
    if(!st||!g?.active)return'أنشئ هدفًا أولًا لاحتساب قدرة الخطة.';const ds=daily(),desired=clamp(st.requiredCeil,0,15),load=adaptiveFresh(ds.settings.minutes,desired),scheduled=load.fresh;if(st.requiredCeil>15)return`الموعد يحتاج نحو ${st.requiredCeil} آية يوميًا، وهو أعلى من الحد التخطيطي الحالي (15). مدّد التاريخ أو زد الوقت وخفّف تراكم المراجعات.`;if(scheduled>=st.requiredCeil)return`الخطة الحالية قادرة مبدئيًا على جدولة ${scheduled} آية جديدة اليوم مقابل ${st.requiredCeil} مطلوبة يوميًا، قبل تغير نتائج المراجعة.`;if(load.pressure>=1.25)return`تراكم المراجعات يخفض الحفظ الجديد حاليًا إلى ${scheduled} آية، بينما الهدف يحتاج ${st.requiredCeil} يوميًا. الأولوية لتصفية المراجعات ثم سيعود الحمل تدريجيًا.`;return`وقت الخطة الحالي يسمح بجدولة نحو ${scheduled} آية جديدة، بينما الهدف يحتاج ${st.requiredCeil} يوميًا. زد الوقت اليومي أو اختر تاريخًا أبعد.`
  }
  function renderAll(){
    const g=goalBox(),st=status(g),active=!!(g.active&&st);document.getElementById('ltgCancel').style.display=active?'block':'none';
    if(st){document.getElementById('ltgHeroTitle').textContent=g.label||'هدف الحفظ';document.getElementById('ltgHeroSub').textContent=`حتى ${fmtDate(g.targetDate)}`;document.getElementById('ltgPct').textContent=`${st.pct}٪`;document.getElementById('ltgMem').textContent=st.memorized;document.getElementById('ltgRemain').textContent=st.remaining;document.getElementById('ltgDaily').textContent=st.requiredCeil||'✓';document.getElementById('ltgBar').style.width=`${st.pct}%`;document.getElementById('ltgTrack').textContent=st.track;
      const deltaText=st.delta>0?`متقدم بنحو ${st.delta} آية عن المسار`:st.delta<0?`متأخر بنحو ${Math.abs(st.delta)} آية عن المسار`:'مطابق تقريبًا للمسار المتوقع',pace=st.pace>0?`${st.pace.toFixed(st.pace<1?1:0)} آية/يوم`:'لا توجد وتيرة فعلية كافية بعد',project=st.projected?fmtDate(st.projected):'يظهر بعد تسجيل إنجاز فعلي';document.getElementById('ltgStatus').innerHTML=`<div class="ltg-status"><strong>${esc(st.track)}</strong><div class="muted" style="margin-top:4px">${esc(deltaText)}</div></div><div class="ltg-metrics" style="margin-top:9px"><div class="ltg-metric"><small class="muted">المتوقع حتى اليوم</small><b>${st.expected} آية</b></div><div class="ltg-metric"><small class="muted">الأيام حتى الموعد</small><b>${Math.max(0,st.rawDays)+1}</b></div><div class="ltg-metric"><small class="muted">وتيرتك منذ إنشاء الهدف</small><b>${esc(pace)}</b></div><div class="ltg-metric"><small class="muted">إنهاء متوقع بالوتيرة الحالية</small><b>${esc(project)}</b></div></div>`;document.getElementById('ltgCapacity').textContent=capacityText(st,g)}
    else{document.getElementById('ltgHeroTitle').textContent=g.completedAt?`اكتمل: ${g.label||'الهدف'}`:'حدد وجهتك';document.getElementById('ltgHeroSub').textContent=g.completedAt?'يمكنك إنشاء هدف جديد':'سورة أو جزء أو القرآن كاملًا';document.getElementById('ltgPct').textContent=g.completedAt?'100٪':'0٪';document.getElementById('ltgMem').textContent='—';document.getElementById('ltgRemain').textContent='—';document.getElementById('ltgDaily').textContent='—';document.getElementById('ltgBar').style.width=g.completedAt?'100%':'0';document.getElementById('ltgTrack').textContent=g.completedAt?'مكتمل':'—';document.getElementById('ltgStatus').innerHTML=`<div class="muted" style="padding:10px 0">${g.completedAt?'تم إكمال الهدف السابق. يمكنك تحديد هدف جديد وتاريخ جديد.':'أنشئ هدفًا لبدء حساب المسار والتعديل التلقائي.'}</div>`;document.getElementById('ltgCapacity').textContent='سيظهر هنا تقييم قدرة خطتك الحالية على الوصول للموعد.'}
    const home=document.getElementById('ltgHomeSub'),homeBar=document.getElementById('ltgHomeBar'),week=document.getElementById('ltgWeeklyText');if(home)home.textContent=active?`${g.label} • ${st.pct}٪ • ${st.requiredCeil} آية/يوم`:g.completedAt?'الهدف السابق مكتمل ✓':'لا يوجد هدف نشط';if(homeBar)homeBar.style.width=active?`${st.pct}%`:g.completedAt?'100%':'0';if(week)week.textContent=active?`${g.label} • ${st.track} • المطلوب ${st.requiredCeil} آية/يوم`:'لا يوجد هدف نشط';
  }

  function sync(){const g=activeGoal();if(g){const st=status(g);if(st?.remaining===0)completeGoal();else{applyGoalToPlans();renderAll()}}else renderAll()}
  function startWatch(){if(timer)return;timer=setInterval(()=>{if(!document.hidden)sync()},60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync()})}
  window.WerdLongTermGoal={status:()=>status(activeGoal()||goalBox()),sync,open};

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inject);else inject();
})();