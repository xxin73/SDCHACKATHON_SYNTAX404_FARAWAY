// Scheduled read-only ingestion; only public evidence is written. No RunPod/Supabase secrets.
const fs=require('node:fs');const crypto=require('node:crypto');
const {collect}=require('../api/trends.js');
(async()=>{
 const path='artifacts/faraway/public/trend-evidence.json';const old=fs.existsSync(path)?JSON.parse(fs.readFileSync(path,'utf8')):null;
 const next=await collect();
 for(const key of ['bls','dosm','onet','research'])if(next[key].status!=='live'&&old?.[key]?.status==='live')next[key]={...old[key],lastSuccessAt:old[key].lastSuccessAt??old.checkedAt,lastCheckFailed:true};
 next.sourceCheckFailures=['bls','dosm','onet','research'].filter(k=>next[k].status!=='live'||next[k].lastCheckFailed);
 next.version=crypto.createHash('sha256').update(JSON.stringify([next.bls.data,next.dosm.data,next.onet.data,next.research.data])).digest('hex').slice(0,16);
 fs.writeFileSync(path,JSON.stringify(next));
 console.log('Evidence version:',next.version,'; failures:',next.sourceCheckFailures.join(', ')||'none');
})().catch(e=>{console.error('Update failed; previous snapshot retained:',e.message);process.exitCode=1;});
