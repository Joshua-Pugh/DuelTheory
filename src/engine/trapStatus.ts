import type {DuelState} from './model';
export const jinzo=(s:DuelState)=>Object.values(s.cards).some(c=>c.location==='monster'&&!c.faceDown&&c.cardId===77585513);
/** The first resolved Decree suppresses later Decrees until it leaves or is negated. */
export function decreeNegated(s:DuelState,id:string){const first=Object.values(s.cards).filter(c=>c.location==='spell'&&!c.faceDown&&c.cardId===51452091&&c.decreeActive!==undefined).sort((a,b)=>a.decreeActive!-b.decreeActive!)[0];return !!first&&first.instanceId!==id;}

export const trapNegated=(s:DuelState,id:string)=>jinzo(s)||decreeNegated(s,id);
