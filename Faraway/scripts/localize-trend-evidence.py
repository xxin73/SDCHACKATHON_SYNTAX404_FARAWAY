"""Translate newly published public evidence titles on CPU before publishing a snapshot.
No profile, personal records, GPU, RunPod API key or third-party translation API is used.
"""
import json,os,pathlib,urllib.request
root=pathlib.Path('artifacts/faraway')
snapshot=json.loads((root/'public/trend-evidence.json').read_text())
paths={lang:root/'src/lib/locales'/f'{lang}.json' for lang in ['zh','ms']}
reviewed=json.loads((root/'src/lib/translations.json').read_text())
dictionaries={lang:json.loads(p.read_text()) for lang,p in paths.items()}
texts={p['title'] for p in (snapshot.get('research',{}).get('data') or [])}
texts.update(p['title'] for p in ((snapshot.get('bls',{}).get('data') or {}).get('occupations') or {}).values())
release=(snapshot.get('onet',{}).get('data') or {}).get('released')
if release:texts.add(release)
pending={lang:[s for s in sorted(texts) if s not in dictionaries[lang] and s not in reviewed] for lang in paths}
if not any(pending.values()):
 print('Evidence titles already translated.');raise SystemExit(0)
import ctranslate2,sentencepiece as spm
model=pathlib.Path(os.environ.get('FARAWAY_TRANSLATION_MODEL','/tmp/faraway-nllb'));model.mkdir(parents=True,exist_ok=True)
for name in ['config.json','model.bin','sentencepiece.bpe.model','shared_vocabulary.txt']:
 path=model/name
 if not path.exists() or not path.stat().st_size:
  temporary=path.with_suffix(path.suffix+'.download')
  with urllib.request.urlopen('https://huggingface.co/JustFrederik/nllb-200-distilled-600M-ct2-int8/resolve/main/'+name,timeout=120) as response,temporary.open('wb') as output:
   while chunk:=response.read(1024*1024):output.write(chunk)
  temporary.replace(path)
sp=spm.SentencePieceProcessor(model_file=str(model/'sentencepiece.bpe.model'))
translator=ctranslate2.Translator(str(model),device='cpu',compute_type='int8',intra_threads=2)
for lang,token in [('zh','zho_Hans'),('ms','zsm_Latn')]:
 for offset in range(0,len(pending[lang]),32):
  batch=pending[lang][offset:offset+32]
  results=translator.translate_batch([['eng_Latn']+sp.encode(s,out_type=str)+['</s>'] for s in batch],target_prefix=[[token]]*len(batch),beam_size=2,max_decoding_length=200)
  for source,result in zip(batch,results):
   target=sp.decode(result.hypotheses[0][1:]).strip()
   if not target:raise RuntimeError('Empty evidence translation; snapshot was not published.')
   dictionaries[lang][source]=target
for lang,path in paths.items():path.write_text(json.dumps(dictionaries[lang],ensure_ascii=False,separators=(',',':')))
print('Public evidence titles translated:',{lang:len(rows) for lang,rows in pending.items()})
