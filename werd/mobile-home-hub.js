// Mobile-only horizontal feature hub for Werd.
(function(){
 const ID='werdMobileHomeHub';
 const items=[
  ['📖','المصحف','قراءة القرآن','mushaf'],
  ['🎧','الاستماع','التلاوات والقراء','listening'],
  ['🌿','الأذكار','الصباح والمساء','adhkar'],
  ['🤲','حصن المسلم','الأدعية والأذكار','hisn'],
  ['◔','الورد اليومي','هدفك وتقدمك','plan'],
  ['📗','الختمة','متابعة الختمة','khatma'],
  ['📿','المسبحة','التسبيح والعداد','tasbih'],
  ['🕌','الصلاة','المواقيت والقبلة','prayer'],
  ['✦','أسماء الله الحسنى','الأسماء والمعاني','asma'],
  ['🔖','علامات القراءة','مواضعك المحفوظة','bookmarks'],
  ['♥️','المفضلة','الآيات والأذكار','favorites'],
  ['📊','الإنجاز','إحصائيات تقدمك','stats'],
  ['🧠','الحفظ والمراجعة','كل أدوات الحفظ في مكان واحد','memorizationHub'],
  ['🔎','البحث','بحث في ورد','search'],
  ['⚙️','الإعدادات','تخصيص التطبيق','settings']
 ];
 function openPage(page){
  if(page==='mushaf'&&typeof window.openWerdMushafV2==='function'){window.openWerdMushafV2();return}
  if(page==='mushaf'&&typeof window.openMushaf==='function'){window.openMushaf();return}
  if(page==='memorizationHub'&&typeof window.openWerdMemorizationHub==='function'){window.openWerdMemorizationHub();return}
  try{window.go(page)}catch(_){try{go(page)}catch(e){}}
 }
 function setupHeaderHome(){
  const btn=document.getElementById('syncBtn');
  if(!btn)return;
  btn.title='الرئيسية';
  btn.setAttribute('aria-label','الصفحة الرئيسية');
  btn.dataset.werdRole='home';
  btn.innerHTML='<svg viewBox="0 0 24 24" width="25" height="25" aria-hidden="true" focusable="false"><path d="M3.7 10.4 12 3.7l8.3 6.7v9.1a1.5 1.5 0 0 1-1.5 1.5h-4.6v-6.1H9.8V21H5.2a1.5 1.5 0 0 1-1.5-1.5v-9.1Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9.8 21v-6.1h4.4V21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
  btn.onclick=()=>{try{if(typeof window.go==='function')window.go('home');else go('home')}catch(_){}window.scrollTo({top:0,behavior:'smooth'})};
 }
 function style(){if(document.getElementById(ID+'Style'))return;const s=document.createElement('style');s.id=ID+'Style';s.textContent=`
 @media(max-width:959px){
  #${ID}{display:block;margin:18px 0 22px}
  #${ID} .mhh-head{display:flex;align-items:end;justify-content:space-between;gap:10px;margin:0 2px 12px}
  #${ID} .mhh-head h3{margin:0;font-size:19px;font-weight:900;color:var(--ink)}
  #${ID} .mhh-head span{font-size:11px;color:var(--muted)}
  #${ID} .mhh-grid{display:grid;grid-template-columns:1fr;gap:9px}
  #${ID} .mhh-item{width:100%;min-height:76px;border:1px solid var(--line);background:linear-gradient(110deg,var(--card),rgba(246,241,226,.72));border-radius:20px;padding:12px 13px;display:grid;grid-template-columns:52px minmax(0,1fr) 30px;align-items:center;gap:12px;text-align:right;color:var(--ink);box-shadow:0 5px 17px rgba(24,62,47,.055);-webkit-tap-highlight-color:transparent}
  #${ID} .mhh-item:active{transform:scale(.985)}
  #${ID} .mhh-icon{width:52px;height:52px;border-radius:17px;display:grid;place-items:center;font-size:25px;background:rgba(15,91,69,.09);border:1px solid rgba(15,91,69,.09)}
  #${ID} .mhh-text{min-width:0}.mhh-text b{display:block;font-size:16px;font-weight:900;line-height:1.35}.mhh-text small{display:block;color:var(--muted);font-size:12px;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #${ID} .mhh-arrow{font-size:22px;color:var(--gold);font-weight:800;direction:ltr}
  #home>.grid,#home>.section-title:has(+ .grid){display:none!important}
 }
 @media(min-width:960px){#${ID}{display:none!important}}
 `;document.head.appendChild(s)}
 function build(){style();setupHeaderHome();const home=document.getElementById('home');if(!home||document.getElementById(ID))return;const hub=document.createElement('section');hub.id=ID;hub.innerHTML=`<div class="mhh-head"><h3>استكشف ورد</h3><span>كل الأقسام</span></div><div class="mhh-grid">${items.map(x=>`<button class="mhh-item" type="button" data-target="${x[3]}"><span class="mhh-icon">${x[0]}</span><span class="mhh-text"><b>${x[1]}</b><small>${x[2]}</small></span><span class="mhh-arrow">‹</span></button>`).join('')}</div>`;const hero=home.querySelector('.hero');if(hero)hero.insertAdjacentElement('afterend',hub);else home.prepend(hub);hub.querySelectorAll('[data-target]').forEach(b=>b.onclick=()=>openPage(b.dataset.target))}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);else build();
})();
