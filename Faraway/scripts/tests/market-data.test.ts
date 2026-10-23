import test from 'node:test';
import assert from 'node:assert/strict';
import {parseObservations,observationPairs} from '../../artifacts/faraway/src/lib/market-data';
const header='provider,role,query,geography,observed_at,count,source_url,method\n';
const row=(date:string,count=12,query='data analyst',method='active-listings')=>`JobStreet,Data Analyst,${query},Malaysia,${date},${count},https://my.jobstreet.com/data-analyst-jobs,${method}\n`;
test('pairs same-day yearly snapshots and retains zero',()=>{const pairs=observationPairs(parseObservations(header+row('2025-01-05',0)+row('2026-01-05',12)),'JobStreet');assert.equal(pairs.length,1);assert.equal(pairs[0].first,0);assert.equal(pairs[0].second,12);});
test('missing and incompatible history is not paired',()=>{for(const text of [row('2026-01-05'),row('2025-01-04')+row('2026-01-05'),row('2025-01-05',2,'analyst')+row('2026-01-05'),row('2025-01-05',2,'data analyst','annual-postings')+row('2026-01-05')])assert.equal(observationPairs(parseObservations(header+text),'JobStreet').length,0);});
test('rejects fabricated dates, negative counts, duplicate rows and unrelated hosts',()=>{for(const text of [row('2025-02-30'),row('2025-01-01',-1),row('2025-01-01')+row('2025-01-01'),row('2025-01-01').replace('my.jobstreet.com','evil.example'),row('2099-01-01')])assert.throws(()=>parseObservations(header+text));});
