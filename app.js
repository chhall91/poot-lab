const $=id=>document.getElementById(id);let ctx,src,last,lastSamples,master;
function audio(){ if(!ctx){const AC=window.AudioContext||window.webkitAudioContext;ctx=new AC();const comp=ctx.createDynamicsCompressor();comp.threshold.value=-10;comp.ratio.value=12;master=ctx.createGain();master.gain.value=0.8;master.connect(comp).connect(ctx.destination);}
  if(ctx.state!=='running')ctx.resume(); // must run inside the tap handler (iOS unlock)
  return ctx;}
function stop(){try{src&&src.stop()}catch(e){}src=null;}
function play(samples){const c=audio();stop();const b=c.createBuffer(1,samples.length,44100);b.copyToChannel?b.copyToChannel(samples,0):b.getChannelData(0).set(samples);src=c.createBufferSource();src.buffer=b;src.connect(master);src.start();}
function make(text,seed){const d=+$('dur').value;const r=Poot.interpret(text,{duration:d||undefined,intensity:+$('int').value,seed});const s=Poot.render(r.params);last=r;lastSamples=s;show(r);play(s);$('replay').disabled=$('dl').disabled=false;}
function show(r){const e=$('emoji');e.textContent=r.emoji;e.classList.remove('pop');void e.offsetWidth;e.classList.add('pop');
 $('mood').innerHTML='<b>'+(r.fallback?'Mystery poot → ':'Matched mood: ')+r.mood.toUpperCase()+'</b>';
 $('why').textContent=r.fallback?"Didn't recognize those words, so I picked a mood for you.":(r.notes.join(' · ')||'');
 const p=r.params;$('params').innerHTML=[['Pitch',Math.round(p.pitch)+' Hz'],['Length',p.dur.toFixed(1)+' s'],['Bursts',p.bursts],['Flutter',Math.round(p.flutter)+' Hz'],['Roughness',Math.round(p.rough*100)+'%'],['Squeak',Math.round(p.squeak*100)+'%']].map(([a,b])=>`<span>${a}</span><b>${b}</b>`).join('');}
$('go').onclick=()=>make($('desc').value.trim()||'happy');
$('desc').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();$('go').click();}};
$('replay').onclick=()=>lastSamples&&play(lastSamples);
$('stop').onclick=stop;
$('random').onclick=()=>{const ks=Object.keys(Poot.MOODS),ex=['tiny','long','deep','rough','squeaky','short',''];const t=ks[Math.random()*ks.length|0]+' '+ex[Math.random()*ex.length|0];$('desc').value=t.trim();make(t,Math.random()*1e9|0);};
$('dl').onclick=()=>{const u=URL.createObjectURL(new Blob([Poot.wav(lastSamples)],{type:'audio/wav'}));const a=document.createElement('a');a.href=u;a.download='poot-'+last.mood+'.wav';a.click();setTimeout(()=>URL.revokeObjectURL(u),5000);};
$('dur').oninput=()=>$('durv').textContent=+$('dur').value?(+$('dur').value).toFixed(1)+' s':'Auto';
$('int').oninput=()=>$('intv').textContent=Math.round($('int').value*100)+'%';
for(const [k,m] of Object.entries(Poot.MOODS)){const b=document.createElement('button');b.innerHTML=`<span>${m.emoji}</span>${k}`;b.setAttribute('aria-label','Play '+k+' poot');b.onclick=()=>{$('desc').value=k;make(k);};$('chips').append(b);}
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
if(SR){$('mic').hidden=false;$('mic').onclick=()=>{const r=new SR();r.lang='en-US';r.interimResults=false;$('mic').textContent='👂';r.onresult=e=>{$('desc').value=e.results[0][0].transcript;};r.onend=()=>$('mic').textContent='🎤';r.onerror=r.onend;try{r.start()}catch(e){r.onend()}};}
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
