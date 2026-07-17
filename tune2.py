import regex, json
from tokenizers import Tokenizer, models, trainers, pre_tokenizers, decoders, normalizers
LANGS=["en","hi","te","sa"]
C={l:open(f"corpus/{l}.txt",encoding="utf-8").read() for l in LANGS}
def ws(t): return len(t.split())
def faithful(t): return len(regex.findall(r"[\p{L}\p{M}\p{N}]+|[^\s]",t))
WS={l:ws(C[l]) for l in LANGS}; FA={l:faithful(C[l]) for l in LANGS}
def train(w,minf=2):
    tok=Tokenizer(models.BPE(unk_token="[UNK]"))
    tok.normalizer=normalizers.NFKC(); tok.pre_tokenizer=pre_tokenizers.Metaspace(); tok.decoder=decoders.Metaspace()
    tr=trainers.BpeTrainer(vocab_size=10000,min_frequency=minf,special_tokens=["[UNK]"],show_progress=False)
    lines=[]
    for l in LANGS: lines+=[C[l]]*w[l]
    tok.train_from_iterator(lines,trainer=tr); return tok
def ev(tok):
    o={l:{"tok":len(tok.encode(C[l]).ids)} for l in LANGS}
    for l in LANGS: o[l]["Xfa"]=o[l]["tok"]/FA[l]; o[l]["Xws"]=o[l]["tok"]/WS[l]
    fa=[o[l]["Xfa"] for l in LANGS]; return o,max(fa)-min(fa)
grid=[]
for minf in [1,2]:
  for hi in [2,3]:
    for te in [3,4,5]:
      for sa in [5,6,7,8,9]:
        grid.append({"en":1,"hi":hi,"te":te,"sa":sa,"_minf":minf})
res=[]
for w in grid:
    minf=w.pop("_minf")
    o,sp=ev(train(w,minf))
    mx=max(o[l]["Xfa"] for l in LANGS)
    res.append({"w":w,"minf":minf,"X":{l:round(o[l]["Xfa"],4) for l in LANGS},"spread":round(sp,4),"score":round(1000/sp,1),"gate":mx<=1.2})
    json.dump(res,open("grid_results.json","w"),indent=0)
print("done",len(res))
