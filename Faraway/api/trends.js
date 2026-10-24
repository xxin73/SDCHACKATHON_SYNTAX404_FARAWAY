// Public, read-only source gateway. No model calls, credentials, user data or arbitrary URLs.
const BLS='https://www.bls.gov/emp/tables/occupational-projections-and-characteristics.htm';
const DOSM='https://storage.dosm.gov.my/labour/lfs_month.csv';
const ONET='https://www.onetcenter.org/db_releases.html';
const ARXIV='https://export.arxiv.org/api/query?search_query=cat%3Acs.AI&start=0&max_results=20&sortBy=submittedDate&sortOrder=descending';
const clean=s=>s.replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&#8211;|&ndash;/g,'–').replace(/&#\d+;/g,' ').replace(/\s+/g,' ').trim();
function parseBls(html){
 const headers=[...html.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi)].map(m=>clean(m[1]));
 const years=headers.map(h=>h.match(/^Employment,?\s+(20\d{2})$/i)?.[1]).filter(Boolean);
 if(years.length!==2||+years[1]<=+years[0])throw Error('BLS table period could not be verified');
 const occupations={};
 for(const m of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)){
  const cells=[...m[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(v=>clean(v[1]));
  const i=cells.findIndex(v=>/^\d{2}-\d{4}$/.test(v));if(i<1||cells[i+1]!=='Line item')continue;
  const first=Number(cells[i+2].replaceAll(',','')),second=Number(cells[i+3].replaceAll(',',''));
  if(!Number.isFinite(first)||first<=0||!Number.isFinite(second)||second<0)continue;
  occupations[cells[i]]={title:cells[i-1],first,second};
 }
 if(Object.keys(occupations).length<500)throw Error('Incomplete BLS table');
 return {baseYear:+years[0],futureYear:+years[1],occupations};
}
function parsePapers(xml){
 const tag=(s,k)=>clean(s.match(new RegExp(`<${k}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${k}>`))?.[1]??'');
 const papers=[...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(m=>({title:tag(m[1],'title'),url:tag(m[1],'id').replace('http:','https:'),publishedAt:tag(m[1],'published').slice(0,10)})).filter(p=>p.title&&/^https:\/\/arxiv.org\/abs\//.test(p.url)&&/^20\d{2}-\d{2}-\d{2}$/.test(p.publishedAt));
 if(!papers.length)throw Error('Research feed has no valid dated entries');return papers;
}
let cached;let inflight;
async function read(url,parse){try{const response=await fetch(url,{signal:AbortSignal.timeout(9000),headers:{'user-agent':'Faraway/1.0 (public workforce research; read-only)','accept':'text/html,application/atom+xml,application/json'}});if(!response.ok)throw Error('Source unavailable');const body=await response.text();if(body.length>6_000_000)throw Error('Source too large');return {status:'live',url,data:parse(body)};}catch{return {status:'unavailable',url,data:null};}}
async function collect(){const checkedAt=new Date().toISOString();const [bls,dosm,onet,research]=await Promise.all([
 read(BLS,parseBls),read(DOSM,s=>{const lines=s.trim().split(/\r?\n/),keys=lines.shift().split(',');const rows=lines.map(line=>Object.fromEntries(line.split(',').map((v,i)=>[keys[i],keys[i]==='date'?v:Number(v)])));if(!rows.length)throw Error();const r=rows.filter(x=>/^20\d{2}-\d{2}-\d{2}$/.test(x.date)&&['u_rate','p_rate','lf_employed'].every(k=>Number.isFinite(x[k]))).sort((a,b)=>b.date.localeCompare(a.date))[0];if(!r)throw Error();return {period:r.date,unemployment:r.u_rate,participation:r.p_rate,employedThousands:r.lf_employed};}),
 read(ONET,s=>{const m=s.match(/O\*NET(?:®|&reg;|\s|<[^>]*>)*\s*(\d{2}\.\d)\s*(?:<[^>]*>|\s)*([A-Z][a-z]+\s+20\d{2})/);if(!m)throw Error();return {version:m[1],released:m[2]};}),read(ARXIV,parsePapers)
 ]);for(const source of [bls,dosm,onet,research])if(source.status==='live')source.lastSuccessAt=checkedAt;return {schemaVersion:1,checkedAt,bls,dosm,onet,research};}
async function handler(req,res){if(req.method!=='GET')return res.status(405).json({error:'Use GET'});const age=cached?Date.now()-Date.parse(cached.checkedAt):Infinity;if(age>3600_000){inflight??=collect().then(x=>(cached=x)).finally(()=>{inflight=undefined;});await inflight;}res.setHeader('Cache-Control','public, s-maxage=3600, stale-while-revalidate=86400');res.setHeader('X-Content-Type-Options','nosniff');return res.status(200).json(cached);}

module.exports=handler;module.exports.parseBls=parseBls;module.exports.parsePapers=parsePapers;module.exports.collect=collect;
