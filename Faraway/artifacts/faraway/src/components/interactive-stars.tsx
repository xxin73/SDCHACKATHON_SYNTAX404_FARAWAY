import {useEffect,useRef} from 'react';
import {useReducedMotion} from 'framer-motion';

/** Transparent twinkling stars with pointer-driven depth; never captures clicks. */
export function InteractiveStars(){
 const canvas=useRef<HTMLCanvasElement>(null);const reduce=useReducedMotion();
 useEffect(()=>{
  const el=canvas.current,ctx=el?.getContext('2d');if(!el||!ctx)return;
  let frame=0,w=0,h=0,x=0,y=0,tx=0,ty=0;
  const stars=Array.from({length:58},(_,i)=>({x:((i*137.508)%100)/100,y:((i*73.37)%100)/100,depth:.3+(i%7)/9,size:1+(i%3)*.55,phase:i*1.7,hue:[190,240,275,320,40][i%5]}));
  const resize=()=>{w=innerWidth;h=innerHeight;const dpr=Math.min(devicePixelRatio||1,2);el.width=w*dpr;el.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);if(reduce)draw(0);};
  const move=(e:PointerEvent)=>{tx=(e.clientX/w-.5)*38;ty=(e.clientY/h-.5)*30;};
  const leave=()=>{tx=0;ty=0;};
  function draw(time:number){if(!el||!ctx)return;ctx.clearRect(0,0,w,h);x+=(tx-x)*.055;y+=(ty-y)*.055;
   for(const star of stars){const px=star.x*w+x*star.depth,py=star.y*h+y*star.depth;const twinkle=reduce?.6:.3+(.5+.5*Math.sin(time*.0016+star.phase))*.65;const size=star.size*(1+twinkle*.5);ctx.strokeStyle=`hsla(${star.hue},80%,65%,${twinkle})`;ctx.lineWidth=.8;ctx.shadowColor=`hsla(${star.hue},90%,70%,.7)`;ctx.shadowBlur=7;ctx.beginPath();ctx.moveTo(px-size*3,py);ctx.lineTo(px+size*3,py);ctx.moveTo(px,py-size*3);ctx.lineTo(px,py+size*3);ctx.stroke();ctx.shadowBlur=0;}
   if(!reduce&&!document.hidden)frame=requestAnimationFrame(draw);
  }
  const visible=()=>{cancelAnimationFrame(frame);if(!document.hidden)draw(performance.now());};
  resize();if(!reduce)frame=requestAnimationFrame(draw);
  window.addEventListener('resize',resize);window.addEventListener('pointermove',move,{passive:true});document.addEventListener('pointerleave',leave);document.addEventListener('visibilitychange',visible);
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('resize',resize);window.removeEventListener('pointermove',move);document.removeEventListener('pointerleave',leave);document.removeEventListener('visibilitychange',visible);};
 },[reduce]);
 return <canvas ref={canvas} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[1] h-full w-full"/>;
}
