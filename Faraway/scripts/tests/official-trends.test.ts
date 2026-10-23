import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {DOSM_GROUPS,BLS_OCCUPATIONS,CAREER_SOC,DOSM_URL,BLS_URL} from '../../artifacts/faraway/src/data/official-trends';

test('DOSM Q1 and Q2 occupation groups reconcile to the published Malaysia totals',()=>{
 assert.equal(DOSM_GROUPS.reduce((sum,row)=>sum+row.first,0),626861);
 assert.equal(DOSM_GROUPS.reduce((sum,row)=>sum+row.second,0),555509);
 assert.match(DOSM_URL,/dosm\.gov\.my/);
});

test('BLS chart uses vetted US SOC projections and leaves unknown careers unmapped',()=>{
 assert.deepEqual(BLS_OCCUPATIONS['15-2051'],{title:'Data scientists',first:275.6,second:371});
 assert.equal(CAREER_SOC['politician'],undefined);
 assert.equal(CAREER_SOC['sustainability-specialist'],undefined);
 for(const code of Object.values(CAREER_SOC))assert.ok(BLS_OCCUPATIONS[code],`missing occupation ${code}`);
 assert.match(BLS_URL,/bls\.gov/);
});
