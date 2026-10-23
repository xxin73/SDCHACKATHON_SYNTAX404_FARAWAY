import test from 'node:test';
import assert from 'node:assert/strict';
import { generationSettings, providerFailure } from '../../supabase/functions/faraway-recommendations/index';

test('Gemini request uses family-compatible thinking controls without mixing budget and level',()=>{
  const schema={type:'OBJECT'};
  const lite=generationSettings('gemini-3.5-flash-lite',schema);
  assert.deepEqual(lite.thinkingConfig,{thinkingLevel:'minimal'});
  assert.equal(lite.responseSchema,schema);
  assert.deepEqual(generationSettings('gemini-3.8-flash',schema).thinkingConfig,{thinkingLevel:'low'});
  assert.deepEqual(generationSettings('gemini-2.5-flash',schema).thinkingConfig,{thinkingBudget:0});
  assert.equal(generationSettings('gemini-2.5-pro',schema).thinkingConfig,undefined);
});

test('provider diagnostics distinguish invalid requests from missing model without echoing private text',()=>{
  const model='gemini-3.5-flash-lite';
  const missing=providerFailure(404,model,{error:{status:'NOT_FOUND',message:'private profile name SECRET'}});
  assert.match(missing,/HTTP 404 \(NOT_FOUND\)/);assert.match(missing,/not available/);
  assert.ok(!missing.includes('SECRET'));
  const thinking=providerFailure(400,model,{error:{status:'INVALID_ARGUMENT',message:'thinking budget invalid SECRET'}});
  assert.match(thinking,/thinking settings/);assert.ok(!thinking.includes('SECRET'));
  assert.match(providerFailure(400,model,{error:{message:'response schema unsupported'}}),/structured-output/);
  assert.match(providerFailure(400,model,{error:{message:'API key invalid'}}),/API key/);
});
