// Mushaf network bridge: keep the existing reader API contract, but route page requests through Werd's own Cloudflare origin.
(function(){
  const nativeFetch=window.fetch.bind(window);
  function timeoutFetch(url,opts={},ms=9000){
    const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);
    return nativeFetch(url,{...opts,signal:c.signal,cache:'no-store'}).finally(()=>clearTimeout(t));
  }
  window.fetch=function(input,init){
    const raw=typeof input==='string'?input:input?.url||'';
    const m=raw.match(/^https:\/\/api\.alquran\.cloud\/v1\/page\/(\d+)\/quran-uthmani(?:\?.*)?$/i);
    if(!m)return nativeFetch(input,init);
    const page=Math.max(1,Math.min(604,Number(m[1])||1));
    return timeoutFetch(`/api/mushaf/${page}?v=50`,{headers:{Accept:'application/json'}},9000);
  };
  function installRetry(){
    const sheet=document.getElementById('mushafSheet');
    if(!sheet)return;
    const failed=sheet.textContent.includes('تعذر تحميل الصفحة')||sheet.textContent.includes('تعذر العثور على آيات');
    if(!failed||sheet.querySelector('.mushaf-retry-btn'))return;
    const b=document.createElement('button');b.className='secondary mushaf-retry-btn';b.style.cssText='margin:14px auto 0;display:block';b.textContent='إعادة المحاولة';
    b.onclick=()=>window.openMushaf?.(Number(document.getElementById('mushafPageInput')?.value||1));sheet.appendChild(b);
  }
  document.addEventListener('DOMContentLoaded',()=>{if(document.body)new MutationObserver(installRetry).observe(document.body,{subtree:true,childList:true,characterData:true})});
})();