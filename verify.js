const fs=require("fs");
eval(fs.readFileSync("model.js","utf8").replace("window.MODEL","var MODEL"));
const {makeEncoder}=require("./bpe.js");
const enc=makeEncoder(MODEL);
const tests=JSON.parse(fs.readFileSync("expected.json","utf8"));
let ok=true;
for(const t of tests){
  const got=enc.encode(t.text);
  const gtok=got.map(x=>x.tok), gid=got.map(x=>x.id);
  const mT=JSON.stringify(gtok)===JSON.stringify(t.tokens);
  const mI=JSON.stringify(gid)===JSON.stringify(t.ids);
  console.log(t.lang,"tokens",mT?"MATCH":"DIFF","ids",mI?"MATCH":"DIFF","("+gtok.length+")");
  if(!mT){ok=false;console.log(" exp",JSON.stringify(t.tokens));console.log(" got",JSON.stringify(gtok));}
  if(!mI)ok=false;
}
console.log(ok?"ALL MATCH":"MISMATCH");
