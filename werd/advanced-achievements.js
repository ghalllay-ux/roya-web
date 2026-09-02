// Advanced memorization achievements and shareable badge gallery for Werd
(function(){
  const COUNTS=[7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
  const JUZ_STARTS=[[1,1],[2,142],[2,253],[3,93],[4,24],[4,148],[5,82],[6,111],[7,88],[8,41],[9,93],[11,6],[12,53],[15,1],[17,1],[18,75],[21,1],[23,1],[25,21],[27,56],[29,46],[33,31],[36,28],[39,32],[41,47],[46,1],[51,31],[58,1],[67,1],[78,1]];
  const FILTERS=[['all','الكل'],['memorization','الحفظ'],['mastery','الإتقان'],['consistency','الاستمرار'],['goals','الأهداف']];
  let activeFilter='all',checking=false,timer=null;

  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function pad(n){return String(n).padStart(2,'0')}
  function localDate(d=new Date()){return`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`}
  function nowISO(){return new Date().toISOString()}
  function globalStart(s){let n=1;for(let i=0;i<s-1;i++)n+=COUNTS[i]||0;return n}
  function toGlobal(s,a){return globalStart(Number(s))+Number(a)-1}
  function surahName(n){try{const list=(typeof surahs!=='undefined'&&Array.isArray(surahs)&&surahs.length)?surahs:((typeof fallbackSurahs!=='undefined'&&Array.isArray(fallbackSurahs))?fallbackSurahs:[]);return list.find(x=>Number(x.number)===Number(n))?.name||`سورة ${n}`}catch(e){return`سورة ${n}`}}
  function fmtDate(v){try{return new Intl.DateTimeFormat('ar-SA',{day:'numeric',month:'short',year:'numeric'}).format(new Date(v))}catch(e){return String(v||'').slice(0,10)}}
  function fmtNum(v){try{return Number(v||0).toLocaleString('ar-SA')}catch(e){return String(v||0)}}

  function tracker(){
    if(!state.memorizationTracker||typeof state.memorizationTracker!=='object'||Array.isArray(state.memorizationTracker))state.memorizationTracker={};
    state.memorizationTracker={version:1,items:{},history:[],...state.memorizationTracker};
    if(!state.memorizationTracker.items||typeof state.memorizationTracker.items!=='object'||Array.isArray(state.memorizationTracker.items))state.memorizationTracker.items={};
    if(!Array.isArray(state.memorizationTracker.history))state.memorizationTracker.history=[];
    return state.memorizationTracker;
  }
  function daily(){
    if(!state.dailyMemPlan||typeof state.dailyMemPlan!=='object'||Array.isArray(state.dailyMemPlan))state.dailyMemPlan={};
    state.dailyMemPlan={version:1,settings:{minutes:30,newGoal:3},days:{},history:[],...state.dailyMemPlan};
    if(!state.dailyMemPlan.days||typeof state.dailyMemPlan.days!=='object'||Array.isArray(state.dailyMemPlan.days))state.dailyMemPlan.days={};
    return state.dailyMemPlan;
  }
  function box(){
    if(!state.advancedAchievements||typeof state.advancedAchievements!=='object'||Array.isArray(state.advancedAchievements))state.advancedAchievements={};
    state.advancedAchievements={version:1,unlocked:{},...state.advancedAchievements};
    if(!state.advancedAchievements.unlocked||typeof state.advancedAchievements.unlocked!=='object'||Array.isArray(state.advancedAchievements.unlocked))state.advancedAchievements.unlocked={};
    return state.advancedAchievements;
  }
  function items(){return Object.values(tracker().items).filter(x=>x&&!x.archived)}
  function globalSet(){const s=new Set();for(const x of items()){const g=Number(x.global)||toGlobal(x.surah,x.ayah);if(g>=1&&g<=6236)s.add(g)}return s}
  function completedSurahs(set=globalSet()){const out=[];for(let s=1;s<=114;s++){const start=globalStart(s),count=COUNTS[s-1]||0;let ok=true;for(let g=start;g<start+count;g++)if(!set.has(g)){ok=false;break}if(ok)out.push(s)}return out}
  function juzRanges(){const starts=JUZ_STARTS.map(([s,a])=>toGlobal(s,a));return starts.map((start,i)=>({juz:i+1,start,end:i<29?starts[i+1]-1:6236}))}
  function completedJuz(set=globalSet()){const out=[];for(const r of juzRanges()){let ok=true;for(let g=r.start;g<=r.end;g++)if(!set.has(g)){ok=false;break}if(ok)out.push(r.juz)}return out}

  function planStatus(p){
    if(!p)return null;const date=String(p.date||''),created=String(p.createdAt||`${date}T00:00:00`),hist=tracker().history.filter(h=>h&&String(h.at||'')>=created),ids=new Set(hist.map(h=>h.id).filter(Boolean));
    const review=(p.review||[]).filter(x=>ids.has(x.id)).length,weak=(p.weak||[]).filter(x=>ids.has(x.id)).length,fresh=(p.confirmedFresh||[]).filter(id=>(p.fresh||[]).some(x=>x.id===id)).length,total=(p.review||[]).length+(p.weak||[]).length+(p.fresh||[]).length,done=review+weak+fresh;return{total,done,complete:total>0&&done>=total}
  }
  function completedPlanDates(){return Object.entries(daily().days).filter(([d,p])=>d<=localDate()&&planStatus(p)?.complete).map(([d])=>d).sort()}
  function longestPlanStreak(){const dates=completedPlanDates();let best=0,run=0,prev=null;for(const d of dates){const cur=new Date(`${d}T12:00:00`);if(prev){const diff=Math.round((cur-prev)/86400000);run=diff===1?run+1:1}else run=1;best=Math.max(best,run);prev=cur}return best}
  function monthlyPerformance(){
    const months={};for(const [date,p] of Object.entries(daily().days)){if(date>localDate())continue;const key=date.slice(0,7);if(!months[key])months[key]={planned:0,total:0,done:0,completeDays:0};const s=planStatus(p);if(!s)continue;months[key].planned++;months[key].total+=s.total;months[key].done+=s.done;if(s.complete)months[key].completeDays++}
    return Object.entries(months).map(([key,x])=>({...x,key,pct:x.total?Math.round(x.done/x.total*100):0}))
  }
  function completedLongGoals(){const g=state.longTermMemGoal;return Array.isArray(g?.history)?g.history.filter(x=>x?.type==='completed').length:0}

  function staticBadges(){
    const all=items(),count=all.length,m4=all.filter(x=>Number(x.mastery)>=4).length,m5=all.filter(x=>Number(x.mastery)>=5).length,sur=completedSurahs(),juz=completedJuz(),streak=longestPlanStreak(),months=monthlyPerformance(),goalDone=completedLongGoals();
    const monthly80=months.some(x=>x.planned>=10&&x.pct>=80),monthly100=months.some(x=>x.planned>=15&&x.pct===100);
    return[
      {id:'mem-10',cat:'memorization',icon:'🌱',title:'عشر آيات',desc:'حفظت 10 آيات موثقة',done:count>=10,progress:`${Math.min(count,10)}/10`},
      {id:'mem-50',cat:'memorization',icon:'🌿',title:'خمسون آية',desc:'حفظت 50 آية موثقة',done:count>=50,progress:`${Math.min(count,50)}/50`},
      {id:'mem-100',cat:'memorization',icon:'📖',title:'مئة آية',desc:'وصلت إلى 100 آية محفوظة',done:count>=100,progress:`${Math.min(count,100)}/100`},
      {id:'mem-500',cat:'memorization',icon:'✨',title:'خمسمئة آية',desc:'وصلت إلى 500 آية محفوظة',done:count>=500,progress:`${Math.min(count,500)}/500`},
      {id:'surah-1x',cat:'memorization',icon:'✦',title:'أول سورة مكتملة',desc:'أتممت حفظ سورة كاملة',done:sur.length>=1,progress:`${sur.length}/1`},
      {id:'surah-10x',cat:'memorization',icon:'📚',title:'عشر سور',desc:'أتممت حفظ 10 سور كاملة',done:sur.length>=10,progress:`${Math.min(sur.length,10)}/10`},
      {id:'juz-1x',cat:'memorization',icon:'◈',title:'أول جزء مكتمل',desc:'أتممت حفظ جزء كامل',done:juz.length>=1,progress:`${juz.length}/1`},
      {id:'juz-5x',cat:'memorization',icon:'🏅',title:'خمسة أجزاء',desc:'أتممت حفظ 5 أجزاء كاملة',done:juz.length>=5,progress:`${Math.min(juz.length,5)}/5`},
      {id:'quran-complete',cat:'memorization',icon:'🏆',title:'حفظ القرآن كاملًا',desc:'جميع آيات القرآن مسجلة محفوظة',done:count>=6236&&juz.length===30,progress:`${Math.min(count,6236)}/6236`},
      {id:'mastery4-25',cat:'mastery',icon:'💎',title:'ثبات 25',desc:'25 آية بدرجة إتقان ثابت أو أعلى',done:m4>=25,progress:`${Math.min(m4,25)}/25`},
      {id:'mastery4-100',cat:'mastery',icon:'🔷',title:'ثبات المئة',desc:'100 آية بدرجة إتقان ثابت أو أعلى',done:m4>=100,progress:`${Math.min(m4,100)}/100`},
      {id:'mastery5-50',cat:'mastery',icon:'⭐',title:'إتقان خمسين',desc:'50 آية وصلت إلى مستوى متقن',done:m5>=50,progress:`${Math.min(m5,50)}/50`},
      {id:'streak-7',cat:'consistency',icon:'🔥',title:'سبعة أيام',desc:'أكملت خطة الحفظ 7 أيام متتالية',done:streak>=7,progress:`${Math.min(streak,7)}/7`},
      {id:'streak-14',cat:'consistency',icon:'🔥',title:'أسبوعان متصلان',desc:'أكملت الخطة 14 يومًا متتاليًا',done:streak>=14,progress:`${Math.min(streak,14)}/14`},
      {id:'streak-30',cat:'consistency',icon:'🛡',title:'ثلاثون يومًا',desc:'أكملت الخطة 30 يومًا متتاليًا',done:streak>=30,progress:`${Math.min(streak,30)}/30`},
      {id:'month-80',cat:'goals',icon:'📅',title:'شهر ثابت',desc:'التزام شهري 80٪ أو أكثر مع 10 أيام مخططة',done:monthly80,progress:monthly80?'مكتمل':'قيد التقدم'},
      {id:'month-100',cat:'goals',icon:'🌟',title:'شهر كامل',desc:'إنجاز 100٪ مع 15 يومًا مخططًا على الأقل',done:monthly100,progress:monthly100?'مكتمل':'قيد التقدم'},
      {id:'long-goal',cat:'goals',icon:'🎯',title:'هدف تحقق',desc:'أكملت هدف حفظ طويل المدى',done:goalDone>=1,progress:`${goalDone}/1`}
    ];
  }
  function dynamicBadges(){const set=globalSet(),out=[];for(const s of completedSurahs(set))out.push({id:`surah:${s}`,cat:'memorization',icon:'✦',title:`${surahName(s)}`,desc:'سورة مكتملة الحفظ',done:true});for(const j of completedJuz(set))out.push({id:`juz:${j}`,cat:'memorization',icon:'◈',title:`الجزء ${j}`,desc:'جزء مكتمل الحفظ',done:true});return out}
  function catalog(){return[...dynamicBadges(),...staticBadges()]}

  function unlockNew(showToast=true){
    if(checking)return[];checking=true;try{const b=box(),newOnes=[];for(const a of catalog()){if(a.done&&!b.unlocked[a.id]){b.unlocked[a.id]={at:nowISO(),title:a.title,icon:a.icon,cat:a.cat};newOnes.push(a)}}if(newOnes.length){try{if(typeof baseAchievementSave==='function')baseAchievementSave();else if(typeof save==='function')save()}catch(e){}if(showToast){const a=newOnes[0];toast(`شارة جديدة: ${a.icon} ${a.title}${newOnes.length>1?` +${newOnes.length-1}`:''}`)}}return newOnes}finally{checking=false}}
  function unlockedAt(id){return box().unlocked[id]?.at||null}

  function injectStyles(){if(document.getElementById('werdAdvancedAchStyle'))return;const s=document.createElement('style');s.id='werdAdvancedAchStyle';s.textContent=`
    .aach-hero{background:linear-gradient(145deg,var(--green),#173f34);color:#fff;border-radius:25px;padding:19px}.aach-hero-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:13px}.aach-hero-stat{background:rgba(255,255,255,.1);border-radius:15px;padding:10px;text-align:center}.aach-hero-stat b{display:block;font-size:21px}.aach-hero-stat small{font-size:8px;opacity:.76}.aach-filters{display:flex;gap:6px;overflow:auto;padding-bottom:2px}.aach-filters button{white-space:nowrap}.aach-filters .active{background:var(--green);color:#fff;border-color:var(--green)}.aach-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}.aach-card{border:1px solid var(--line);background:var(--card);border-radius:20px;padding:13px;position:relative;min-height:150px}.aach-card.locked{opacity:.56}.aach-medal{width:50px;height:50px;border-radius:50%;display:grid;place-items:center;font-size:26px;background:var(--sage);border:1px solid var(--line);margin-bottom:9px}.aach-card.unlocked .aach-medal{background:linear-gradient(145deg,#f4dfad,#d9b56b);box-shadow:0 7px 20px rgba(0,0,0,.09)}.aach-card b{font-size:13px;display:block}.aach-card small{font-size:9px;color:var(--muted);line-height:1.55;display:block;margin-top:4px}.aach-lock{position:absolute;top:10px;left:10px;font-size:10px;color:var(--muted)}.aach-share{margin-top:9px}.aach-share button{font-size:9px;padding:6px 9px}.aach-section{margin-top:12px}.aach-completed-list{display:flex;gap:6px;flex-wrap:wrap}.aach-chip{background:var(--sage);border:1px solid var(--line);border-radius:99px;padding:6px 9px;font-size:9px}.aach-home{margin-top:10px}@media(max-width:390px){.aach-grid{grid-template-columns:1fr}.aach-hero-grid{grid-template-columns:1fr 1fr 1fr}}
  `;document.head.appendChild(s)}
  function inject(){
    injectStyles();tracker();daily();box();const main=document.querySelector('main');if(!main)return;
    if(!document.getElementById('advancedAchievements')){const sec=document.createElement('section');sec.className='page';sec.id='advancedAchievements';sec.innerHTML=`
      <div class="section-title"><h3>معرض الإنجازات</h3><button class="smallbtn" id="aachBack">الإحصائيات</button></div>
      <div class="aach-hero"><div class="row"><div><b style="font-size:19px">شارات الحفظ</b><div style="font-size:10px;opacity:.72">تُفتح من إنجازك الفعلي وتبقى محفوظة مع حسابك</div></div><span style="font-size:28px">🏅</span></div><div class="aach-hero-grid"><div class="aach-hero-stat"><b id="aachCount">0</b><small>شارة مفتوحة</small></div><div class="aach-hero-stat"><b id="aachSurahs">0</b><small>سورة مكتملة</small></div><div class="aach-hero-stat"><b id="aachJuz">0</b><small>جزء مكتمل</small></div></div></div>
      <div class="card aach-section"><div class="aach-filters" id="aachFilters"></div></div>
      <div class="section-title"><h3>الشارات</h3><span id="aachMeta">—</span></div><div class="aach-grid" id="aachGrid"></div>
      <div class="section-title"><h3>المكتمل بالتفصيل</h3><span>سور وأجزاء</span></div><div class="card"><b>السور المكتملة</b><div class="aach-completed-list" id="aachSurahList" style="margin-top:9px"></div><b style="display:block;margin-top:13px">الأجزاء المكتملة</b><div class="aach-completed-list" id="aachJuzList" style="margin-top:9px"></div></div>
      <div class="muted" style="font-size:9px;line-height:1.7;margin-top:10px">الشارات تعتمد على الآيات المسجلة في متابعة الحفظ. إكمال السورة أو الجزء يتطلب وجود جميع آيات النطاق ضمن الحفظ الموثق في «ورد».</div>`;main.appendChild(sec)}
    addEntries();wire();unlockNew(false);render();startWatch();
  }
  function addEntries(){
    const mg=document.querySelector('#more .more-grid');if(mg&&!document.getElementById('moreAdvancedAchievements')){const b=document.createElement('button');b.className='more-tile';b.id='moreAdvancedAchievements';b.innerHTML='<span class="mi">🏅</span><b>معرض الإنجازات</b><small>شارات الحفظ والإتقان</small>';b.onclick=openPage;mg.insertBefore(b,mg.firstChild)}
    const stats=document.querySelector('#stats #realProgressPanel .section-title:nth-of-type(3)');if(stats&&!document.getElementById('aachFromStats')){const b=document.createElement('button');b.className='smallbtn';b.id='aachFromStats';b.textContent='🏅 المعرض';b.onclick=openPage;stats.appendChild(b)}
    [['#monthlyMemDashboard .section-title','aachFromMonth'],['#longTermMemGoal .section-title','aachFromGoal'],['#achievementReport .section-title','aachFromReport']].forEach(([q,id])=>{const host=document.querySelector(q);if(host&&!document.getElementById(id)){const b=document.createElement('button');b.className='smallbtn';b.id=id;b.textContent='🏅 الشارات';b.onclick=openPage;host.appendChild(b)}})
    const home=document.getElementById('home');if(home&&!document.getElementById('aachHome')){const c=document.createElement('div');c.className='card aach-home';c.id='aachHome';c.innerHTML='<div class="row"><div><b>🏅 إنجازات الحفظ</b><div class="muted" id="aachHomeSub">—</div></div><button class="smallbtn" id="aachHomeBtn">المعرض</button></div>';home.insertBefore(c,home.firstChild);document.getElementById('aachHomeBtn').onclick=openPage}
  }
  function wire(){document.getElementById('aachBack').onclick=()=>go('stats');document.getElementById('aachFilters').onclick=e=>{const b=e.target.closest('button[data-filter]');if(!b)return;activeFilter=b.dataset.filter;render()};document.getElementById('aachGrid').onclick=e=>{const b=e.target.closest('button[data-share]');if(b)shareBadge(b.dataset.share)}}
  function openPage(){go('advancedAchievements');unlockNew(false);render()}window.openWerdAdvancedAchievements=openPage;

  function visibleCatalog(){const arr=catalog(),u=box().unlocked;return arr.filter(a=>activeFilter==='all'||a.cat===activeFilter).sort((a,b)=>Number(!!u[b.id])-Number(!!u[a.id])||a.title.localeCompare(b.title,'ar'))}
  function render(){
    if(!document.getElementById('aachGrid'))return;unlockNew(false);const u=box().unlocked,set=globalSet(),sur=completedSurahs(set),juz=completedJuz(set),all=catalog(),opened=all.filter(a=>u[a.id]).length;
    document.getElementById('aachCount').textContent=fmtNum(opened);document.getElementById('aachSurahs').textContent=fmtNum(sur.length);document.getElementById('aachJuz').textContent=fmtNum(juz.length);document.getElementById('aachHomeSub').textContent=`${opened} شارة • ${sur.length} سورة • ${juz.length} جزء`;
    document.getElementById('aachFilters').innerHTML=FILTERS.map(([id,label])=>`<button class="smallbtn ${activeFilter===id?'active':''}" data-filter="${id}">${label}</button>`).join('');const rows=visibleCatalog();document.getElementById('aachMeta').textContent=`${rows.filter(a=>u[a.id]).length} مفتوحة`;
    document.getElementById('aachGrid').innerHTML=rows.map(a=>{const at=unlockedAt(a.id),on=!!at;return`<div class="aach-card ${on?'unlocked':'locked'}"><span class="aach-lock">${on?'✓ مفتوحة':'🔒'}</span><div class="aach-medal">${a.icon}</div><b>${esc(a.title)}</b><small>${esc(a.desc)}</small><small>${on?`فُتحت ${esc(fmtDate(at))}`:`التقدم: ${esc(a.progress||'لم يكتمل')}`}</small>${on?`<div class="aach-share"><button class="smallbtn" data-share="${esc(a.id)}">↗ مشاركة الشارة</button></div>`:''}</div>`}).join('');
    document.getElementById('aachSurahList').innerHTML=sur.length?sur.map(s=>`<span class="aach-chip">✦ ${esc(surahName(s))}</span>`).join(''):'<span class="muted">لا توجد سورة مكتملة بعد.</span>';document.getElementById('aachJuzList').innerHTML=juz.length?juz.map(j=>`<span class="aach-chip">◈ الجزء ${j}</span>`).join(''):'<span class="muted">لا يوجد جزء مكتمل بعد.</span>';
  }

  function badgeById(id){return catalog().find(a=>a.id===id&&unlockedAt(id))||null}
  function rounded(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}
  function badgeCanvas(a){
    const c=document.createElement('canvas');c.width=1080;c.height=1080;const x=c.getContext('2d');x.textAlign='center';x.textBaseline='middle';x.direction='rtl';const g=x.createLinearGradient(0,0,1080,1080);g.addColorStop(0,'#163f34');g.addColorStop(1,'#0d2f28');x.fillStyle=g;x.fillRect(0,0,1080,1080);x.fillStyle='rgba(255,255,255,.06)';for(let i=0;i<8;i++){x.beginPath();x.arc(100+i*145,100+(i%2)*70,95,0,Math.PI*2);x.fill()}
    x.fillStyle='#f5ead4';x.font='900 54px system-ui,-apple-system,"Arial"';x.fillText('وَرْد',540,100);x.font='500 28px system-ui,-apple-system,"Arial"';x.fillStyle='rgba(245,234,212,.72)';x.fillText('شارة إنجاز في حفظ القرآن',540,157);
    x.fillStyle='#f1d39a';x.beginPath();x.arc(540,420,170,0,Math.PI*2);x.fill();x.fillStyle='#173f34';x.font='150px system-ui,-apple-system,"Arial"';x.fillText(a.icon,540,425);
    x.fillStyle='#fffaf0';x.font='900 62px system-ui,-apple-system,"Arial"';x.fillText(a.title,540,660);x.font='500 31px system-ui,-apple-system,"Arial"';x.fillStyle='rgba(255,250,240,.78)';wrapText(x,a.desc,540,725,820,46);
    x.fillStyle='rgba(255,255,255,.1)';rounded(x,275,860,530,90,28);x.fillStyle='#f5ead4';x.font='600 26px system-ui,-apple-system,"Arial"';x.fillText(`فُتحت ${fmtDate(unlockedAt(a.id))}`,540,905);x.font='500 22px system-ui,-apple-system,"Arial"';x.fillStyle='rgba(245,234,212,.62)';x.fillText('إنجاز موثق من تطبيق ورد',540,1010);return c
  }
  function wrapText(ctx,text,x,y,maxWidth,lineHeight){const words=String(text).split(/\s+/),lines=[];let line='';for(const w of words){const test=line?`${line} ${w}`:w;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=w}else line=test}if(line)lines.push(line);lines.slice(0,3).forEach((l,i)=>ctx.fillText(l,x,y+i*lineHeight))}
  function blobFromCanvas(c){return new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(new Error('blob')),'image/png',1))}
  async function shareBadge(id){const a=badgeById(id);if(!a)return toast('هذه الشارة غير مفتوحة');try{const blob=await blobFromCanvas(badgeCanvas(a)),file=new File([blob],`werd-badge-${id.replace(/[^a-z0-9-]+/gi,'-')}.png`,{type:'image/png'});if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){await navigator.share({title:`شارة ${a.title} • ورد`,text:`حققت شارة «${a.title}» في ورد.`,files:[file]});return}downloadBlob(blob,file.name);toast('تم تجهيز صورة الشارة ✓')}catch(e){if(e?.name!=='AbortError'){console.error(e);toast('تعذر مشاركة الشارة على هذا الجهاز')}}}
  function downloadBlob(blob,name){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1500)}

  function startWatch(){if(timer)return;timer=setInterval(()=>{if(!document.hidden){const n=unlockNew(true);if(n.length)render()}},30000);document.addEventListener('visibilitychange',()=>{if(!document.hidden){const n=unlockNew(true);if(n.length)render()}})}

  let baseAchievementSave=null;try{baseAchievementSave=typeof save==='function'?save:null;if(baseAchievementSave){save=function(){baseAchievementSave();setTimeout(()=>{const n=unlockNew(true);if(n.length)render()},0)}}}catch(e){}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inject);else inject();
})();