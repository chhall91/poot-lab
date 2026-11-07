const C=require('../clips.js'),P=require('../synth.js'),a=require('assert'),{execFileSync}=require('child_process'),fs=require('fs');
const bufs={};for(const c of C.CLIPS){const r0=execFileSync('ffmpeg',['-v','error','-i',__dirname+'/../'+c.src,'-ac','1','-ar','44100','-f','f32le','-'],{maxBuffer:1e8});const raw=Buffer.from(r0);bufs[c.id]=new Float32Array(raw.buffer,raw.byteOffset,raw.length/4);a(bufs[c.id].length>4000,c.id);}
let n=0;for(const t of ['sad','happy','angry','angry tiny squeaky poot','nervous','sleepy','proud','wet juicy','surprised','long deep','blorp']){
 const r=P.interpret(t),p=C.plan(t,r.mood,123),s=C.compose(p,bufs,{intensity:0.7});let pk=0,ss=0;for(const v of s){a(isFinite(v));pk=Math.max(pk,Math.abs(v));ss+=v*v;}
 a(pk>0.3&&pk<=0.9,'peak '+t);a(s.length/44100>0.2&&s.length/44100<20);console.log('PASS',JSON.stringify(t),r.mood,p.clips.map(c=>c.id).join('+'),'rate',p.rate.toFixed(2),'dur',(s.length/44100).toFixed(2),'peak',pk.toFixed(2),'rms',Math.sqrt(ss/s.length).toFixed(3));n++;}
a(C.plan('wet','wet',1).clips[0].id==='wet1');a(C.plan('tiny squeaky','nervous',1).clips[0].tags.includes('squeaky')||C.plan('tiny squeaky','nervous',1).clips[0].tags.includes('short'));
const d=C.compose(C.plan('happy','happy',5),bufs,{duration:4});a(Math.abs(d.length/44100-4)<0.01,'duration');
fs.writeFileSync('/tmp/real.wav',Buffer.from(P.wav(d)));console.log('ALL PASS',n+3);
