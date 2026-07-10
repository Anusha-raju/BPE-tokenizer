function makeEncoder(MODEL){
  const vocab=MODEL.vocab, unk=MODEL.unk;
  const rank=new Map();
  MODEL.merges.forEach(function(m,i){ rank.set(m[0]+" "+m[1], i); });
  function bpeWord(word){
    let syms=Array.from(word);
    if(syms.length===1) return syms;
    while(true){
      let best=-1, bestRank=Infinity;
      for(let i=0;i<syms.length-1;i++){
        const r=rank.get(syms[i]+" "+syms[i+1]);
        if(r!==undefined && r<bestRank){ bestRank=r; best=i; }
      }
      if(best<0) break;
      syms.splice(best,2,syms[best]+syms[best+1]);
    }
    return syms;
  }
  function encode(text){
    const norm=text.normalize("NFC");
    const words=norm.split(/\s+/).filter(function(w){return w.length>0;});
    let out=[];
    for(const w of words){
      const pieces=bpeWord(w);
      for(const p of pieces) out.push({tok:p, id:(p in vocab)?vocab[p]:vocab[unk]});
    }
    return out;
  }
  return {encode:encode, bpeWord:bpeWord};
}
if(typeof module!=="undefined") module.exports={makeEncoder};
