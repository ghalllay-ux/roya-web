from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
marker='/* roya-mobile-visual-comfort-v4 */'
css=r'''
/* roya-mobile-visual-comfort-v4 */
@media(max-width:800px){
 body{background:radial-gradient(circle at 50% -10%,rgba(112,92,210,.12),transparent 34%),linear-gradient(180deg,#0b0e22 0%,#0d1026 52%,#0a0d20 100%);color:#eef0f8}
 .shell{padding-inline:14px}
 header{background:rgba(11,14,34,.91);border-bottom-color:rgba(255,255,255,.04)}
 .hero>.panel:first-child,.side,.card,.price,#workspace{background:linear-gradient(155deg,rgba(23,27,52,.82),rgba(14,18,40,.88))!important;border-color:rgba(255,255,255,.06)!important;box-shadow:0 8px 28px rgba(0,0,0,.14)!important}
 .hero h1{font-size:28px;line-height:1.3;margin-block:9px 11px}.hero p{color:#aeb5cc;line-height:1.9}
 .kicker{color:#c9c3ee}.dreambox{margin-top:17px;background:rgba(8,11,27,.58);border-color:rgba(255,255,255,.055);padding:13px}textarea{min-height:128px;background:transparent;color:#f3f4fa;line-height:1.85}
 .primary{box-shadow:0 8px 20px rgba(91,74,190,.16)}.secondary,.ghost{background:rgba(255,255,255,.035);border-color:rgba(255,255,255,.07)}
 .privacy{background:rgba(255,255,255,.025);border-color:rgba(255,255,255,.045)}.privacy p,.step span,.card p{color:#969eb8!important}
 .section{margin-top:24px}.sectionTitle{margin-bottom:12px}.sectionTitle h2{font-size:16px;font-weight:700}.sectionTitle span{color:#8991aa;background:transparent;border:0;padding:0}
 .steps,.cards{gap:10px}.step{background:rgba(255,255,255,.025);border-color:rgba(255,255,255,.045);padding:12px;min-height:84px}.num{background:rgba(119,101,218,.13);color:#d9d3ff}
 .card{padding:15px 12px;min-height:142px}.card .icon{opacity:.9}.card h3{margin-top:9px;font-size:12px}.card p{line-height:1.65}
 .pricing{gap:11px}.pricing .price{background:linear-gradient(155deg,rgba(24,28,54,.9),rgba(15,19,42,.94))!important}.pricing .amount{letter-spacing:-.5px}
 nav{background:rgba(13,17,39,.94);border-color:rgba(255,255,255,.055);box-shadow:0 10px 34px rgba(0,0,0,.35)}nav button{color:#8f97b1}nav button.active{color:#f3f1ff;background:rgba(119,101,218,.13)}
 .modal{background:rgba(4,6,17,.58)}.modalbox{background:linear-gradient(180deg,#171b36,#0e122a);border-color:rgba(255,255,255,.065)}
 *{scrollbar-width:none}*::-webkit-scrollbar{display:none}
}
@media(prefers-reduced-motion:reduce){*,*:before,*:after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
'''
if marker not in s:
    s=s.replace('</style>',css+'\n</style>',1)
p.write_text(s,encoding='utf-8')
print('Roya mobile visual comfort v4 applied')
