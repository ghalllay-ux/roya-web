// Group memorization-related home widgets into one mobile section.
(function(){
 const PAGE_ID='memorizationHub';
 const TITLES=['رحلة الحفظ','إنجازات الحفظ','إنجاز الحفظ هذا الشهر','هدف الحفظ','أسبوع الحفظ','خطة الحفظ اليوم'];
 let moved=[];
 function mobile(){return matchMedia('(max-width:959px)').matches}
 function style(){if(document.getElementById('werdMobileMemHubStyle'))return;const s=document.createElement('style');s.id='werdMobileMemHubStyle';s.textContent=`
 @media(max-width:959px){
  #${PAGE_ID}.page{padding-bottom:20px}
  #${PAGE_ID} .mmh-hero{background:linear-gradient(145deg,var(--green),#164d3d);color:#fff;border-radius:24px;padding:18px;margin-bottom:12px;box-shadow:0 10px 28px rgba(20,66,50,.12)}
  #${PAGE_ID} .mmh-hero h3{margin:0 0 5px;font-size:21px}.mmh-hero p{margin:0;color:rgba(255,255,255,.75);line-height:1.7;font-size:12px}
  #${PAGE_ID} .mmh-primary{width:100%;margin:10px 0 14px;border:0;border-radius:18px;background:var(--green);color:white;padding:14px;font-weight:900;font-size:15px}
  #${PAGE_ID} .mmh-stack{display:grid;gap:10px}
  #${PAGE_ID} .mmh-stack>.card,#${PAGE_ID} .mmh-stack>[class*="card"]{margin:0!important}
 }
 `;document.head.appendChild(s)}
 function ensurePage(){style();const main=document.querySelector('main');if(!main)return null;let sec=document.getElementById(PAGE_ID);if(sec)return sec;sec=document.createElement('section');sec.className='page';sec.id=PAGE_ID;sec.innerHTML=`<div class="section-title"><h3>الحفظ والمراجعة</h3><button class="smallbtn" id="mmhBack">الرئيسية</button></div><div class="mmh-hero"><h3>رحلتك مع الحفظ</h3><p>كل أدوات الحفظ والمراجعة والإنجازات في مكان واحد.</p></div><button class="mmh-primary" id="mmhSession">🧠 بدء جلسة الحفظ والمراجعة</button><div class="mmh-stack" id="mmhStack"></div>`;main.appendChild(sec);sec.querySelector('#mmhBack').onclick=()=>go('home');sec.querySelector('#mmhSession').onclick=()=>{if(typeof window.openWerdMemorization==='function')window.openWerdMemorization();else go('memorization')};return sec}
 function directHomeCardFor(title){const home=document.getElementById('home');if(!home)return null;const all=[...home.querySelectorAll('.card,[class*="home"],[class*="jour"],[class*="achievement"],[class*="mem"]')];for(const el of all){if(el.closest('#'+PAGE_ID))continue;const txt=(el.textContent||'').replace(/\s+/g,' ').trim();if(txt.includes(title)){let node=el;while(node.parentElement&&node.parentElement!==home&&node.parentElement.children.length===1)node=node.parentElement;return node}}return null}
 function group(){if(!mobile())return;const sec=ensurePage(),stack=sec?.querySelector('#mmhStack');if(!stack)return;for(const t of TITLES){if(moved.some(x=>x.title===t))continue;const node=directHomeCardFor(t);if(node){moved.push({title:t,node,parent:node.parentNode,next:node.nextSibling});stack.appendChild(node)}}}
 function restore(){if(mobile())return;for(const x of moved.splice(0)){try{x.parent.insertBefore(x.node,x.next)}catch(e){try{x.parent.appendChild(x.node)}catch(_){}}}}
 function init(){ensurePage();group();const obs=new MutationObserver(()=>group());const home=document.getElementById('home');if(home)obs.observe(home,{childList:true,subtree:true});addEventListener('resize',()=>{mobile()?group():restore()})}
 window.openWerdMemorizationHub=()=>{group();go(PAGE_ID);document.querySelectorAll('.bottom .nav').forEach(n=>n.classList.remove('active'));document.querySelector('.bottom .nav[data-page="more"]')?.classList.add('active')};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,300));else setTimeout(init,300);
})();