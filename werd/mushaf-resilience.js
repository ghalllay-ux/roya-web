// Resilient Mushaf network layer. iPhone/iPad use Quran.com by_page first; other devices keep AlQuran Cloud first.
(function(){
  const nativeFetch=window.fetch.bind(window);
  const isAppleTouch=/iPhone|iPad|iPod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const COUNTS=[7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
  const FALLBACK_NAMES=['الفاتحة','البقرة','آل عمران','النساء','المائدة','الأنعام','الأعراف','الأنفال','التوبة','يونس','هود','يوسف','الرعد','إبراهيم','الحجر','النحل','الإسراء','الكهف','مريم','طه','الأنبياء','الحج','المؤمنون','النور','الفرقان','الشعراء','النمل','القصص','العنكبوت','الروم','لقمان','السجدة','الأحزاب','سبأ','فاطر','يس','الصافات','ص','الزمر','غافر','فصلت','الشورى','الزخرف','الدخان','الجاثية','الأحقاف','محمد','الفتح','الحجرات','ق','الذاريات','الطور','النجم','القمر','الرحمن','الواقعة','الحديد','المجادلة','الحشر','الممتحنة','الصف','الجمعة','المنافقون','التغابن','الطلاق','التحريم','الملك','القلم','الحاقة','المعارج','نوح','الجن','المزمل','المدثر','القيامة','الإنسان','المرسلات','النبأ','النازعات','عبس','التكوير','الانفطار','المطففين','الانشقاق','البروج','الطارق','الأعلى','الغاشية','الفجر','البلد','الشمس','الليل','الضحى','الشرح','التين','العلق','القدر','البينة','الزلزلة','العاديات','القارعة','التكاثر','العصر','الهمزة','الفيل','قريش','الماعون','الكوثر','الكافرون','النصر','المسد','الإخلاص','الفلق','الناس'];
  const startOf=s=>1+COUNTS.slice(0,s-1).reduce((a,b)=>a+b,0);
  function withTimeout(url,opts={},ms=6500){const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);return nativeFetch(url,{...opts,signal:c.signal,cache:'no-store'}).finally(()=>clearTimeout(t))}
  function surahMeta(n){const list=(Array.isArray(window.surahs)&&window.surahs.length)?window.surahs:(window.fallbackSurahs||[]);const x=list.find(v=>Number(v.number)===Number(n));return x||{number:n,name:FALLBACK_NAMES[n-1]||`سورة ${n}`,numberOfAyahs:COUNTS[n-1]||0}}
  function toAlQuranShape(verses,page){
    const ayahs=(Array.isArray(verses)?verses:[]).map(v=>{const [s0,a0]=String(v.verse_key||'').split(':').map(Number),s=Number(v.chapter_id)||s0,a=Number(v.verse_number)||a0,surah=surahMeta(s);return{number:Number(v.id)||startOf(s)+a-1,numberInSurah:a,text:v.text_uthmani||v.text_uthmani_simple||v.text||'',juz:Number(v.juz_number)||null,page:Number(v.page_number)||Number(page),hizbQuarter:Number(v.rub_el_hizb_number)||((Number(v.hizb_number)||1)-1)*4+1,surah:{number:s,name:surah.name,englishName:surah.englishName||'',englishNameTranslation:surah.englishNameTranslation||'',numberOfAyahs:surah.numberOfAyahs||COUNTS[s-1]||0,revelationType:surah.revelationType||''}}}).filter(a=>a.surah.number&&a.numberInSurah&&a.text);
    if(!ayahs.length)throw new Error('qurancom_transform_empty');
    return new Response(JSON.stringify({code:200,status:'OK',data:{number:Number(page),ayahs}}),{status:200,headers:{'Content-Type':'application/json'}})
  }
  async function quranComByPage(page){
    const url=`https://api.quran.com/api/v4/verses/by_page/${encodeURIComponent(page)}?language=ar&words=false&fields=text_uthmani,juz_number,hizb_number,rub_el_hizb_number,page_number&per_page=50`;
    const r=await withTimeout(url,{headers:{Accept:'application/json'}},6500);if(!r.ok)throw new Error(`qurancom_page_${r.status}`);const j=await r.json();return toAlQuranShape(j.verses,page)
  }
  async function quranComScriptPage(page){
    const url=`https://api.quran.com/api/v4/quran/verses/uthmani?page_number=${encodeURIComponent(page)}`;
    const r=await withTimeout(url,{headers:{Accept:'application/json'}},6500);if(!r.ok)throw new Error(`qurancom_script_${r.status}`);const j=await r.json();return toAlQuranShape(j.verses,page)
  }
  async function alQuranPage(raw,init){const r=await withTimeout(raw,init,6000);if(!r.ok)throw new Error(`alquran_${r.status}`);return r}
  async function resilientPage(raw,page,init){
    if(isAppleTouch){
      try{return await quranComByPage(page)}catch(e){console.warn('Werd Mushaf Quran.com by_page failed',e)}
      try{return await quranComScriptPage(page)}catch(e){console.warn('Werd Mushaf Quran.com script fallback failed',e)}
      return alQuranPage(raw,init)
    }
    try{return await alQuranPage(raw,init)}catch(e){console.warn('Werd Mushaf primary source failed',e)}
    try{return await quranComByPage(page)}catch(e){console.warn('Werd Mushaf by_page fallback failed',e)}
    return quranComScriptPage(page)
  }
  window.fetch=function(input,init){
    const raw=typeof input==='string'?input:input?.url||'';
    const m=raw.match(/^https:\/\/api\.alquran\.cloud\/v1\/page\/(\d+)\/quran-uthmani(?:\?.*)?$/i);
    if(!m)return nativeFetch(input,init);
    return resilientPage(raw,Number(m[1]),init)
  };
  function installRetry(){
    const sheet=document.getElementById('mushafSheet');if(!sheet)return;const txt=sheet.textContent||'';if(!txt.includes('تعذر تحميل الصفحة')||sheet.querySelector('.mushaf-retry-btn'))return;const b=document.createElement('button');b.className='secondary mushaf-retry-btn';b.style.margin='14px auto 0';b.style.display='block';b.textContent='إعادة المحاولة';b.onclick=()=>{const n=Number(document.getElementById('mushafPageInput')?.value||1);if(typeof window.openMushaf==='function')window.openMushaf(n)};sheet.appendChild(b)
  }
  const mo=new MutationObserver(()=>installRetry());
  document.addEventListener('DOMContentLoaded',()=>{if(document.body)mo.observe(document.body,{subtree:true,childList:true,characterData:true})});
})();