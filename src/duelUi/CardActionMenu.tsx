import {useEffect,useRef,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import './duelControls.css';
export type CardMenuAction={id:string;label:string;disabled?:boolean;reason?:string;run:()=>void};
export default function CardActionMenu({title,actions,onClose,details}:{title:string;actions:CardMenuAction[];onClose:()=>void;details?:ReactNode}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const dialog=ref.current;if(dialog&&!dialog.open)dialog.showModal();return()=>dialog?.close();},[]);
 if(typeof document==='undefined')return null;
 return createPortal(<dialog ref={ref} className="dt-action-dialog" aria-label={`Actions for ${title}`} onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}><header><strong>{title}</strong><button autoFocus aria-label="Close card actions" onClick={onClose}>Close ✕</button></header><div>{details}{actions.map(action=><button key={action.id} disabled={action.disabled} title={action.reason} onClick={()=>{onClose();action.run();}}><span>{action.label}</span>{action.reason&&<small>{action.reason}</small>}</button>)}{!actions.some(a=>a.id!=='view'&&!a.disabled)&&<p>No playable action in the current window.</p>}</div></dialog>,document.body);
}
