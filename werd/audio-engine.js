// Unified single-audio engine for Werd
(function(){
  if(window.werdAudioEngine)return;
  const NativeAudio=window.Audio;
  const native=new NativeAudio();
  native.preload='metadata';native.playsInline=true;
  let owner=null,seq=0;
  const clients=new Set();

  function makeClient(){
    const id=++seq,listeners=new Map();
    let src='',rate=1,preload='metadata',playsInline=true;
    const client={
      __werdAudioClient:id,
      get src(){return src},
      set src(v){src=String(v||'');if(owner===client)native.src=src},
      get currentSrc(){return owner===client?native.currentSrc:src},
      get preload(){return preload},set preload(v){preload=v||'metadata';if(owner===client)native.preload=preload},
      get playsInline(){return playsInline},set playsInline(v){playsInline=!!v;if(owner===client)native.playsInline=playsInline},
      get playbackRate(){return owner===client?native.playbackRate:rate},set playbackRate(v){rate=Number(v)||1;if(owner===client)native.playbackRate=rate},
      get currentTime(){return owner===client?native.currentTime:0},set currentTime(v){if(owner===client)try{native.currentTime=Number(v)||0}catch(e){}},
      get duration(){return owner===client?native.duration:NaN},
      get paused(){return owner===client?native.paused:true},
      get ended(){return owner===client?native.ended:false},
      addEventListener(type,fn){if(typeof fn!=='function')return;if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(fn)},
      removeEventListener(type,fn){listeners.get(type)?.delete(fn)},
      dispatchEvent(ev){dispatch(client,ev.type,ev);return true},
      async play(){
        await claim(client);
        return native.play();
      },
      pause(){if(owner===client)native.pause()},
      load(){if(owner===client)native.load()},
      removeAttribute(name){if(name==='src'){src='';if(owner===client){native.removeAttribute('src');native.load()}}},
      setAttribute(name,value){if(name==='src')client.src=value},
      canPlayType(type){return native.canPlayType(type)},
      _listeners:listeners
    };
    clients.add(client);return client;
  }

  function cloneEvent(type,base){try{return new Event(type)}catch(e){return{type,target:owner,currentTarget:owner,originalEvent:base}}}
  function dispatch(client,type,base){for(const fn of client?._listeners?.get(type)||[]){try{fn.call(client,cloneEvent(type,base))}catch(e){console.error('Werd audio listener',e)}}}

  async function claim(client){
    if(owner!==client){
      const previous=owner;
      if(previous&&!native.paused){native.pause();dispatch(previous,'pause')}
      owner=client;
      native.preload=client.preload||'metadata';native.playsInline=client.playsInline!==false;native.playbackRate=Number(client.playbackRate)||1;
      if(native.src!==client.src){native.src=client.src||'';if(client.src)native.load()}
      window.dispatchEvent(new CustomEvent('werd:audio-owner',{detail:{clientId:client.__werdAudioClient}}));
    }
  }

  ['play','pause','ended','timeupdate','error','loadedmetadata','durationchange','waiting','canplay'].forEach(type=>{
    native.addEventListener(type,e=>{if(owner)dispatch(owner,type,e)});
  });

  function stop(){if(owner){native.pause();native.removeAttribute('src');native.load();owner=null}}
  function status(){return{owner:owner?.__werdAudioClient||null,src:native.currentSrc||native.src||'',paused:native.paused,currentTime:native.currentTime||0,duration:Number.isFinite(native.duration)?native.duration:null}}

  window.werdAudioEngine={native,clients,stop,status,get owner(){return owner}};
  window.Audio=function WerdAudio(){return makeClient()};
  window.Audio.prototype=NativeAudio.prototype;
  try{Object.setPrototypeOf(window.Audio,NativeAudio)}catch(e){}
})();