// Werd Ruqyah — Quranic verses and authentic prophetic supplications
(function(){
  const ID='werdRuqyah';
  const groups=[
    {id:'fatiha',icon:'📖',title:'سورة الفاتحة',note:'الرقية بأمّ الكتاب',refs:[[1,1],[1,2],[1,3],[1,4],[1,5],[1,6],[1,7]]},
    {id:'kursi',icon:'✦',title:'آية الكرسي',note:'سورة البقرة — الآية 255',refs:[[2,255]]},
    {id:'baqaraEnd',icon:'🌙',title:'آخر آيتين من البقرة',note:'سورة البقرة — 285–286',refs:[[2,285],[2,286]]},
    {id:'muawwidhat',icon:'🤲',title:'الإخلاص والفلق والناس',note:'المعوّذات',refs:[[112,1],[112,2],[112,3],[112,4],[113,1],[113,2],[113,3],[113,4],[113,5],[114,1],[114,2],[114,3],[114,4],[114,5],[114,6]]},
    {id:'sihr',icon:'🛡️',title:'آيات إبطال السحر',note:'الأعراف 117–122، يونس 81–82، طه 69',refs:[[7,117],[7,118],[7,119],[7,120],[7,121],[7,122],[10,81],[10,82],[20,69]]}
  ];
  const duas=[
    {title:'دعاء الشفاء',text:'اللَّهُمَّ رَبَّ النَّاسِ، أَذْهِبِ البَأْسَ، اشْفِ أَنْتَ الشَّافِي، لَا شِفَاءَ إِلَّا شِفَاؤُكَ، شِفَاءً لَا يُغَادِرُ سَقَمًا.'},
    {title:'رقية جبريل ﷺ',text:'بِسْمِ اللَّهِ أَرْقِيكَ، مِنْ كُلِّ شَيْءٍ يُؤْذِيكَ، مِنْ شَرِّ كُلِّ نَفْسٍ أَوْ عَيْنِ حَاسِدٍ، اللَّهُ يَشْفِيكَ، بِسْمِ اللَّهِ أَرْقِيكَ.'},
    {title:'الاستعاذة بكلمات الله',text:'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ.'},
    {title:'للأهل والصغار',text:'أُعِيذُكُمَا بِكَلِمَاتِ اللَّهِ التَّامَّةِ، مِنْ كُلِّ شَيْطَانٍ وَهَامَّةٍ، وَمِنْ كُلِّ عَيْنٍ لَامَّةٍ.'}
  ];
  const cache=new Map();
  function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function style(){
    if(document.getElementById(ID+'Style'))return;
    const s=document.createElement('style');s.id=ID+'Style';s.textContent=`
    #${ID}{position:fixed;inset:0;z-index:99992;background:linear-gradient(180deg,#f7f3ea,#fffdf8);color:#173d32;overflow:auto;-webkit-overflow-scrolling:touch;direction:rtl;font-family:inherit}
    #${ID} *{box-sizing:border-box}
    #${ID} .rq-wrap{width:min(760px,100%);margin:auto;padding:18px 16px 54px}
    #${ID} .rq-top{position:sticky;top:0;z-index:3;margin:-18px -16px 16px;padding:14px 16px 12px;display:flex;align-items:center;gap:12px;background:rgba(247,243,234,.94);backdrop-filter:blur(14px);border-bottom:1px solid rgba(180,147,89,.24)}
    #${ID} .rq-back{width:42px;height:42px;border:1px solid rgba(180,147,89,.38);border-radius:14px;background:#fffdf8;color:#0f5b45;font-size:24px;display:grid;place-items:center;cursor:pointer}
    #${ID} .rq-title{flex:1;min-width:0}
    #${ID} .rq-title h2{margin:0;font-size:22px;color:#0f5b45;font-weight:950}
    #${ID} .rq-title small{display:block;margin-top:2px;color:#7b7468;font-size:12px}
    #${ID} .rq-hero{border:1px solid rgba(180,147,89,.35);border-radius:25px;padding:20px 18px;background:radial-gradient(circle at 15% 0,rgba(180,147,89,.14),transparent 34%),linear-gradient(145deg,#fffdf8,#f5ecdb);box-shadow:0 12px 30px rgba(80,58,20,.08);margin-bottom:18px;text-align:center}
    #${ID} .rq-hero .ico{width:66px;height:66px;margin:0 auto 10px;border-radius:50%;display:grid;place-items:center;font-size:29px;background:#0f5b45;color:#fff7df;box-shadow:0 8px 20px rgba(15,91,69,.18)}
    #${ID} .rq-hero h3{margin:0 0 7px;font-size:22px;color:#0f5b45}
    #${ID} .rq-hero p{margin:0;color:#6f675c;line-height:1.8;font-size:14px}
    #${ID} .rq-section-title{font-size:18px;font-weight:950;color:#0f5b45;margin:22px 2px 11px}
    #${ID} .rq-card{border:1px solid rgba(180,147,89,.31);border-radius:20px;background:#fffdfa;margin:10px 0;overflow:hidden;box-shadow:0 7px 20px rgba(56,44,21,.05)}
    #${ID} .rq-head{width:100%;border:0;background:transparent;padding:15px 14px;display:flex;align-items:center;gap:12px;text-align:right;color:inherit;cursor:pointer}
    #${ID} .rq-icon{width:46px;height:46px;flex:0 0 46px;border-radius:15px;display:grid;place-items:center;background:#f3ead8;font-size:21px}
    #${ID} .rq-head-text{flex:1;min-width:0}
    #${ID} .rq-head-text b{display:block;color:#164f3f;font-size:15.5px;margin-bottom:3px}
    #${ID} .rq-head-text small{color:#867b6c;font-size:12px}
    #${ID} .rq-chev{font-size:21px;color:#a2844d;transition:transform .2s}
    #${ID} .rq-card.open .rq-chev{transform:rotate(180deg)}
    #${ID} .rq-body{display:none;border-top:1px solid rgba(180,147,89,.18);padding:14px}
    #${ID} .rq-card.open .rq-body{display:block}
    #${ID} .rq-ayah{font-family:'Amiri Quran','Noto Naskh Arabic',serif;font-size:23px;line-height:2.05;text-align:center;color:#172f28;padding:12px 8px;border-bottom:1px dashed rgba(180,147,89,.22)}
    #${ID} .rq-ayah:last-child{border-bottom:0}
    #${ID} .rq-ref{display:block;color:#9a7c43;font-family:inherit;font-size:11px;margin-top:6px}
    #${ID} .rq-loading,#${ID} .rq-error{text-align:center;padding:20px;color:#7d7366;font-size:13px}
    #${ID} .rq-dua{padding:17px 16px}
    #${ID} .rq-dua b{display:block;color:#0f5b45;margin-bottom:9px;font-size:15px}
    #${ID} .rq-dua p{margin:0;font-family:'Noto Naskh Arabic',serif;font-size:20px;line-height:2;color:#263b34}
    #${ID} .rq-note{margin-top:18px;border-radius:18px;padding:14px 15px;background:#eef6f2;border:1px solid rgba(15,91,69,.14);color:#46665b;font-size:12.5px;line-height:1.85}
    body.dark #${ID}{background:linear-gradient(180deg,#14271f,#10221b);color:#f5ead1}
    body.dark #${ID} .rq-top{background:rgba(20,39,31,.94)}
    body.dark #${ID} .rq-back,body.dark #${ID} .rq-card{background:#1a3027;color:#f4e8cc;border-color:rgba(206,172,101,.25)}
    body.dark #${ID} .rq-hero{background:linear-gradient(145deg,#1e352b,#182d25);border-color:rgba(206,172,101,.27)}
    body.dark #${ID} .rq-title h2,body.dark #${ID} .rq-hero h3,body.dark #${ID} .rq-section-title,body.dark #${ID} .rq-head-text b,body.dark #${ID} .rq-dua b{color:#e9cf91}
    body.dark #${ID} .rq-title small,body.dark #${ID} .rq-hero p,body.dark #${ID} .rq-head-text small{color:#b9ac92}
    body.dark #${ID} .rq-icon{background:#233d32}
    body.dark #${ID} .rq-ayah,body.dark #${ID} .rq-dua p{color:#f4ead6}
    body.dark #${ID} .rq-note{background:#1a3329;color:#c7d8ce;border-color:rgba(206,172,101,.18)}
    `;document.head.appendChild(s);
  }
  async function getAyah(s,a){
    const key=s+':'+a;if(cache.has(key))return cache.get(key);
    const p=fetch(`/api/ayah/${s}/${a}`,{cache:'force-cache'}).then(async r=>{if(!r.ok)throw Error('ayah');const j=await r.json();if(!j?.text)throw Error('ayah');return j.text;});
    cache.set(key,p);return p;
  }
  async function loadGroup(card,g){
    const body=card.querySelector('.rq-body');if(body.dataset.loaded==='1')return;
    body.innerHTML='<div class="rq-loading">جاري تحميل الآيات…</div>';
    try{
      const rows=await Promise.all(g.refs.map(async r=>({s:r[0],a:r[1],text:await getAyah(r[0],r[1])})));
      body.innerHTML=rows.map(x=>`<div class="rq-ayah">${esc(x.text)}<span class="rq-ref">${x.s}:${x.a}</span></div>`).join('');
      body.dataset.loaded='1';
    }catch(_){body.innerHTML='<div class="rq-error">تعذر تحميل الآيات الآن. تحقق من الاتصال ثم حاول مرة أخرى.</div>'}
  }
  function close(){document.getElementById(ID)?.remove();document.documentElement.style.overflow='';}
  function open(){
    if(document.getElementById(ID))return;
    style();document.documentElement.style.overflow='hidden';
    const root=document.createElement('section');root.id=ID;root.setAttribute('role','dialog');root.setAttribute('aria-label','الرقية الشرعية');
    root.innerHTML=`<div class="rq-wrap">
      <div class="rq-top"><button class="rq-back" type="button" aria-label="رجوع">‹</button><div class="rq-title"><h2>الرقية الشرعية</h2><small>من القرآن والأدعية النبوية المأثورة</small></div></div>
      <div class="rq-hero"><div class="ico">🛡️</div><h3>رقية شرعية مرتبة وواضحة</h3><p>اقرأ ما تيسر بخشوع ويقين بالله، فالشفاء بيده سبحانه.</p></div>
      <div class="rq-section-title">آيات الرقية</div>
      ${groups.map(g=>`<article class="rq-card" data-group="${g.id}"><button class="rq-head" type="button"><span class="rq-icon">${g.icon}</span><span class="rq-head-text"><b>${g.title}</b><small>${g.note}</small></span><span class="rq-chev">⌄</span></button><div class="rq-body"></div></article>`).join('')}
      <div class="rq-section-title">أدعية نبوية مأثورة</div>
      ${duas.map(d=>`<article class="rq-card rq-dua"><b>${d.title}</b><p>${d.text}</p></article>`).join('')}
      <div class="rq-note">الرقية الشرعية دعاء وقراءة للقرآن مع التوكل على الله، ولا تمنع من مراجعة الطبيب أو أخذ العلاج عند الحاجة. تجنب الممارسات المجهولة أو طلب معلومات شخصية من أي شخص يدّعي العلاج.</div>
    </div>`;
    document.body.appendChild(root);
    root.querySelector('.rq-back').onclick=close;
    root.querySelectorAll('[data-group]').forEach(card=>{const g=groups.find(x=>x.id===card.dataset.group);card.querySelector('.rq-head').onclick=()=>{card.classList.toggle('open');if(card.classList.contains('open'))loadGroup(card,g)}});
    try{if(typeof window.gtag==='function')window.gtag('event','ruqyah_open',{event_category:'engagement'})}catch(_){}
  }
  window.openWerdRuqyah=open;
  window.closeWerdRuqyah=close;
})();
