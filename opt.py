from train import train, evaluate, LANGS
import itertools, json

def score_of(weights):
    tok=train(weights)
    r=evaluate(tok)
    vals=sorted(r.values())
    spread=vals[-1]-vals[0]
    en=r["en"]
    # objective: minimize spread, hard-ish penalty if en>1.2
    pen = max(0, en-1.2)*50
    return spread+pen, spread, r

# coordinate descent
w={"en":6,"hi":5,"te":10,"kn":16}
best_obj,best_spread,best_r=score_of(w)
print("start",w,best_r,"spread",round(best_spread,4))
steps=[ -3,-2,-1,1,2,3 ]
import copy
improved=True
it=0
while improved and it<6:
    improved=False; it+=1
    for l in LANGS:
        for s in steps:
            nw=dict(w); nw[l]=w[l]+s
            if nw[l]<1 or nw[l]>40: continue
            o,sp,r=score_of(nw)
            if o<best_obj-1e-4:
                best_obj,best_spread,best_r=o,sp,r; w=nw; improved=True
    print("iter",it,w,{k:round(v,3) for k,v in best_r.items()},"spread",round(best_spread,4))
print("BEST",w)
print(json.dumps({k:round(v,4) for k,v in best_r.items()}))
vals=sorted(best_r.values())
print("spread",round(vals[-1]-vals[0],4),"score",round(1000/(vals[-1]-vals[0]),1),"en_ok",best_r["en"]<=1.2)
json.dump(w,open("best_weights.json","w"))
