// Unified Quran playback queue for Werd
(function(){
  const COUNTS=[7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
  const RECITERS=[['ar.alafasy','مشاري العفاسي'],['ar.sudais','عبدالرحمن السديس'],['ar.mahermuaiqly','ماهر المعيقلي'],['ar.husary','محمود خليل الحصري'],['ar.hudhaify','علي الحذيفي'],['ar.shuraim','سعود الشريم'],['ar.ajamy','أحمد العجمي'],['ar.abdullahbasfar','عبدالله بصفر']];
  const LEGACY={'ar.abdurrahmaansudais':'ar.sudais','ar.saoodshuraym':'ar.shuraim','ar.ahmedajamy':'ar.ajamy'};
  const CDN='https://cdn.islamic.network/quran/audio';
  const BITRATES=[128,64,192,48,40,32];
  const audio=new Audio();audio.preload='metadata';audio.playsInline=true;
  let itemIndex=-1,trackIndex=0,tracks=[],candidateIndex=0,manualStop=false;

  function qstate(){
    if(!state.audioQueue||typeof state.audioQueue!=='object'||Array.isArray(state.audioQueue))state.audioQueue={};
    state.audioQueue={items:[],repeat:'off',currentId:null,...state.audioQueue};
    if(!Array.isArray(state.audioQueue.items))state.audioQueue.items=[];
    if(!['off','one','all'].includes(state.audioQueue.repeat))state.audioQueue.repeat='off';
    return state.audioQueue;
  }
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function uid(){try{return crypto.randomUUID()}catch(e){return 'q-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)}}
  function globalStart(s){let n=1;for(let i=0;i<s-1;i++)n+=COUNTS[i]||0;return n}
  function surahName(n){const list=(Array.isArray(window.surahs)&&surahs.length)?surahs:(window.fallbackSurahs||[]);return list.find(x=>Number(x.number)===Number(n))?.name||`سورة ${n}`}
  function reciterName(id){return RECITERS.find(x=>x[0]===id)?.[1]||'القارئ'}
  function canonical(id){return LEGACY[id]||id||'ar.alafasy'}
  function currentReciter(){return canonical(state.listening?.reciter||state.readerPrefs?.reciter||'ar.alafasy')}
  function candidates(global,reciter){return BITRATES.map(b=>`${CDN}/${b}/${canonical(reciter)}/${global}.mp3`)}

  function addSurah(n,reciter=currentReciter()){
    n=Math.max(1,Math.min(114,Number(n)||1));const q=qstate();q.items.push({id:uid(),type:'surah',surah:n,surahName:surahName(n),reciter:canonical(reciter),addedAt:new Date().toISOString()});save();render();toast(`أضيفت ${surahName(n)} إلى الطابور ✓`)
  }
  function addAyah(surah,ayah,global,reciter=currentReciter()){
    surah=Number(surah);ayah=Number(ayah);global=Number(global)||globalStart(surah)+ayah-1;if(!surah||!ayah)return;
    const q=qstate();q.items.push({id:uid(),type:'ayah',surah,ayah,global,surahName:surahName(surah),reciter:canonical(reciter),addedAt:new Date().toISOString()});save();render();toast(`أضيفت الآية ${ayah} إلى الطابور ✓`)
  }
  window.werdQueue={addSurah,addAyah,open:()=>{go('playlist');render()},playIndex:i=>playItem(i)};

  function buildTracks(item){
    const rec=canonical(item.reciter);if(item.type==='ayah')return[{...item,candidates:candidates(item.global,rec)}];
    const count=COUNTS[item.surah-1]||0,start=globalStart(item.surah);return Array.from({length:count},(_,i)=>({surah:item.surah,surahName:item.surahName,ayah:i+1,global:start+i,reciter:rec,candidates:candidates(start+i,rec)}));
  }
  async function playItem(i,fromEnd=false){
    const q=qstate();if(!q.items.length)return toast('قائمة التشغيل فارغة');i=Math.max(0,Math.min(q.items.length-1,Number(i)||0));itemIndex=i;const item=q.items[i];q.currentId=item.id;tracks=buildTracks(item);trackIndex=fromEnd?tracks.length-1:0;candidateIndex=0;save();render();await playTrack()
  }
  async function playTrack(){const t=tracks[trackIndex];if(!t)return;manualStop=false;candidateIndex=0;await tryCandidate(t)}
  async function tryCandidate(t){const list=t.candidates||[];if(!list.length)return nextTrack();audio.src=list[candidateIndex];audio.playbackRate=Number(state.listening?.speed)||1;try{await audio.play();updateNow(t,true)}catch(e){if(candidateIndex<list.length-1){candidateIndex++;return tryCandidate(t)}toast('تعذر تشغيل هذا المقطع');nextTrack()}}
  function nextTrack(){if(manualStop)return;if(trackIndex<tracks.length-1){trackIndex++;return playTrack()}advanceItem(1)}
  function prevTrack(){if(audio.currentTime>5){audio.currentTime=0;return}if(trackIndex>0){trackIndex--;return playTrack()}advanceItem(-1,true)}
  function advanceItem(dir,fromEnd=false){
    const q=qstate();if(q.repeat==='one')return playItem(itemIndex,false);
    let n=itemIndex+dir;if(n>=q.items.length){if(q.repeat==='all')n=0;else{return finish()}}if(n<0){if(q.repeat==='all')n=q.items.length-1;else n=0}return playItem(n,fromEnd)
  }
  function finish(){qstate().currentId=null;save();updateNow(null,false);render();toast('انتهت قائمة التشغيل ✓')}
  function toggle(){if(audio.src&&!audio.paused)return audio.pause();if(audio.src&&audio.paused)return audio.play().catch(()=>playTrack());const q=qstate(),i=Math.max(0,q.items.findIndex(x=>x.id===q.currentId));playItem(i)}
  function stop(){manualStop=true;audio.pause();audio.removeAttribute('src');qstate().currentId=null;save();updateNow(null,false);render()}

  audio.addEventListener('ended',nextTrack);
  audio.addEventListener('error',()=>{const t=tracks[trackIndex];if(t&&candidateIndex<(t.candidates?.length||0)-1){candidateIndex++;tryCandidate(t)}else nextTrack()});
  audio.addEventListener('play',()=>{const t=tracks[trackIndex];updateNow(t,true)});
  audio.addEventListener('pause',()=>updateButtons(false));
  audio.addEventListener('timeupdate',()=>{const p=(audio.duration&&Number.isFinite(audio.duration))?audio.currentTime/audio.duration*100:0;const b=document.getElementById('queueMiniProgress');if(b)b.style.width=p+'%'});

  function injectStyles(){if(document.getElementById('werdPlaylistStyle'))return;const s=document.createElement('style');s.id='werdPlaylistStyle';s.textContent=`
    .queue-item{display:flex;gap:10px;align-items:center;padding:12px 0;border-bottom:1px solid var(--line)}.queue-item:last-child{border-bottom:0}.queue-grab{font-size:18px;color:var(--muted)}.queue-main{flex:1;min-width:0}.queue-main b,.queue-main small{display:block}.queue-main small{color:var(--muted);margin-top:3px}.queue-actions{display:flex;gap:5px}.queue-actions button{min-width:34px;padding:7px}.queue-current{background:var(--sage);border-radius:14px;padding-inline:8px}.queue-empty{text-align:center;padding:28px;color:var(--muted)}
    .queue-mini{position:fixed;z-index:21;left:50%;transform:translateX(-50%);bottom:70px;width:min(516px,calc(100% - 20px));background:rgba(17,70,55,.98);color:white;border-radius:18px;padding:10px 12px;display:none;align-items:center;gap:9px;box-shadow:0 15px 36px rgba(0,0,0,.25)}.queue-mini.show{display:flex}.queue-mini button{width:38px;height:38px;border:0;border-radius:12px;background:rgba(255,255,255,.12);color:white}.queue-mini-main{flex:1;min-width:0}.queue-mini-main b,.queue-mini-main small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.queue-mini-main small{opacity:.8}.queue-mini-progress{height:3px;background:rgba(255,255,255,.2);margin-top:5px;border-radius:9px;overflow:hidden}.queue-mini-progress span{display:block;height:100%;background:#f0d39b;width:0}
    .queue-repeat{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.queue-repeat button.active{background:var(--green);color:#fff;border-color:var(--green)}
  `;document.head.appendChild(s)}
  function inject(){injectStyles();qstate();const main=document.querySelector('main');if(!main)return;
    if(!document.getElementById('playlist')){const sec=document.createElement('section');sec.className='page';sec.id='playlist';sec.innerHTML=`<div class="section-title"><h3>قائمة التشغيل</h3><button class="smallbtn" id="queueBack">الاستماع</button></div><div class="card"><div class="row"><div><b id="queueNowTitle">لا يوجد تشغيل الآن</b><div class="muted" id="queueNowSub">أضف سورة أو آية إلى الطابور</div></div><span class="badge" id="queueCount">0</span></div><div class="row" style="margin-top:12px"><button class="smallbtn" id="queuePrev">⏮ السابق</button><button class="primary" id="queuePlay" style="margin:0;flex:1">▶ تشغيل</button><button class="smallbtn" id="queueNext">التالي ⏭</button></div></div><div class="card" style="margin-top:10px"><b>التكرار</b><div class="queue-repeat" style="margin-top:9px"><button class="smallbtn" data-repeat="off">بدون</button><button class="smallbtn" data-repeat="one">العنصر</button><button class="smallbtn" data-repeat="all">القائمة</button></div></div><div class="section-title"><h3>الطابور</h3><button class="smallbtn" id="queueClear">مسح الكل</button></div><div class="card" id="queueList"></div>`;main.appendChild(sec)}
    if(!document.getElementById('queueMini')){const m=document.createElement('div');m.className='queue-mini';m.id='queueMini';m.innerHTML='<button id="queueMiniPrev">⏮</button><button id="queueMiniPlay">▶</button><div class="queue-mini-main" id="queueMiniOpen"><b id="queueMiniTitle">قائمة ورد</b><small id="queueMiniSub">جاهز</small><div class="queue-mini-progress"><span id="queueMiniProgress"></span></div></div><button id="queueMiniNext">⏭</button>';document.body.appendChild(m)}
    const lg=document.querySelector('#listening .section-title');if(lg&&!document.getElementById('queueEntry')){const b=document.createElement('button');b.className='smallbtn';b.id='queueEntry';b.textContent='☷ قائمة التشغيل';b.onclick=()=>{go('playlist');render()};lg.appendChild(b)}
    const mg=document.querySelector('#more .more-grid');if(mg&&!document.getElementById('moreQueueTile')){const b=document.createElement('button');b.className='more-tile';b.id='moreQueueTile';b.innerHTML='<span class="mi">☷</span><b>قائمة التشغيل</b><small>السور والآيات في طابور واحد</small>';b.onclick=()=>{go('playlist');render()};mg.insertBefore(b,mg.firstChild)}
    wire();observeIntegrations();render();
  }
  function wire(){const $=id=>document.getElementById(id);$('queueBack').onclick=()=>go('listening');$('queuePlay').onclick=toggle;$('queuePrev').onclick=prevTrack;$('queueNext').onclick=nextTrack;$('queueClear').onclick=()=>{if(confirm('مسح جميع عناصر قائمة التشغيل؟')){stop();qstate().items=[];save();render()}};$('queueMiniPlay').onclick=toggle;$('queueMiniPrev').onclick=prevTrack;$('queueMiniNext').onclick=nextTrack;$('queueMiniOpen').onclick=()=>{go('playlist');render()};document.querySelectorAll('[data-repeat]').forEach(b=>b.onclick=()=>{qstate().repeat=b.dataset.repeat;save();render()})}

  function render(){const q=qstate(),box=document.getElementById('queueList');if(!box)return;document.getElementById('queueCount').textContent=`${q.items.length} عنصر`;document.querySelectorAll('[data-repeat]').forEach(b=>b.classList.toggle('active',b.dataset.repeat===q.repeat));if(!q.items.length)box.innerHTML='<div class="queue-empty">القائمة فارغة. أضف سورًا من صفحة الاستماع أو آيات من المصحف.</div>';else box.innerHTML=q.items.map((x,i)=>`<div class="queue-item ${x.id===q.currentId?'queue-current':''}"><span class="queue-grab">${i+1}</span><div class="queue-main"><b>${esc(x.surahName)}${x.type==='ayah'?` • الآية ${x.ayah}`:''}</b><small>${x.type==='surah'?'سورة كاملة':'آية واحدة'} • ${esc(reciterName(x.reciter))}</small></div><div class="queue-actions"><button class="smallbtn" data-up="${i}">↑</button><button class="smallbtn" data-down="${i}">↓</button><button class="smallbtn" data-play="${i}">▶</button><button class="smallbtn" data-del="${i}">×</button></div></div>`).join('');box.querySelectorAll('[data-play]').forEach(b=>b.onclick=()=>playItem(Number(b.dataset.play)));box.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>remove(Number(b.dataset.del)));box.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>move(Number(b.dataset.up),-1));box.querySelectorAll('[data-down]').forEach(b=>b.onclick=()=>move(Number(b.dataset.down),1));}
  function remove(i){const q=qstate(),was=q.items[i]?.id===q.currentId;q.items.splice(i,1);if(was)stop();save();render()}
  function move(i,d){const q=qstate(),j=i+d;if(j<0||j>=q.items.length)return;[q.items[i],q.items[j]]=[q.items[j],q.items[i]];save();render()}
  function updateButtons(playing){for(const id of ['queuePlay','queueMiniPlay']){const b=document.getElementById(id);if(b)b.textContent=playing?'⏸':'▶'}}
  function updateNow(t,playing){const mini=document.getElementById('queueMini');if(mini)mini.classList.toggle('show',!!t);const title=t?`${t.surahName} • الآية ${t.ayah}`:'لا يوجد تشغيل الآن',sub=t?reciterName(t.reciter):'أضف سورة أو آية إلى الطابور';for(const id of ['queueNowTitle','queueMiniTitle']){const e=document.getElementById(id);if(e)e.textContent=title}for(const id of ['queueNowSub','queueMiniSub']){const e=document.getElementById(id);if(e)e.textContent=sub}updateButtons(playing);render()}

  function decorateListening(){document.querySelectorAll('#listenSurahList [data-listen-surah]').forEach(row=>{if(row.querySelector('.queue-add-surah'))return;const b=document.createElement('button');b.className='smallbtn queue-add-surah';b.textContent='＋';b.title='أضف إلى قائمة التشغيل';b.onclick=e=>{e.stopPropagation();addSurah(Number(row.dataset.listenSurah),document.getElementById('listenReciter')?.value||currentReciter())};row.appendChild(b)})}
  function decorateReader(){document.querySelectorAll('#ayahs .ayah').forEach(node=>{const tools=node.querySelector('.reader-tools');if(!tools||tools.querySelector('.queue-add-ayah'))return;const ayah=Number(node.querySelector('.an')?.textContent||0),surah=Number(state.lastSurah?.number||state.mushaf?.surahNumber||0);if(!ayah||!surah)return;const b=document.createElement('button');b.className='smallbtn queue-add-ayah';b.textContent='＋ طابور';b.onclick=()=>addAyah(surah,ayah,globalStart(surah)+ayah-1,document.getElementById('readerReciter')?.value||currentReciter());tools.appendChild(b)})}
  function observeIntegrations(){decorateListening();decorateReader();const mo=new MutationObserver(()=>{decorateListening();decorateReader()});mo.observe(document.body,{childList:true,subtree:true})}

  const baseRender=renderState;renderState=function(){baseRender();qstate();render()};
  inject();
})();