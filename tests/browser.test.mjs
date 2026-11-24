import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { createRequire } from "node:module";
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.ATLAS_PLAYWRIGHT_MODULE || "playwright-core");
const root=resolve("public");
const mime={".html":"text/html",".js":"text/javascript",".css":"text/css",".webp":"image/webp"};
const cfg=JSON.parse(await readFile("vercel.json","utf8"));
const headers=Object.fromEntries(cfg.headers[0].headers.map(h=>[h.key,h.value]));
const server=createServer(async(req,res)=>{
 try {
 const pathname=new URL(req.url,"http://localhost").pathname;
 const path=resolve(root,"."+ (pathname==="/" ? "/index.html":pathname));
 if(!path.startsWith(root+sep)) {res.writeHead(403);res.end();return;}
 const b=await readFile(path);res.writeHead(200,{...headers,"Content-Type":mime[extname(path)]||"application/octet-stream"});res.end(b);
 } catch {res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,"127.0.0.1",r));
let browser;
try {
 browser=await chromium.launch({executablePath:process.env.ATLAS_CHROME,headless:true,args:["--no-sandbox"]});
 await mkdir("evidence",{recursive:true});
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 const errors=[],external=[];
 page.on("pageerror",e=>errors.push(e.message));
 page.on("request",r=>{if(!r.url().startsWith("http://127.0.0.1:")&&!r.url().startsWith("data:"))external.push(r.url());});
 await page.goto("http://127.0.0.1:"+server.address().port+"/");
 await page.waitForFunction(()=>document.querySelector("canvas").width===1440 && [...document.images].every(i=>i.complete&&i.naturalWidth>0));
 const pixels=()=>page.locator("canvas").evaluate(c=>c.toDataURL());
 assert.equal(await page.locator("body").innerText(),"");
 assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight===innerHeight && document.documentElement.scrollWidth===innerWidth),true);
 const before=await pixels();await page.mouse.move(700,660);await page.mouse.click(700,660);await page.waitForTimeout(180);assert.notEqual(await pixels(),before);
 await page.screenshot({path:"evidence/desktop-1440x900.png"});
 await page.keyboard.press("Space");await page.waitForFunction(()=>document.querySelector("main").dataset.motionPaused==="true");const still=await pixels();await page.waitForTimeout(200);assert.equal(await pixels(),still);
 await page.keyboard.press("Space");await page.waitForFunction(()=>document.querySelector("main").dataset.motionPaused==="false");
 await page.emulateMedia({reducedMotion:"reduce"});await page.waitForFunction(()=>document.querySelector("main").dataset.motionPaused==="true");
 const reduced=await pixels();await page.waitForTimeout(200);assert.equal(await pixels(),reduced);
 await page.emulateMedia({reducedMotion:"no-preference"});await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>document.querySelector("canvas").width===390);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight===innerHeight&&document.documentElement.scrollWidth===innerWidth),true);
 await page.screenshot({path:"evidence/mobile-390x844.png"});
 await page.setViewportSize({width:2560,height:1080});await page.waitForFunction(()=>document.querySelector("canvas").width===2560);
 await page.screenshot({path:"evidence/ultrawide-2560x1080.png"});
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 console.log("PASS browser: original images loaded; text-free screen; animated canvas; pointer/click; pause/reduced motion; mobile/ultrawide; CSP; zero external requests and JS errors");
} finally {if(browser)await browser.close();server.close();}
