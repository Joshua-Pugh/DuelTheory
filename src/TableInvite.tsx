import {useEffect,useState} from 'react';
import {roomInvite} from './table/client';
import {inviteQrSvg} from './table/inviteQr';
export default function TableInvite({code,copy,leave,host,practice=false}:{code:string;copy:()=>void;leave:()=>void;host:boolean;practice?:boolean}){
 const [svg,setSvg]=useState('');
 useEffect(()=>{if(practice)return;let active=true;void inviteQrSvg(roomInvite(code)).then(s=>{if(active)setSvg(s);}).catch(()=>{});return()=>{active=false;};},[code,practice]);
 return <section className="ct-invite-panel" aria-label="Table invitation"><strong>{practice?'Practice invitation · no public room':'Scan to join'}</strong>{svg&&<img width="160" height="160" src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`} alt={`QR invite for table ${code}`}/>}<strong className="ct-room-code">{code}</strong>{!practice&&<><a className="ct-invite-link" href={roomInvite(code)}>{roomInvite(code)}</a><button onClick={copy}>Copy invite link</button></>}<button onClick={leave}>{practice?'Exit practice':host?'Close table & leave':'Leave table'}</button></section>;
}
