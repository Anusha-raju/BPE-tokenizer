import re, os, json
from tokenizers import Tokenizer, models, trainers, pre_tokenizers, decoders, normalizers

LANGS=["en","hi","te","sa"]
CORPUS={l:open(f"corpus/{l}.txt",encoding="utf-8").read() for l in LANGS}

def word_count(t):            # plain whitespace word count, identical across langs
    return len(t.split())
WORDS={l:word_count(CORPUS[l]) for l in LANGS}

def build_tokenizer(weights, vocab_size=10000, min_freq=2):
    tok=Tokenizer(models.BPE(unk_token="[UNK]"))
    tok.normalizer=normalizers.NFKC()
    tok.pre_tokenizer=pre_tokenizers.Metaspace()
    tok.decoder=decoders.Metaspace()
    tr=trainers.BpeTrainer(vocab_size=vocab_size,min_frequency=min_freq,
                           special_tokens=["[UNK]"],show_progress=False)
    # oversample by repeating each corpus 'weights[l]' times
    lines=[]
    for l in LANGS:
        lines.extend([CORPUS[l]]*weights[l])
    tok.train_from_iterator(lines,trainer=tr)
    return tok

def evaluate(tok):
    res={}
    for l in LANGS:
        ids=tok.encode(CORPUS[l]).ids
        res[l]={"tokens":len(ids),"words":WORDS[l],"X":len(ids)/WORDS[l]}
    xs=[res[l]["X"] for l in LANGS]
    spread=max(xs)-min(xs)
    return res, spread, 1000/spread

def roundtrip(tok):
    ok={}
    for l in LANGS:
        s=CORPUS[l]
        d=tok.decode(tok.encode(s).ids)
        strip=lambda z:"".join(z.split())
        ok[l]=(strip(d)==strip(s))
    return ok

if __name__=="__main__":
    import sys
    w=json.loads(sys.argv[1]) if len(sys.argv)>1 else {l:1 for l in LANGS}
    tok=build_tokenizer(w)
    res,spread,score=evaluate(tok)
    print("weights",w)
    for l in LANGS:
        print(f"  {l}: words={res[l]['words']:6d} tokens={res[l]['tokens']:6d} X={res[l]['X']:.4f}")
    print(f"  spread={spread:.4f} score={score:.2f}")
    print("  roundtrip",roundtrip(tok))
