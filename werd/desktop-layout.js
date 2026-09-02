// Professional desktop shell for Werd; mobile layout remains unchanged.
(function(){
  const MQ='(min-width: 900px)';
  const items=[
    ['⌂','الرئيسية','home'],['📖','المصحف','quran'],['🌿','الأذكار','adhkar'],['📿','المسبحة','tasbih'],['◔','الورد اليومي','plan'],['📊','الإنجاز','stats'],
    ['🧠','متابعة الحفظ','memorizationTracker'],['🗺','رحلة الحفظ','memorizationJourney'],['📅','خطة اليوم','dailyMemorizationPlan'],['▦','الخطة الأسبوعية','weeklyMemorizationPlan'],['🎯','الهدف طويل المدى','longTermMemGoal'],['🏅','الإنجازات','advancedAchievements'],['☷','المزيد','more']
  ];
  function css(){if(document.getElementById('werdDesktopCss'))return;const s=document.createElement('style');s.id='werdDesktopCss';s.textContent=`
  @media(min-width:900px){
    html,body{min-height:100%;background:#f2eee6}body{overflow-x:hidden}
    .app{max-width:none!important;width:100%!important;min-height:100vh;margin:0!important;padding:92px 34px 48px 292px!important;background:var(--bg)}
    .top{position:fixed;z-index:35;top:0;right:0;left:0;height:76px;margin:0;padding:12px 34px 12px 292px;background:rgba(255,253,248,.94);backdrop-filter:blur(18px);border-bottom:1px solid var(--line);box-shadow:0 3px 16px rgba(30,60,48,.04)}
    .top .brand{position:static!important;margin:0 auto;direction:rtl;transform:translateX(-54px)}.top .logo{width:50px;height:50px;border-radius:15px}.top .brand h1{font-size:21px}.top .brand small{font-size:11px}.top .actions{position:absolute;right:34px;direction:ltr}
    main{display:block!important;max-width:1440px!important;margin:0 auto!important;width:100%!important;min-width:0}.page{width:100%;min-width:0}.page.active{animation:deskFade .18s ease}@keyframes deskFade{from{opacity:.65;transform:translateY(3px)}to{opacity:1;transform:none}}
    .bottom{position:fixed!important;z-index:40;top:0!important;bottom:0!important;left:0!important;right:auto!important;transform:none!important;width:258px!important;height:100vh!important;display:flex!important;flex-direction:column;gap:4px;padding:104px 14px 24px!important;background:rgba(255,253,248,.97);border:0;border-right:1px solid var(--line);box-shadow:8px 0 26px rgba(30,60,48,.035);overflow-y:auto;overflow-x:hidden;backdrop-filter:blur(18px)}
    .bottom:before{content:'التنقل';display:block;color:var(--muted);font-size:10px;font-weight:800;padding:0 13px 9px;text-align:right}.nav{display:flex;align-items:center;justify-content:flex-start;gap:12px;width:100%;min-height:43px;border-radius:13px;padding:11px 13px;font-size:13px;text-align:right;direction:rtl;transition:.15s;flex:0 0 auto}.nav i{display:grid;place-items:center;width:26px;font-size:18px}.nav:hover{background:var(--sage);color:var(--green)}.nav.active{background:var(--sage);color:var(--green)}
    .desktop-extra-nav{display:contents}.desktop-extra-nav .nav{flex:none}
    .hero{border-radius:24px;padding:25px}.hero h2{font-size:29px}.card{border-radius:18px;padding:18px}.section-title{margin:19px 2px 11px}.grid{grid-template-columns:repeat(6,minmax(0,1fr))}.tile{border-radius:17px;min-height:112px;display:grid;align-content:center}.statgrid{grid-template-columns:repeat(3,minmax(0,1fr))}

    /* Home: every dynamic section spans the full canvas by default. */
    #home.active{display:grid!important;grid-template-columns:repeat(12,minmax(0,1fr));gap:14px;align-items:start;width:100%}
    #home.active>*{grid-column:1/-1;min-width:0!important;max-width:none!important}
    #home.active>.hero{grid-column:span 8}
    #home.active>#authCard{grid-column:span 4}
    #home.active>#installCard{grid-column:span 4}
    #home.active>#smartDashboard{grid-column:1/-1!important;width:100%!important;min-width:0!important}
    #home.active>#smartDashboard .smart-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:12px}
    #home.active>#smartDashboard .smart-card.wide{grid-column:span 2!important}
    #home.active>#smartDashboard .smart-head,#home.active>#smartDashboard .smart-quick{width:100%;min-width:0}
    #home.active>.section-title{margin-bottom:-3px}
    #home.active>.grid{grid-column:1/-1}
    #home.active>.card:not(#authCard):not(#installCard){grid-column:span 6}
    #home.active>.offline{grid-column:1/-1}

    #quran.active,#adhkar.active,#tasbih.active,#plan.active,#stats.active{max-width:1180px!important;margin:0 auto!important}.reader-head{top:76px}.search input{font-size:14px}.ayah{font-size:28px;line-height:2.25}.counter-circle{width:240px;height:240px}
    .toast{bottom:28px}.mjour-grid,.aach-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}.mjour-juz-grid{grid-template-columns:repeat(5,minmax(0,1fr))!important}
  }
  @media(min-width:900px) and (max-width:1120px){
    .app{padding-left:238px!important;padding-right:22px!important}.top{padding-left:238px;padding-right:22px}.bottom{width:218px!important}.top .actions{right:22px}
    #home.active>.hero,#home.active>#authCard,#home.active>#installCard,#home.active>.card:not(#authCard):not(#installCard){grid-column:1/-1!important}
    #home.active>#smartDashboard .smart-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}#home.active>#smartDashboard .smart-card.wide{grid-column:1/-1!important}
    .grid{grid-template-columns:repeat(3,minmax(0,1fr))}.mjour-grid,.aach-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.mjour-juz-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}
  }
  @media(min-width:1300px){.app{padding-left:306px!important;padding-right:46px!important}.top{padding-left:306px;padding-right:46px}.bottom{width:272px!important}.top .actions{right:46px}.mjour-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important}}
  body.dark .bottom,body.dark .top{background:rgba(22,40,33,.97)}
  `;document.head.appendChild(s)}
  function addDesktopNav(){const nav=document.querySelector('.bottom');if(!nav||document.getElementById('desktopExtraNav'))return;const wrap=document.createElement('div');wrap.id='desktopExtraNav';wrap.className='desktop-extra-nav';const existing=new Set([...nav.querySelectorAll('[data-page]')].map(x=>x.dataset.page));for(const [icon,label,page] of items){if(existing.has(page))continue;const b=document.createElement('button');b.className='nav desktop-only-nav';b.dataset.page=page;b.innerHTML=`<i>${icon}</i>${label}`;b.onclick=()=>{if(document.getElementById(page)){go(page);return}const map={memorizationTracker:'openWerdMemorizationTracker',memorizationJourney:'openWerdMemorizationJourney',dailyMemorizationPlan:'openWerdDailyMemorizationPlan',weeklyMemorizationPlan:'openWerdWeeklyMemorizationPlan',longTermMemGoal:'openWerdLongTermMemGoal',advancedAchievements:'openWerdAdvancedAchievements'};const fn=window[map[page]];if(typeof fn==='function')fn();else if(typeof go==='function')go('more')};wrap.appendChild(b)}nav.appendChild(wrap)}
  function syncActive(){if(!matchMedia(MQ).matches)return;const active=document.querySelector('main .page.active')?.id;document.querySelectorAll('.bottom .nav').forEach(b=>b.classList.toggle('active',b.dataset.page===active))}
  function init(){css();addDesktopNav();syncActive();const main=document.querySelector('main');if(main)new MutationObserver(syncActive).observe(main,{subtree:true,attributes:true,attributeFilter:['class']});window.addEventListener('resize',syncActive)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();