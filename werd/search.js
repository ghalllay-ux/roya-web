// Unified search for Werd: Quran, surahs, adhkar, favorites and bookmarks
(function(){
  let searchSeq=0;
  const LIMIT_QURAN=40;

  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function norm(v){return String(v||'').normalize('NFKD').replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g,'').replace(/[إأآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/ـ/g,'').toLowerCase().trim()}
  function contains(text,q){return norm(text).includes(norm(q))}
  function history(){if(!Array.isArray(state.searchHistory))state.searchHistory=[];return state.searchHistory}
  function saveHistory(q){q=q.trim();if(q.length<2)return;state.searchHistory=[q,...history().filter(x=>x!==q)].slice(0,8);save();renderHistory()}

  function injectStyles(){
    if(document.getElementById('werdSearchStyle'))return;
    const s=document.createElement('style');s.id='werdSearchStyle';s.textContent=`
      .global-search{display:flex;gap:8px}.global-search input{flex:1;min-width:0;border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:15px;padding:13px 14px;font-size:16px}.global-search button{border:0;border-radius:14px;background:var(--green);color:#fff;padding:0 17px;font-weight:800}
      .search-filters{display:flex;gap:7px;overflow:auto;padding:10px 0 3px}.search-filters .chip{white-space:nowrap}.search-result{cursor:pointer}.search-result .sr-head{display:flex;align-items:center;justify-content:space-between;gap:8px}.search-result .sr-text{line-height:2;margin:10px 0 0}.search-result .sr-source{font-size:11px;color:var(--muted);margin-top:8px}.search-empty{text-align:center;padding:36px 16px;color:var(--muted)}
      .search-history{display:flex;flex-wrap:wrap;gap:7px}.search-history button{border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:99px;padding:8px 11px}.search-count{font-size:12px;color:var(--muted)}
    `;document.head.appendChild(s);
  }

  function injectPage(){
    injectStyles();const main=document.querySelector('main');if(!main)return;
    if(!document.getElementById('searchPage')){
      const sec=document.createElement('section');sec.className='page';sec.id='searchPage';sec.innerHTML=`
        <div class="section-title"><h3>البحث الشامل</h3><button class="smallbtn" id="searchBack">المزيد</button></div>
        <div class="card"><div class="global-search"><input id="globalSearchInput" inputmode="search" autocomplete="off" placeholder="ابحث في القرآن والأذكار…"><button id="globalSearchBtn">بحث</button></div><div class="search-filters" id="searchFilters"><button class="chip active" data-sfilter="all">الكل</button><button class="chip" data-sfilter="quran">القرآن</button><button class="chip" data-sfilter="surah">السور</button><button class="chip" data-sfilter="adhkar">الأذكار</button><button class="chip" data-sfilter="saved">المحفوظات</button></div></div>
        <div class="section-title"><h3>عمليات البحث الأخيرة</h3><button class="smallbtn" id="clearSearchHistory">مسح</button></div><div class="card"><div class="search-history" id="searchHistory"></div></div>
        <div class="section-title"><h3>النتائج</h3><span class="search-count" id="searchCount">ابدأ بكتابة كلمة</span></div><div id="globalSearchResults"><div class="card search-empty">يمكنك البحث باسم سورة، كلمة من القرآن، ذكر محفوظ، مفضلة أو علامة قراءة.</div></div>`;main.appendChild(sec);
    }
    const grid=document.querySelector('#more .more-grid');if(grid&&!document.getElementById('moreSearchTile')){
      const b=document.createElement('button');b.className='more-tile';b.id='moreSearchTile';b.innerHTML='<span class="mi">⌕</span><b>البحث الشامل</b><small>القرآن والأذكار والمحفوظات</small>';b.onclick=()=>openSearch();grid.insertBefore(b,grid.firstChild);
    }
    wire();renderHistory();
  }

  let activeFilter='all',lastResults=[];
  function wire(){
    const input=document.getElementById('globalSearchInput'),btn=document.getElementById('globalSearchBtn');
    if(btn)btn.onclick=()=>runSearch(input.value);
    if(input){input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();runSearch(input.value)}};input.oninput=()=>{if(!input.value.trim()){lastResults=[];renderResults([],false)}}}
    document.querySelectorAll('[data-sfilter]').forEach(b=>b.onclick=()=>{activeFilter=b.dataset.sfilter;document.querySelectorAll('[data-sfilter]').forEach(x=>x.classList.toggle('active',x===b));renderResults(lastResults,false)});
    document.getElementById('searchBack').onclick=()=>go('more');
    document.getElementById('clearSearchHistory').onclick=()=>{state.searchHistory=[];save();renderHistory();toast('تم مسح سجل البحث')};
  }

  window.openSearch=function(q=''){
    go('searchPage');const input=document.getElementById('globalSearchInput');if(input){input.value=q;setTimeout(()=>input.focus(),80)}if(q)runSearch(q);
  };

  function renderHistory(){const box=document.getElementById('searchHistory');if(!box)return;const h=history();box.innerHTML=h.length?h.map(q=>`<button data-history="${esc(q)}">${esc(q)}</button>`).join(''):'<span class="muted">لا توجد عمليات بحث سابقة.</span>';box.querySelectorAll('[data-history]').forEach(b=>b.onclick=()=>{document.getElementById('globalSearchInput').value=b.dataset.history;runSearch(b.dataset.history)})}

  function localResults(q){
    const out=[];const list=(Array.isArray(surahs)&&surahs.length)?surahs:fallbackSurahs;
    list.filter(s=>contains(`${s.name} ${s.englishName||''}`,q)).forEach(s=>out.push({kind:'surah',title:s.name,meta:`سورة رقم ${s.number} • ${s.numberOfAyahs||''} آية`,surah:Number(s.number)}));
    const allAdhkar=Array.isArray(adhkar)&&adhkar.length?adhkar:fallbackAdhkar;
    allAdhkar.filter(x=>contains(`${x.content||x.zekr||''} ${x.source||''}`,q)).slice(0,20).forEach((x,i)=>out.push({kind:'adhkar',title:'ذكر',text:x.content||x.zekr||'',meta:x.source||'حصن المسلم',adhkarType:Number(x.type)===2?'evening':'morning'}));
    const favA=state.favorites?.ayahs||[],favD=state.favorites?.adhkar||[],marks=state.bookmarks||[];
    favA.filter(x=>contains(`${x.surahName||''} ${x.text||''}`,q)).forEach(x=>out.push({kind:'saved',subkind:'favAyah',title:`${x.surahName} • الآية ${x.ayahNumber}`,text:x.text,meta:'مفضلة',surah:Number(x.surahNumber),ayah:Number(x.ayahNumber)}));
    favD.filter(x=>contains(`${x.text||''} ${x.source||''}`,q)).forEach(x=>out.push({kind:'saved',subkind:'favDhikr',title:'ذكر محفوظ',text:x.text,meta:x.source||'المفضلة'}));
    marks.filter(x=>contains(`${x.surahName||''} ${x.text||''}`,q)).forEach(x=>out.push({kind:'saved',subkind:'bookmark',title:`${x.surahName} • الآية ${x.ayahNumber}`,text:x.text,meta:'علامة قراءة',surah:Number(x.surahNumber),ayah:Number(x.ayahNumber)}));
    return out;
  }

  async function remoteQuran(q,seq){
    if(!navigator.onLine||q.length<2)return[];
    try{
      const r=await fetch(`${API_QURAN}/search/${encodeURIComponent(q)}/all/ar`);if(!r.ok)throw new Error('search');const j=await r.json();if(seq!==searchSeq)return[];
      const matches=Array.isArray(j.data?.matches)?j.data.matches:[];const seen=new Set(),out=[];
      for(const m of matches){const s=Number(m.surah?.number),a=Number(m.numberInSurah);if(!s||!a)continue;const k=`${s}:${a}`;if(seen.has(k))continue;seen.add(k);out.push({kind:'quran',title:`${m.surah?.name||'القرآن'} • الآية ${a}`,text:m.text||'',meta:`الجزء ${m.juz||'—'} • الصفحة ${m.page||'—'}`,surah:s,ayah:a});if(out.length>=LIMIT_QURAN)break}
      return out;
    }catch(e){console.warn('Quran search unavailable',e);return[]}
  }

  async function runSearch(raw){
    const q=raw.trim();if(q.length<2){toast('اكتب حرفين على الأقل للبحث');return}const seq=++searchSeq;saveHistory(q);const count=document.getElementById('searchCount'),box=document.getElementById('globalSearchResults');count.textContent='جاري البحث…';box.innerHTML='<div class="card loading">جاري البحث في ورد والقرآن…</div>';
    const local=localResults(q),remote=await remoteQuran(q,seq);if(seq!==searchSeq)return;lastResults=[...local,...remote];renderResults(lastResults,true);
  }

  function filtered(items){if(activeFilter==='all')return items;if(activeFilter==='saved')return items.filter(x=>x.kind==='saved');return items.filter(x=>x.kind===activeFilter)}
  function renderResults(items,announce){
    const box=document.getElementById('globalSearchResults'),count=document.getElementById('searchCount');if(!box)return;const rows=filtered(items);count.textContent=`${rows.length} نتيجة${activeFilter==='quran'&&rows.length>=LIMIT_QURAN?' على الأقل':''}`;
    if(!rows.length){box.innerHTML='<div class="card search-empty">لا توجد نتائج مطابقة في هذا التصنيف.</div>';return}
    box.innerHTML=rows.map((x,i)=>`<div class="card search-result" data-result="${i}"><div class="sr-head"><b>${esc(x.title)}</b><span class="badge">${x.kind==='quran'?'قرآن':x.kind==='surah'?'سورة':x.kind==='adhkar'?'أذكار':'محفوظ'}</span></div>${x.text?`<div class="sr-text">${esc(x.text)}</div>`:''}<div class="sr-source">${esc(x.meta||'')}</div></div>`).join('');
    box.querySelectorAll('[data-result]').forEach((node,i)=>node.onclick=()=>openResult(rows[i]));if(announce&&rows.length)toast(`تم العثور على ${rows.length} نتيجة`);
  }

  async function openResult(x){
    if(x.kind==='surah'){go('quran');await openSurah(x.surah);return}
    if(x.kind==='quran'||(x.kind==='saved'&&x.surah&&x.ayah)){go('quran');await openSurah(x.surah);setTimeout(()=>document.getElementById(`ayah-${x.ayah}`)?.scrollIntoView({behavior:'smooth',block:'center'}),180);return}
    if(x.kind==='adhkar'){currentAdhkarType=x.adhkarType||'morning';document.querySelectorAll('[data-type]').forEach(b=>b.classList.toggle('active',b.dataset.type===currentAdhkarType));renderAdhkar();go('adhkar');return}
    if(x.subkind==='favDhikr'){if(typeof renderFavorites==='function')renderFavorites('adhkar');go('favorites');return}
    go('favorites');
  }

  const baseGo=window.go||go;window.go=function(page){baseGo(page);if(page==='searchPage'){document.querySelectorAll('.bottom .nav').forEach(n=>n.classList.remove('active'));document.querySelector('.bottom .nav[data-page="more"]')?.classList.add('active')}};go=window.go;
  injectPage();
})();
