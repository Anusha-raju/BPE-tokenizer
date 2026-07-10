
const A=window.APP,S=A.summary,T=A.tokens;
const LANGCOL={en:"#3b82f6",hi:"#f59e0b",te:"#10b981",sa:"#8b5cf6"};
const LANGNAME={en:"English",hi:"Hindi",te:"Telugu",sa:"Sanskrit"};
const codeMap={"English":"en","Hindi":"hi","Telugu":"te","Sanskrit":"sa"};
const BCOL={latin:"#3b82f6",deva:"#f59e0b",te:"#10b981",other:"#64748b"};
const BNAME={latin:"Latin",deva:"Devanagari",te:"Telugu",other:"Other"};

document.getElementById("score").childNodes[0].nodeValue=S.self_score.toLocaleString();
document.getElementById("formulaBox").innerHTML=
  "X_min = <b>"+S.Xmin+"</b> ("+S.sorted_low_to_high[0].lang+")<br>"+
  "X_max = <b>"+S.Xmax+"</b> ("+S.sorted_low_to_high[3].lang+")<br>"+
  "spread = "+S.Xmax+" &minus; "+S.Xmin+" = <b>"+S.spread+"</b><br>"+
  "score = 1000 / "+S.spread+" = <b>"+S.self_score+"</b>";
const ok=S.english_constraint_met;
document.getElementById("constraint").innerHTML='<span class="badge '+(ok?'ok':'no')+'">'+(ok?'✓':'✗')+' English X1 = '+S.stats.en.ratio+' '+(ok?'≤':'>')+' 1.20 target</span>';
document.getElementById("wtxt").textContent="en:"+S.weights.en+" · hi:"+S.weights.hi+" · te:"+S.weights.te+" · sa:"+S.weights.sa;

const maxR=Math.max.apply(null,Object.values(S.stats).map(function(s){return s.ratio;}));
document.getElementById("cards").innerHTML=["en","hi","te","sa"].map(function(l){
  const s=S.stats[l],c=LANGCOL[l];
  return '<div class="card"><div class="stripe" style="background:'+c+'"></div>'+
    '<div class="lang" style="color:'+c+'">'+s.language+'</div>'+
    '<div class="r">'+s.ratio.toFixed(3)+'</div>'+
    '<div class="meta">'+s.tokens.toLocaleString()+' tokens ÷ '+s.sample_words.toLocaleString()+' words</div>'+
    '<div class="bar"><i style="width:'+(s.ratio/maxR*100).toFixed(1)+'%;background:'+c+'"></i></div></div>';
}).join("");

const tb=document.querySelector("#calcTable tbody");
S.sorted_low_to_high.forEach(function(row,i){
  const l=codeMap[row.lang],s=S.stats[l];
  const cls=i===0?"rowmin":(i===3?"rowmax":"");
  const tag=i===0?' <span class="pill" style="background:rgba(34,197,94,.15);color:#22c55e">X_min</span>':i===3?' <span class="pill" style="background:rgba(239,68,68,.15);color:#ef4444">X_max</span>':'';
  tb.innerHTML+='<tr class="'+cls+'"><td><span class="tag" style="background:'+LANGCOL[l]+'">'+row.lang+'</span>'+tag+'</td>'+
    '<td class="num">'+s.sample_words.toLocaleString()+'</td><td class="num">'+s.tokens.toLocaleString()+'</td>'+
    '<td class="num"><b>'+row.ratio.toFixed(4)+'</b></td></tr>';
});
document.getElementById("calcBox").innerHTML=
  "spread = X_max &minus; X_min = "+S.Xmax+" &minus; "+S.Xmin+" = <b>"+S.spread+"</b><br>"+
  'self-score = 1000 / '+S.spread+' = <b style="font-size:18px">'+S.self_score+'</b>';

const sc=S.script_token_counts,tot=S.vocab_size;
document.getElementById("alloc").innerHTML=["latin","deva","te","other"].map(function(l){
  const n=sc[l]||0,pct=(n/tot*100);
  return '<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px">'+
    '<span>'+BNAME[l]+'</span><span class="muted">'+n.toLocaleString()+' tokens · '+pct.toFixed(1)+'%</span></div>'+
    '<div class="bar"><i style="width:'+pct+'%;background:'+BCOL[l]+'"></i></div></div>';
}).join("");

let page=0,per=100,view=T;
function apply(){
  const q=document.getElementById("q").value.trim().toLowerCase();
  const f=document.getElementById("filter").value;
  view=T.filter(function(r){return (f==="all"||r.s===f)&&(q===""||r.token.toLowerCase().indexOf(q)>=0||(""+r.id)===q);});
  page=0;render();
}
function render(){
  const pages=Math.max(1,Math.ceil(view.length/per));
  if(page>=pages)page=pages-1;
  const slice=view.slice(page*per,page*per+per);
  document.getElementById("tokBody").innerHTML=slice.map(function(r){
    let disp=r.token.replace(/ /g,'<span class="whitespace">␣</span>');
    if(disp==="")disp='<span class="whitespace">∅</span>';
    return '<tr><td class="num muted">'+r.id+'</td><td class="tok">'+disp+'</td>'+
      '<td><span class="tag" style="background:'+BCOL[r.s]+'">'+BNAME[r.s]+'</span></td></tr>';
  }).join("");
  document.getElementById("count").textContent=view.length.toLocaleString()+" tokens";
  document.getElementById("pageInfo").textContent="Page "+(page+1)+" / "+pages;
}
document.getElementById("q").addEventListener("input",apply);
document.getElementById("filter").addEventListener("change",apply);
document.getElementById("prev").onclick=function(){if(page>0){page--;render();}};
document.getElementById("next").onclick=function(){const pages=Math.ceil(view.length/per);if(page<pages-1){page++;render();}};
function dl(name,content,type){const b=new Blob([content],{type:type});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download=name;a.click();URL.revokeObjectURL(u);}
document.getElementById("dlTsv").onclick=function(){let s="id\ttoken\tscript\n"+T.map(function(r){return r.id+"\t"+r.token+"\t"+BNAME[r.s];}).join("\n");dl("tokens.tsv",s,"text/tab-separated-values");};
document.getElementById("dlJson").onclick=function(){dl("tokens.json",JSON.stringify(T.map(function(r){return {id:r.id,token:r.token};})),"application/json");};
document.getElementById("dlTok").onclick=function(){dl("tokenizer.json",window.TOKENIZER_JSON,"application/json");};
apply();
