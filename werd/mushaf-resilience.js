// Resilient Mushaf network layer: timeout AlQuran Cloud page requests, then fall back to Quran.com Uthmani text.
(function(){
  const nativeFetch=window.fetch.bind(window);
  const COUNTS=[7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
  const FALLBACK_NAMES=['الفاتحة','البقرة','آل عمران','النساء','المائدة','الأنعام','الأعراف','الأنفال','التوبة','يونس','هود','يوسف','الرعد','إبراهيم','الحجر','النحل','الإسراء','الكهف','مريم','طه','الأنبياء','الحج','المؤمنون','النور','الفرقان','الشعراء','النمل','القصص','العنكبوت','الروم','لقمان','السجدة','الأحزاب','سبأ','فاطر','يس','الصافات','ص','الزمر','غافر','فصلت','الشورى','الزخرف','الدخان','الجاثية','الأحقاف','محمد','الفتح','الحجرات','ق','الذاريات','الطور','النجم','القمر','الرحمن','الواقعة','الحديد','المجادلة','الحشر','الممتحنة','الصف','الجمعة','المنافقون','التغابن','الطلاق','التحريم','الملك','القلم','الحاقة','المعارج','نوح','الجن','المزمل','المدثر','القيامة','الإنسان','المرسلات','النبأ','النازعات','عبس','التكوير','الانفطار','المطففين','الانشقاق','البروج','الطارق','الأعلى','الغاشية','الفجر','البلد','الشمس','الليل','الضحى','الشرح','التين','العلق','القدر','البينة','الزلزلة','العاديات','القارعة','التكاثر','العصر','الهمزة','الفيل','قريش','الماعون','الكوثر','الكافرون','النصر','المسد','الإخلاص','الفلق','الناس'];
  const startOf=s=>1+COUNTS.slice(0,s-1).reduce((a,b)=>a+b,0);
  function withTimeout(url,opts={},ms=7500){const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);return nativeFetch(url,{...opts,signal:c.signal,cache:'no-store'}).finally(()=>clearTimeout(t))}
  function surahMeta(n){const list=(Array.isArray(window.surahs)&&window.surahs.length)?window.surahs:(window.fallbackSurahs||[]);const x=list.find(v=>Number(v.number)===Number(n));return x||{number:n,name:FALLBACK_NAMES[n-1]||`سورة ${n}`,numberOfAyahs:COUNTS[n-1]||0}}
  async function quranComPage(page){
    const url=`https://api.quran.com/api/v4/verses/uthmani?page_number=${encodeURIComponent(page)}&per_page=50`;
    const r=await withTimeout(url,{headers:{Accept:'application/json'}},9000);if(!r.ok)throw new Error(`qurancom_${r.status}`);const j=await r.json();const verses=Array.isArray(j.verses)?j.verses:[];if(!verses.length)throw new Error('qurancom_empty');
    const ayahs=verses.map(v=>{const [s,a]=String(v.verse_key||'').split(':').map(Number);const surah=surahMeta(s);return{number:startOf(s)+a-1,numberInSurah:a,text:v.text_uthmani||v.text_uthmani_simple||'',juz:Number(v.juz_number)||null,page:Number(v.page_number)||Number(page),hizbQuarter:Number(v.hizb_number)?(Number(v.hizb_number)-1)*4+1:null,surah:{number:s,name:surah.name,englishName:surah.englishName||'',englishNameTranslation:surah.englishNameTranslation||'',numberOfAyahs:surah.numberOfAyahs||COUNTS[s-1]||0,revelationType:surah.revelationType||''}}}).filter(a=>a.surah.number&&a.numberInSurah&&a.text);
    if(!ayahs.length)throw new Error('qurancom_transform_empty');
    return new Response(JSON.stringify({code:200,status:'OK',data:{number:Number(page),ayahs}}),{status:200,headers:{'Content-Type':'application/json'}});
  }
  window.fetch=async function(input,init){
    const raw=typeof input==='string'?input:input?.url||'';
    const m=raw.match(/^https:\/\/api\.alquran\.cloud\/v1\/page\/(\d+)\/quran-uthmani(?:\?.*)?$/i);
    if(!m)return nativeFetch(input,init);
    const page=Number(m[1]);
    try{const r=await withTimeout(raw,init,7000);if(r.ok)return r;throw new Error(`alquran_${r.status}`)}catch(e){console.warn('Werd Mushaf primary source failed; trying trusted fallback',e);try{return await quranComPage(page)}catch(e2){console.error('Werd Mushaf fallback failed',e2);throw e2}}
  };
  function installRetry(){
    const sheet=document.getElementById('mushafSheet');if(!sheet)return;const txt=sheet.textContent||'';if(!txt.includes('تعذر تحميل الصفحة')||sheet.querySelector('.mushaf-retry-btn'))return;const b=document.createElement('button');b.className='secondary mushaf-retry-btn';b.style.margin='14px auto 0';b.style.display='block';b.textContent='إعادة المحاولة';b.onclick=()=>{const n=Number(document.getElementById('mushafPageInput')?.value||1);if(typeof window.openMushaf==='function')window.openMushaf(n)};sheet.appendChild(b)
  }
  const mo=new MutationObserver(()=>installRetry());document.addEventListener('DOMContentLoaded',()=>{const root=document.body;mo.observe(root,{subtree:true,childList:true,characterData:true})});
})();