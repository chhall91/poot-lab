import {createRequire} from 'module';const require=createRequire('/tmp/pw/');const {chromium}=require('playwright');
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});const c=await b.newContext({serviceWorkers:'block'});const p=await c.newPage();
await c.route('**/sounds/**',r=>r.abort());await p.goto(process.argv[2]);await p.click('#go');await p.waitForFunction(()=>typeof lastSamples!=='undefined'&&lastSamples);
console.log(JSON.stringify({src:await p.textContent('#src'),len:await p.evaluate(()=>lastSamples.length)}));await b.close();
