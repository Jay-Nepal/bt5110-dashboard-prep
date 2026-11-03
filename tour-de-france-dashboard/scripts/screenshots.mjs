import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4173'],{stdio:'pipe'});
const base='http://127.0.0.1:4173/';
let browser;
try{
 for(let i=0;i<80;i++){try{const response=await fetch(base);if(response.ok)break;}catch{}if(i===79)throw new Error('Preview server did not start');await new Promise(r=>setTimeout(r,250));}
 browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
 const errors=[];const external=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 page.on('request',r=>{if(!r.url().startsWith(base)&&!r.url().startsWith('blob:')&&!r.url().startsWith('data:'))external.push(r.url());});
 const ready=async()=>{await page.locator('.page-heading').waitFor();await page.waitForFunction(()=>!document.querySelector('.skeleton'),{},{timeout:60000});assert.equal(await page.locator('.error,.fatal').count(),0,'Query or startup error shown');await page.waitForTimeout(400);};
 await mkdir('docs/screenshots',{recursive:true});const pages=['overview','stages','rider','teams','classifications','nations','pivot','about','head-to-head'];
 for(const name of pages){await page.goto(base+'#/'+name);await ready();await page.screenshot({path:`docs/screenshots/${name}.png`,fullPage:false});console.log('Captured',name);}
 await page.goto(base+'#/classifications?noBonus=true&noPenalty=true');await ready();assert.match(await page.locator('#changes').innerText(),/0 position changes/);
 await page.getByRole('slider').focus();await page.keyboard.press('Home');await ready();assert.doesNotMatch(await page.locator('#changes').innerText(),/\b0 position changes/);
 // Every guided scenario reaches a data view in one menu choice, including arrow-key navigation.
 for(let i=0;i<21;i++){await page.goto(base+'#/overview?demo=0');await ready();await page.locator('#demo-step').selectOption(String(i));await ready();assert.equal(await page.locator('#demo-step').inputValue(),String(i));}
 await page.locator('h1').click();await page.keyboard.press('Escape');assert.equal(await page.locator('.demo-bar').count(),0);
 // Desktop/projector and mobile layout; tables may scroll internally, not the whole page.
 for(const viewport of [{width:1366,height:768},{width:390,height:844}]){await page.setViewportSize(viewport);for(const name of pages){await page.goto(base+'#/'+name);await ready();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2),`Page overflow: ${name} at ${viewport.width}`);}}
 await page.setViewportSize({width:1920,height:1080});await page.goto(base+'#/nations?theme=dark&nation=FRA');await ready();await page.screenshot({path:'docs/screenshots/nations-dark.png'});
 // Check working exports, with the complete query result rather than visible scroll rows.
 await page.goto(base+'#/overview');await ready();let download=page.waitForEvent('download');await page.getByRole('button',{name:'CSV ↓',exact:true}).first().click();assert((await download).suggestedFilename().endsWith('.csv'));
 download=page.waitForEvent('download');await page.getByRole('button',{name:'PNG ↓',exact:true}).first().click();assert((await download).suggestedFilename().endsWith('.png'));
 assert.deepEqual(external,[],'Runtime must not request third-party/CDN URLs');assert.deepEqual(errors,[],'Browser console must be error-free');
 await writeFile('docs/browser-verification.json',JSON.stringify({pages,viewports:['1920x1080','1366x768','390x844'],demoSteps:21,consoleErrors:errors,externalRequests:external,status:'passed'},null,2)+'\n');
}finally{await browser?.close();server.kill('SIGTERM');}
