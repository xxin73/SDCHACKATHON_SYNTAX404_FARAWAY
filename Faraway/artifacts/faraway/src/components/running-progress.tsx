import { motion, useReducedMotion } from 'framer-motion';
export function RunningProgress({percent}:{percent:number}){
 const reduced=useReducedMotion();const value=Math.max(0,Math.min(100,percent));
 const cycle={repeat:Infinity,duration:.65};
 return <div className="relative pt-9" role="progressbar" aria-label="Learning progress" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
  <motion.span aria-hidden className="absolute top-0" animate={{left:`${value}%`}} transition={{duration:reduced?0:.7}} style={{marginLeft:-14}}>
   <motion.svg width="28" height="30" viewBox="0 0 28 30" fill="none" stroke="#7c3aed" strokeWidth="2.3" strokeLinecap="round" animate={reduced?{}:{y:[0,-2,0]}} transition={cycle}>
    <circle cx="17" cy="4" r="2.4" fill="#ddd6fe"/>
    <path d="M15 9 L12 18"/>
    <motion.path d="M15 10 L19 14 L23 11" style={{transformOrigin:'15px 10px'}} animate={reduced?{}:{rotate:[-20,25,-20]}} transition={cycle}/>
    <motion.path d="M15 10 L9 11 L7 7" style={{transformOrigin:'15px 10px'}} animate={reduced?{}:{rotate:[25,-20,25]}} transition={cycle}/>
    <motion.path d="M12 18 L18 22 L16 28" style={{transformOrigin:'12px 18px'}} animate={reduced?{}:{rotate:[-25,25,-25]}} transition={cycle}/>
    <motion.path d="M12 18 L8 24 L3 23" style={{transformOrigin:'12px 18px'}} animate={reduced?{}:{rotate:[25,-25,25]}} transition={cycle}/>
   </motion.svg>
  </motion.span>
  <div className="h-3 overflow-hidden rounded-full bg-violet-100"><div className="spectrum-bar h-full rounded-full transition-all" style={{width:value+'%'}}/></div>
 </div>;
}
