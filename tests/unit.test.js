const P=require('../synth.js'),a=require('assert'),fs=require('fs');let ok=0;
for(const t of ['sad','happy','angry','angry tiny squeaky poot','nervous','sleepy','proud','wet','surprised','xyzzy blorp','']){
 const r=P.interpret(t);const s=P.render(r.params);let pk=0,rms=0,nan=0;for(const v of s){if(!isFinite(v))nan++;pk=Math.max(pk,Math.abs(v));rms+=v*v}rms=Math.sqrt(rms/s.length);
 a(nan===0&&pk>0.2&&pk<=0.81&&rms>0.03,t);console.log('PASS',JSON.stringify(t),r.mood,r.fallback?'(fallback)':'',r.notes.join(','),'peak',pk.toFixed(2),'rms',rms.toFixed(3),'len',(s.length/44100).toFixed(2));ok++;}
a.equal(P.interpret('so sad').mood,'sad');a.equal(P.interpret('ANGRY').mood,'angry');a(P.interpret('tiny happy').params.pitch>P.interpret('happy').params.pitch);
a(P.interpret('xyzzy').fallback);a.equal(P.interpret('sad',{duration:2}).params.dur,2);
const w=Buffer.from(P.wav(P.render(P.interpret('angry tiny squeaky poot').params)));a.equal(w.toString('ascii',0,4),'RIFF');a.equal(w.readUInt32LE(24),44100);fs.writeFileSync('/tmp/poot.wav',w);
console.log('ALL PASS',ok+5);
