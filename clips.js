// Real fart recordings (see LICENSES.md) + chooser/composer. Moods choose clips and lightly shape them.
(function(root){
  const CLIPS=[
    ['short1',['short','squeaky','pop']],['short2',['short','medium']],['short3',['short','medium']],['squeaky2',['squeaky','short']],
    ['deep1',['deep','medium']],['deep2',['deep','long']],['deep3',['deep','long']],['long1',['long','rough']],['long2',['long']],
    ['medium1',['medium','rough']],['medium2',['medium']],['wet1',['wet','long']],['loud1',['loud','rough','deep']]
  ].map(([id,tags])=>({id,tags,src:'sounds/'+id+'.m4a'}));
  // mood -> preferred tags, playback rate, repeats, gap(s)
  const PLAN={happy:{tags:['short','squeaky'],rate:1.06,reps:3,gap:0.12},sad:{tags:['long','deep'],rate:0.86,reps:1,gap:0,fadeOut:1},
    angry:{tags:['loud','rough','deep'],rate:0.94,reps:1,gap:0},nervous:{tags:['squeaky','short'],rate:1.15,reps:3,gap:0.25},
    sleepy:{tags:['long','deep'],rate:0.9,reps:1,gap:0,fadeOut:1},proud:{tags:['long','rough','medium'],rate:1,reps:1,gap:0},
    wet:{tags:['wet'],rate:1,reps:1,gap:0},surprised:{tags:['short','pop','loud'],rate:1.04,reps:1,gap:0}};
  const MOD=[[['tiny','small','little','mini','baby','squeak','high'],'squeaky',1.18],[['deep','low','bass','rumble','huge','big','massive'],'deep',0.92],
    [['long','endless','forever'],'long',1],[['short','quick','fast'],'short',1],[['wet','juicy','squishy','sloppy','splat'],'wet',1],[['loud','thunder','rip','rough'],'loud',1]];
  function plan(text,mood,seed){const t=(text||'').toLowerCase(),base=PLAN[mood]||PLAN.happy;let tags=[...base.tags],rate=base.rate,notes=[];
    for(const [ws,tag,r] of MOD) if(ws.some(w=>t.includes(w))){tags.unshift(tag);rate*=r;notes.push(tag+' clip');}
    const score=c=>(c.tags.includes('wet')&&!tags.includes('wet'))?-1:tags.reduce((s,tg,i)=>s+(c.tags.includes(tg)?(tags.length-i)*(i===0?3:1):0),0);
    const ranked=CLIPS.map(c=>[score(c),c]).sort((a,b)=>b[0]-a[0]),top=ranked.filter(x=>x[0]>=ranked[0][0]*0.6).map(x=>x[1]);
    let s=seed>>>0;const pick=()=>{s=(Math.imul(s,1103515245)+12345)>>>0;return top[s%top.length];};
    const reps=tags[0]==='long'?1:base.reps,seq=[];for(let i=0;i<reps;i++)seq.push(pick());
    return {clips:seq,rate:Math.max(0.8,Math.min(1.3,rate)),gap:base.gap,fadeOut:!!base.fadeOut,notes};}
  // buffers: id -> Float32Array @sr. Returns mixed Float32Array (exactly what plays & downloads).
  function compose(p,buffers,{sr=44100,duration=0,intensity=0.7}={}){const parts=[];
    let seq=p.clips.slice();const len=c=>buffers[c.id].length/p.rate/sr;
    if(duration){let tot=seq.reduce((a,c)=>a+len(c)+p.gap,0),i=0;while(tot<duration&&i<8){const c=p.clips[i%p.clips.length];seq.push(c);tot+=len(c)+p.gap;i++;}}
    for(const c of seq){const b=buffers[c.id],n=Math.floor(b.length/p.rate),o=new Float32Array(n);
      for(let k=0;k<n;k++){const x=k*p.rate,i=x|0,f=x-i;o[k]=(b[i]||0)*(1-f)+(b[i+1]||0)*f;}parts.push(o);parts.push(new Float32Array(Math.floor(p.gap*sr)));}
    let N=parts.reduce((a,x)=>a+x.length,0);if(duration)N=Math.min(N,Math.floor(duration*sr));
    const out=new Float32Array(N);let off=0;for(const x of parts){if(off>=N)break;out.set(x.subarray(0,N-off),off);off+=x.length;}
    let pk=1e-9;for(const v of out)pk=Math.max(pk,Math.abs(v));const g=Math.min(4,(0.35+0.5*intensity)/pk),fd=Math.floor(sr*0.02),fo=p.fadeOut?Math.floor(N*0.35):fd;
    for(let k=0;k<N;k++){let v=out[k]*g;if(k<fd)v*=k/fd;if(k>N-fo)v*=(N-k)/fo;out[k]=Math.max(-0.9,Math.min(0.9,v));}
    return out;}
  const api={CLIPS,PLAN,plan,compose};if(typeof module!=='undefined')module.exports=api;else root.Clips=api;
})(this);
