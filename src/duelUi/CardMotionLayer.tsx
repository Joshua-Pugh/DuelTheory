import type {CSSProperties,ReactNode} from 'react';
import './cardMotion.css';
export type MotionRect={x:number;y:number;width:number;height:number};
export type CardMotion=MotionRect&{key:string;dx:number;dy:number;delay?:number;content:ReactNode};
export function motionBetween(from:MotionRect,to:MotionRect){return {...from,dx:to.x-from.x,dy:to.y-from.y};}
/** Display only: no timers or animation completion callbacks can advance game state. */
export default function CardMotionLayer({flights,children}:{flights:CardMotion[];children?:ReactNode}){
 return <div className="dt-card-motion-layer" aria-hidden="true">{children}{flights.map(f=><div className="dt-card-motion" key={f.key} style={{left:f.x,top:f.y,width:f.width,height:f.height,animationDelay:`${f.delay||0}ms`,'--motion-x':`${f.dx}px`,'--motion-y':`${f.dy}px`} as CSSProperties}>{f.content}</div>)}</div>;
}
