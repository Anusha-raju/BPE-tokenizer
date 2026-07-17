import re, regex, json
from tokenizers import Tokenizer, models, trainers, pre_tokenizers, decoders, normalizers
LANGS=["en","hi","te","sa"]
C={l:open(f"corpus/{l}.txt",encoding="utf-8").read() for l in LANGS}
def ws(t): return len(t.split())
def faithful(t): return len(regex.findall(r"[\p{L}\p{M}\p{N}]+|[^\s]",t))
WS={l:ws(C[l]) for l in LANGS}; FA={l:faithful(C[l]) for l in LANGS}

def train(weights,vocab=10000,minf=2):
    tok=Tokenizer(models.BPE(unk_token="[UNK]"))
    tok.normalizer=normalizers.NFKC()
    tok.pre_tokenizer=pre_tokenizers.Metaspace()
    tok.decoder=decoders.Metaspace()
    tr=trainers.BpeTrainer(vocab_size=vocab,min_frequency=minf,special_tokens=["[UNK]"],show_progress=False)
    lines=[]
    for l in LANGS: lines+=[C[l]]*weights[l]
    tok.train_from_iterator(lines,trainer=tr)
    return tok

def ev(tok):
    out={}
    for l in LANGS:
        n=len(tok.encode(C[l]).ids)
        out[l]={"tok":n,"Xfa":n/FA[l],"Xws":n/WS[l]}
    fa=[out[l]["Xfa"] for l in LANGS]
    return out, max(fa)-min(fa)

for w in [
  {"en":1,"hi":1,"te":1,"sa":1},
  {"en":1,"hi":2,"te":4,"sa":8},
  {"en":1,"hi":2,"te":5,"sa":12},
  {"en":1,"hi":3,"te":7,"sa":16},
  {"en":1,"hi":2,"te":6,"sa":20},
]:
    o,sp=ev(train(w))
    s=" ".join(f"{l}={o[l]['Xfa']:.3f}" for l in LANGS)
    print(f"w={w}  {s}  spread={sp:.4f} score={1000/sp:.1f}")

print("--- fine search ---")
best=None
import itertools
for minf in [1,2]:
  for hi in [2,3]:
    for te in [3,4,5]:
      for sa in [5,6,7,8,9]:
        w={"en":1,"hi":hi,"te":te,"sa":sa}
        o,sp=ev(train(w,minf=minf))
        mx=max(o[l]["Xfa"] for l in LANGS)
        gate=mx<=1.2
        tag=f"minf={minf} w={w} "+ " ".join(f"{l}={o[l]['Xfa']:.3f}" for l in LANGS)+f" spread={sp:.4f} score={1000/sp:.0f} gate={'OK' if gate else 'X'}"
        print(tag)
        cand=(gate, -sp)
        if best is None or cand>best[0]:
            best=(cand,w,minf,o,sp)
print("BEST:",best[1],"minf",best[2],"spread",round(best[4],4),"score",round(1000/best[4]))
