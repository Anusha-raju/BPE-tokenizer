const fs=require("fs");const {JSDOM}=require("jsdom");
const html=fs.readFileSync("tokenizer_story.html","utf8");
const errs=[];
const dom=new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,
  beforeParse(w){w.requestAnimationFrame=cb=>setTimeout(()=>cb(Date.now()),0);
   w.IntersectionObserver=class{constructor(c){this.c=c;}observe(){}unobserve(){}};
   w.URL.createObjectURL=()=>"blob:x";w.URL.revokeObjectURL=()=>{};}});
const w=dom.window;
w.addEventListener("error",e=>errs.push("ERR:"+(e.error&&e.error.stack||e.message)));
setTimeout(()=>{
 const d=w.document;
 try{w.drawResults();w.drawAlloc();}catch(e){errs.push("draw:"+e.message);}
 const out={
   heroScore:d.getElementById("heroScore").textContent,
   pgWords:d.getElementById("pg_words").textContent,
   pgTokens:d.getElementById("pg_tokens").textContent,
   pgRatio:d.getElementById("pg_ratio").textContent,
   pgChips:d.querySelectorAll("#pg_out .tk").length,
   mergeSyms:d.querySelectorAll("#mp_words .sym").length,
   simScore:d.getElementById("sim_score").textContent,
   resultBars:d.querySelectorAll("#results .rbar").length,
   podium:d.querySelectorAll("#podium .pcard").length,
   allocRows:d.querySelectorAll("#alloc .row").length,
   tokenRows:d.querySelectorAll("#tokBody tr").length,
   count:d.getElementById("count").textContent
 };
 console.log(JSON.stringify(out,null,1));
 console.log("ERRORS:",errs.length?errs:"none");
 process.exit(0);
},500);
