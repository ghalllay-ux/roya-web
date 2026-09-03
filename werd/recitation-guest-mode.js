// Self-contained guest voice recitation for Chrome on iPhone — v108
(function(){
  if(!/CriOS/i.test(navigator.userAgent||''))return;
  const $=id=>document.getElementById(id);
  const ENDPOINT='https://oajqczrxzurwvxjkbseq.supabase.co/functions/v1/werd-transcribe-recitation';
  const INTERVALS={1:1,2:3,3:7,4:14,5:30};
  const NativeRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  let session=[],idx=0,recorder=null,stream=null,chunks=[],busy=false,transcript='',analysis=null,rated=false,hintUsed=false,elapsed=0,startedAt=0,timer=null,active=false,nativeRecognition=null;
  let cloudUnavailable=sessionStorage.getItem('werd_recitation_cloud_unavailable')==='1';
  let stats={scores:[],again:0,hard:0,good:0,easy:0,hints:0,exact:0,near:0,duration:0};

  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function notify(m){try{typeof toast==='function'?toast(m):console.log(m)}catch(_){}}
  function dateKey(d=new Date()){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return`${y}-${m}-${day}`}
  function addDays(date,days){const d=new Date(`${date}T12:00:00`);d.setDate(d.getDate()+Number(days||0));return dateKey(d)}
  function fmt(sec){sec=Math.max(0,Number(sec)||0);return`${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`}
  function directActive(){return !!($('rtestDirectBtn')?.classList.contains('active')&&$('rtestDirectPanel')?.classList.contains('show'))}
  function selected(){
    const sEl=$('rtestDirectSurah'),fromEl=$('rtestDirectFrom'),toEl=$('rtestDirectTo');
    const s=Math.max(1,Math.min(114,Number(sEl?.value)||1)),from=Math.max(1,Number(fromEl?.value)||1),to=Math.max(from,Number(toEl?.value)||from);
    const name=(sEl?.options?.[sEl.selectedIndex]?.text||`سورة ${s}`).replace(/^\s*\d+\.\s*/,'').trim();
    return{s,from,to,name}
  }
  function tracker(){
    if(typeof state==='undefined')return null;
    if(!state.memorizationTracker||typeof state.memorizationTracker!=='object'||Array.isArray(state.memorizationTracker))state.memorizationTracker={};
    const t=state.memorizationTracker;if(!t.items||typeof t.items!=='object'||Array.isArray(t.items))t.items={};if(!Array.isArray(t.history))t.history=[];if(!Array.isArray(t.recitationHistory))t.recitationHistory=[];return t
  }
  function ensureItem(x){
    const t=tracker();if(!t)return null;const id=`${x.surah}:${x.ayah}`;let item=t.items[id];
    if(!item){item={id,surah:x.surah,ayah:x.ayah,surahName:x.surahName,mastery:1,addedAt:new Date().toISOString(),nextReview:dateKey(),reviewCount:0,successCount:0,lapses:0,source:'direct-voice-recitation'};t.items[id]=item}
    return item
  }
  function setSupport(){
    if(!directActive())return;const start=$('rtestStart'),support=$('rtestSupport'),avail=$('rtestAvailable');if(!start)return;
    const v=selected();if(avail)avail.textContent=v.from===v.to?`جاهز للتسميع مباشرة: ${v.name} • الآية ${v.from}`:`جاهز للتسميع مباشرة: ${v.name} • ${v.from}–${v.to}`;
    if(!navigator.mediaDevices?.getUserMedia&&!NativeRecognition){start.disabled=true;if(support)support.innerHTML='<span>⚠️</span><div><b>التسجيل الصوتي غير متاح في هذا المتصفح.</b><br>حدّث Chrome ثم أعد المحاولة.</div>';return}
    start.disabled=false;start.textContent='ابدأ جلسة التسميع';
    if(support){
      if(cloudUnavailable&&NativeRecognition)support.innerHTML='<span>🎙️</span><div><b>جاهز بالتعرّف الصوتي المباشر ✓</b><br>الخدمة السحابية وصلت حد الحساب، لذلك سيستخدم «ورد» التعرّف المباشر من المتصفح.</div>';
      else support.innerHTML='<span>🎙️</span><div><b>جاهز للتسميع مباشرة بدون تسجيل ✓</b><br>اختر الآية واضغط بدء الجلسة. التسجيل الصوتي مؤقت للتحويل فقط ولا يُحفظ.</div>'
    }
  }
  function stopTracks(){try{stream?.getTracks().forEach(t=>t.stop())}catch(_){}stream=null}
  function stopTimer(){if(startedAt)elapsed=Math.max(elapsed,Math.floor((Date.now()-startedAt)/1000));startedAt=0;clearInterval(timer);timer=null;if($('rtestTime'))$('rtestTime').textContent=fmt(elapsed)}
  function startTimer(){startedAt=Date.now();clearInterval(timer);timer=setInterval(()=>{elapsed=Math.max(elapsed,Math.floor((Date.now()-startedAt)/1000));if($('rtestTime'))$('rtestTime').textContent=fmt(elapsed)},400)}
  function idleMic(ok=false){const m=$('rtestMic');if(m){m.classList.remove('live','starting');m.textContent='🎙';m.disabled=false}if($('rtestMicStatus'))$('rtestMicStatus').textContent=ok?'تم تحويل التسميع إلى نص ✓':'اضغط للبدء';if($('rtestRetry'))$('rtestRetry').disabled=!ok;if($('rtestAnalyze'))$('rtestAnalyze').disabled=!ok}
  function resetQuestion(){
    stopRecording(true);try{nativeRecognition?.abort()}catch(_){}nativeRecognition=null;transcript='';analysis=null;rated=false;hintUsed=false;elapsed=0;if($('rtestTime'))$('rtestTime').textContent='00:00';if($('rtestLive'))$('rtestLive').innerHTML='<span class="muted">اضغط الميكروفون وابدأ التسميع.</span>';if($('rtestHint')){$('rtestHint').classList.remove('show');$('rtestHint').textContent=''}if($('rtestHintBtn')){$('rtestHintBtn').disabled=false;$('rtestHintBtn').textContent='💡 تلميح'}idleMic(false);document.querySelectorAll('[data-rrate]').forEach(b=>{b.disabled=false;b.classList.remove('recommended')});if($('rtestNext'))$('rtestNext').disabled=true
  }
  function showQuestion(){
    resetQuestion();const x=session[idx];if(!x)return finish();active=true;
    if($('rtestHeroSmall'))$('rtestHeroSmall').textContent=cloudUnavailable&&NativeRecognition?'تسميع مباشر بدون تسجيل':'تسميع سحابي بدون تسجيل';if($('rtestHeroTitle'))$('rtestHeroTitle').textContent=`${x.surahName} • الآية ${x.ayah}`;if($('rtestPrompt'))$('rtestPrompt').textContent=`${x.surahName} — الآية ${x.ayah}`;if($('rtestCounter'))$('rtestCounter').textContent=`${idx+1} من ${session.length}`;if($('rtestProgress'))$('rtestProgress').style.width=`${Math.round(idx/session.length*100)}%`;
    if($('rtestSetup'))$('rtestSetup').style.display='none';if($('rtestSession'))$('rtestSession').style.display='block';if($('rtestAnalysis'))$('rtestAnalysis').style.display='none';if($('rtestDone'))$('rtestDone').style.display='none';if($('rtestNext'))$('rtestNext').textContent=idx===session.length-1?'إنهاء الجلسة':'التالي';window.scrollTo({top:0,behavior:'smooth'})
  }
  function startSession(){
    if(!directActive())return false;if(!navigator.mediaDevices?.getUserMedia&&!NativeRecognition){notify('التسجيل الصوتي غير متاح في هذا الإصدار من Chrome');return true}
    const v=selected();session=[];for(let a=v.from;a<=v.to;a++)session.push({id:`${v.s}:${a}`,surah:v.s,ayah:a,surahName:v.name});idx=0;stats={scores:[],again:0,hard:0,good:0,easy:0,hints:0,exact:0,near:0,duration:0};showQuestion();return true
  }
  function chooseMime(){for(const m of ['audio/mp4','audio/webm;codecs=opus','audio/webm','audio/ogg']){try{if(MediaRecorder.isTypeSupported?.(m))return m}catch(_){}}return''}
  function startNativeRecognition(){
    if(!NativeRecognition||busy||!active)return;
    busy=true;transcript='';const mic=$('rtestMic');if(mic){mic.disabled=true;mic.classList.add('live');mic.textContent='■'}if($('rtestMicStatus'))$('rtestMicStatus').textContent='أستمع الآن…';if($('rtestLive'))$('rtestLive').innerHTML='<span class="muted">تكلّم الآن… يستخدم «ورد» التعرّف المباشر من المتصفح.</span>';
    try{
      const rec=new NativeRecognition();nativeRecognition=rec;rec.lang='ar-SA';rec.continuous=false;rec.interimResults=true;rec.maxAlternatives=1;startTimer();
      let finalText='',interim='';
      rec.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++){const txt=e.results[i][0]?.transcript||'';if(e.results[i].isFinal)finalText+=txt+' ';else interim=txt}if($('rtestLive'))$('rtestLive').innerHTML=`<span>${esc(finalText)}</span>${interim?` <span class="interim">${esc(interim)}</span>`:''}`};
      rec.onerror=e=>{console.warn('Werd native recognition',e?.error);notify(e?.error==='not-allowed'?'اسمح بالميكروفون من إعدادات Chrome':'تعذر التعرّف المباشر، حاول مرة أخرى')};
      rec.onend=()=>{stopTimer();nativeRecognition=null;transcript=(finalText||interim||'').trim();busy=false;if($('rtestLive'))$('rtestLive').innerHTML=transcript?`<span>${esc(transcript)}</span>`:'<span class="muted">لم يُلتقط نص واضح. أعد المحاولة.</span>';idleMic(!!transcript);if(transcript)notify('تم التقاط التسميع ✓')};
      rec.start()
    }catch(e){console.error('Werd native start',e);nativeRecognition=null;busy=false;stopTimer();idleMic(false);notify('تعذر تشغيل التعرّف الصوتي المباشر')}
  }
  async function startRecording(){
    if(busy||!active)return;if(cloudUnavailable&&NativeRecognition)return startNativeRecognition();busy=true;const mic=$('rtestMic');if(mic){mic.disabled=true;mic.classList.add('starting')}if($('rtestMicStatus'))$('rtestMicStatus').textContent='جاري تشغيل الميكروفون…';
    try{stream=await navigator.mediaDevices.getUserMedia({audio:true});chunks=[];const mime=chooseMime();recorder=mime?new MediaRecorder(stream,{mimeType:mime}):new MediaRecorder(stream);recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data)};recorder.onstop=()=>processRecording(mime||recorder?.mimeType||'audio/mp4');recorder.start();startTimer();if(mic){mic.disabled=false;mic.classList.remove('starting');mic.classList.add('live');mic.textContent='■'}if($('rtestMicStatus'))$('rtestMicStatus').textContent='أسجّل الآن… اضغط للإيقاف';if($('rtestLive'))$('rtestLive').innerHTML='<span class="muted">يتم التسجيل الآن…</span>'}
    catch(e){console.error('Werd mic',e);stopTracks();idleMic(false);busy=false;notify('تعذر الوصول إلى الميكروفون')}
  }
  function stopRecording(discard=false){if(nativeRecognition){try{discard?nativeRecognition.abort():nativeRecognition.stop()}catch(_){}return}if(!recorder)return;recorder.__discard=discard;try{if(recorder.state==='recording')recorder.stop()}catch(_){}stopTimer()}
  async function toggleRecording(){if(nativeRecognition){try{nativeRecognition.stop()}catch(_){}return}if(recorder?.state==='recording'){stopRecording(false);return}await startRecording()}
  function cloudErrorMessage(code){
    if(code==='OPENAI_QUOTA_OR_RATE_LIMIT')return 'خدمة التحويل السحابي وصلت حد الحساب';
    if(code==='OPENAI_KEY_INVALID'||code==='OPENAI_KEY_MISSING')return 'إعداد خدمة التحويل يحتاج تحديث المفتاح';
    if(code==='AUDIO_OR_REQUEST_REJECTED')return 'صيغة التسجيل لم تُقبل، أعد المحاولة';
    return 'تعذر تحويل الصوت الآن، حاول مرة أخرى'
  }
  async function processRecording(mime){
    const r=recorder;recorder=null;stopTimer();stopTracks();if(r?.__discard){chunks=[];busy=false;return idleMic(false)}const blob=new Blob(chunks,{type:mime||'audio/mp4'});chunks=[];
    if(blob.size<800){busy=false;idleMic(false);return notify('التسجيل قصير جدًا، حاول مرة أخرى')}
    const mic=$('rtestMic');if(mic){mic.disabled=true;mic.classList.remove('live');mic.textContent='…'}if($('rtestMicStatus'))$('rtestMicStatus').textContent='جاري تحويل التسميع إلى نص…';if($('rtestLive'))$('rtestLive').innerHTML='<span class="muted">جاري التحويل السحابي…</span>';
    try{
      const fd=new FormData();fd.append('audio',blob,'werd-recitation.m4a');const headers={};try{if(typeof SUPABASE_PUBLISHABLE_KEY!=='undefined')headers.apikey=SUPABASE_PUBLISHABLE_KEY}catch(_){}
      const res=await fetch(ENDPOINT,{method:'POST',headers,body:fd});const j=await res.json().catch(()=>({}));
      if(!res.ok||!j.text){const err=new Error(j.code||j.error||`HTTP_${res.status}`);err.code=j.code||'';err.diagnostic=j.diagnostic||[];throw err}
      transcript=String(j.text).trim();if($('rtestLive'))$('rtestLive').innerHTML=transcript?`<span>${esc(transcript)}</span>`:'<span class="muted">لم يُلتقط نص واضح.</span>';idleMic(!!transcript);if(transcript)notify('تم تحويل التسميع إلى نص ✓')
    }catch(e){
      console.error('Werd guest transcription',e);transcript='';const code=String(e?.code||e?.message||'');
      if(code==='OPENAI_QUOTA_OR_RATE_LIMIT'){cloudUnavailable=true;sessionStorage.setItem('werd_recitation_cloud_unavailable','1')}
      if($('rtestLive')){
        if(code==='OPENAI_QUOTA_OR_RATE_LIMIT'&&NativeRecognition)$('rtestLive').innerHTML='<span class="muted">الخدمة السحابية وصلت حد الحساب. يمكنك المتابعة الآن بالتعرّف المباشر.</span><br><button class="primary" id="rtestNativeFallback" style="margin-top:12px;width:100%">🎙 استخدام التعرّف المباشر</button>';
        else $('rtestLive').innerHTML=`<span class="muted">${esc(cloudErrorMessage(code))}.</span>`
      }
      idleMic(false);notify(code==='OPENAI_QUOTA_OR_RATE_LIMIT'?(NativeRecognition?'الخدمة السحابية وصلت حدها • استخدم التعرّف المباشر':'خدمة التحويل السحابي وصلت حد الحساب'):cloudErrorMessage(code))
    }finally{busy=false}
  }
  function norm(v){return String(v||'').normalize('NFKD').replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g,'').replace(/ـ/g,'').replace(/[إأآٱ]/g,'ا').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/ى/g,'ي').replace(/[^\u0621-\u063A\u0641-\u064A0-9]/g,'').trim()}
  function toks(v){return String(v||'').split(/\s+/).map(raw=>({raw:raw.replace(/[۝۞﴿﴾]/g,''),norm:norm(raw)})).filter(x=>x.norm)}
  function lev(a,b){const m=a.length,n=b.length;if(!m)return n;if(!n)return m;let p=Array.from({length:n+1},(_,i)=>i);for(let i=1;i<=m;i++){const c=[i];for(let j=1;j<=n;j++)c[j]=Math.min(c[j-1]+1,p[j]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));p=c}return p[n]}
  function kind(a,b){if(a===b)return'match';const mx=Math.max(a.length,b.length),d=lev(a,b);if(mx>=5&&d===1)return'near';if(mx>=7&&d/mx<=.18)return'near';return'sub'}
  function align(e,a){const m=e.length,n=a.length,dp=Array.from({length:m+1},()=>Array(n+1).fill(0)),op=Array.from({length:m+1},()=>Array(n+1).fill(''));for(let i=1;i<=m;i++){dp[i][0]=i;op[i][0]='del'}for(let j=1;j<=n;j++){dp[0][j]=j;op[0][j]='ins'}for(let i=1;i<=m;i++)for(let j=1;j<=n;j++){const k=kind(e[i-1].norm,a[j-1].norm),cost=k==='match'?0:(k==='near'?.45:1),sub=dp[i-1][j-1]+cost,del=dp[i-1][j]+1,ins=dp[i][j-1]+1,b=Math.min(sub,del,ins);dp[i][j]=b;op[i][j]=b===sub?k:(b===del?'del':'ins')}let i=m,j=n,out=[];while(i||j){const k=op[i][j];if(k==='match'||k==='near'||k==='sub'){out.push({type:k,e:e[i-1],a:a[j-1]});i--;j--}else if(k==='del'){out.push({type:'del',e:e[i-1]});i--}else{out.push({type:'ins',a:a[j-1]});j--}}out.reverse();const exact=out.filter(x=>x.type==='match').length,near=out.filter(x=>x.type==='near').length,total=m,score=total?Math.round((exact+near*.6)/total*100):0;return{out,exact,near,total,score}}
  async function fetchAyah(x){let base='https://api.alquran.cloud/v1';try{if(typeof API_QURAN!=='undefined')base=API_QURAN}catch(_){}const r=await fetch(`${base}/ayah/${x.surah}:${x.ayah}/quran-uthmani`);if(!r.ok)throw Error('quran');const j=await r.json(),text=j?.data?.text;if(!text)throw Error('quran');return text}
  function verdict(s){return s>=95?'ممتاز':s>=85?'جيد جدًا':s>=70?'جيد':s>=55?'يحتاج تثبيت':'أعد المراجعة'}
  function recommend(a){return a.score>=96&&!hintUsed?'easy':a.score>=84&&!hintUsed?'good':a.score>=62?'hard':'again'}
  async function analyze(){
    if(!transcript)return notify('سجّل تسميعك أولًا');const b=$('rtestAnalyze');if(b){b.disabled=true;b.textContent='جاري المقارنة…'}
    try{const text=await fetchAyah(session[idx]);analysis=align(toks(text),toks(transcript));if($('rtestSession'))$('rtestSession').style.display='none';if($('rtestAnalysis'))$('rtestAnalysis').style.display='block';if($('rtestProgress'))$('rtestProgress').style.width=`${Math.round((idx+1)/session.length*100)}%`;if($('rtestScore'))$('rtestScore').textContent=`${analysis.score}٪`;if($('rtestVerdict'))$('rtestVerdict').textContent=verdict(analysis.score);const errs=analysis.out.filter(x=>x.type==='sub'||x.type==='del'),extras=analysis.out.filter(x=>x.type==='ins').map(x=>x.a.raw);if($('rtestScoreMeta'))$('rtestScoreMeta').textContent=`${analysis.exact} مطابق • ${analysis.near} قريب • ${errs.length} يحتاج مراجعة`;if($('rtestWords'))$('rtestWords').innerHTML=analysis.out.filter(x=>x.type!=='ins').map(x=>x.type==='match'?`<span class="rtest-word rtest-match">${esc(x.e.raw)}</span>`:x.type==='near'?`<span class="rtest-word rtest-near">${esc(x.e.raw)}<small>سُمعت قريبًا: ${esc(x.a?.raw||'—')}</small></span>`:x.type==='del'?`<span class="rtest-word rtest-miss">${esc(x.e.raw)}<small>لم تُلتقط</small></span>`:`<span class="rtest-word rtest-sub">${esc(x.e.raw)}<small>سُمعت: ${esc(x.a?.raw||'—')}</small></span>`).join('');const ex=$('rtestExtras');if(ex){if(extras.length){ex.style.display='block';ex.innerHTML=`<b>كلمات إضافية التقطها الجهاز:</b> ${extras.map(esc).join(' • ')}`}else ex.style.display='none'}const rec=recommend(analysis);document.querySelectorAll('[data-rrate]').forEach(x=>x.classList.toggle('recommended',x.dataset.rrate===rec));if($('rtestRecommend'))$('rtestRecommend').innerHTML=`اقتراح «ورد»: <b>${({again:'أعدها',hard:'صعب',good:'جيد',easy:'متقن'})[rec]}</b> • النتيجة تقديرية.`
    }catch(e){console.error(e);notify('تعذر تحميل نص الآية للمقارنة')}finally{if(b){b.disabled=false;b.textContent='تحليل التسميع'}}
  }
  async function hint(){if(hintUsed)return;const b=$('rtestHintBtn');if(b){b.disabled=true;b.textContent='جاري إظهار التلميح…'}try{const text=await fetchAyah(session[idx]),words=toks(text).slice(0,2).map(x=>x.raw).join(' ');if($('rtestHint')){$('rtestHint').textContent=`بداية الآية: ${words} …`;$('rtestHint').classList.add('show')}hintUsed=true;stats.hints++;if(b)b.textContent='تم استخدام التلميح ✓'}catch(e){if(b){b.disabled=false;b.textContent='💡 تلميح'}notify('تعذر تحميل التلميح الآن')}}
  function retry(){stopRecording(true);transcript='';analysis=null;elapsed=0;if($('rtestLive'))$('rtestLive').innerHTML='<span class="muted">اضغط الميكروفون وابدأ التسميع.</span>';idleMic(false);if($('rtestTime'))$('rtestTime').textContent='00:00'}
  function rate(rating){
    if(!analysis||rated)return;const x=session[idx],item=ensureItem(x),t=tracker();if(!item||!t)return;const before=Math.max(1,Math.min(5,Number(item.mastery)||1));let after=before,days=1,success=true;if(rating==='again'){after=1;days=1;success=false;item.lapses=(Number(item.lapses)||0)+1}else if(rating==='hard'){days=Math.max(1,Math.ceil((INTERVALS[after]||1)/2))}else if(rating==='good'){after=Math.min(5,before+1);days=INTERVALS[after]||7}else if(rating==='easy'){after=Math.min(5,before+2);days=Math.max(INTERVALS[after]||14,7)}const today=dateKey();item.mastery=after;item.lastReviewed=new Date().toISOString();item.nextReview=addDays(today,days);item.reviewCount=(Number(item.reviewCount)||0)+1;if(success)item.successCount=(Number(item.successCount)||0)+1;t.history.unshift({at:new Date().toISOString(),date:today,id:x.id,surah:x.surah,ayah:x.ayah,rating,before,after,nextReview:item.nextReview,source:'voice-recitation'});t.recitationHistory.unshift({at:new Date().toISOString(),date:today,id:x.id,surah:x.surah,ayah:x.ayah,score:analysis.score,exact:analysis.exact,near:analysis.near,total:analysis.total,rating,hintUsed,durationSec:elapsed,engine:cloudUnavailable?'browser-direct':'guest-server'});if(t.history.length>500)t.history.length=500;if(t.recitationHistory.length>200)t.recitationHistory.length=200;stats.scores.push(analysis.score);stats[rating]=(stats[rating]||0)+1;stats.exact+=analysis.exact;stats.near+=analysis.near;stats.duration+=elapsed;rated=true;try{typeof save==='function'&&save()}catch(e){console.warn('Werd local save',e)}document.querySelectorAll('[data-rrate]').forEach(b=>b.disabled=true);if($('rtestNext'))$('rtestNext').disabled=false;notify('تم حفظ تقييم التسميع على هذا الجهاز ✓')
  }
  function next(){if(!rated)return;idx++;idx>=session.length?finish():showQuestion()}
  function finish(){stopRecording(true);stopTracks();active=false;if($('rtestSession'))$('rtestSession').style.display='none';if($('rtestAnalysis'))$('rtestAnalysis').style.display='none';if($('rtestDone'))$('rtestDone').style.display='block';if($('rtestHeroSmall'))$('rtestHeroSmall').textContent='اكتملت الجلسة';if($('rtestHeroTitle'))$('rtestHeroTitle').textContent='نتيجة التسميع';if($('rtestCounter'))$('rtestCounter').textContent=`${session.length} آية`;if($('rtestProgress'))$('rtestProgress').style.width='100%';const avg=stats.scores.length?Math.round(stats.scores.reduce((a,b)=>a+b,0)/stats.scores.length):0;if($('rtestAvg'))$('rtestAvg').textContent=`${avg}٪`;if($('rtestStrong'))$('rtestStrong').textContent=(stats.good||0)+(stats.easy||0);if($('rtestWeak'))$('rtestWeak').textContent=(stats.again||0)+(stats.hard||0);if($('rtestHints'))$('rtestHints').textContent=stats.hints||0;if($('rtestDoneMeta'))$('rtestDoneMeta').textContent=`${stats.exact} كلمة مطابقة • ${stats.near} قريبة صوتيًا • زمن التسميع ${fmt(stats.duration)}`}
  function newSession(){stopRecording(true);stopTracks();active=false;session=[];idx=0;if($('rtestSetup'))$('rtestSetup').style.display='block';if($('rtestSession'))$('rtestSession').style.display='none';if($('rtestAnalysis'))$('rtestAnalysis').style.display='none';if($('rtestDone'))$('rtestDone').style.display='none';setTimeout(()=>{$('rtestDirectBtn')?.click();setSupport()},30)}

  function capture(e){
    const t=e.target?.closest?.('#rtestStart,#rtestMic,#rtestNativeFallback,#rtestAnalyze,#rtestHintBtn,#rtestRetry,#rtestNext,#rtestAgain,[data-rrate]');if(!t)return;
    if(t.id==='rtestStart'){if(!directActive())return;e.preventDefault();e.stopImmediatePropagation();startSession();return}
    if(!active&&t.id!=='rtestAgain')return;e.preventDefault();e.stopImmediatePropagation();
    if(t.id==='rtestMic')toggleRecording();else if(t.id==='rtestNativeFallback')startNativeRecognition();else if(t.id==='rtestAnalyze')analyze();else if(t.id==='rtestHintBtn')hint();else if(t.id==='rtestRetry')retry();else if(t.id==='rtestNext')next();else if(t.id==='rtestAgain')newSession();else if(t.dataset?.rrate)rate(t.dataset.rrate)
  }
  function install(){
    const page=$('recitationTest');if(!page||!$('rtestStart')||!$('rtestDirectBtn'))return setTimeout(install,160);
    if(document.documentElement.dataset.werdGuest108)return;document.documentElement.dataset.werdGuest108='1';
    document.addEventListener('click',capture,true);document.addEventListener('pointerdown',e=>{if(e.target?.closest?.('#rtestStart,#rtestMic'))setTimeout(setSupport,0)},true);
    document.addEventListener('change',e=>{if(e.target?.closest?.('#rtestDirectSurah,#rtestDirectFrom,#rtestDirectTo'))setTimeout(setSupport,0)});
    setInterval(()=>{if(directActive()&&!active)setSupport()},500);setTimeout(setSupport,50)
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  window.addEventListener('pageshow',()=>setTimeout(install,100));
})();