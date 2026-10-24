import {useEffect,useState} from 'react';
import {roomInvite} from './table/client';
import {inviteQrSvg} from './table/inviteQr';
export default function HostTableQr({hostId,playerId,code}:{hostId:string;playerId:string;code:string}){
 const [open,setOpen]=useState(false),[svg,setSvg]=useState(''),[error,setError]=useState('');
 useEffect(()=>{if(!open||hostId!==playerId)return;let cancelled=false;setError('');void inviteQrSvg(roomInvite(code)).then(image=>{if(!cancelled)setSvg(image);}).catch(()=>{if(!cancelled)setError('QR generation failed. Use the invite link or room code instead.');});return()=>{cancelled=true;};},[open,code,hostId,playerId]);
 if(hostId!==playerId)return null;
 return <section className="ct-host-qr"><button aria-expanded={open} onClick={()=>setOpen(!open)}>{open?'Hide QR invite':'Show QR invite'}</button>{open&&<div className="ct-qr-card"><strong>Scan to join this table</strong>{svg?<img width={288} height={288} src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`} alt={`QR invite for table ${code}`}/>:!error&&<p role="status">Generating QR invite…</p>}<p>Other players scan with their phone camera, then enter their name and join. This code opens the room invite; it does not grant your host seat.</p><small>{code}</small>{error&&<p role="alert">{error}</p>}</div>}</section>;
}
