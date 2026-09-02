// Dark premium desktop sidebar matching Werd's approved reference direction.
(function(){function run(){if(document.getElementById('werdReferenceSidebar'))return;const s=document.createElement('style');s.id='werdReferenceSidebar';s.textContent=`
@media(min-width:960px){
 .bottom{background:linear-gradient(180deg,#0b3d32 0%,#0c4a3b 48%,#092f28 100%)!important;border-left:1px solid rgba(204,170,99,.32)!important;box-shadow:-14px 0 38px rgba(8,43,35,.18)!important;color:#fff!important;overflow:hidden auto!important}
 .bottom:before{content:'ورد'!important;color:#f6efe0!important;font-size:26px!important;text-align:center!important;padding:18px 8px 22px!important;border-bottom:1px solid rgba(212,180,111,.24)!important;margin:0 10px 12px!important;font-weight:900!important;letter-spacing:.5px!important}
 .bottom:after{content:'';position:absolute;pointer-events:none;left:18px;right:18px;bottom:28px;height:155px;opacity:.34;background-repeat:no-repeat;background-position:center bottom;background-size:contain;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 180 170'%3E%3Cg fill='none' stroke='%23c9a65f' stroke-width='1.6' stroke-opacity='.75'%3E%3Cpath d='M26 166V81Q90 7 154 81v85'/%3E%3Cpath d='M43 166V90Q90 35 137 90v76'/%3E%3Cpath d='M55 166V101Q90 57 125 101v65'/%3E%3Cpath d='M26 132h128M43 113h94'/%3E%3Cpath d='M58 82l32 29 32-29M68 65l22 21 22-21'/%3E%3C/g%3E%3C/svg%3E")}
 .bottom .nav{position:relative;z-index:2;color:rgba(255,255,255,.82)!important;border:1px solid transparent!important;background:transparent!important;font-size:15px!important;min-height:44px!important;margin:1px 0!important}
 .bottom .nav i{color:rgba(239,224,188,.86)!important;filter:none!important}
 .bottom .nav:hover{color:#fff!important;background:rgba(255,255,255,.055)!important;border-color:rgba(212,180,111,.12)!important;transform:none!important}
 .bottom .nav.active{color:#183b32!important;background:linear-gradient(135deg,#d7b36a,#b88c3e)!important;border-color:#dfc37f!important;box-shadow:0 9px 22px rgba(0,0,0,.18),inset 0 1px 0 rgba(255,255,255,.28)!important;font-weight:900!important}
 .bottom .nav.active i{color:#244237!important}.bottom .nav.active:after{display:none!important}
 .app{margin-right:228px!important}.top{right:228px!important}
}
@media(min-width:1500px){.bottom{width:244px!important}.app{margin-right:244px!important}.top{right:244px!important}}
`;document.head.appendChild(s)}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run()})();