import test from 'node:test';
import assert from 'node:assert/strict';
import {generateStructuredJson,resolveModelProvider,runpodChatRequest} from '../../supabase/functions/faraway-recommendations/model-provider.ts';

const schema={type:'OBJECT',properties:{items:{type:'ARRAY',items:{type:'OBJECT',properties:{title:{type:'STRING'}},required:['title']}}},required:['items']};

test('RunPod provider is selected from server secrets and uses the deployed vLLM model ID',()=>{
 const env=(key:string)=>({AI_PROVIDER:'runpod',RUNPOD_API_KEY:'server-secret',RUNPOD_ENDPOINT_ID:'abc_123',RUNPOD_MODEL:'Qwen/Qwen3-8B'} as Record<string,string>)[key];
 const provider=resolveModelProvider(env);
 assert.equal(provider.provider,'runpod');
 if(provider.provider!=='runpod')throw new Error('Expected RunPod provider');
 assert.equal(provider.model,'Qwen/Qwen3-8B');
 assert.equal(provider.endpointId,'abc_123');
});

test('RunPod request uses OpenAI JSON schema, a single completion and bounded output tokens',()=>{
 const request=runpodChatRequest('Qwen/Qwen3-8B','System instructions',{task:'test'},schema,2048);
 assert.equal(request.model,'Qwen/Qwen3-8B');
 assert.equal(request.n,1);
 assert.equal(request.stream,false);
 assert.equal(request.max_tokens,2048);
 assert.match(request.messages[0].content,/\/no_think/);
 assert.deepEqual(request.response_format.json_schema.schema,{type:'object',properties:{items:{type:'array',items:{type:'object',properties:{title:{type:'string'}},required:['title']}}},required:['items']});
});

test('RunPod server call parses structured JSON and keeps the API key server side',async()=>{
 let url='',sent:any,authorization='';
 const provider={provider:'runpod' as const,model:'Qwen/Qwen3-8B',apiKey:'server-only-key',endpointId:'abc_123'};
 const result=await generateStructuredJson((async(input:any,init:any)=>{
  url=String(input);sent=JSON.parse(init.body);authorization=init.headers.authorization;
  return new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:'{"items":[{"title":"SQL"}]}'}}]}),{status:200});
 }) as typeof fetch,provider,{system:'Be concise',data:{task:'test'},schema,maxTokens:2048});
 assert.equal(url,'https://api.runpod.ai/v2/abc_123/openai/v1/chat/completions');
 assert.equal(authorization,'Bearer server-only-key');
 assert.equal(sent.n,1);
 assert.equal(sent.max_tokens,2048);
 assert.deepEqual(result,{items:[{title:'SQL'}]});
});

test('RunPod errors are not retried, preventing duplicate GPU work',async()=>{
 let calls=0;
 const provider={provider:'runpod' as const,model:'Qwen/Qwen3-8B',apiKey:'secret',endpointId:'abc_123'};
 await assert.rejects(()=>generateStructuredJson((async()=>{
  calls++;
  return new Response('busy',{status:503});
 }) as typeof fetch,provider,{system:'Be concise',data:{},schema,maxTokens:256}),/Check endpoint status/);
 assert.equal(calls,1);
});
