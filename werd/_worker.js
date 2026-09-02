export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const match = url.pathname.match(/^\/api\/mushaf\/(\d+)$/);
    if (!match) return env.ASSETS.fetch(request);

    const page = Math.max(1, Math.min(604, Number(match[1]) || 1));
    const headers = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=300' };

    const primary = `https://api.alquran.cloud/v1/page/${page}/quran-uthmani`;
    try {
      const r = await fetch(primary, { headers: { accept: 'application/json' } });
      if (r.ok) return new Response(await r.text(), { status: 200, headers });
    } catch (_) {}

    const fallback = `https://api.quran.com/api/v4/verses/by_page/${page}?language=ar&words=false&fields=text_uthmani,juz_number,hizb_number,rub_el_hizb_number,page_number&per_page=50`;
    try {
      const r = await fetch(fallback, { headers: { accept: 'application/json' } });
      if (!r.ok) throw new Error(`qurancom_${r.status}`);
      const j = await r.json();
      const counts=[7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
      const names=['الفاتحة','البقرة','آل عمران','النساء','المائدة','الأنعام','الأعراف','الأنفال','التوبة','يونس','هود','يوسف','الرعد','إبراهيم','الحجر','النحل','الإسراء','الكهف','مريم','طه','الأنبياء','الحج','المؤمنون','النور','الفرقان','الشعراء','النمل','القصص','العنكبوت','الروم','لقمان','السجدة','الأحزاب','سبأ','فاطر','يس','الصافات','ص','الزمر','غافر','فصلت','الشورى','الزخرف','الدخان','الجاثية','الأحقاف','محمد','الفتح','الحجرات','ق','الذاريات','الطور','النجم','القمر','الرحمن','الواقعة','الحديد','المجادلة','الحشر','الممتحنة','الصف','الجمعة','المنافقون','التغابن','الطلاق','التحريم','الملك','القلم','الحاقة','المعارج','نوح','الجن','المزمل','المدثر','القيامة','الإنسان','المرسلات','النبأ','النازعات','عبس','التكوير','الانفطار','المطففين','الانشقاق','البروج','الطارق','الأعلى','الغاشية','الفجر','البلد','الشمس','الليل','الضحى','الشرح','التين','العلق','القدر','البينة','الزلزلة','العاديات','القارعة','التكاثر','العصر','الهمزة','الفيل','قريش','الماعون','الكوثر','الكافرون','النصر','المسد','الإخلاص','الفلق','الناس'];
      const startOf=s=>1+counts.slice(0,s-1).reduce((a,b)=>a+b,0);
      const ayahs=(j.verses||[]).map(v=>{const [s0,a0]=String(v.verse_key||'').split(':').map(Number);const s=Number(v.chapter_id)||s0,a=Number(v.verse_number)||a0;return{number:Number(v.id)||startOf(s)+a-1,numberInSurah:a,text:v.text_uthmani||'',juz:Number(v.juz_number)||null,page:Number(v.page_number)||page,hizbQuarter:Number(v.rub_el_hizb_number)||((Number(v.hizb_number)||1)-1)*4+1,surah:{number:s,name:names[s-1]||`سورة ${s}`,englishName:'',englishNameTranslation:'',numberOfAyahs:counts[s-1]||0,revelationType:''}}}).filter(a=>a.surah.number&&a.numberInSurah&&a.text);
      if (!ayahs.length) throw new Error('empty');
      return new Response(JSON.stringify({code:200,status:'OK',data:{number:page,ayahs}}),{status:200,headers});
    } catch (e) {
      return new Response(JSON.stringify({code:503,status:'ERROR',message:'Mushaf source unavailable'}),{status:503,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
    }
  }
};
