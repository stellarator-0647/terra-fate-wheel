// One persistent audio channel: rendering the game never replaces this element.
export const TRACK={title:'生命流',scene:'视野',src:'assets/music/lifeflow.mp3',source:'https://monster-siren.hypergryph.com/music/232202'};
const KEY='terra-bgm-v1';
export function readMusicSettings(storage){
  try{const s=JSON.parse(storage.getItem(KEY)||'null');return {enabled:s?.enabled!==false,volume:Number.isFinite(s?.volume)?Math.max(0,Math.min(1,s.volume)):.25};}
  catch{return {enabled:true,volume:.25};}
}
const waveform='<span class="bgm-wave" aria-hidden="true"><i></i><i></i><i></i><i></i></span>';
export function musicTrigger(){return `<button class="bgm-trigger" type="button" data-bgm-open aria-label="背景音乐设置" aria-expanded="false" aria-controls="bgm-panel">${waveform}<span>BGM</span><span data-bgm-brief>待播放</span></button>`;}
export function createMusicChannel({audio,storage,hidden=()=>false,notify=()=>{},frame=fn=>requestAnimationFrame(fn),now=()=>performance.now()}){
  const prefs=readMusicSettings(storage);let unlocked=false,loading=false,error=false,generation=0,fadeGeneration=0;
  audio.loop=true;audio.preload='none';audio.volume=prefs.volume;
  function save(){try{storage.setItem(KEY,JSON.stringify(prefs));}catch{}}
  function snapshot(){return {...prefs,unlocked,loading,error,playing:!audio.paused&&!hidden(),state:!prefs.enabled?'已关闭':error?'加载失败':hidden()?'后台暂停':loading?'正在加载':!audio.paused?'播放中':'待播放'};}
  function publish(){notify(snapshot());}
  function fade(){const id=++fadeGeneration,start=now(),from=audio.volume;
    const tick=()=>{if(id!==fadeGeneration)return;const t=Math.min(1,(now()-start)/450);audio.volume=from+(prefs.volume-from)*t;if(t<1)frame(tick);};frame(tick);
  }
  async function resume(){
    if(!prefs.enabled||!unlocked||hidden()||loading||!audio.paused)return;
    const id=++generation;loading=true;error=false;audio.volume=0;publish();
    try{await audio.play();if(id!==generation||!prefs.enabled||hidden()){audio.pause();return;}loading=false;fade();publish();}
    catch(e){if(id!==generation)return;loading=false;error=e?.name!=='NotAllowedError'&&e?.name!=='AbortError';publish();}
  }
  function suspend(){generation++;fadeGeneration++;loading=false;audio.pause();publish();}
  audio.addEventListener('error',()=>{generation++;fadeGeneration++;loading=false;error=true;publish();});
  audio.addEventListener('playing',publish);audio.addEventListener('pause',publish);
  return {snapshot,gesture(){unlocked=true;return resume();},toggle(){prefs.enabled=!prefs.enabled;unlocked=true;save();if(prefs.enabled)return resume();suspend();},setVolume(value){prefs.volume=Math.max(0,Math.min(1,Number(value)||0));save();if(!audio.paused)fade();else audio.volume=prefs.volume;publish();},visibility(){if(hidden())suspend();else return resume();},retry(){unlocked=true;error=false;audio.load();return resume();}};
}
let channel;
export function syncMusicUI(){
  if(!channel)return;const s=channel.snapshot();
  document.querySelectorAll('[data-bgm-open]').forEach(el=>{el.classList.toggle('is-playing',s.playing);el.setAttribute('aria-expanded',String(!document.getElementById('bgm-panel').hidden));el.title=`背景音乐：${TRACK.title} · ${s.state}`;el.querySelector('[data-bgm-brief]').textContent=s.state;});
  const panel=document.getElementById('bgm-panel');panel.dataset.playing=String(s.playing);
  panel.querySelector('[data-bgm-state]').textContent=s.state;
  const toggle=panel.querySelector('[data-bgm-toggle]');toggle.textContent=s.enabled?'关闭音乐':'开启音乐';toggle.setAttribute('aria-pressed',String(s.enabled));
  const volume=panel.querySelector('[data-bgm-volume]');if(document.activeElement!==volume)volume.value=String(Math.round(s.volume*100));
  panel.querySelector('output').textContent=Math.round(s.volume*100)+'%';panel.querySelector('[data-bgm-retry]').hidden=!s.error;
}
export function initMusic(){
  const root=document.createElement('div');root.id='bgm-channel';root.innerHTML=`<audio id="bgm-audio" src="${TRACK.src}" loop preload="none"></audio><section class="bgm-panel" id="bgm-panel" aria-label="背景音乐控制" hidden><div class="bgm-panel-top"><span>PRTS / AUDIO CHANNEL</span><button type="button" data-bgm-close aria-label="关闭音乐面板">×</button></div><div class="bgm-track"><div class="bgm-record" aria-hidden="true">${waveform}</div><div><h2>${TRACK.title}</h2><p>明日方舟主页 · ${TRACK.scene}</p><span class="bgm-state" data-bgm-state role="status">待播放</span></div></div><div class="bgm-controls"><button type="button" data-bgm-toggle aria-pressed="true">关闭音乐</button><button type="button" data-bgm-retry hidden>重试加载</button></div><label class="bgm-volume">音乐音量 <output>25%</output><input type="range" min="0" max="100" step="1" value="25" data-bgm-volume aria-label="音乐音量"></label><div class="bgm-credits"><span>塞壬唱片 · MSR</span><a href="${TRACK.source}" target="_blank" rel="noreferrer">曲目来源 ↗</a></div></section>`;
  document.body.append(root);const panel=root.querySelector('section');
  let storage;try{storage=localStorage;}catch{storage={getItem:()=>null,setItem:()=>{}};}
  channel=createMusicChannel({audio:root.querySelector('audio'),storage,hidden:()=>document.hidden,notify:syncMusicUI});
  function close(){panel.hidden=true;syncMusicUI();}
  document.addEventListener('pointerdown',e=>{if(!e.target.closest('#bgm-channel,[data-bgm-open]'))channel.gesture();});
  document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&!e.target.closest('#bgm-channel,[data-bgm-open]'))channel.gesture();if(e.key==='Escape')close();});
  document.addEventListener('click',e=>{const trigger=e.target.closest('[data-bgm-open]');if(trigger){panel.hidden=!panel.hidden;syncMusicUI();if(!panel.hidden){channel.gesture();panel.querySelector('[data-bgm-close]').focus();}}else if(!e.target.closest('#bgm-channel'))close();});
  root.querySelector('[data-bgm-close]').onclick=close;
  root.querySelector('[data-bgm-toggle]').onclick=()=>channel.toggle();
  root.querySelector('[data-bgm-retry]').onclick=()=>channel.retry();
  root.querySelector('[data-bgm-volume]').oninput=e=>channel.setVolume(e.target.value/100);
  document.addEventListener('visibilitychange',()=>channel.visibility());
}
