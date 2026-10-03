import test from 'node:test';
import assert from 'node:assert/strict';
import {spinAngle,pointerIndex} from '../dist/wheel-visual.js';

test('wheel stops on every real sector across all pool sizes',()=>{
 for(const n of [2,8,9,12,17,22,30,139,181])for(let chosen=0;chosen<n;chosen++){
  const finish=2160-chosen*360/n;
  assert.equal(spinAngle(0,finish),0);
  assert.equal(spinAngle(1,finish),finish);
  assert.equal(pointerIndex(spinAngle(1,finish),n),chosen);
 }
});
test('wheel accelerates, brakes smoothly and settles smoothly without reversing',()=>{
 const a=t=>spinAngle(t,2160),speed=t=>(a(t+.001)-a(t))/.001;
 assert.ok(speed(.10)>speed(.02));
 assert.ok(speed(.3)>speed(.6)&&speed(.6)>speed(.85));
 for(let i=0;i<=800;i++)assert.ok(a(.12+i*.001)>=a(.119+i*.001));
 for(let i=950;i<=1000;i++)assert.ok(Math.abs(a(i/1000)-2160)<=1.801);
 assert.ok(a(.98)<2160);
 for(const t of [.5,.6,.7,.8,.9,.97])assert.ok(speed(t) > speed(t+.01),'braking speed must decrease');
});
