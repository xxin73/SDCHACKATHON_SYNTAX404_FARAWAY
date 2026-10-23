"""Build a small traceable ESCO seed. Usage: python import-esco.py DATA_SET.zip output.sql"""
import csv
import hashlib
import io
import json
import sys
import zipfile
from pathlib import Path

# Explicit title mappings, not an official crosswalk. Confirm with domain users.
MAPPINGS = {'data-analyst': 'data analyst', 'software-engineer': 'software developer',
            'cloud-engineer': 'cloud engineer', 'financial-analyst': 'financial analyst',
            'business-analyst': 'ICT business analyst'}

def build(path):
    raw = Path(path).read_bytes()
    archive = zipfile.ZipFile(io.BytesIO(raw))
    if 'occupations_en.csv' not in archive.namelist():
        names = [n for n in archive.namelist() if n.endswith('.zip') and 'ESCO' in n]
        if len(names) != 1:
            raise ValueError('Expected one ESCO ZIP inside the supplied archive')
        raw = archive.read(names[0])
        archive = zipfile.ZipFile(io.BytesIO(raw))
    def rows(name):
        return list(csv.DictReader(io.StringIO(archive.read(name).decode('utf-8-sig'))))
    occupations = rows('occupations_en.csv')
    skills = {s['conceptUri']: s for s in rows('skills_en.csv')}
    relations = rows('occupationSkillRelations_en.csv')
    result = []
    for career_id, label in MAPPINGS.items():
        matches = [o for o in occupations if o['preferredLabel'] == label]
        if len(matches) != 1:
            raise ValueError(f'Expected exactly one occupation: {label}')
        occupation = matches[0]
        linked = {}
        for relation in relations:
            if relation['occupationUri'] != occupation['conceptUri']:
                continue
            skill = skills[relation['skillUri']]
            kind = relation['relationType']
            if kind not in ('essential', 'optional'):
                raise ValueError(f'Unexpected relation: {kind}')
            key = (skill['conceptUri'], kind)
            linked[key] = {'uri': skill['conceptUri'], 'label': skill['preferredLabel'],
                           'relation': kind, 'type': skill['skillType'],
                           'description': skill['description']}
        if not linked:
            raise ValueError(f'No skills for {label}')
        result.append({'career_id': career_id, 'esco_version': '1.2.1',
                       'occupation_uri': occupation['conceptUri'], 'occupation_label': label,
                       'description': occupation['description'],
                       'source_url': 'https://esco.ec.europa.eu/en/use-esco/download',
                       'archive_sha256': hashlib.sha256(raw).hexdigest(),
                       'mapping_note': 'Team-selected related occupation; not an official equivalence or Malaysian demand evidence.',
                       'skills': sorted(linked.values(), key=lambda s: (s['relation'], s['label']))})
    return result

def sql(records):
    statements = ['-- ESCO v1.2.1 subset from the team-supplied archive. Run after 003_esco_reference.sql.', 'begin;']
    for record in records:
        value = json.dumps(record, ensure_ascii=False).replace("'", "''")
        statements.append("insert into public.career_skill_references(career_id,esco_version,payload) values "
                          f"('{record['career_id']}','1.2.1','{value}'::jsonb) "
                          "on conflict(career_id,esco_version) do update set payload=excluded.payload, imported_at=now();")
    return '\n'.join(statements + ['commit;', ''])

if __name__ == '__main__':
    records = build(sys.argv[1])
    Path(sys.argv[2]).write_text(sql(records), encoding='utf-8')
    print(f'Prepared {len(records)} occupations and {sum(len(r["skills"]) for r in records)} skill relations.')
