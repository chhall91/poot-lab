const $=id=>document.getElementById(id);let ctx,src,last,lastSamples,master;
function audio(){ if(!ctx){const AC=window.AudioContext||window.webkitAudioContext;ctx=new AC();const comp=ctx.createDynamicsCompressor();comp.threshold.value=-10;comp.ratio.value=12;master=ctx.createGain();master.gain.value=0.8;master.connect(comp).connect(ctx.destination);}
  if(ctx.state!=='running')ctx.resume(); // must run inside the tap handler (iOS unlock)
  return ctx;}
function stop(){try{src&&src.stop()}catch(e){}src=null;}
function play(samples){const c=audio();stop();const b=c.createBuffer(1,samples.length,44100);b.copyToChannel?b.copyToChannel(samples,0):b.getChannelData(0).set(samples);src=c.createBufferSource();src.buffer=b;src.connect(master);src.start();}
let bufs=null,loading=null,real=true;
function loadClips(){if(loading)return loading;const c=audio();loading=Promise.all(Clips.CLIPS.map(k=>fetch(k.src).then(r=>{if(!r.ok)throw 0;return r.arrayBuffer()}).then(a=>new Promise((ok,no)=>c.decodeAudioData(a,ok,no))).then(b=>{const off=new OfflineAudioContext(1,Math.ceil(b.duration*44100),44100);const s=off.createBufferSource();s.buffer=b;s.connect(off.destination);s.start();return off.startRendering();}).then(b=>[k.id,b.getChannelData(0)]))).then(e=>bufs=Object.fromEntries(e)).catch(()=>{bufs=null;loading=null;});return loading;}
async function make(text,seed){audio();const d=+$('dur').value,seedV=seed??(Math.random()*1e9|0);const r=Poot.interpret(text,{duration:d||undefined,intensity:+$('int').value,seed:seedV});
 $('go').disabled=true;await loadClips();$('go').disabled=false;let s;
 if(bufs){const p=Clips.plan(text,r.mood,seedV);s=Clips.compose(p,bufs,{duration:d,intensity:+$('int').value});r.real=true;r.clipIds=p.clips.map(c=>c.id);r.rate=p.rate;r.notes=p.notes;r.dur=s.length/44100;}
 else{s=Poot.render(r.params);r.real=false;}
 last=r;lastSamples=s;show(r);play(s);$('replay').disabled=$('dl').disabled=false;}
function show(r){const e=$('emoji');e.textContent=r.emoji;e.classList.remove('pop');void e.offsetWidth;e.classList.add('pop');
 $('mood').innerHTML='<b>'+(r.fallback?'Mystery poot → ':'Matched mood: ')+r.mood.toUpperCase()+'</b>';
 $('why').textContent=r.fallback?"Didn't recognize those words, so I picked a mood for you.":(r.notes.join(' · ')||'');
 const p=r.params;$('src').textContent=r.real?'🎙️ Real sound effect recording':'⚠️ Fallback: synthetic sound (recordings could not load)';
 $('params').innerHTML=(r.real?[['Clips',r.clipIds.join(', ')],['Speed',Math.round(r.rate*100)+'%'],['Length',r.dur.toFixed(1)+' s']]:[['Pitch',Math.round(p.pitch)+' Hz'],['Length',p.dur.toFixed(1)+' s'],['Roughness',Math.round(p.rough*100)+'%']]).map(([a,b])=>`<span>${a}</span><b>${b}</b>`).join('');}
$('go').onclick=()=>make($('desc').value.trim()||'happy');
$('desc').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();$('go').click();}};
$('replay').onclick=()=>lastSamples&&play(lastSamples);
$('stop').onclick=stop;
$('random').onclick=()=>{const ks=Object.keys(Poot.MOODS),ex=['tiny','long','deep','rough','squeaky','short',''];const t=ks[Math.random()*ks.length|0]+' '+ex[Math.random()*ex.length|0];$('desc').value=t.trim();make(t);};
$('dl').onclick=()=>{const u=URL.createObjectURL(new Blob([Poot.wav(lastSamples)],{type:'audio/wav'}));const a=document.createElement('a');a.href=u;a.download='poot-'+last.mood+'.wav';a.click();setTimeout(()=>URL.revokeObjectURL(u),5000);};
$('dur').oninput=()=>$('durv').textContent=+$('dur').value?(+$('dur').value).toFixed(1)+' s':'Auto';
$('int').oninput=()=>$('intv').textContent=Math.round($('int').value*100)+'%';
for(const [k,m] of Object.entries(Poot.MOODS)){const b=document.createElement('button');b.innerHTML=`<span>${m.emoji}</span>${k}`;b.setAttribute('aria-label','Play '+k+' poot');b.onclick=()=>{$('desc').value=k;make(k);};$('chips').append(b);}
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
if(SR){$('mic').hidden=false;$('mic').onclick=()=>{const r=new SR();r.lang='en-US';r.interimResults=false;$('mic').textContent='👂';r.onresult=e=>{$('desc').value=e.results[0][0].transcript;};r.onend=()=>$('mic').textContent='🎤';r.onerror=r.onend;try{r.start()}catch(e){r.onend()}};}
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
