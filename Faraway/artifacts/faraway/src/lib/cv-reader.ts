import type { Profile } from './store';
export type CvResult = Pick<Profile,'name'|'email'|'location'|'summary'|'highest'|'years'|'roles'|'ug'|'pg'|'phd'> & {skills:{name:string;level:number}[];suggestedStream:string;missing:string[]};
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
export function parseCvText(text:string,knownSkills:string[],current:Profile):CvResult {
  if(text.trim().length<5)throw new Error('No readable text found. Try a clearer image, an unlocked PDF, or enter your details manually.');
  const lines=text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  const name=lines.find(s=>s.length>=3&&s.length<80&&!/@|https?:|curriculum|resume|\bcv\b|\d{5}/i.test(s))??'';
  return {name,email:text.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/)?.[0]??'',location:'',summary:'',highest:current.highest,years:current.years,roles:current.roles,ug:current.ug,pg:current.pg,phd:current.phd,skills:knownSkills.filter(s=>new RegExp(`(^|[^a-z])${s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}([^a-z]|$)`,'i').test(text)).map(name=>({name,level:0})),suggestedStream:'',missing:['location','experience responsibilities','education','summary','skill ratings: detected keywords need your assessment']};
}
