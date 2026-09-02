// Weakness analysis and targeted memorization review for Werd
(function(){
  const INTERVALS={1:1,2:3,3:7,4:14,5:30};
  let reviewQueue=[],reviewIndex=0,revealed=false,loading=false,reviewStats={again:0,hard:0,good:0,easy:0};

  function tracker(){
    if(!state.memorizationTracker||typeof state.memorizationTracker!=='object'||Array.isArray(state.memorizationTracker))state.memorizationTracker={};
    state.memorizationTracker={version:1,items:{},history:[],recitationHistory:[],weakWords:{},settings:{reminderEnabled:true,reminderTime:'19:30',dailyGoal:5},...state.memorizationTracker};
    if(!state.memorizationTracker.items||typeof state.memorizationTracker.items!=='object'||Array.isArray(state.memorizationTracker.items))state.memorizationTracker.items={};
    if(!Array.isArray(state.memorizationTracker.history))state.memorizationTracker.history=[];
    if(!Array.isArray(state.memorizationTracker.recitationHistory))state.memorizationTracker.recitationHistory=[];
    if(!state.memorizationTracker.weakWords||typeof state.memorizationTracker.weakWords!=='object'||Array.isArray(state.memorizationTracker.weakWords))state.memorizationTracker.weakWords={};
    return state.memorizationTracker;
  }
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function localDate(d=new Date()){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return`${y}-${m}-${day}`}
  function addDays(date,days){const d=new Date(`${date}T12:00:00`);d.setDate(d.getDate()+Number(days||0));return localDate(d)}
  function daysBetween(a,b){const x=new Date(`${a}T12:00:00`),y=new Date(`${b}T12:00:00`);return Math.round((y-x)/86400000)}
  function clamp(n,a=0,b=100){return Math.max(a,Math.min(b,Number(n)||0))}
  function mastery(n){return Math.max(1,Math.min(5,Number(n)||1))}
  function normalizeWord(v){return String(v||'').normalize('NFKD').replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g,'').replace(/ـ/g,'').replace(/[إأآٱ]/g,'ا').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/ى/g,'ي').replace(/[^\u0621-\u063A\u0641-\u064A]/g,'').trim()}
  function surahName(n){try{const list=(typeof surahs!=='undefined'&&Array.isArray(surahs)&&surahs.length)?surahs:((typeof fallbackSurahs!=='undefined'&&Array.isArray(fallbackSurahs))?fallbackSurahs:[]);return list.find(x=>Number(x.number)===Number(n))?.name||`سورة ${n}`}catch(e){return`سورة ${n}`}}
  function items(){return Object.values(tracker().items).filter(x=>x&&!x.archived)}

  function ratingPenalty(r){return r==='again'?18:r==='hard'?10:r==='good'?-5:r==='easy'?-9:0}
  function analysisRows(){
    const t=tracker(),today=localDate();
    return items().map(item=>{
      const id=item.id||`${item.surah}:${item.ayah}`;
      const h=t.history.filter(x=>x&&x.id===id).slice(0,12);
      const voices=t.recitationHistory.filter(x=>x&&x.id===id).slice(0,8);
      const base=(5-mastery(item.mastery))*14;
      const lapses=Math.min(18,(Number(item.lapses)||0)*5);
      const recent=Math.max(-14,Math.min(30,h.slice(0,6).reduce((s,x)=>s+ratingPenalty(x.rating),0)));
      const voiceAvg=voices.length?voices.reduce((s,x)=>s+clamp(x.score),0)/voices.length:null;
      const voice=voiceAvg===null?0:Math.max(0,(80-voiceAvg)*0.45);
      const overdueDays=item.nextReview&&String(item.nextReview)<today?Math.max(0,daysBetween(item.nextReview,today)):0;
      const overdue=Math.min(12,overdueDays*2);
      const score=Math.round(clamp(base+lapses+recent+voice+overdue));
      const reasons=[];
      if(mastery(item.mastery)<=2)reasons.push('إتقان منخفض');
      if((Number(item.lapses)||0)>=2)reasons.push(`${item.lapses} تعثرات`);
      const weakRatings=h.filter(x=>x.rating==='again'||x.rating==='hard').length;if(weakRatings)reasons.push(`${weakRatings} تقييمات تحتاج تثبيت`);
      if(voiceAvg!==null&&voiceAvg<80)reasons.push(`تسميع ${Math.round(voiceAvg)}٪`);
      if(overdueDays>0)reasons.push(`متأخرة ${overdueDays} يوم`);
      if(!reasons.length)reasons.push('مستوى مستقر');
      return{...item,id,weakness:score,strength:100-score,voiceAvg:voiceAvg===null?null:Math.round(voiceAvg),reasons,weakRatings,overdueDays};
    }).sort((a,b)=>b.weakness-a.weakness||mastery(a.mastery)-mastery(b.mastery)||a.surah-b.surah||a.ayah-b.ayah)
  }
  function surahRows(rows=analysisRows()){
    const map=new Map();
    for(const x of rows){const k=Number(x.surah),g=map.get(k)||{surah:k,name:x.surahName||surahName(k),items:[],weak:0};g.items.push(x);g.weak+=x.weakness;map.set(k,g)}
    return[...map.values()].map(g=>({...g,count:g.items.length,weakness:Math.round(g.weak/g.items.length),strength:100-Math.round(g.weak/g.items.length),weakCount:g.items.filter(x=>x.weakness>=45).length})).sort((a,b)=>a.strength-b.strength||a.surah-b.surah)
  }
  function topWords(){return Object.values(tracker().weakWords).filter(Boolean).sort((a,b)=>(Number(b.count)||0)-(Number(a.count)||0)||String(b.lastAt||'').localeCompare(String(a.lastAt||''))).slice(0,18)}

  function captureWeakWords(){
    const page=document.getElementById('recitationTest');if(!page)return;
    page.addEventListener('click',e=>{
      const b=e.target.closest?.('[data-rrate]');if(!b)return;
      const t=tracker(),prompt=document.getElementById('rtestPrompt')?.textContent||'',idMatch=prompt.match(/(?:سورة\s*)?(\d+)?/);
      const current=document.querySelectorAll('#rtestWords .rtest-miss,#rtestWords .rtest-sub');
      if(!current.length)return;
      current.forEach(node=>{
        const clone=node.cloneNode(true);clone.querySelectorAll('small').forEach(x=>x.remove());const display=clone.textContent.trim();const norm=normalizeWord(display);if(!norm)return;
        const old=t.weakWords[norm]||{word:display,count:0,ayahs:[],lastAt:null};old.word=display;old.count=(Number(old.count)||0)+1;old.lastAt=new Date().toISOString();
        const hero=document.getElementById('rtestHeroTitle')?.textContent||'';const m=hero.match(/الآية\s+(\d+)/);const sName=hero.split('•')[0]?.trim()||'';const a=m?Number(m[1]):null;if(a){const token=`${sName}|${a}`;old.ayahs=Array.isArray(old.ayahs)?old.ayahs:[];if(!old.ayahs.includes(token))old.ayahs.unshift(token);if(old.ayahs.length>8)old.ayahs.length=8}t.weakWords[norm]=old;
      });
      save();setTimeout(renderAll,50);
    },true);
  }

  function injectStyles(){if(document.getElementById('werdWeaknessStyle'))return;const s=document.createElement('style');s.id='werdWeaknessStyle';s.textContent=`
    .weak-hero{background:linear-gradient(145deg,var(--green),#173f34);color:#fff;border-radius:24px;padding:18px}.weak-hero-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:13px}.weak-stat{background:rgba(255,255,255,.1);border-radius:15px;padding:10px;text-align:center}.weak-stat b{font-size:22px;display:block}.weak-stat small{font-size:9px;opacity:.74}.weak-bar{height:8px;background:var(--line);border-radius:99px;overflow:hidden}.weak-bar span{display:block;height:100%;background:var(--green);border-radius:99px}.weak-item{padding:12px 0;border-bottom:1px solid var(--line)}.weak-item:last-child{border-bottom:0}.weak-score{min-width:48px;text-align:center;font-weight:900}.weak-bad{color:#a7554a}.weak-mid{color:#a47739}.weak-good{color:var(--green)}.weak-tags{display:flex;gap:5px;flex-wrap:wrap;margin-top:6px}.weak-tag{font-size:9px;background:var(--sage);border-radius:99px;padding:4px 7px}.weak-surah{padding:10px 0}.weak-words{display:flex;gap:7px;flex-wrap:wrap}.weak-word{border:1px solid var(--line);background:var(--card);border-radius:14px;padding:8px 10px}.weak-word b{font-size:16px}.weak-word small{display:block;color:var(--muted);font-size:8px;margin-top:2px}.weak-session{text-align:center}.weak-session-prompt{font-size:19px;font-weight:900;margin:8px 0}.weak-reveal{min-height:145px;border:1px dashed var(--line);border-radius:18px;padding:15px;display:flex;align-items:center;justify-content:center;line-height:2.2;font-size:21px}.weak-rate{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.weak-rate button{font-size:10px;padding:9px 4px}.weak-counts{display:flex;gap:6px;flex-wrap:wrap}.weak-counts button.active{background:var(--green);color:#fff;border-color:var(--green)}
    @media(max-width:380px){.weak-hero-grid{grid-template-columns:1fr}.weak-rate{grid-template-columns:1fr 1fr}}
  `;document.head.appendChild(s)}

  function inject(){
    injectStyles();tracker();const main=document.querySelector('main');if(!main)return;
    if(!document.getElementById('weaknessAnalysis')){const sec=document.createElement('section');sec.className='page';sec.id='weaknessAnalysis';sec.innerHTML=`
      <div class="section-title"><h3>تحليل نقاط الضعف</h3><button class="smallbtn" id="weakBack">متابعة الحفظ</button></div>
      <div class="weak-hero"><div class="row"><div><b style="font-size:18px">خريطة حفظك</b><div style="font-size:10px;opacity:.72;margin-top:3px" id="weakHeroSub">تحليل الإتقان والمراجعات والتسميع</div></div><span style="font-size:26px">🧭</span></div><div class="weak-hero-grid"><div class="weak-stat"><b id="weakCount">0</b><small>مواضع تحتاج تقوية</small></div><div class="weak-stat"><b id="weakStrength">0٪</b><small>متوسط الثبات</small></div><div class="weak-stat"><b id="weakWordsCount">0</b><small>كلمات تكررت</small></div></div></div>
      <div class="card" id="weakStartCard" style="margin-top:10px"><div class="row"><div><b>جلسة تقوية ذكية</b><div class="muted">تبدأ من أضعف المواضع بالترتيب.</div></div><span>🎯</span></div><div class="weak-counts" style="margin-top:10px"><button class="smallbtn active" data-weak-count="5">5 آيات</button><button class="smallbtn" data-weak-count="10">10 آيات</button><button class="smallbtn" data-weak-count="20">20 آية</button></div><button class="primary" id="weakStart" style="width:100%;margin-top:10px">ابدأ جلسة التقوية</button></div>
      <div class="card weak-session" id="weakSession" style="display:none;margin-top:10px"><div class="muted" id="weakSessionCounter">—</div><div class="weak-session-prompt" id="weakSessionPrompt">—</div><div class="weak-reveal" id="weakReveal"><span class="muted">اقرأ الآية من حفظك، ثم اكشفها للمقارنة.</span></div><div class="row" style="margin-top:10px"><button class="secondary" id="weakRevealBtn" style="margin:0;flex:1">👁 كشف الآية</button><button class="smallbtn" id="weakTeachBtn">🧠 تلقين</button></div><div style="margin-top:13px"><b>كيف كانت المراجعة؟</b><div class="weak-rate" style="margin-top:8px"><button class="smallbtn" data-weak-rate="again">↺ أعدها</button><button class="smallbtn" data-weak-rate="hard">◔ صعب</button><button class="smallbtn" data-weak-rate="good">✓ جيد</button><button class="smallbtn" data-weak-rate="easy">★ متقن</button></div></div></div>
      <div class="card" id="weakDone" style="display:none;margin-top:10px;text-align:center"><div style="font-size:36px">✓</div><h3 style="margin:5px 0">اكتملت جلسة التقوية</h3><div class="muted" id="weakDoneText">—</div><button class="primary" id="weakAgain" style="width:100%;margin-top:10px">جلسة أخرى</button></div>
      <div class="section-title"><h3>أضعف المواضع</h3><span id="weakListMeta">—</span></div><div class="card" id="weakList"></div>
      <div class="section-title"><h3>خريطة السور</h3><span>الثبات</span></div><div class="card" id="weakSurahs"></div>
      <div class="section-title"><h3>كلمات تحتاج تثبيتًا</h3><span id="weakWordMeta">من التسميع الصوتي</span></div><div class="card"><div class="weak-words" id="weakWordList"></div><div class="muted" id="weakWordEmpty" style="padding:12px 0;line-height:1.7">ستظهر هنا الكلمات القرآنية الصحيحة التي تكررت كمواطن ضعف في جلسات التسميع الجديدة. لا يُحفظ نص ما نطقته.</div></div>`;main.appendChild(sec)}
    addEntries();wire();captureWeakWords();renderAll();
  }

  let selectedCount=5;
  function addEntries(){
    const mg=document.querySelector('#more .more-grid');if(mg&&!document.getElementById('moreWeakAnalysis')){const b=document.createElement('button');b.className='more-tile';b.id='moreWeakAnalysis';b.innerHTML='<span class="mi">🧭</span><b>نقاط ضعف الحفظ</b><small>خريطة ذكية وجلسة تقوية</small>';b.onclick=open;mg.insertBefore(b,mg.firstChild)}
    [['#memorizationTracker .section-title','weakFromTracker','🧭 التحليل'],['#memorizationTest .section-title','weakFromTest','🧭 نقاط الضعف'],['#recitationTest .section-title','weakFromRecitation','🧭 التحليل']].forEach(([q,id,label])=>{const h=document.querySelector(q);if(h&&!document.getElementById(id)){const b=document.createElement('button');b.className='smallbtn';b.id=id;b.textContent=label;b.onclick=open;h.appendChild(b)}})
  }
  function wire(){
    document.getElementById('weakBack').onclick=()=>window.openWerdMemorizationTracker?.();document.getElementById('weakStart').onclick=startReview;document.getElementById('weakRevealBtn').onclick=revealCurrent;document.getElementById('weakTeachBtn').onclick=()=>{const x=reviewQueue[reviewIndex];if(x&&typeof window.openWerdMemorization==='function')window.openWerdMemorization(x.surah,x.ayah)};document.getElementById('weakAgain').onclick=()=>{document.getElementById('weakDone').style.display='none';document.getElementById('weakStartCard').style.display='block';renderAll()};
    document.querySelectorAll('[data-weak-count]').forEach(b=>b.onclick=()=>{selectedCount=Number(b.dataset.weakCount)||5;document.querySelectorAll('[data-weak-count]').forEach(x=>x.classList.toggle('active',x===b))});
    document.querySelectorAll('[data-weak-rate]').forEach(b=>b.onclick=()=>rateCurrent(b.dataset.weakRate));
  }
  function open(){go('weaknessAnalysis');renderAll()}window.openWerdWeaknessAnalysis=open;

  function renderAll(){
    if(!document.getElementById('weaknessAnalysis'))return;const rows=analysisRows(),sr=surahRows(rows),words=topWords(),weak=rows.filter(x=>x.weakness>=45),avg=rows.length?Math.round(rows.reduce((s,x)=>s+x.strength,0)/rows.length):0;
    document.getElementById('weakCount').textContent=weak.length;document.getElementById('weakStrength').textContent=`${avg}٪`;document.getElementById('weakWordsCount').textContent=words.length;document.getElementById('weakListMeta').textContent=`${Math.min(15,rows.length)} من ${rows.length}`;
    const list=document.getElementById('weakList');list.innerHTML=rows.length?rows.slice(0,15).map(x=>`<div class="weak-item"><div class="row"><div><b>${esc(x.surahName||surahName(x.surah))} • الآية ${x.ayah}</b><div class="muted">الإتقان ${mastery(x.mastery)}/5${x.voiceAvg!==null?` • آخر متوسط تسميع ${x.voiceAvg}٪`:''}</div></div><div class="weak-score ${x.weakness>=60?'weak-bad':x.weakness>=35?'weak-mid':'weak-good'}">${x.weakness}<small style="display:block;font-size:7px">ضعف</small></div></div><div class="weak-tags">${x.reasons.map(r=>`<span class="weak-tag">${esc(r)}</span>`).join('')}</div><div class="row" style="margin-top:8px"><div class="weak-bar" style="flex:1"><span style="width:${x.strength}%"></span></div><button class="smallbtn" data-weak-teach="${x.id}">تلقين</button></div></div>`).join(''):'<div class="muted" style="padding:18px;text-align:center">سجّل آيات محفوظة أولًا ليبدأ التحليل.</div>';
    list.querySelectorAll('[data-weak-teach]').forEach(b=>b.onclick=()=>{const x=rows.find(r=>r.id===b.dataset.weakTeach);if(x&&typeof window.openWerdMemorization==='function')window.openWerdMemorization(x.surah,x.ayah)});
    document.getElementById('weakSurahs').innerHTML=sr.length?sr.map(x=>`<div class="weak-surah"><div class="row"><div><b>${esc(x.name)}</b><div class="muted">${x.count} آية • ${x.weakCount} تحتاج تقوية</div></div><b>${x.strength}٪</b></div><div class="weak-bar" style="margin-top:7px"><span style="width:${x.strength}%"></span></div></div>`).join(''):'<div class="muted" style="padding:12px">لا توجد بيانات كافية بعد.</div>';
    const wb=document.getElementById('weakWordList'),empty=document.getElementById('weakWordEmpty');wb.innerHTML=words.map(w=>`<div class="weak-word"><b>${esc(w.word)}</b><small>تكررت ${Number(w.count)||0} مرة</small></div>`).join('');empty.style.display=words.length?'none':'block';
    document.getElementById('weakStart').disabled=!rows.length;
  }

  function startReview(){const rows=analysisRows();if(!rows.length)return toast('لا توجد آيات محفوظة للتحليل');reviewQueue=rows.slice(0,Math.min(selectedCount,rows.length));reviewIndex=0;reviewStats={again:0,hard:0,good:0,easy:0};document.getElementById('weakStartCard').style.display='none';document.getElementById('weakDone').style.display='none';document.getElementById('weakSession').style.display='block';showReview()}
  function showReview(){const x=reviewQueue[reviewIndex];if(!x)return finishReview();revealed=false;loading=false;document.getElementById('weakSessionCounter').textContent=`${reviewIndex+1} من ${reviewQueue.length} • درجة الضعف ${x.weakness}`;document.getElementById('weakSessionPrompt').textContent=`${x.surahName||surahName(x.surah)} • الآية ${x.ayah}`;document.getElementById('weakReveal').innerHTML='<span class="muted">اقرأ الآية من حفظك أولًا، ثم اكشفها للمقارنة.</span>';const rb=document.getElementById('weakRevealBtn');rb.disabled=false;rb.textContent='👁 كشف الآية';document.querySelectorAll('[data-weak-rate]').forEach(b=>b.disabled=false)}
  async function revealCurrent(){if(revealed||loading)return;const x=reviewQueue[reviewIndex];if(!x)return;loading=true;const b=document.getElementById('weakRevealBtn');b.disabled=true;b.textContent='جاري تحميل النص…';try{const r=await fetch(`${API_QURAN}/ayah/${x.surah}:${x.ayah}/quran-uthmani`);if(!r.ok)throw new Error('quran');const j=await r.json(),text=j?.data?.text;if(!text)throw new Error('quran');document.getElementById('weakReveal').innerHTML=`<div><div style="font-family:serif;font-size:22px;line-height:2.25">${esc(text)}</div><div class="muted" style="font-size:10px;margin-top:7px">${esc(x.surahName||surahName(x.surah))} • الآية ${x.ayah}</div></div>`;revealed=true;b.textContent='✓ تم كشف الآية'}catch(e){console.error(e);b.disabled=false;b.textContent='إعادة محاولة';toast('تعذر تحميل نص الآية الآن')}finally{loading=false}}
  function rateCurrent(rating){const x=reviewQueue[reviewIndex],t=tracker(),item=x&&t.items[x.id];if(!item)return;const before=mastery(item.mastery);let after=before,days=1,success=true;if(rating==='again'){after=1;days=1;success=false;item.lapses=(Number(item.lapses)||0)+1}else if(rating==='hard'){after=before;days=Math.max(1,Math.ceil((INTERVALS[after]||1)/2))}else if(rating==='good'){after=Math.min(5,before+1);days=INTERVALS[after]||7}else if(rating==='easy'){after=Math.min(5,before+2);days=Math.max(INTERVALS[after]||14,7)}const today=localDate();item.mastery=after;item.lastReviewed=new Date().toISOString();item.nextReview=addDays(today,days);item.reviewCount=(Number(item.reviewCount)||0)+1;if(success)item.successCount=(Number(item.successCount)||0)+1;t.history.unshift({at:new Date().toISOString(),date:today,id:x.id,surah:item.surah,ayah:item.ayah,rating,before,after,nextReview:item.nextReview,source:'weakness-review'});if(t.history.length>500)t.history.length=500;reviewStats[rating]=(reviewStats[rating]||0)+1;save();document.querySelectorAll('[data-weak-rate]').forEach(b=>b.disabled=true);setTimeout(()=>{reviewIndex++;if(reviewIndex>=reviewQueue.length)finishReview();else showReview()},260)}
  function finishReview(){document.getElementById('weakSession').style.display='none';document.getElementById('weakDone').style.display='block';const strong=(reviewStats.good||0)+(reviewStats.easy||0),weak=(reviewStats.again||0)+(reviewStats.hard||0);document.getElementById('weakDoneText').textContent=`راجعت ${reviewQueue.length} آية • ${strong} جيدة/متقنة • ${weak} تحتاج متابعة`;renderAll()}

  window.WerdWeakness={rows:analysisRows,surahs:surahRows,words:topWords,start:open};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inject);else inject();
})();
