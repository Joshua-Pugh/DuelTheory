import type {Card} from './core/types';
import type {DuelState,Seat} from './engine/model';
/** Display only public identities, even when the local state contains both decks. */
export function effectTargets(state:DuelState,catalog:ReadonlyMap<number,Card>,viewer:Seat){
 const name=(id:string)=>{const c=state.cards[id];if(!c)return 'Unavailable card';if(c.controller!==viewer&&(c.faceDown||c.equippedHidden||['deck','hand','extra'].includes(c.location)))return `Player ${c.controller+1} · ${c.faceDown?'face-down card':'hidden card'}${c.zone!==undefined?` · ${c.location==='monster'?'Monster':'Spell / Trap'} zone ${c.zone+1}`:''}`;return catalog.get(c.cardId)?.name??'Card';};
 const scope:Record<string,string>={MIRROR_FORCE:'Destroys all opponent Attack Position monsters · does not target',TORRENTIAL:'Destroys all monsters · does not target',HEAVY_STORM:'Destroys all Spell / Trap cards · does not target',SMASHING:'Chooses a monster at resolution · does not target',BOTTOMLESS:'Banishes qualifying summoned monsters · does not target',SOLEMN_SUMMON:'Negates the summon · does not target',SOLEMN_CHAIN:'Negates the preceding Chain Link · does not target'};
 return state.chain.map((link,index)=>{const selected=['TURTLE_SUMMON','RAT_SUMMON','SANGAN_SEARCH','SPY_SUMMON','APPRENTICE_RECRUIT','TOMATO_SUMMON','SHINING_ANGEL_SUMMON','THUNDER_SEARCH','SEARCH_RITUAL'].includes(link.effectId);const ids=selected||['BOTTOMLESS','SOLEMN_SUMMON','SOLEMN_CHAIN'].includes(link.effectId)?[]:[...new Set([...link.targets,...(['MOBIUS','KYCOO_BANISH'].includes(link.effectId)?link.searchIds??[]:[])])];
  const targets=ids.map(id=>({id,name:name(id),location:state.cards[id]?.location}));const detail=targets.length?`Targets: ${targets.map(t=>t.name).join(', ')}`:selected?'Deck selection · no field target':scope[link.effectId]??'No selected card target';
  return {number:index+1,sourceId:link.instanceId,source:name(link.instanceId),targets,detail,label:`CL${index+1} · ${name(link.instanceId)} — ${detail}`};
 });
}
