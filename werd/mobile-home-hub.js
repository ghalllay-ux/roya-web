// Mobile Explore Werd hub — premium quick-access card design
(function(){
 const ID='werdMobileHomeHub';
 const items=[
  ['📖','المصحف','قراءة القرآن','mushaf'],
  ['🎧','الاستماع','التلاوات والقراء','listening'],
  ['🎙️','التسميع بالصوت','سمّع واحصل على تحليل فوري','recitationTest'],
  ['🌿','الأذكار','الصباح والمساء','adhkar'],
  ['🤲','حصن المسلم','الأدعية والأذكار','hisn'],
  ['◔','الورد اليومي','هدفك وتقدمك','plan'],
  ['📗','الختمة','متابعة الختمة','khatma'],
  ['📿','المسبحة','التسبيح والعداد','tasbih'],
  ['✦','أسماء الله الحسنى','الأسماء والمعاني','asma'],
  ['🔖','علامات القراءة','مواضعك المحفوظة','bookmarks'],
  ['♥️','المفضلة','الآيات والأذكار','favorites'],
  ['📊','الإنجاز','إحصائيات تقدمك','stats'],
  ['🧠','الحفظ والمراجعة','كل أدوات الحفظ','memorizationHub'],
  ['🔎','البحث','البحث الشامل','search'],
  ['⚙️','الإعدادات','تخصيص التطبيق','settings']
 ];
 function callGo(page){try{if(typeof window.go==='function')window.go(page);else go(page)}catch(_){}}
 function openPage(page){
  if(page==='mushaf'&&typeof window.openWerdMushafV2==='function'){window.openWerdMushafV2();return}
  if(page==='mushaf'&&typeof window.openMushaf==='function'){window.openMushaf();return}
  if(page==='memorizationHub'&&typeof window.openWerdMemorizationHub==='function'){window.openWerdMemorizationHub();return}
  if(page==='recitationTest'&&typeof window.openWerdRecitationTest==='function'){window.openWerdRecitationTest();return}
  if(page==='search'&&typeof window.openSearch==='function'){window.openSearch();return}
  callGo(page);
 }
 function setupHeaderHome(){
  const btn=document.getElementById('syncBtn');if(!btn)return;
  btn.title='الرئيسية';btn.setAttribute('aria-label','الصفحة الرئيسية');btn.dataset.werdRole='home';
  btn.innerHTML='<svg viewBox="0 0 24 24" width="25" height="25" aria-hidden="true" focusable="false"><path d="M3.7 10.4 12 3.7l8.3 6.7v9.1a1.5 1.5 0 0 1-1.5 1.5h-4.6v-6.1H9.8V21H5.2a1.5 1.5 0 0 1-1.5-1.5v-9.1Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9.8 21v-6.1h4.4V21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
  btn.onclick=()=>{callGo('home');window.scrollTo({top:0,behavior:'smooth'})};
 }
 function style(){
  if(document.getElementById(ID+'Style'))return;
  const s=document.createElement('style');s.id=ID+'Style';s.textContent=`
  @media(max-width:959px){
   #${ID}{display:block;margin:24px 0 28px}
   #${ID} .mhh-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 2px 16px}
   #${ID} .mhh-head h3{margin:0;font-size:25px;font-weight:950;color:var(--green);letter-spacing:-.2px}
   #${ID} .mhh-head h3:before,#${ID} .mhh-head h3:after{content:'✦';color:var(--gold);font-size:13px;margin:0 7px;vertical-align:middle}
   #${ID} .mhh-head span{font-size:13px;color:var(--muted)}
   #${ID} .mhh-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;padding:4px 0 12px}
   #${ID} .mhh-item{min-width:0;min-height:132px;border:1.5px solid rgba(180,147,89,.45);border-radius:25px;padding:18px 7px 14px;background:radial-gradient(circle at 50% 28%,rgba(180,147,89,.10),transparent 30%),linear-gradient(155deg,#fffdf8,#faf4e8);color:var(--green);display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:8px;text-align:center;box-shadow:0 10px 24px rgba(72,53,20,.09),inset 0 0 0 1px rgba(255,255,255,.65);position:relative;overflow:hidden;-webkit-tap-highlight-color:transparent;transition:transform .18s ease,box-shadow .18s ease}
   #${ID} .mhh-item:after{content:'';position:absolute;width:38px;height:38px;top:-21px;right:-21px;border:1px solid rgba(180,147,89,.24);transform:rotate(45deg)}
   #${ID} .mhh-item:active{transform:scale(.97);box-shadow:0 5px 14px rgba(72,53,20,.07)}
   #${ID} .mhh-icon{width:58px;height:58px;flex:0 0 58px;border-radius:50%;display:grid;place-items:center;font-size:25px;border:1px solid rgba(180,147,89,.38);background:radial-gradient(circle,#fffdf8 42%,#f2ead7 43% 46%,#fffdf8 47%);color:var(--gold)}
   #${ID} .mhh-text{min-width:0;width:100%}
   #${ID} .mhh-text b{display:block;font-size:15px;font-weight:950;line-height:1.45;color:var(--green);overflow-wrap:anywhere}
   #${ID} .mhh-text small{display:none}
   #home>.grid,#home>.section-title:has(+ .grid){display:none!important}
   #smartDashboard .smart-head:has(+ .smart-quick),#smartDashboard .smart-quick{display:none!important}
   body.dark #${ID} .mhh-item{background:linear-gradient(155deg,#20392f,#172c24);border-color:rgba(197,163,94,.34);box-shadow:0 10px 24px rgba(0,0,0,.16)}
   body.dark #${ID} .mhh-icon{background:radial-gradient(circle,#213b31 42%,#182f27 43% 46%,#213b31 47%);color:#e1c784}
   body.dark #${ID} .mhh-text b{color:#f0ddb0}
  }
  @media(max-width:430px){
   #${ID} .mhh-grid{gap:9px}
   #${ID} .mhh-item{min-height:122px;padding:15px 4px 12px;border-radius:22px;gap:7px}
   #${ID} .mhh-icon{width:52px;height:52px;flex-basis:52px;font-size:22px}
   #${ID} .mhh-text b{font-size:13.5px;line-height:1.4}
  }
  @media(max-width:360px){
   #${ID} .mhh-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
   #${ID} .mhh-item{min-height:118px}
   #${ID} .mhh-text b{font-size:15px}
  }
  @media(min-width:960px){#${ID}{display:none!important}}
  `;document.head.appendChild(s)
 }
 function build(){
  style();setupHeaderHome();
  const home=document.getElementById('home');if(!home||document.getElementById(ID))return;
  const hub=document.createElement('section');hub.id=ID;
  hub.innerHTML=`<div class="mhh-head"><h3>استكشف ورد</h3><span>كل الأقسام</span></div><div class="mhh-grid">${items.map(x=>`<button class="mhh-item" type="button" data-target="${x[3]}" aria-label="${x[1]}"><span class="mhh-icon">${x[0]}</span><span class="mhh-text"><b>${x[1]}</b><small>${x[2]}</small></span></button>`).join('')}</div>`;
  const hero=home.querySelector('.hero');if(hero)hero.insertAdjacentElement('afterend',hub);else home.prepend(hub);
  hub.querySelectorAll('[data-target]').forEach(b=>b.onclick=()=>openPage(b.dataset.target));
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);else build();
})();
