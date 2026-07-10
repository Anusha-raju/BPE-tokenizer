/* ===== shared ===== */
var A=window.APP,S=A.summary,TOKENS=A.tokens;
var LANGCOL={en:"#3b82f6",hi:"#f59e0b",te:"#10b981",sa:"#a78bfa"};
var LANGNAME={en:"English",hi:"Hindi",te:"Telugu",sa:"Sanskrit"};
var codeMap={"English":"en","Hindi":"hi","Telugu":"te","Sanskrit":"sa"};
var BCOL={latin:"#3b82f6",deva:"#f59e0b",te:"#10b981",other:"#64748b"};
var BNAME={latin:"Latin",deva:"Devanagari",te:"Telugu",other:"Other"};
function bucket(t){for(var k=0;k<t.length;k++){var o=t.charCodeAt(k);
 if((o>=65&&o<=90)||(o>=97&&o<=122))return"latin";
 if(o>=0x0900&&o<=0x097F)return"deva"; if(o>=0x0C00&&o<=0x0C7F)return"te";}return"other";}
function el(id){return document.getElementById(id);}

/* ===== BPE encoder (verified identical to Python tokenizer) ===== */
function makeEncoder(M){
 var vocab=M.vocab,unk=M.unk,rank=new Map();
 M.merges.forEach(function(m,i){rank.set(m[0]+" "+m[1],i);});
 function bpeWord(w){var s=Array.from(w);if(s.length===1)return s;
  while(true){var best=-1,br=Infinity;
   for(var i=0;i<s.length-1;i++){var r=rank.get(s[i]+" "+s[i+1]);if(r!==undefined&&r<br){br=r;best=i;}}
   if(best<0)break; s.splice(best,2,s[best]+s[best+1]);}
  return s;}
 return{encode:function(text){var n=text.normalize("NFC").split(/\s+/).filter(function(w){return w.length>0;});
  var out=[];for(var i=0;i<n.length;i++){var p=bpeWord(n[i]);for(var j=0;j<p.length;j++)out.push({tok:p[j],id:(p[j] in vocab)?vocab[p[j]]:vocab[unk]});}return out;}};
}
var ENC=makeEncoder(window.MODEL);

/* ===== progress + reveal ===== */
window.addEventListener("scroll",function(){
 var h=document.documentElement,st=h.scrollTop,sh=h.scrollHeight-h.clientHeight;
 el("progress").style.width=(sh>0?st/sh*100:0)+"%";
});
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");
 if(e.target.dataset.once!=="done"){e.target.dataset.once="done"; if(e.target.dataset.on)window[e.target.dataset.on]&&window[e.target.dataset.on]();}}});},{threshold:.18});
document.querySelectorAll(".reveal").forEach(function(n){io.observe(n);});

/* ===== count up ===== */
function countUp(node,to,dur,dec){var t0=null;dec=dec||0;
 function fr(ts){if(!t0)t0=ts;var p=Math.min(1,(ts-t0)/dur);var e=1-Math.pow(1-p,3);
  node.textContent=(to*e).toLocaleString(undefined,{minimumFractionDigits:dec,maximumFractionDigits:dec});
  if(p<1)requestAnimationFrame(fr);}requestAnimationFrame(fr);}

/* ===== hero ===== */
countUp(el("heroScore"),S.self_score,1700,0);
el("heroBadge").innerHTML='<span class="badge ok">✓ English X₁ = '+S.stats.en.ratio+' ≤ 1.20</span>'+
 '<div class="muted" style="font-size:13px;margin-top:8px">spread '+S.spread+' · '+LANGNAME[codeMap[S.sorted_low_to_high[0].lang]]+' best · '+S.sorted_low_to_high[3].lang+' hardest</div>';

/* ===== ticker ===== */
var facts=["BPE = Byte-Pair Encoding","Vocabulary: <b>10,000</b> shared tokens","<b>9,709</b> merge rules learned",
 "Hindi &amp; Sanskrit share the <b>Devanagari</b> script","English ratio <b>1.192</b> — under the 1.2 ceiling",
 "Telugu is the hardest to compress at <b>1.973</b>","Ratio = tokens ÷ words · measured on full articles","Lower ratio = better compression",
 "Self-score = 1000 ÷ (max − min ratio)","Trained on 4 Wikipedia &ldquo;India&rdquo; articles"];
var run="";for(var f=0;f<2;f++)facts.forEach(function(x){run+='<span>'+x+'</span>';});
el("ticker").innerHTML=run;

/* ===== ACT II: merge player ===== */
var MPbase=[{w:"low",f:5},{w:"lowest",f:2},{w:"newer",f:6},{w:"wider",f:3},{w:"slow",f:4}];
var mp={};
function mpReset(){mp.words=MPbase.map(function(o){return{arr:Array.from(o.w),f:o.f};});mp.merges=[];mp.step=0;mp.busy=false;mp.playing=false;
 mp.baseVocab=(function(){var s={};mp.words.forEach(function(o){o.arr.forEach(function(c){s[c]=1;});});return Object.keys(s).length;})();
 el("mp_step").textContent="0";el("mp_action").textContent="Ready. Each step merges the most frequent adjacent pair.";
 el("mp_merges").innerHTML="";el("mp_vocab").textContent=mp.baseVocab;el("mp_play").textContent="▶ Play";mpRender(null,null);}
function mpRender(hit,mergedStr){
 el("mp_words").innerHTML=mp.words.map(function(o){
  var html="";var i=0;
  while(i<o.arr.length){
   var isHit=hit&&i<o.arr.length-1&&o.arr[i]===hit[0]&&o.arr[i+1]===hit[1];
   if(isHit){html+='<span class="sym hit">'+esc(o.arr[i])+'</span><span class="sym hit">'+esc(o.arr[i+1])+'</span>';i+=2;}
   else{var cl=(mergedStr&&o.arr[i]===mergedStr)?"sym merged":"sym";html+='<span class="'+cl+'">'+esc(o.arr[i])+'</span>';i++;}
  }
  return '<div class="word">'+html+'<span class="muted mono" style="font-size:12px;margin-left:10px">×'+o.f+'</span></div>';
 }).join("");
}
function esc(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;");}
function mpBest(){var cnt={},order=[];mp.words.forEach(function(o){for(var i=0;i<o.arr.length-1;i++){var k=o.arr[i]+""+o.arr[i+1];
 if(!(k in cnt)){cnt[k]=0;order.push(k);}cnt[k]+=o.f;}});
 var bk=null,bc=-1;order.forEach(function(k){if(cnt[k]>bc){bc=cnt[k];bk=k;}});
 if(!bk)return null;var p=bk.split("");return{a:p[0],b:p[1],c:bc};}
function mpStep(){if(mp.busy)return;var best=mpBest();if(!best){el("mp_action").textContent="No pairs left to merge — done!";mpStop();return;}
 mp.busy=true;el("mp_action").innerHTML='Most frequent pair: <b style="color:#fbbf24">'+esc(best.a)+' + '+esc(best.b)+'</b> (appears '+best.c+'×) → merge it';
 mpRender([best.a,best.b],null);
 setTimeout(function(){
  var merged=best.a+best.b;
  mp.words.forEach(function(o){var na=[];for(var i=0;i<o.arr.length;i++){if(i<o.arr.length-1&&o.arr[i]===best.a&&o.arr[i+1]===best.b){na.push(merged);i++;}else na.push(o.arr[i]);}o.arr=na;});
  mp.merges.push(merged);mp.step++;el("mp_step").textContent=mp.step;el("mp_vocab").textContent=mp.baseVocab+mp.merges.length;
  el("mp_merges").innerHTML=mp.merges.map(function(m){return '<span class="mtag">'+esc(m)+'</span>';}).join("");
  mpRender(null,merged);mp.busy=false;
  if(mp.playing){if(mp.merges.length>=8){mpStop();el("mp_action").innerHTML='Vocabulary built. In the real run this repeats <b>9,709×</b>.';}else setTimeout(mpStep,900);}
 },700);
}
function mpStop(){mp.playing=false;el("mp_play").textContent="▶ Play";}
el("mp_next").onclick=function(){mp.playing=false;mpStep();};
el("mp_reset").onclick=function(){mpStop();mpReset();};
el("mp_play").onclick=function(){if(mp.playing){mpStop();}else{mp.playing=true;el("mp_play").textContent="⏸ Pause";mpStep();}};
mpReset();

/* ===== ACT IV: playground ===== */
var SAMPLES={
 en:"The Republic of India is a country in South Asia. It is the seventh-largest country by area and the most populous democracy in the world.",
 hi:"भारत दक्षिण एशिया में स्थित एक देश है। यह क्षेत्रफल के अनुसार विश्व का सातवाँ सबसे बड़ा देश है।",
 te:"భారతదేశం దక్షిణ ఆసియాలో ఉన్న ఒక దేశం. ఇది వైశాల్యం ప్రకారం ప్రపంచంలో ఏడవ అతిపెద్ద దేశం.",
 sa:"भारतम् एकः दक्षिणएशियास्थः देशः अस्ति। एतत् क्षेत्रफलदृष्ट्या विश्वस्य सप्तमः बृहत्तमः देशः वर्तते।"
};
function pgRender(){
 var text=el("pg_in").value;var toks=ENC.encode(text);
 var words=text.normalize("NFC").split(/\s+/).filter(function(w){return w.length>0;}).length;
 el("pg_out").innerHTML=toks.map(function(t,i){var b=bucket(t.tok),c=BCOL[b];
  var disp=t.tok===""?"∅":esc(t.tok);
  return '<span class="tk" style="border-color:'+c+';background:'+c+'22;color:#fff;animation-delay:'+Math.min(i*12,600)+'ms">'+disp+'<span class="tip">#'+t.id+' · '+BNAME[b]+'</span></span>';
 }).join("");
 el("pg_words").textContent=words;el("pg_tokens").textContent=toks.length;
 var ratio=words?toks.length/words:0;el("pg_ratio").textContent=ratio.toFixed(2);
 var pct=Math.max(0,Math.min(100,(ratio-1)/1.5*100));el("pg_fert").style.width=pct+"%";
 el("pg_fert").style.background=ratio<=1.2?"var(--good)":ratio<=1.7?"var(--gold)":"var(--bad)";
 el("pg_ratio").style.color=ratio<=1.2?"var(--good)":ratio<=1.7?"var(--gold)":"var(--bad)";
 el("pg_mark").style.left="13.3%";
}
document.querySelectorAll(".chipbtn").forEach(function(btn){btn.onclick=function(){
 document.querySelectorAll(".chipbtn").forEach(function(b){b.classList.remove("on");});btn.classList.add("on");
 el("pg_in").value=SAMPLES[btn.dataset.s];pgRender();};});
el("pg_in").addEventListener("input",pgRender);
el("pg_in").value=SAMPLES.en;document.querySelector('.chipbtn[data-s="en"]').classList.add("on");pgRender();

/* ===== ACT V: results ===== */
var maxR=Math.max.apply(null,Object.values(S.stats).map(function(s){return s.ratio;}));
window.drawResults=function(){
 el("results").innerHTML=["en","hi","te","sa"].map(function(l){var s=S.stats[l],c=LANGCOL[l];
  return '<div class="rbar"><div class="name" style="color:'+c+'">'+s.language+'</div>'+
   '<div class="track"><div class="fill" data-w="'+(s.ratio/maxR*100)+'" style="background:linear-gradient(90deg,'+c+'99,'+c+')"></div></div>'+
   '<div class="val">'+s.ratio.toFixed(3)+'</div></div>';
 }).join("");
 setTimeout(function(){document.querySelectorAll("#results .fill").forEach(function(f){f.style.width=f.dataset.w+"%";});},60);
 el("podium").innerHTML=S.sorted_low_to_high.map(function(row,i){var l=codeMap[row.lang],c=LANGCOL[l];
  var medal=["🥇 easiest","🥈","🥉","🐢 hardest"][i];
  return '<div class="pcard"><div style="position:absolute;inset:0;opacity:.12;background:radial-gradient(circle at 50% 0,'+c+',transparent 70%)"></div>'+
   '<div class="muted" style="font-size:12px">'+medal+'</div><div style="color:'+c+';font-weight:800;margin-top:4px">'+row.lang+'</div>'+
   '<div class="r" style="color:'+c+'">'+row.ratio.toFixed(3)+'</div><div class="muted" style="font-size:12px">'+S.stats[l].tokens.toLocaleString()+' / '+S.stats[l].sample_words.toLocaleString()+'</div></div>';
 }).join("");
};

/* ===== ACT VI: score + simulator ===== */
el("calcFormula").innerHTML=
 'X_min = <b>'+S.Xmin+'</b>  ('+S.sorted_low_to_high[0].lang+')\n'+
 'X_max = <b>'+S.Xmax+'</b>  ('+S.sorted_low_to_high[3].lang+')\n'+
 'spread = '+S.Xmax+' − '+S.Xmin+' = <b>'+S.spread+'</b>\n'+
 'score  = 1000 ÷ '+S.spread+' = <b style="color:#fbbf24">'+S.self_score+'</b>';
el("calcFormula").style.whiteSpace="pre-wrap";
function simDraw(spread){
 var score=1000/spread;
 el("sim_spread").textContent=spread.toFixed(2);
 el("sim_score").textContent=Math.round(score).toLocaleString();
 var note;if(spread<=0.3)note="Languages almost equally compressed — a great multilingual tokenizer.";
  else if(spread<=0.8)note="Our real result: English is efficient, Telugu lags. Solid but uneven.";
  else if(spread<=1.3)note="A wide gap — some languages are second-class citizens of the vocabulary.";
  else note="Huge disparity — the tokenizer badly favours one script over another.";
 el("sim_note").textContent=note;
 // svg curve score vs spread
 var W=320,H=130,cap=4000;var svg='';
 var path="";for(var i=0;i<=100;i++){var sp=0.05+(2.0-0.05)*i/100;var sc=Math.min(cap,1000/sp);
  var x=i/100*W;var y=H-10-(sc/cap)*(H-20);path+=(i?"L":"M")+x.toFixed(1)+" "+y.toFixed(1)+" ";}
 svg+='<path d="'+path+'" fill="none" stroke="#334155" stroke-width="2"/>';
 var cx=(spread-0.05)/(2.0-0.05)*W;var cy=H-10-(Math.min(cap,score)/cap)*(H-20);
 svg+='<line x1="'+((S.spread-0.05)/(2.0-0.05)*W).toFixed(1)+'" y1="10" x2="'+((S.spread-0.05)/(2.0-0.05)*W).toFixed(1)+'" y2="'+(H-10)+'" stroke="#22c55e" stroke-dasharray="3 3" stroke-width="1"/>';
 svg+='<circle cx="'+cx.toFixed(1)+'" cy="'+cy.toFixed(1)+'" r="6" fill="#fbbf24"/>';
 el("sim_svg").innerHTML=svg;
}
el("sim").addEventListener("input",function(){simDraw(this.value/100);});
simDraw(0.78);

/* ===== ACT VII: allocation + explorer ===== */
var sc=S.script_token_counts,tot=S.vocab_size;
window.drawAlloc=function(){
 el("alloc").innerHTML='<div class="muted mono" style="font-size:12px;margin-bottom:8px">VOCABULARY ALLOCATION BY SCRIPT · 10,000 tokens</div>'+
 ["latin","deva","te","other"].map(function(l){var n=sc[l]||0,pct=n/tot*100;
  return '<div class="row"><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px"><span>'+BNAME[l]+'</span><span class="muted">'+n.toLocaleString()+' · '+pct.toFixed(1)+'%</span></div>'+
   '<div class="bar"><i data-w="'+pct+'" style="background:'+BCOL[l]+'"></i></div></div>';
 }).join("");
 setTimeout(function(){document.querySelectorAll("#alloc .bar i").forEach(function(b){b.style.width=b.dataset.w+"%";});},60);
};
var page=0,per=100,view=TOKENS;
function apply(){var q=el("q").value.trim().toLowerCase(),f=el("filter").value;
 view=TOKENS.filter(function(r){return(f==="all"||r.s===f)&&(q===""||r.token.toLowerCase().indexOf(q)>=0||(""+r.id)===q);});page=0;render();}
function render(){var pages=Math.max(1,Math.ceil(view.length/per));if(page>=pages)page=pages-1;
 var sl=view.slice(page*per,page*per+per);
 el("tokBody").innerHTML=sl.map(function(r){var disp=r.token.replace(/ /g,'<span class="whitespace">␣</span>');if(disp==="")disp='<span class="whitespace">∅</span>';
  return '<tr><td class="num muted">'+r.id+'</td><td class="mono">'+disp+'</td><td><span class="tag" style="background:'+BCOL[r.s]+'">'+BNAME[r.s]+'</span></td></tr>';}).join("");
 el("count").textContent=view.length.toLocaleString()+" tokens";el("pageInfo").textContent="Page "+(page+1)+" / "+pages;}
el("q").addEventListener("input",apply);el("filter").addEventListener("change",apply);
el("prev").onclick=function(){if(page>0){page--;render();}};
el("next").onclick=function(){var p=Math.ceil(view.length/per);if(page<p-1){page++;render();}};
function dl(name,content,type){var b=new Blob([content],{type:type}),u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download=name;a.click();URL.revokeObjectURL(u);}
el("dlTsv").onclick=function(){dl("tokens.tsv","id\ttoken\tscript\n"+TOKENS.map(function(r){return r.id+"\t"+r.token+"\t"+BNAME[r.s];}).join("\n"),"text/tab-separated-values");};
el("dlJson").onclick=function(){dl("tokens.json",JSON.stringify(TOKENS.map(function(r){return{id:r.id,token:r.token};})),"application/json");};
el("dlTok").onclick=function(){dl("tokenizer.json",window.TOKENIZER_JSON,"application/json");};
apply();
var io2=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting&&e.target.__f){e.target.__f();io2.unobserve(e.target);}});},{threshold:.2});
var rn=el("results");rn.__f=drawResults;io2.observe(rn);
var an=el("alloc");an.__f=drawAlloc;io2.observe(an);
// fallback if already visible
setTimeout(function(){var r=el("results").getBoundingClientRect();if(r.top<innerHeight&&!el("results").innerHTML)drawResults();var a=el("alloc").getBoundingClientRect();if(a.top<innerHeight&&!el("alloc").innerHTML)drawAlloc();},400);
