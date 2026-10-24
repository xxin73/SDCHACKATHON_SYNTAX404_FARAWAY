import test from 'node:test';import assert from 'node:assert/strict';
import {scoreOpportunity} from '../../artifacts/faraway/src/lib/opportunity-score';
test('market update changes ranking with the same profile',()=>{assert.equal(scoreOpportunity(.8,1,1,0).score,83);assert.equal(scoreOpportunity(.8,1,1,10).score,85);});
test('rapid AI targets can lower readiness without fabricating BLS growth',()=>{assert.ok(scoreOpportunity(.6,1,1,10).score<scoreOpportunity(.8,1,1,10).score);});
test('missing market evidence is renormalized, not scored as zero',()=>{assert.equal(scoreOpportunity(1,1,1,null).score,100);assert.equal(scoreOpportunity(.8,1,1,null).marketIndex,null);});
test('score stays bounded with extreme positive or negative growth',()=>{assert.equal(scoreOpportunity(1,1,1,1000).score,100);assert.equal(scoreOpportunity(0,0,0,-1000).score,0);});
