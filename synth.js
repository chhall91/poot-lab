// Poot Lab synth: keyword mood interpreter + procedural fart renderer (original, no samples).
(function (root) {
  const MOODS = {
    happy:   { emoji:'😄', words:['happy','joy','cheer','bouncy','fun','glad','party','silly','giggle','excited'], p:{pitch:140, slide:0.15, bursts:4, flutter:28, rough:0.25, noise:0.2, squeak:0.2, dur:1.4, wet:0.5} },
    sad:     { emoji:'😢', words:['sad','cry','sorry','lonely','blue','depress','gloomy','tragic','mourn','deflat'], p:{pitch:110, slide:-0.6, bursts:3, flutter:14, rough:0.2, noise:0.15, squeak:0.1, dur:3.0, wet:0.3} },
    angry:   { emoji:'😡', words:['angry','mad','rage','furious','loud','thunder','huge','big','massive','monster','beast'], p:{pitch:55, slide:-0.1, bursts:1, flutter:42, rough:0.85, noise:0.45, squeak:0, dur:2.0, wet:0.6} },
    nervous: { emoji:'😬', words:['nervous','scared','anxious','sneaky','shy','quiet','oops','awkward','worried','secret'], p:{pitch:300, slide:0.3, bursts:6, flutter:55, rough:0.15, noise:0.25, squeak:0.8, dur:1.6, wet:0.2} },
    sleepy:  { emoji:'😴', words:['sleepy','tired','lazy','slow','yawn','bored','chill','relax'], p:{pitch:75, slide:-0.25, bursts:1, flutter:10, rough:0.3, noise:0.35, squeak:0, dur:3.5, wet:0.4} },
    proud:   { emoji:'😎', words:['proud','confident','epic','majestic','trumpet','royal','victory','brag'], p:{pitch:95, slide:0.35, bursts:2, flutter:32, rough:0.5, noise:0.2, squeak:0.15, dur:2.4, wet:0.3} },
    wet:     { emoji:'💦', words:['wet','juicy','squishy','sloppy','soggy','bubbly','splat'], p:{pitch:80, slide:-0.2, bursts:3, flutter:22, rough:0.5, noise:0.6, squeak:0.1, dur:1.8, wet:1} },
    surprised:{emoji:'😲', words:['surprise','shock','sudden','whoa','startled','pop'], p:{pitch:180, slide:0.5, bursts:1, flutter:40, rough:0.4, noise:0.3, squeak:0.4, dur:0.7, wet:0.3} },
  };
  const MODS = [
    [['tiny','small','little','mini','baby','squeak','squeaky','high'], p=>{p.pitch*=1.9; p.squeak=Math.min(1,p.squeak+0.5); p.dur*=0.7;}, 'tiny/squeaky → higher pitch'],
    [['long','endless','forever','marathon'], p=>{p.dur*=1.8;}, 'long → longer'],
    [['short','quick','fast'], p=>{p.dur*=0.55;}, 'short → shorter'],
    [['deep','low','bass','rumble'], p=>{p.pitch*=0.6; p.rough+=0.15;}, 'deep → lower'],
    [['rough','raspy','rippy','growl'], p=>{p.rough=Math.min(1,p.rough+0.35);}, 'rough → raspier'],
    [['silent','whisper','airy','hiss','sbd'], p=>{p.noise=0.9; p.rough*=0.3;}, 'airy → more hiss'],
  ];
  function hash(s){let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
  function interpret(text, opts={}) {
    const t=(text||'').toLowerCase(); let best=null, score=0;
    for (const [k,m] of Object.entries(MOODS)) { const s=m.words.filter(w=>t.includes(w)).length; if (s>score){score=s;best=k;} }
    const notes=[]; let fallback=false;
    if(!best){ fallback=true; const keys=Object.keys(MOODS); best=keys[hash(t)%keys.length]; }
    const p={...MOODS[best].p};
    for (const [ws,fn,label] of MODS) if (ws.some(w=>t.includes(w))) { fn(p); notes.push(label); }
    if (opts.duration) p.dur=opts.duration;
    p.intensity = opts.intensity ?? 0.7;
    p.dur=Math.max(0.3,Math.min(6,p.dur)); p.seed=opts.seed ?? hash(t);
    return { mood:best, emoji:MOODS[best].emoji, fallback, notes, params:p };
  }
  function rng(seed){let s=seed>>>0||1;return()=>((s=Math.imul(s^(s>>>15),2246822519)+1013904223>>>0)/4294967296);}
  function render(p, sr=44100) {
    const N=Math.floor(p.dur*sr), out=new Float32Array(N), r=rng(p.seed);
    // burst layout
    const bursts=Math.max(1,p.bursts|0), seg=[]; let tpos=0;
    for(let i=0;i<bursts;i++){const len=(p.dur/bursts)*(0.6+0.35*r()); seg.push([tpos,len]); tpos+=p.dur/bursts;}
    let ph=0, fph=0, lp=0, bp1=0, bp1b=0, bp2=0, bp2b=0;
    const bq=(f,q)=>{const w=2*Math.PI*f/sr;return [2*Math.sin(w/2), 1/q];};
    for(let n=0;n<N;n++){
      const t=n/sr; let env=0, local=0, bi=0;
      for(let i=0;i<seg.length;i++){const [s,l]=seg[i]; if(t>=s&&t<s+l){local=(t-s)/l; bi=i; env=Math.min(1,local*25)*Math.pow(1-local,0.6); break;}}
      const prog=t/p.dur;
      let f=p.pitch*Math.pow(2,p.slide*prog*2)*(1+0.08*Math.sin(2*Math.PI*p.flutter*t))*(1+(r()-0.5)*0.15*p.rough);
      if(p.slide<-0.3) f*=Math.pow(0.88,bi); // sad: descending notes
      if(p.slide>0 && bursts>2) f*=1+0.12*(bi%2); // bouncy
      ph+=f/sr; ph-=Math.floor(ph);
      const buzz=Math.pow(1-ph,3)*2-0.5; // pulse train like lip buzz
      fph+=p.flutter/sr; const flap=0.55+0.45*Math.sign(Math.sin(2*Math.PI*fph))*(0.5+0.5*p.rough);
      const nz=(r()*2-1);
      let x=buzz*flap*(1-p.noise*0.6)+nz*p.noise*0.5*flap;
      x+= p.squeak*0.4*Math.sin(2*Math.PI*ph*3)*(1-local);
      // two formant SVF bandpasses
      let [g1,d1]=bq(Math.min(sr/3,f*2.2+250),3); bp1+=g1*bp1b; const hp1=x-bp1-d1*bp1b; bp1b+=g1*hp1;
      let [g2,d2]=bq(Math.min(sr/3,500+700*p.wet+f*3),5); bp2+=g2*bp2b; const hp2=x-bp2-d2*bp2b; bp2b+=g2*hp2;
      lp+=0.25*(x-lp);
      let y=(lp*0.6+bp1b*0.7+bp2b*0.35*p.wet)*env;
      out[n]=y;
    }
    // normalize + soft limit, safe peak
    let pk=1e-9; for(const v of out) pk=Math.max(pk,Math.abs(v));
    const g=(0.35+0.5*p.intensity)/pk, fade=Math.floor(sr*0.01);
    for(let n=0;n<N;n++){let v=Math.tanh(out[n]*g*1.2)*0.8; if(n<fade)v*=n/fade; if(n>N-fade)v*=(N-n)/fade; out[n]=v;}
    return out;
  }
  function wav(samples, sr=44100){
    const b=new ArrayBuffer(44+samples.length*2), d=new DataView(b), w=(o,s)=>{for(let i=0;i<s.length;i++)d.setUint8(o+i,s.charCodeAt(i));};
    w(0,'RIFF');d.setUint32(4,36+samples.length*2,true);w(8,'WAVEfmt ');d.setUint32(16,16,true);d.setUint16(20,1,true);d.setUint16(22,1,true);
    d.setUint32(24,sr,true);d.setUint32(28,sr*2,true);d.setUint16(32,2,true);d.setUint16(34,16,true);w(36,'data');d.setUint32(40,samples.length*2,true);
    for(let i=0;i<samples.length;i++)d.setInt16(44+i*2,Math.max(-1,Math.min(1,samples[i]))*32767,true);
    return b;
  }
  const api={MOODS,interpret,render,wav};
  if(typeof module!=='undefined')module.exports=api; else root.Poot=api;
})(this);
