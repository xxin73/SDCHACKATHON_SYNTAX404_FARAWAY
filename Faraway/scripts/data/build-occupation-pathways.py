import json,hashlib,datetime
from pathlib import Path
root=Path(__file__).resolve().parents[2]
# Editorial interest-to-occupation links. Skill relationships below are taken from O*NET rows.
roles=[
('lawyer','Lawyer','law','23-1011.00',['law'],['Legal Research','Legal Writing','Debate & Argumentation','Communication','Negotiation','Critical Thinking']),
('legal-researcher','Legal Researcher / Paralegal','law','23-2011.00',['law'],['Legal Research','Legal Writing','Reading Comprehension','Communication','Critical Thinking','Active Listening']),
('policy-analyst','Public Policy Analyst','law','19-3094.00',['law','public'],['Policy Analysis','Research Methods','Writing','Communication','Critical Thinking','Judgment and Decision Making']),
('politician','Politician / Legislator','public','19-3094.00',['law','public'],['Policy Analysis','Debate & Argumentation','Communication','Negotiation','Critical Thinking','Writing']),
('nurse','Registered Nurse','health','29-1141.00',['health'],None),
('health-educator','Health Education Specialist','health','21-1091.00',['health','education','social'],None),
('industrial-engineer','Industrial Engineer','engineering','17-2112.00',['engineering'],None),
('mechanical-engineer','Mechanical Engineer','engineering','17-2141.00',['engineering'],None),
('teacher','Teacher','education','25-2021.00',['education'],None),
('instructional-designer','Instructional Designer','education','25-9031.00',['education','design'],None),
('biologist','Biologist','science','19-1029.04',['science'],None),
('research-scientist','Research Scientist (Chemistry)','science','19-2031.00',['science'],None),
('environmental-scientist','Environmental Scientist','environment','19-2041.00',['environment','science'],None),
('sustainability-specialist','Sustainability Specialist','environment','13-1199.05',['environment','business'],None),
('agricultural-scientist','Agricultural Scientist','agriculture','19-1013.00',['agriculture','science'],None),
('food-scientist','Food Scientist','agriculture','19-1012.00',['agriculture','science'],None),
('logistician','Logistics Analyst','logistics','13-1081.00',['logistics'],None),
('purchasing-agent','Procurement Specialist','logistics','13-1023.00',['logistics','business'],None),
('hotel-manager','Hotel / Lodging Manager','hospitality','11-9081.00',['hospitality'],None),
('tour-guide','Tour Guide','hospitality','39-7011.00',['hospitality'],None),
('civil-engineer','Civil Engineer','construction','17-2051.00',['construction','engineering'],None),
('construction-manager','Construction Manager','construction','11-9021.00',['construction'],None),
('social-worker','Social Worker','social','21-1021.00',['social'],None),
('community-service-manager','Community Services Manager','social','11-9151.00',['social','public'],None),
('journalist','Journalist','media','27-3023.00',['media'],None),
('public-relations-specialist','Public Relations Specialist','media','27-3031.00',['media','business'],None),
('retail-manager','Retail Manager','entrepreneurship','41-1011.00',['entrepreneurship','business'],None),
('business-owner','Business Owner / Entrepreneur','entrepreneurship','11-1021.00',['entrepreneurship','business'],None),
('public-service-manager','Public Service Programme Manager','public','11-3012.00',['public'],None),
]
# Curated display groups, always retain native source element and scale.
aliases={'Legal Research':['Law and Government','Reading Comprehension'],'Legal Writing':['Writing','Law and Government'],'Debate & Argumentation':['Persuasion','Critical Thinking'],'Communication':['Speaking','Active Listening'],'Policy Analysis':['Law and Government','Judgment and Decision Making'],'Research Methods':['Reading Comprehension','Critical Thinking']}
sources={};allrows=[]
for name in ['essential','transferable','knowledge']:
 raw=(Path(__import__('sys').argv[1]) / (name+'.json')).read_bytes();d=json.loads(raw)
 sources[name]={'url':f'https://www.onetcenter.org/dl_files/database/db_31_0_json/{d["table_id"]}.json','sha256':hashlib.sha256(raw).hexdigest()}
 allrows.extend([{**r,'file':name} for r in d['row'] if r['scale_id']=='IM' and r.get('recommend_suppress')!='Y' and r.get('not_relevant')!='Y'])
output=[]
for id,title,stream,code,interests,skills in roles:
 rows=[r for r in allrows if r['onetsoc_code']==code];assert rows,(id,code)
 byname={r['element_name']:r for r in rows}
 if skills is None:
  selected=[]
  for file,n in [('knowledge',2),('essential',2),('transferable',2)]:
   selected.extend(sorted([r for r in rows if r['file']==file and float(r['data_value'])>=2.5],key=lambda r:(-float(r['data_value']),r['element_name']))[:n])
  skills=list(dict.fromkeys(r['element_name'] for r in selected))
 groups=[]
 for skill in skills:
  matches=[byname[k] for k in aliases.get(skill,[skill]) if k in byname];assert matches,(id,skill)
  groups.append({'skill':skill,'target':3,'concepts':[{'id':r['element_id'],'label':r['element_name'],'importance':r['data_value'],'scale':'Importance (1–5), not proficiency','updatedAt':r['date_updated'],'source':r['file']} for r in matches]})
 qualification='This learning pathway develops skills; it does not confer a professional qualification. Check recognised study, registration and local entry requirements.' if id in ['lawyer','nurse','teacher','civil-engineer','mechanical-engineer','industrial-engineer','social-worker'] else ''
 if id=='politician':qualification='An elected role, not a guaranteed employment outcome. Skills use a Political Scientists analogue because the O*NET Legislators profile has no measured skill ratings.'
 if id=='business-owner':qualification='A self-employment pathway. General and Operations Managers is a selected occupational analogue; it does not establish business success or an entry credential.'
 output.append({'id':id,'title':title,'stream':stream,'interests':interests,'code':code,'sourceTitle':rows[0]['title'],'groups':groups,'qualificationNote':qualification,'futureSkills':[s for s in skills if s in ['Legal Research','Legal Writing','Policy Analysis','Research Methods','Writing','Critical Thinking','Judgment and Decision Making','Science','Systems Analysis']][:3]})
pack={'version':'occupation-pathways-onet31-v1','sourceVersion':'31.0','retrievedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sources':sources,'roles':output}
(root/'supabase/functions/faraway-recommendations/pathway-data.ts').write_text('// Generated by scripts/data/build-occupation-pathways.py. O*NET 31.0, CC BY 4.0; selected/modified by Faraway.\nexport const PATHWAY_DATA = '+json.dumps(pack,ensure_ascii=False,indent=2)+' as const;\n')
