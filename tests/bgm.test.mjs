import test from 'node:test';
import assert from 'node:assert/strict';
import {createMusicChannel,readMusicSettings,TRACK} from '../dist/bgm.js';
function harness(play){
  const values=new Map(),handlers={};let hidden=false;
  const storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
  const audio={paused:true,volume:1,addEventListener:(n,f)=>handlers[n]=f,play:async function(){await play?.();this.paused=false;},pause(){this.paused=true;},load(){}};
  const c=createMusicChannel({audio,storage,hidden:()=>hidden,frame:()=>{},notify:()=>{}});
  return {audio,c,storage,handlers,setHidden:v=>hidden=v};
}
test('music preferences survive separately from the game save, malformed preferences are safe',()=>{
  const h=harness();assert.deepEqual(readMusicSettings(h.storage),{enabled:true,volume:.25});
  h.c.setVolume(.6);h.c.toggle();assert.deepEqual(readMusicSettings(h.storage),{enabled:false,volume:.6});
  assert.deepEqual(readMusicSettings({getItem:()=>'{'}),{enabled:true,volume:.25});
  assert.equal(TRACK.title,'生命流');
});
test('music waits for a gesture; visibility pauses and resumes without changing player preference',async()=>{
  const h=harness();assert.equal(h.audio.paused,true);await h.c.visibility();assert.equal(h.audio.paused,true);
  await h.c.gesture();assert.equal(h.c.snapshot().playing,true);assert.equal(h.audio.loop,true);
  h.setHidden(true);h.c.visibility();assert.equal(h.audio.paused,true);assert.equal(h.c.snapshot().enabled,true);
  h.setHidden(false);await h.c.visibility();assert.equal(h.audio.paused,false);
  h.c.toggle();await h.c.gesture();assert.equal(h.audio.paused,true);
});
test('disabling during a pending play cannot restart music when loading finishes',async()=>{
  let resolve;const h=harness(()=>new Promise(r=>resolve=r));const p=h.c.gesture();h.c.toggle();resolve();await p;
  assert.equal(h.audio.paused,true);assert.equal(h.c.snapshot().enabled,false);assert.equal(h.c.snapshot().loading,false);
});
test('playback failure is visible and an explicit retry can recover',async()=>{
  let fail=true;const h=harness(()=>{if(fail)throw Object.assign(new Error('network'),{name:'NotSupportedError'});});
  await h.c.gesture();assert.equal(h.c.snapshot().state,'加载失败');fail=false;await h.c.retry();assert.equal(h.c.snapshot().playing,true);
});
