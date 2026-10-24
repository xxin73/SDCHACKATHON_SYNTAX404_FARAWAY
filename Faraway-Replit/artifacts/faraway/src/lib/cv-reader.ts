import type { Profile } from './store';
export type CvResult = Pick<Profile,'name'|'email'|'location'|'summary'|'highest'|'years'|'roles'|'ug'|'pg'|'phd'> & {skills:{name:string;level:number}[];suggestedStream:string;missing:string[];educationText?:string;experienceText?:string};
export async function readCvText(input:{fileName:string;contentBase64:string}):Promise<string>{
  const ext=input.fileName.split('.').pop()?.toLowerCase();
  if(!['txt','pdf','png','jpg','jpeg'].includes(ext??''))throw new Error('Choose a PDF, TXT, PNG, JPG or JPEG CV.');
  const bytes=Uint8Array.from(atob(input.contentBase64),c=>c.charCodeAt(0));
  if(bytes.length>8*1024*1024)throw new Error('Choose a CV under 8 MB.');
  if(ext==='txt')return new TextDecoder().decode(bytes);
  const recognize=async(image:HTMLCanvasElement|string)=>{
    const {createWorker}=await import('tesseract.js');
    const worker=await createWorker('eng');
    try {const result=await worker.recognize(image);return result.data.text;}finally{await worker.terminate();}
  };
  if(ext!=='pdf')return recognize(`data:image/${ext==='png'?'png':'jpeg'};base64,${input.contentBase64}`);
  const pdfjs=await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc=new URL('pdfjs-dist/build/pdf.worker.min.mjs',import.meta.url).href;
  const loading=pdfjs.getDocument({data:bytes});
  const doc=await loading.promise;
  try {
    if(doc.numPages>10)throw new Error('Choose a CV with 10 pages or fewer.');
    const text:string[]=[];
    for(let n=1;n<=doc.numPages;n++){
      const page=await doc.getPage(n);const content=await page.getTextContent();
      const extracted=content.items.map(item=>'str' in item?item.str+('hasEOL' in item&&item.hasEOL?'\n':' '):'').join('');
      if(extracted.trim().length>30)text.push(extracted);
      else {const viewport=page.getViewport({scale:1.5});const canvas=document.createElement('canvas');canvas.width=viewport.width;canvas.height=viewport.height;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Cannot read scanned PDF in this browser.');await page.render({canvas,canvasContext:ctx,viewport}).promise;text.push(await recognize(canvas));canvas.width=canvas.height=0;}
    }
    return text.join('\n');
  } finally {await loading.destroy();}
}

export function detectSkills(text:string, knownSkills:string[]):string[] {
  const aliases:Record<string,string[]>={SQL:['sql','mysql','postgresql','sqlite'], 'C++':['c++','cpp'], 'Web Development':['website','web development','web application','web app'], JavaScript:['javascript','js'], 'Data Visualisation':['data visualization','data visualisation'], 'Git & DevOps':['git','devops']};
  const candidates=Array.from(new Set([...knownSkills,'C++','Web Development','HTML','CSS']));
  return candidates.filter(skill=>(aliases[skill]??[skill]).some(alias=>new RegExp('(^|[^a-z0-9])'+alias.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?=$|[^a-z0-9])','i').test(text)));
}
export function parseCvText(text:string,knownSkills:string[],_current?:Profile):CvResult {
  if(text.trim().length<5)throw new Error('No readable text found. Try a clearer image, an unlocked PDF, or enter your details manually.');
  const lines=text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  const named=lines.find(s=>/^(?:full\s+)?name\s*:/i.test(s))?.replace(/^(?:full\s+)?name\s*:\s*/i,'');
  const name=named??lines.slice(0,8).find(s=>/^[\p{L}][\p{L} .'’-]{2,69}$/u.test(s)&&s.split(/\s+/).length>=2&&!/student|engineer|developer|analyst|manager|assistant|education|experience|skills|profile|summary|curriculum|resume|university|college|bachelor|master|contact|address|malaysia/i.test(s))??'';
  const location=lines.find(s=>/^(?:location|address|based in)\s*:/i.test(s))?.replace(/^[^:]+:\s*/,'')??lines.find(s=>/\b(?:Johor|Selangor|Kuala Lumpur|Penang|Perak|Sabah|Sarawak|Melaka|Negeri Sembilan|Pahang|Kedah|Perlis|Kelantan|Terengganu|Putrajaya|Sepang|Batu Pahat)\b/i.test(s)&&!/@|university|college|school|sdn|bhd/i.test(s))??'';
  const section=(heading:RegExp)=>{const start=lines.findIndex(l=>heading.test(l));if(start<0)return '';const end=lines.findIndex((l,i)=>i>start&&/^(education|(?:work |professional )?experience|skills|projects|references|certifications|summary|profile|interests)\s*:?$/i.test(l));return lines.slice(start+1,end<0?undefined:end).join('\n');};
  const education=section(/^education\s*:?$/i)||lines.filter(l=>/bachelor|master|ph\.?d|a.level|stpm|foundation|igcse|\bspm\b|diploma/i.test(l)).join('\n');
  const highest:Profile['highest']=/ph\.?d|doctorate/i.test(education)?'PhD':/master/i.test(education)?'Masters':/bachelor|degree/i.test(education)?'Degree':/diploma/i.test(education)?'Diploma':/a.level|stpm|foundation|pre.u/i.test(education)?'Pre-U':/igcse|\bspm\b|secondary/i.test(education)?'Secondary':'';
  const experience=section(/^(?:work |professional |employment )?experience\s*:?$/i);
  const summary=section(/^(?:professional )?(?:summary|profile|objective)\s*:?$/i);
  const empty=()=>({field:'',institution:'',year:''});
  return {name,email:text.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/)?.[0]??'',location,summary,highest,years:0,roles:[],ug:empty(),pg:empty(),phd:empty(),skills:detectSkills(text,knownSkills).map(name=>({name,level:0})),suggestedStream:'',missing:[...(!name?['name']:[]),...(!location?['location']:[]),...(!education?['education']:[]),...(!experience?['experience']:[])],educationText:education,experienceText:experience};
}
