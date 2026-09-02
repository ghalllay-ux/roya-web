// Real daily progress, streaks, weekly stats and achievements for Werd
(function(){
  const STORAGE_KEY='ward_state_v3';
  const BACKUP_KEY='werd_activity_history_v1';
  let initialized=false;

  function safeParse(v,fallback={}){try{return JSON.parse(v)||fallback}catch(e){return fallback}}
  function keyToday(){return typeof todayKey==='function'?todayKey():new Date().toISOString().slice(0,10)}
  function addDays(key,delta){const d=new Date(key+'T12:00:00');d.setDate(d.getDate()+delta);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function dhikrCount(s){return Object.keys(s?.adhkarDone||{}).length}
  function snapshot(s,date){return{
    date:date||s?.date||keyToday(),
    pages:Math.max(0,Number(s?.pages)||0),
    goal:Math.max(1,Number(s?.goal)||20),
    tasbih:Math.max(0,Number(s?.tasbih)||0),
    adhkar:dhikrCount(s),
    khatmaRead:Math.max(0,Number(s?.khatma?.readPages)||0),
    lastSurah:s?.lastSurah?.name||null
  }}
  function active(x){return !!x&&(Number(x.pages)>0||Number(x.tasbih)>0||Number(x.adhkar)>0)}
  function backup(){return safeParse(localStorage.getItem(BACKUP_KEY)||'{}',{})}
  function ensureHistory(){
    if(!state.activityHistory||typeof state.activityHistory!=='object'||Array.isArray(state.activityHistory))state.activityHistory={};
    state.activityHistory={...backup(),...state.activityHistory};
    return state.activityHistory;
  }
  function persistBackup(){try{localStorage.setItem(BACKUP_KEY,JSON.stringify(state.activityHistory||{}))}catch(e){}}
  function archivePrevious(){
    const raw=safeParse(localStorage.getItem(STORAGE_KEY)||'{}',{}),today=keyToday();
    ensureHistory();
    if(raw?.date&&raw.date!==today&&!state.activityHistory[raw.date])state.activityHistory[raw.date]=snapshot(raw,raw.date);
    if(raw?.activityHistory&&typeof raw.activityHistory==='object')state.activityHistory={...raw.activityHistory,...state.activityHistory};
    persistBackup();
  }
  function captureToday(){
    ensureHistory();const today=keyToday();state.activityHistory[today]=snapshot(state,today);
    const keys=Object.keys(state.activityHistory).sort();if(keys.length>120){keys.slice(0,keys.length-120).forEach(k=>delete state.activityHistory[k])}
    persistBackup();
  }
  function streakFromHistory(){
    const h=ensureHistory(),today=keyToday();let cursor=active(h[today])?today:addDays(today,-1),count=0;
    while(active(h[cursor])){count++;cursor=addDays(cursor,-1);if(count>500)break}
    return count;
  }
  function bestStreak(){
    const h=ensureHistory(),keys=Object.keys(h).sort();let best=0,run=0,prev=null;
    for(const k of keys){if(!active(h[k])){run=0;prev=k;continue}run=(prev&&addDays(prev,1)===k)?run+1:1;best=Math.max(best,run);prev=k}
    return best;
  }
  function days(n=7){const today=keyToday();return Array.from({length:n},(_,i)=>addDays(today,i-(n-1)))}
  function totals(keys){
    const h=ensureHistory(),rows=keys.map(k=>h[k]||{date:k,pages:0,tasbih:0,adhkar:0});
    return{rows,pages:rows.reduce((a,x)=>a+(Number(x.pages)||0),0),tasbih:rows.reduce((a,x)=>a+(Number(x.tasbih)||0),0),adhkar:rows.reduce((a,x)=>a+(Number(x.adhkar)||0),0),activeDays:rows.filter(active).length}
  }
  function lifetimeTotals(){return totals(Object.keys(ensureHistory()))}

  function injectStyles(){
    if(document.getElementById('werdProgressStyle'))return;
    const s=document.createElement('style');s.id='werdProgressStyle';s.textContent=`
      .progress-summary{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}.progress-mini{border:1px solid var(--line);background:var(--card);border-radius:18px;padding:14px}.progress-mini b{display:block;font-size:25px;color:var(--green)}.progress-mini small{color:var(--muted)}
      .week-chart{height:155px;display:flex;align-items:end;gap:7px;padding-top:12px}.week-col{flex:1;min-width:0;text-align:center}.week-bar-wrap{height:110px;display:flex;align-items:end;justify-content:center}.week-bar{width:min(28px,76%);min-height:4px;border-radius:9px 9px 4px 4px;background:var(--green);position:relative}.week-bar.today{outline:2px solid var(--gold);outline-offset:2px}.week-val{font-size:10px;color:var(--muted);margin-bottom:5px}.week-day{font-size:10px;color:var(--muted);margin-top:6px;white-space:nowrap}
      .achievement-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}.achievement{border:1px solid var(--line);background:var(--card);border-radius:18px;padding:13px;display:flex;gap:10px;align-items:center}.achievement.locked{opacity:.48;filter:grayscale(.6)}.achievement .ach-icon{font-size:27px}.achievement b{display:block;font-size:13px}.achievement small{display:block;color:var(--muted);font-size:10px;margin-top:3px;line-height:1.5}
      .history-strip{display:grid;grid-template-columns:repeat(10,1fr);gap:5px}.history-dot{aspect-ratio:1;border-radius:6px;background:var(--line);position:relative}.history-dot.on{background:var(--green)}.history-dot.today{box-shadow:0 0 0 2px var(--gold)}
      .streak-card{background:linear-gradient(135deg,color-mix(in srgb,var(--sage) 70%,var(--card)),var(--card));border:1px solid var(--line);border-radius:20px;padding:16px}.streak-number{font-size:34px;font-weight:900;color:var(--green)}
      @media(min-width:470px){.progress-summary{grid-template-columns:repeat(4,1fr)}.achievement-grid{grid-template-columns:repeat(3,1fr)}}
    `;document.head.appendChild(s);
  }

  function injectStats(){
    injectStyles();const page=document.getElementById('stats');if(!page||document.getElementById('realProgressPanel'))return;
    const panel=document.createElement('div');panel.id='realProgressPanel';panel.innerHTML=`
      <div class="section-title"><h3>سلسلة الالتزام</h3><span>تُحسب من نشاطك الحقيقي</span></div>
      <div class="streak-card"><div class="row"><div><div class="streak-number"><span id="realStreak">0</span> 🔥</div><div class="muted">أيام متتالية</div></div><div style="text-align:left"><b id="bestStreak">0 أيام</b><div class="muted">أفضل سلسلة</div></div></div></div>
      <div class="section-title"><h3>آخر 7 أيام</h3><span id="weekActiveLabel">0 أيام نشطة</span></div>
      <div class="progress-summary"><div class="progress-mini"><b id="weekPages">0</b><small>صفحة</small></div><div class="progress-mini"><b id="weekTasbih">0</b><small>تسبيحة</small></div><div class="progress-mini"><b id="weekAdhkar">0</b><small>ذكر مكتمل</small></div><div class="progress-mini"><b id="weekActive">0</b><small>أيام نشطة</small></div></div>
      <div class="card" style="margin-top:10px"><b>القراءة خلال الأسبوع</b><div class="week-chart" id="weekChart"></div></div>
      <div class="section-title"><h3>الإنجازات</h3><span id="achievementCount">0 مكتمل</span></div><div class="achievement-grid" id="achievementGrid"></div>
      <div class="section-title"><h3>آخر 30 يومًا</h3><span>النشاط اليومي</span></div><div class="card"><div class="history-strip" id="historyStrip"></div><div class="muted" style="font-size:10px;margin-top:9px">المربع الأخضر يعني وجود قراءة أو ذكر أو تسبيح في ذلك اليوم.</div></div>`;
    page.appendChild(panel);
    const title=page.querySelector('.section-title span');if(title)title.textContent='سجل محفوظ مع حسابك';
  }

  function achievements(){
    const life=lifetimeTotals(),best=bestStreak(),k=Math.max(0,Number(state.khatma?.readPages)||0);
    return[
      {icon:'🌱',title:'البداية الطيبة',desc:'سجّل أول صفحة قراءة',done:life.pages>=1},
      {icon:'📖',title:'عشرون صفحة',desc:'اقرأ 20 صفحة عبر أيامك',done:life.pages>=20},
      {icon:'📿',title:'مئة تسبيحة',desc:'أكمل 100 تسبيحة',done:life.tasbih>=100},
      {icon:'🌿',title:'صحبة الذكر',desc:'أكمل 20 ذكرًا',done:life.adhkar>=20},
      {icon:'🔥',title:'أسبوع متصل',desc:'حافظ على النشاط 7 أيام',done:best>=7},
      {icon:'◔',title:'ربع الختمة',desc:'تجاوز 151 صفحة في الختمة',done:k>=151},
      {icon:'🏆',title:'ختمة كاملة',desc:'أتم 604 صفحات',done:k>=604}
    ];
  }

  function renderProgress(){
    if(!document.getElementById('realProgressPanel'))return;captureToday();const streak=streakFromHistory(),best=bestStreak(),week=totals(days(7));state.streak=streak;
    const heroStreak=document.getElementById('streak');if(heroStreak)heroStreak.textContent=`${streak} يوم متتالٍ 🌿`;
    document.getElementById('realStreak').textContent=streak;document.getElementById('bestStreak').textContent=`${best} أيام`;document.getElementById('weekPages').textContent=week.pages;document.getElementById('weekTasbih').textContent=week.tasbih;document.getElementById('weekAdhkar').textContent=week.adhkar;document.getElementById('weekActive').textContent=week.activeDays;document.getElementById('weekActiveLabel').textContent=`${week.activeDays} أيام نشطة`;
    const max=Math.max(1,...week.rows.map(x=>Number(x.pages)||0)),today=keyToday(),weekNames=['أح','إث','ثل','أر','خم','جم','سب'];
    document.getElementById('weekChart').innerHTML=week.rows.map(x=>{const d=new Date(x.date+'T12:00:00'),p=Number(x.pages)||0,h=Math.max(4,Math.round(p/max*100));return`<div class="week-col"><div class="week-val">${p}</div><div class="week-bar-wrap"><div class="week-bar ${x.date===today?'today':''}" style="height:${h}%"></div></div><div class="week-day">${weekNames[d.getDay()]}</div></div>`}).join('');
    const ach=achievements(),done=ach.filter(x=>x.done).length;document.getElementById('achievementCount').textContent=`${done} من ${ach.length}`;document.getElementById('achievementGrid').innerHTML=ach.map(x=>`<div class="achievement ${x.done?'':'locked'}"><span class="ach-icon">${x.icon}</span><div><b>${esc(x.title)} ${x.done?'✓':''}</b><small>${esc(x.desc)}</small></div></div>`).join('');
    const hist=ensureHistory();document.getElementById('historyStrip').innerHTML=days(30).map(k=>`<div class="history-dot ${active(hist[k])?'on':''} ${k===today?'today':''}" title="${k}"></div>`).join('');
  }

  archivePrevious();injectStats();
  const baseSave=save;save=function(){captureToday();state.streak=streakFromHistory();baseSave();renderProgress()};
  const baseRenderState=renderState;renderState=function(){ensureHistory();captureToday();state.streak=streakFromHistory();baseRenderState();renderProgress()};
  captureToday();state.streak=streakFromHistory();persistBackup();renderProgress();
  if(!initialized){initialized=true;setTimeout(()=>{try{baseSave()}catch(e){console.warn('progress persist',e)}},120)}
})();
