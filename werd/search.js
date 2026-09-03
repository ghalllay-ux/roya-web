// Unified search for Werd: local-first Quran/surah search, adhkar and saved items.
(function(){
  const LIMIT_QURAN=40;
  const SURAHS=['الفاتحة','البقرة','آل عمران','النساء','المائدة','الأنعام','الأعراف','الأنفال','التوبة','يونس','هود','يوسف','الرعد','إبراهيم','الحجر','النحل','الإسراء','الكهف','مريم','طه','الأنبياء','الحج','المؤمنون','النور','الفرقان','الشعراء','النمل','القصص','العنكبوت','الروم','لقمان','السجدة','الأحزاب','سبأ','فاطر','يس','الصافات','ص','الزمر','غافر','فصلت','الشورى','الزخرف','الدخان','الجاثية','الأحقاف','محمد','الفتح','الحجرات','ق','الذاريات','الطور','النجم','القمر','الرحمن','الواقعة','الحديد','المجادلة','الحشر','الممتحنة','الصف','الجمعة','المنافقون','التغابن','الطلاق','التحريم','الملك','القلم','الحاقة','المعارج','نوح','الجن','المزمل','المدثر','القيامة','الإنسان','المرسلات','النبأ','النازعات','عبس','التكوير','الانفطار','المطففين','الانشقاق','البروج','الطارق','الأعلى','الغاشية','الفجر','البلد','الشمس','الليل','الضحى','الشرح','التين','العلق','القدر','البينة','الزلزلة','العاديات','القارعة','التكاثر','العصر','الهمزة','الفيل','قريش','الماعون','الكوثر','الكافرون','النصر','المسد','الإخلاص','الفلق','الناس'];
  const SURAH_PAGES=[1,2,50,77,106,128,151,177,187,208,221,235,249,255,262,267,282,293,305,312,322,332,342,350,359,367,377,385,396,404,411,415,418,428,434,440,446,453,458,467,477,483,489,496,499,502,507,511,515,518,520,523,526,528,531,534,537,542,545,549,551,553,554,556,558,560,562,564,566,568,570,572,574,575,577,578,580,582,583,585,586,587,587,589,590,591,591,592,593,594,595,595,596,596,597,597,598,598,599,599,600,600,601,601,601,602,602,602,603,603,603,604,604,604,604,604,604];
  let activeFilter='all',lastResults=[],searchSeq=0;

  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]))}
  function norm(v){
    return String(v||'').normalize('NFKD')
      .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g,'')
      .replace(/[إأآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ؤ/g,'و').replace(/ئ/g,'ي')
      .replace(/ة/g,'ه').replace(/ـ/g,'').replace(/[^\u0621-\u063A\u0641-\u064A0-9a-zA-Z ]/g,' ')
      .replace(/\s+/g,' ').toLowerCase().trim();
  }
  function cleanQuery(v){return norm(v).replace(/^سوره\s+/,'').trim()}
  function contains(text,q){const n=norm(text),x=cleanQuery(q);return !!x&&n.includes(x)}
  function history(){if(!Array.isArray(state.searchHistory))state.searchHistory=[];return state.searchHistory}
  function saveHistory(q){q=String(q||'').trim();if(q.length<2)return;state.searchHistory=[q,...history().filter(x=>x!==q)].slice(0,8);try{save()}catch(_){}renderHistory()}

  function styles(){
    if(document.getElementById('werdSearchStyle'))return;
    const s=document.createElement('style');s.id='werdSearchStyle';s.textContent=`
      .global-search{display:flex;gap:8px}.global-search input{flex:1;min-width:0;border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:15px;padding:13px 14px;font-size:16px}.global-search button{border:0;border-radius:14px;background:var(--green);color:#fff;padding:0 17px;font-weight:800;min-width:76px}
      .search-filters{display:flex;gap:7px;overflow:auto;padding:10px 0 3px}.search-filters .chip{white-space:nowrap}.search-result{cursor:pointer}.search-result .sr-head{display:flex;align-items:center;justify-content:space-between;gap:8px}.search-result .sr-text{line-height:2;margin:10px 0 0}.search-result .sr-source{font-size:11px;color:var(--muted);margin-top:8px}.search-empty{text-align:center;padding:36px 16px;color:var(--muted)}
      .search-history{display:flex;flex-wrap:wrap;gap:7px}.search-history button{border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:99px;padding:8px 11px}.search-count{font-size:12px;color:var(--muted)}.search-live-note{font-size:10px;color:var(--muted);margin-top:7px}
    `;document.head.appendChild(s);
  }

  function injectPage(){
    styles();const main=document.querySelector('main');if(!main)return;
    if(!document.getElementById('searchPage')){
      const sec=document.createElement('section');sec.className='page';sec.id='searchPage';sec.innerHTML=`
        <div class="section-title"><h3>البحث الشامل</h3><button class="smallbtn" id="searchBack" type="button">المزيد</button></div>
        <div class="card"><div class="global-search"><input id="globalSearchInput" inputmode="search" enterkeyhint="search" autocomplete="off" placeholder="ابحث: البقرة، الكهف، الحمد لله…"><button id="globalSearchBtn" type="button">بحث</button></div><div class="search-filters" id="searchFilters"><button class="chip active" data-sfilter="all" type="button">الكل</button><button class="chip" data-sfilter="quran" type="button">القرآن</button><button class="chip" data-sfilter="surah" type="button">السور</button><button class="chip" data-sfilter="adhkar" type="button">الأذكار</button><button class="chip" data-sfilter="saved" type="button">المحفوظات</button></div><div class="search-live-note">أسماء السور تعمل بدون إنترنت، والبحث داخل الآيات يُستكمل عند توفر الاتصال.</div></div>
        <div class="section-title"><h3>عمليات البحث الأخيرة</h3><button class="smallbtn" id="clearSearchHistory" type="button">مسح</button></div><div class="card"><div class="search-history" id="searchHistory"></div></div>
        <div class="section-title"><h3>النتائج</h3><span class="search-count" id="searchCount">ابدأ بكتابة كلمة</span></div><div id="globalSearchResults"><div class="card search-empty">ابحث باسم سورة أو كلمة من القرآن أو الأذكار أو محفوظاتك.</div></div>`;main.appendChild(sec);
    }
    const grid=document.querySelector('#more .more-grid');
    if(grid&&!document.getElementById('moreSearchTile')){const b=document.createElement('button');b.className='more-tile';b.id='moreSearchTile';b.type='button';b.innerHTML='<span class="mi">⌕</span><b>البحث الشامل</b><small>القرآن والأذكار والمحفوظات</small>';b.onclick=()=>window.openSearch();grid.insertBefore(b,grid.firstChild)}
    wire();renderHistory();
  }

  function wire(){
    const input=document.getElementById('globalSearchInput'),btn=document.getElementById('globalSearchBtn');
    if(btn)btn.onclick=()=>runSearch(input?.value||'');
    if(input){
      input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();runSearch(input.value)}};
      input.oninput=()=>{const q=input.value.trim();if(!q){lastResults=[];renderResults([],false);return}if(q.length>=2)runLocalOnly(q)};
    }
    document.querySelectorAll('#searchFilters [data-sfilter]').forEach(b=>b.onclick=()=>{activeFilter=b.dataset.sfilter;document.querySelectorAll('#searchFilters [data-sfilter]').forEach(x=>x.classList.toggle('active',x===b));renderResults(lastResults,false)});
    document.getElementById('searchBack')?.addEventListener('click',()=>go('more'));
    document.getElementById('clearSearchHistory')?.addEventListener('click',()=>{state.searchHistory=[];try{save()}catch(_){}renderHistory();toast('تم مسح سجل البحث')});
  }

  window.openSearch=function(q=''){
    go('searchPage');const input=document.getElementById('globalSearchInput');if(input){input.value=q;setTimeout(()=>input.focus(),80)}if(q)runSearch(q);
  };

  function renderHistory(){
    const box=document.getElementById('searchHistory');if(!box)return;const h=history();
    box.innerHTML=h.length?h.map(q=>`<button type="button" data-history="${esc(q)}">${esc(q)}</button>`).join(''):'<span class="muted">لا توجد عمليات بحث سابقة.</span>';
    box.querySelectorAll('[data-history]').forEach(b=>b.onclick=()=>{const input=document.getElementById('globalSearchInput');if(input)input.value=b.dataset.history;runSearch(b.dataset.history)});
  }

  function surahResults(q){
    const x=cleanQuery(q);if(!x)return[];
    return SURAHS.map((name,i)=>({name,number:i+1,page:SURAH_PAGES[i]}))
      .filter(s=>contains(`${s.name} سوره ${s.name} ${s.number}`,x))
      .map(s=>({kind:'surah',title:`سورة ${s.name}`,meta:`سورة رقم ${s.number} • تبدأ من صفحة ${s.page}`,surah:s.number,page:s.page}));
  }

  function localResults(q){
    const out=surahResults(q);
    const allAdhkar=(typeof adhkar!=='undefined'&&Array.isArray(adhkar)&&adhkar.length)?adhkar:((typeof fallbackAdhkar!=='undefined'&&Array.isArray(fallbackAdhkar))?fallbackAdhkar:[]);
    allAdhkar.filter(x=>contains(`${x.content||x.zekr||''} ${x.source||''}`,q)).slice(0,24).forEach(x=>out.push({kind:'adhkar',title:'ذكر',text:x.content||x.zekr||'',meta:x.source||'حصن المسلم',adhkarType:Number(x.type)===2?'evening':'morning'}));
    const favA=state.favorites?.ayahs||[],favD=state.favorites?.adhkar||[],marks=state.bookmarks||[];
    favA.filter(x=>contains(`${x.surahName||''} ${x.text||''}`,q)).forEach(x=>out.push({kind:'saved',subkind:'favAyah',title:`${x.surahName} • الآية ${x.ayahNumber}`,text:x.text,meta:'مفضلة',surah:Number(x.surahNumber),ayah:Number(x.ayahNumber)}));
    favD.filter(x=>contains(`${x.text||''} ${x.source||''}`,q)).forEach(x=>out.push({kind:'saved',subkind:'favDhikr',title:'ذكر محفوظ',text:x.text,meta:x.source||'المفضلة'}));
    marks.filter(x=>contains(`${x.surahName||''} ${x.text||''}`,q)).forEach(x=>out.push({kind:'saved',subkind:'bookmark',title:`${x.surahName} • الآية ${x.ayahNumber}`,text:x.text,meta:'علامة قراءة',surah:Number(x.surahNumber),ayah:Number(x.ayahNumber)}));
    return out;
  }

  function runLocalOnly(q){lastResults=localResults(q);renderResults(lastResults,false)}

  async function remoteQuran(q,seq){
    if(!navigator.onLine||q.length<2)return[];
    try{
      const r=await fetch(`${API_QURAN}/search/${encodeURIComponent(q)}/all/ar`,{cache:'no-store'});if(!r.ok)throw new Error('search');
      const j=await r.json();if(seq!==searchSeq)return[];const matches=Array.isArray(j.data?.matches)?j.data.matches:[],seen=new Set(),out=[];
      for(const m of matches){const s=Number(m.surah?.number),a=Number(m.numberInSurah);if(!s||!a)continue;const k=`${s}:${a}`;if(seen.has(k))continue;seen.add(k);out.push({kind:'quran',title:`${m.surah?.name||'القرآن'} • الآية ${a}`,text:m.text||'',meta:`الجزء ${m.juz||'—'} • الصفحة ${m.page||'—'}`,surah:s,ayah:a,page:Number(m.page)||SURAH_PAGES[s-1]});if(out.length>=LIMIT_QURAN)break}
      return out;
    }catch(e){console.warn('Quran search unavailable',e);return[]}
  }

  async function runSearch(raw){
    const q=String(raw||'').trim();if(q.length<2){toast('اكتب حرفين على الأقل للبحث');return}
    const seq=++searchSeq;saveHistory(q);
    // Show guaranteed local matches immediately; never wait for the network to show a surah.
    const local=localResults(q);lastResults=local;renderResults(lastResults,false);
    const count=document.getElementById('searchCount');if(count&&navigator.onLine)count.textContent=`${filtered(lastResults).length} نتيجة • جارٍ استكمال البحث في الآيات…`;
    const remote=await remoteQuran(q,seq);if(seq!==searchSeq)return;
    lastResults=[...local,...remote];renderResults(lastResults,true);
  }

  function filtered(items){
    if(activeFilter==='all')return items;
    if(activeFilter==='saved')return items.filter(x=>x.kind==='saved');
    if(activeFilter==='quran')return items.filter(x=>x.kind==='quran'||x.kind==='surah');
    return items.filter(x=>x.kind===activeFilter);
  }

  function renderResults(items,announce){
    const box=document.getElementById('globalSearchResults'),count=document.getElementById('searchCount');if(!box)return;const rows=filtered(items);
    if(count)count.textContent=`${rows.length} نتيجة`;
    if(!rows.length){box.innerHTML='<div class="card search-empty">لا توجد نتائج مطابقة. جرّب اسم سورة مثل «البقرة» أو اختر «الكل».</div>';return}
    box.innerHTML=rows.map((x,i)=>`<div class="card search-result" data-result="${i}"><div class="sr-head"><b>${esc(x.title)}</b><span class="badge">${x.kind==='quran'?'قرآن':x.kind==='surah'?'سورة':x.kind==='adhkar'?'أذكار':'محفوظ'}</span></div>${x.text?`<div class="sr-text">${esc(x.text)}</div>`:''}<div class="sr-source">${esc(x.meta||'')}</div></div>`).join('');
    box.querySelectorAll('[data-result]').forEach((node,i)=>node.onclick=()=>openResult(rows[i]));
    if(announce&&rows.length)toast(`تم العثور على ${rows.length} نتيجة`);
  }

  async function openResult(x){
    if(x.kind==='surah'){
      if(typeof window.openWerdMushafV2==='function'){window.openWerdMushafV2(x.page||SURAH_PAGES[x.surah-1]);return}
      go('quran');if(typeof openSurah==='function')await openSurah(x.surah);return;
    }
    if(x.kind==='quran'||(x.kind==='saved'&&x.surah&&x.ayah)){
      if(typeof window.openWerdMushafV2==='function'){window.openWerdMushafV2(x.page||SURAH_PAGES[(x.surah||1)-1]);return}
      go('quran');if(typeof openSurah==='function')await openSurah(x.surah);return;
    }
    if(x.kind==='adhkar'){
      if(typeof currentAdhkarType!=='undefined')currentAdhkarType=x.adhkarType||'morning';
      document.querySelectorAll('[data-type]').forEach(b=>b.classList.toggle('active',b.dataset.type===(x.adhkarType||'morning')));
      if(typeof renderAdhkar==='function')renderAdhkar();go('adhkar');return;
    }
    if(x.subkind==='favDhikr'){if(typeof renderFavorites==='function')renderFavorites('adhkar');go('favorites');return}
    go('favorites');
  }

  const baseGo=window.go||go;
  window.go=function(page){baseGo(page);if(page==='searchPage'){document.querySelectorAll('.bottom .nav').forEach(n=>n.classList.remove('active'));document.querySelector('.bottom .nav[data-page="more"]')?.classList.add('active')}};
  try{go=window.go}catch(_){}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',injectPage);else injectPage();
})();
