import type {Card} from '../core/types';
import type {DuelState,LegalAction,Seat} from '../engine/model';
export {bestLegalAction,type Decision} from '../framework/decisions';
/** GOAT observation adapter. No hidden opponent identities or shuffle seed reach the policy. */
export function goatObservation(state:DuelState,seat:Seat):DuelState{
 const s=structuredClone(state);s.seed=0;s.events=s.events.map(e=>({...e,message:''}));
 for(const c of Object.values(s.cards))if(c.controller!==seat&&(c.location==='hand'&&s.pendingChaos?.controller!==seat||c.location==='deck'||c.location==='extra'||c.faceDown||c.equippedHidden))c.cardId=0;
 for(const p of s.players)p.deck.sort();
 return s;
}
/** Idle opponent-turn free actions do not grant a bot an unsolicited decision loop. */
export function hasDecision(state:DuelState,seat:Seat,actions:readonly LegalAction[]){
 if(!actions.length||state.winner!==null||state.drawnGame)return false;
 return state.current===seat||Boolean(state.chain.length||state.pendingAttack||state.summonResponse||state.freeResponse||state.pendingTriggers?.length||state.pendingSearch||state.pendingDiscard||state.pendingChaos||state.pendingLightChoice||state.pendingRandomDiscard||state.pendingDeckChoice||state.pendingRoll||state.pendingRitual);
}

/** Human presentation uses the same redaction boundary while retaining public history. */
export function goatPlayerView(state:DuelState,seat:Seat,catalog:readonly Card[]):DuelState{
 const view=goatObservation(state,seat),names=new Map(catalog.map(c=>[c.id,c.name]));
 const hiddenNames=[...new Set(Object.values(state.cards).filter(c=>c.cardId!==0&&view.cards[c.instanceId].cardId===0).map(c=>names.get(c.cardId)).filter((name):name is string=>!!name))];
 view.events=state.events.map(e=>({...e,message:e.seat!==seat&&(e.type==='SET'||e.type==='NORMAL_SUMMON'&&e.message.includes(' set ')||e.type==='TRIBUTE_SUMMON'&&/set/i.test(e.message))?hiddenNames.reduce((text,name)=>text.split(name).join('a hidden card'),e.message):e.message}));
 return view;
}
