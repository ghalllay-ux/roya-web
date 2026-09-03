// Werd v94 — allow iPhone voice recitation even when no verses were previously saved.
(function(){
  const SURAHS=['الفاتحة','البقرة','آل عمران','النساء','المائدة','الأنعام','الأعراف','الأنفال','التوبة','يونس','هود','يوسف','الرعد','إبراهيم','الحجر','النحل','الإسراء','الكهف','مريم','طه','الأنبياء','الحج','المؤمنون','النور','الفرقان','الشعراء','النمل','القصص','العنكبوت','الروم','لقمان','السجدة','الأحزاب','سبأ','فاطر','يس','الصافات','ص','الزمر','غافر','فصلت','الشورى','الزخرف','الدخان','الجاثية','الأحقاف','محمد','الفتح','الحجرات','ق','الذاريات','الطور','النجم','القمر','الرحمن','الواقعة','الحديد','المجادلة','الحشر','الممتحنة','الصف','الجمعة','المنافقون','التغابن','الطلاق','التحريم','الملك','القلم','الحاقة','المعارج','نوح','الجن','المزمل','المدثر','القيامة','الإنسان','المرسلات','النبأ','النازعات','عبس','التكوير','الانفطار','المطففين','الانشقاق','البروج','الطارق','الأعلى','الغاشية','الفجر','البلد','الشمس','الليل','الضحى','الشرح','التين','العلق','القدر','البينة','الزلزلة','العاديات','القارعة','التكاثر','العصر','الهمزة','الفيل','قريش','الماعون','الكوثر','الكافرون','النصر','المسد','الإخلاص','الفلق','الناس'];
  const TEMP='__werd_rtest_temp__';
  let tempKeys=[];
  const $=id=>document.getElementById(id);
  function tracker(){
    if(!window.state)return null;
    state.memorizationTracker=state.memorizationTracker&&typeof state.memorizationTracker==='object'?state.memorizationTracker:{};
    state.memorizationTracker.items=state.memorizationTracker.items&&typeof state.memorizationTracker.items==='object'?state.memorizationTracker.items:{};
    return state.memorizationTracker;
  }
  function realItems(){const t=tracker();return t?Object.values(t.items).filter(x=>x&&!x.archived&&!x.__recitationTemp):[]}
  function cleanup(persist=false){
    const t=tracker();if(!t)return;
    Object.keys(t.items).forEach(k=>{if(k.startsWith(TEMP)||t.items[k]?.__recitationTemp)delete t.items[k]});tempKeys=[];
    if(persist){try{save?.()}catch(_){}}
  }
  function fillAllSurahs(){
    const sel=$('rtestSurah');if(!sel)return;
    const old=Number(sel.value)||1;
    sel.innerHTML=SURAHS.map((n,i)=>`<option value="${i+1}">${i+1}. ${n}</option>`).join('');
    sel.value=String(Math.max(1,Math.min(114,old)));sel.disabled=false;
  }
  function selectSurahScope(){
    const b=document.querySelector('[data-rscope="surah"]');if(b&&!b.classList.contains('active'))b.click();fillAllSurahs();
  }
  async function seedSelected(){
    const t=tracker();if(!t)throw Error('tracker');
    cleanup(false);
    const s=Math.max(1,Math.min(114,Number($('rtestSurah')?.value)||1));
    const need=Math.max(1,Math.min(10,Number($('rtestCount')?.value)||3));
    const r=await fetch(`https://api.alquran.cloud/v1/surah/${s}/quran-uthmani`,{cache:'no-store'});if(!r.ok)throw Error('quran');
    const j=await r.json(),ayahs=Array.isArray(j?.data?.ayahs)?j.data.ayahs.slice(0,need):[];if(!ayahs.length)throw Error('empty');
    const today=new Date().toISOString().slice(0,10),name=j?.data?.name||SURAHS[s-1]||`سورة ${s}`;
    ayahs.forEach(a=>{const key=`${TEMP}${s}_${a.numberInSurah}`;tempKeys.push(key);t.items[key]={id:key,surah:s,surahName:name,ayah:Number(a.numberInSurah),text:String(a.text||''),mastery:3,nextReview:today,reviewCount:0,successCount:0,archived:false,__recitationTemp:true}});
  }
  function enhance(){
    const page=$('recitationTest'),start=$('rtestStart'),sel=$('rtestSurah');if(!page||!start||!sel||start.dataset.v94)return false;
    start.dataset.v94='1';cleanup(false);
    const originalStart=start.onclick;
    const originalBack=$('rtestBack')?.onclick;
    if(!realItems().length){selectSurahScope();const av=$('rtestAvailable');if(av)av.textContent='يمكنك التسميع من أي سورة حتى لو لم تحفظ آيات داخل المتابعة بعد';start.disabled=false}
    start.onclick=async function(e){
      if(realItems().length){return originalStart?.call(this,e)}
      e?.preventDefault?.();selectSurahScope();start.disabled=true;const old=start.textContent;start.textContent='جاري تجهيز الآيات…';
      try{await seedSelected();start.disabled=false;start.textContent=old;originalStart?.call(this,e);tempKeys.forEach(k=>{const t=tracker();if(t?.items?.[k])t.items[k].archived=true})}
      catch(err){console.warn('recitation seed failed',err);start.disabled=false;start.textContent=old;try{toast?.('تعذر تجهيز آيات التسميع. تحقق من الاتصال ثم أعد المحاولة')}catch(_){}}
    };
    const back=$('rtestBack');if(back)back.onclick=function(e){cleanup(true);return originalBack?.call(this,e)};
    const done=$('rtestDone');if(done){const mo=new MutationObserver(()=>{if(done.style.display!=='none'&&tempKeys.length)cleanup(true)});mo.observe(done,{attributes:true,attributeFilter:['style','class']})}
    document.querySelectorAll('[data-rscope]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.rscope==='surah'&&!realItems().length){setTimeout(()=>{fillAllSurahs();start.disabled=false;const av=$('rtestAvailable');if(av)av.textContent='اختر السورة ثم ابدأ جلسة التسميع'},0)}},true));
    return true;
  }
  let tries=0;const t=setInterval(()=>{if(enhance()||++tries>80)clearInterval(t)},250);
  document.addEventListener('click',e=>{if(e.target?.closest?.('[data-mem-action="recitation"],#openRecitationTest,[onclick*="Recitation"]'))setTimeout(enhance,60)},true);
})();