// Deep-link router for Werd notification targets
(function(){
  function openRequestedPage(){
    try{
      const u=new URL(location.href),page=u.searchParams.get('open');
      if(!page||typeof go!=='function'||!document.getElementById(page))return;
      go(page);
      u.searchParams.delete('open');
      history.replaceState({},'',u.pathname+(u.searchParams.toString()?`?${u.searchParams}`:'')+u.hash);
    }catch(e){console.warn('Werd deep link',e)}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(openRequestedPage,450));
  else setTimeout(openRequestedPage,450);
  window.addEventListener('pageshow',()=>setTimeout(openRequestedPage,150));
})();

// Direct surah / ayah selection for voice recitation — v96
(function(){
  const COUNTS=[7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
  const NAMES=['الفاتحة','البقرة','آل عمران','النساء','المائدة','الأنعام','الأعراف','الأنفال','التوبة','يونس','هود','يوسف','الرعد','إبراهيم','الحجر','النحل','الإسراء','الكهف','مريم','طه','الأنبياء','الحج','المؤمنون','النور','الفرقان','الشعراء','النمل','القصص','العنكبوت','الروم','لقمان','السجدة','الأحزاب','سبأ','فاطر','يس','الصافات','ص','الزمر','غافر','فصلت','الشورى','الزخرف','الدخان','الجاثية','الأحقاف','محمد','الفتح','الحجرات','ق','الذاريات','الطور','النجم','القمر','الرحمن','الواقعة','الحديد','المجادلة','الحشر','الممتحنة','الصف','الجمعة','المنافقون','التغابن','الطلاق','التحريم','الملك','القلم','الحاقة','المعارج','نوح','الجن','المزمل','المدثر','القيامة','الإنسان','المرسلات','النبأ','النازعات','عبس','التكوير','الانفطار','المطففين','الانشقاق','البروج','الطارق','الأعلى','الغاشية','الفجر','البلد','الشمس','الليل','الضحى','الشرح','التين','العلق','القدر','البينة','الزلزلة','العاديات','القارعة','التكاثر','العصر','الهمزة','الفيل','قريش','الماعون','الكوثر','الكافرون','النصر','المسد','الإخلاص','الفلق','الناس'];
  let installed=false,directMode=false,internalSwitch=false;
  const $=id=>document.getElementById(id);
  function today(){const d=new Date(),y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return`${y}-${m}-${day}`}
  function tracker(){
    if(typeof state==='undefined')return null;
    if(!state.memorizationTracker||typeof state.memorizationTracker!=='object'||Array.isArray(state.memorizationTracker))state.memorizationTracker={};
    const t=state.memorizationTracker;
    if(!t.items||typeof t.items!=='object'||Array.isArray(t.items))t.items={};
    if(!Array.isArray(t.history))t.history=[];
    if(!Array.isArray(t.recitationHistory))t.recitationHistory=[];
    return t
  }
  function injectStyle(){if($('werdDirectRecitationStyle'))return;const s=document.createElement('style');s.id='werdDirectRecitationStyle';s.textContent=`
    .rtest-scope.rtest-has-direct{grid-template-columns:repeat(2,1fr)}
    .rtest-direct-panel{display:none;margin-top:11px;padding:13px;border:1px solid var(--line);border-radius:17px;background:linear-gradient(180deg,var(--card),rgba(124,153,126,.06))}
    .rtest-direct-panel.show{display:block}.rtest-direct-grid{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:8px}.rtest-direct-field label{display:block;font-size:10px;color:var(--muted);margin-bottom:5px}.rtest-direct-field select{width:100%;padding:11px;border:1px solid var(--line);border-radius:13px;background:var(--card);color:var(--ink)}
    .rtest-direct-meta{margin-top:9px;padding:9px 11px;border-radius:12px;background:var(--sage);font-size:11px;line-height:1.7;color:var(--muted)}.rtest-direct-meta b{color:var(--ink)}
    @media(max-width:430px){.rtest-direct-grid{grid-template-columns:1fr 1fr}.rtest-direct-field:first-child{grid-column:1/-1}}
  `;document.head.appendChild(s)}
  function optionList(max,selected=1){let out='';for(let i=1;i<=max;i++)out+=`<option value="${i}"${i===selected?' selected':''}>${i}</option>`;return out}
  function directValues(){const s=Math.max(1,Math.min(114,Number($('rtestDirectSurah')?.value)||1)),max=COUNTS[s-1]||1;let from=Math.max(1,Math.min(max,Number($('rtestDirectFrom')?.value)||1)),to=Math.max(1,Math.min(max,Number($('rtestDirectTo')?.value)||from));if(to<from)to=from;return{s,from,to,max,count:to-from+1,name:NAMES[s-1]||`سورة ${s}`}}
  function refreshDirect(){if(!directMode)return;const v=directValues();if($('rtestDirectTo')&&Number($('rtestDirectTo').value)!==v.to)$('rtestDirectTo').value=String(v.to);const meta=$('rtestDirectMeta');if(meta)meta.innerHTML=v.count===1?`سيتم تسميع <b>${v.name} — الآية ${v.from}</b> فقط.`:`سيتم تسميع <b>${v.name}</b> من الآية <b>${v.from}</b> إلى الآية <b>${v.to}</b> (${v.count} آية).`;if($('rtestAvailable'))$('rtestAvailable').textContent=v.count===1?`آية واحدة محددة: ${v.name} • ${v.from}`:`${v.count} آية محددة من ${v.name}`;const supported=!!(window.SpeechRecognition||window.webkitSpeechRecognition);if($('rtestStart'))$('rtestStart').disabled=!supported}
  function fillAyahs(reset=true){const s=Math.max(1,Math.min(114,Number($('rtestDirectSurah')?.value)||1)),max=COUNTS[s-1]||1,oldFrom=reset?1:Math.min(max,Number($('rtestDirectFrom')?.value)||1),oldTo=reset?1:Math.min(max,Number($('rtestDirectTo')?.value)||oldFrom);$('rtestDirectFrom').innerHTML=optionList(max,oldFrom);$('rtestDirectTo').innerHTML=optionList(max,Math.max(oldFrom,oldTo));refreshDirect()}
  function setNativeVisible(show){const setup=$('rtestSetup');if(!setup)return;const cfg=setup.querySelector('.rtest-config'),nativeSurah=$('rtestSurah')?.parentElement;[cfg,nativeSurah].forEach(n=>{if(n)n.style.display=show?'':'none'})}
  function deactivateDirect(){directMode=false;$('rtestDirectBtn')?.classList.remove('active');$('rtestDirectPanel')?.classList.remove('show');setNativeVisible(true)}
  function activateDirect(){
    const native=document.querySelector('[data-rscope="surah"]');internalSwitch=true;try{if(native?.onclick)native.onclick.call(native)}finally{internalSwitch=false}
    directMode=true;document.querySelectorAll('[data-rscope]').forEach(b=>b.classList.remove('active'));$('rtestDirectBtn')?.classList.add('active');$('rtestDirectPanel')?.classList.add('show');setNativeVisible(false);refreshDirect()
  }
  function ensureItem(t,s,a){const id=`${s}:${a}`;let item=t.items[id];if(!item){item={id,surah:s,ayah:a,surahName:NAMES[s-1]||`سورة ${s}`,mastery:1,addedAt:new Date().toISOString(),lastReviewed:null,nextReview:today(),reviewCount:0,successCount:0,lapses:0,source:'direct-voice-recitation'};t.items[id]=item}else{item.surah=Number(item.surah)||s;item.ayah=Number(item.ayah)||a;if(!item.surahName)item.surahName=NAMES[s-1]||`سورة ${s}`;if(!item.nextReview)item.nextReview=today();if(!item.mastery)item.mastery=1}return item}
  function runDirectStart(baseStart,ctx,event){
    const v=directValues(),t=tracker();if(!t)return typeof toast==='function'&&toast('تعذر تجهيز جلسة التسميع');
    const restore=[];Object.values(t.items).forEach(item=>{if(item&&Number(item.surah)===v.s){restore.push([item,item.archived]);item.archived=true}});
    for(let a=v.from;a<=v.to;a++)ensureItem(t,v.s,a).archived=false;
    const native=document.querySelector('[data-rscope="surah"]');internalSwitch=true;try{if(native?.onclick)native.onclick.call(native)}finally{internalSwitch=false}
    if($('rtestSurah')){$('rtestSurah').value=String(v.s);if(typeof $('rtestSurah').onchange==='function')$('rtestSurah').onchange()}
    const count=$('rtestCount');if(count){count.querySelectorAll('option[data-direct-count]').forEach(o=>o.remove());if(![...count.options].some(o=>Number(o.value)===v.count)){const o=document.createElement('option');o.value=String(v.count);o.textContent=`${v.count} آية`;o.dataset.directCount='1';count.appendChild(o)}count.value=String(v.count)}
    if($('rtestOrder'))$('rtestOrder').value='quran';
    try{return baseStart?.call(ctx,event)}finally{restore.forEach(([item,old])=>{if(old===undefined)delete item.archived;else item.archived=old});directMode=true;document.querySelectorAll('[data-rscope]').forEach(b=>b.classList.remove('active'));$('rtestDirectBtn')?.classList.add('active')}
  }
  function install(){
    if(installed)return;const setup=$('rtestSetup'),scopes=setup?.querySelector('.rtest-scope'),start=$('rtestStart'),support=$('rtestSupport');if(!setup||!scopes||!start||!support)return setTimeout(install,250);installed=true;injectStyle();scopes.classList.add('rtest-has-direct');
    const btn=document.createElement('button');btn.className='smallbtn';btn.id='rtestDirectBtn';btn.type='button';btn.textContent='آية محددة';scopes.appendChild(btn);
    const panel=document.createElement('div');panel.id='rtestDirectPanel';panel.className='rtest-direct-panel';panel.innerHTML=`<b>اختر موضع التسميع</b><div class="rtest-direct-grid" style="margin-top:9px"><div class="rtest-direct-field"><label>السورة</label><select id="rtestDirectSurah">${NAMES.map((n,i)=>`<option value="${i+1}">${i+1}. ${n}</option>`).join('')}</select></div><div class="rtest-direct-field"><label>من الآية</label><select id="rtestDirectFrom"></select></div><div class="rtest-direct-field"><label>إلى الآية</label><select id="rtestDirectTo"></select></div></div><div class="rtest-direct-meta" id="rtestDirectMeta"></div>`;setup.insertBefore(panel,support);
    fillAyahs(true);btn.onclick=activateDirect;
    $('rtestDirectSurah').onchange=()=>fillAyahs(true);$('rtestDirectFrom').onchange=()=>{const f=Number($('rtestDirectFrom').value)||1;if(Number($('rtestDirectTo').value)<f)$('rtestDirectTo').value=String(f);refreshDirect()};$('rtestDirectTo').onchange=()=>{const f=Number($('rtestDirectFrom').value)||1;if(Number($('rtestDirectTo').value)<f)$('rtestDirectTo').value=String(f);refreshDirect()};
    document.querySelectorAll('[data-rscope]').forEach(b=>b.addEventListener('click',()=>{if(!internalSwitch)deactivateDirect()}));
    const baseStart=start.onclick;start.onclick=function(e){if(!directMode)return baseStart?.call(this,e);return runDirectStart(baseStart,this,e)};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,700));else setTimeout(install,700);
  window.addEventListener('pageshow',()=>setTimeout(install,300));
})();