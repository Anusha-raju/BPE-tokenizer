from tokenizers import Tokenizer, models, trainers, pre_tokenizers, normalizers
LANGS=["en","hi","te","sa"]
TEXT={l:open(f"corpus/{l}_final.txt").read() for l in LANGS}
WORDS={l:TEXT[l].split() for l in LANGS}
EVAL={l:" ".join(WORDS[l][:5000]) for l in LANGS}
EVAL_W={l:min(5000,len(WORDS[l])) for l in LANGS}
def train(weights, vocab=10000):
    tok=Tokenizer(models.BPE(unk_token="[UNK]")); tok.normalizer=normalizers.NFC()
    tok.pre_tokenizer=pre_tokenizers.WhitespaceSplit()
    tr=trainers.BpeTrainer(vocab_size=vocab, special_tokens=["[UNK]"], show_progress=False)
    corpus=[]
    for l in LANGS: corpus+=[TEXT[l]]*weights[l]
    tok.train_from_iterator(corpus, trainer=tr); return tok
def evaluate(tok):
    return {l: len(tok.encode(EVAL[l]).ids)/EVAL_W[l] for l in LANGS}
