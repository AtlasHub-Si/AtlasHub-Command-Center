import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import vm from "node:vm";
const manifest=JSON.parse(readFileSync(new URL("../docs/living-background-provenance.json",import.meta.url),"utf8"));
for(const a of manifest.assets){const b=readFileSync(new URL("../public/"+a.path,import.meta.url)); assert.equal(b.length,a.bytes); assert.equal(createHash("sha256").update(b).digest("hex"),a.sha256);}
const events=new Map(), docEvents=new Map(), mediaEvents=new Map(), rootEvents=new Map();
function emitter(map){return {addEventListener(k,f){map.set(k,f)},removeEventListener(k){map.delete(k)}}}
let now=0,seq=0,frames=new Map(),arcs=[],draws=0,w=1440,h=900,attrs={};
const root={setAttribute(k,v){attrs[k]=v},removeAttribute(k){delete attrs[k]}};
const ctx={clearRect(){draws++},beginPath(){},moveTo(){},lineTo(){},stroke(){},arc(x,y,r){arcs.push({x,y,r})},fill(){},setTransform(){}};
const canvas={parentElement:root,getContext:()=>ctx,getBoundingClientRect:()=>({left:0,top:0,right:w,bottom:h,width:w,height:h})};
const media={matches:false,...emitter(mediaEvents)},document={hidden:false,...emitter(docEvents),documentElement:emitter(rootEvents)};
const sandbox={...emitter(events),document,performance:{now:()=>now},matchMedia:()=>media,devicePixelRatio:3,requestAnimationFrame:f=>{frames.set(++seq,f);return seq},cancelAnimationFrame:id=>frames.delete(id)};
vm.createContext(sandbox);vm.runInContext(readFileSync(new URL("../public/living-background.js",import.meta.url),"utf8"),sandbox);
const c=sandbox.AtlasLivingBackground.mount(canvas,{root,pulse:true}); assert.equal(canvas.width,2880); assert.equal(canvas.height,1800); assert.ok(arcs.length>=240);assert.equal(frames.size,1);
function step(t){now=t;const q=[...frames.values()];frames.clear();q.forEach(f=>f(t));}
const initial=arcs.slice();arcs=[];events.get("pointermove")({clientX:720,clientY:630});step(20);step(40);assert.notDeepEqual(arcs,initial);
events.get("pointerdown")({clientX:720,clientY:630});arcs=[];step(120);assert.ok(arcs.some(a=>a.r>10),"click ripple");
c.pause();assert.equal(frames.size,0);assert.equal(attrs["data-motion-paused"],"true");c.resume();assert.equal(frames.size,1);
document.hidden=true;docEvents.get("visibilitychange")();assert.equal(frames.size,0);document.hidden=false;docEvents.get("visibilitychange")();assert.equal(frames.size,1);
media.matches=true;mediaEvents.get("change")();assert.equal(frames.size,0);assert.equal(c.isPaused(),true);media.matches=false;mediaEvents.get("change")();assert.equal(frames.size,1);
w=390;h=844;events.get("resize")();assert.equal(canvas.width,780);c.destroy();assert.equal(frames.size,0);assert.equal(events.size,0);assert.equal(docEvents.size,0);assert.equal(mediaEvents.size,0);assert.equal(rootEvents.size,0);
console.log("PASS: exact image SHA-256, Canvas drawing, ripple, pause, visibility, reduced motion, resize, cleanup");
