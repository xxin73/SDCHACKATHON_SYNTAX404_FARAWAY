"""Refresh attributable reference snapshots; requires Python 3, no API keys."""
import csv,io,json,urllib.request,datetime,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'artifacts/faraway/src/data'
MAPPINGS={'data-analyst':'15-2051.01','software-engineer':'15-1252.00','cyber-analyst':'15-1212.00','ml-engineer':'15-2051.00','accountant':'13-2011.00','financial-analyst':'13-2051.00','hr-specialist':'13-1071.00','digital-marketer':'13-1161.01'}
def build(dosm,onet):
 now=datetime.datetime.now(datetime.timezone.utc).isoformat()
 rows=list(csv.DictReader(io.StringIO(dosm.decode('utf-8-sig'))));r=max(rows,key=lambda r:r['date'])
 snapshot={'observedAt':r['date'],'retrievedAt':now,'unemployment':float(r['u_rate']),'participation':float(r['p_rate']),'employedThousands':float(r['lf_employed']),'source':'https://storage.dosm.gov.my/labour/lfs_month.csv','sha256':hashlib.sha256(dosm).hexdigest()}
 OUT.joinpath('dosm-labour.json').write_text(json.dumps(snapshot,indent=2)+'\n')
 data=json.loads(onet);result={'version':'31.0','retrievedAt':now,'source':'https://www.onetcenter.org/dl_files/database/db_31_0_json/software_skills.json','license':'CC BY 4.0','sha256':hashlib.sha256(onet).hexdigest(),'occupations':{}}
 for career,code in MAPPINGS.items():
  selected=[r for r in data['row'] if r['onetsoc_code']==code]
  if not selected:raise ValueError('No rows for '+code)
  result['occupations'][career]={'code':code,'title':selected[0]['title'],'mapping':'Faraway selected occupational analogue; not an official ESCO/MASCO crosswalk.','software':[{'name':r['workplace_example'],'category':r['element_name'],'hot':r['hot_technology']=='Y','inDemand':r['in_demand']=='Y'} for r in selected]}
 OUT.joinpath('onet-software.json').write_text(json.dumps(result,indent=2)+'\n')
if __name__=='__main__':
 import argparse
 parser=argparse.ArgumentParser();parser.add_argument('--local-dir',type=Path);args=parser.parse_args()
 if args.local_dir:build((args.local_dir/'lfs_month.csv').read_bytes(),(args.local_dir/'onet-software.json').read_bytes())
 else:
  def fetch(url):
   with urllib.request.urlopen(url,timeout=90) as response:return response.read()
  build(fetch('https://storage.dosm.gov.my/labour/lfs_month.csv'),fetch('https://www.onetcenter.org/dl_files/database/db_31_0_json/software_skills.json'))
