import type {Card} from '../core/types';
import type {DuelState,LegalAction,Seat} from '../engine/model';
import {dispatchDuel,legalActions} from '../engine/rules';
import {searchSequences} from '../framework/planning';
import {goatObservation,type Decision} from './policy';
type Pilot=(s:DuelState,a:readonly LegalAction[],seat:Seat,c:readonly Card[])=>Decision<LegalAction>|undefined;
const forced=new Set(['PASS_CHAIN','RESOLVE_CHAIN','PASS_ATTACK_RESPONSE','PASS_SUMMON_RESPONSE','PASS_SUMMON_NEGATION','PASS_FREE_RESPONSE','ADVANCE_DAMAGE_STEP']);
const tactical=new Set(['SPECIAL_SUMMON_CHAOS','ACTIVATE_DECK_EFFECT','ACTIVATE_BOOK_OF_MOON','ACTIVATE_MST','DECLARE_ATTACK','REPLAY_ATTACK','FLIP_SUMMON','NORMAL_SUMMON','CHANGE_POSITION','ACTIVATE_TRIGGER','ADVANCE']);
const unknown:Card={id:0,name:'Unknown card',type:'Normal Monster',attribute:'EARTH',race:'Unknown',level:4,atk:1600,def:1800,desc:''};
/** Planning model never receives opposing hidden identities OR either shuffled deck order.
 * Unknown defenses use the same neutral estimate as the baseline. Future draws stop search.
 * Responses use the visible opponent pilot; hidden interaction remains an explicit uncertainty.
 */
export function planningObservation(state:DuelState,seat:Seat){
 const s=goatObservation(state,seat);
 for(const p of s.players)for(const id of p.deck)s.cards[id].cardId=0;
 return s;
}
export function planChaosTurn(state:DuelState,legal:readonly LegalAction[],seat:Seat,catalog:readonly Card[],pilot:Pilot):Decision<LegalAction>|undefined{
 if(state.current!==seat||!['MAIN_1','BATTLE','MAIN_2'].includes(state.phase)||state.chain.length||state.pendingAttack||state.summonResponse||state.freeResponse||state.pendingTriggers?.length)return;
 if(!legal.some(a=>a.seat===seat&&(a.type==='DECLARE_ATTACK'||a.type==='SPECIAL_SUMMON_CHAOS'||a.type==='ACTIVATE_DECK_EFFECT'&&['SNATCH','CHAOS_BANISH','RAIGEKI_BREAK','BREAKER_DESTROY'].includes(a.effectId))))return;
 const ctx={cards:new Map([...catalog,unknown].map(c=>[c.id,c]))},opponent:Seat=seat===0?1:0;
 const initial=planningObservation(state,seat),startTurn=state.turn;
 const boundary=(s:DuelState)=>s.turn!==startTurn||s.winner!==null||!!s.drawnGame||s.pendingDraw||s.players.some(p=>p.hand.some(id=>s.cards[id].cardId===0)&&p===s.players[seat]);
 const evaluate=(s:DuelState)=>{
  if(s.drawnGame)return -10000;if(s.winner!==null)return s.winner===seat?100000:-100000;
  const value=(who:Seat)=>{const p=s.players[who];return p.hand.length*350+p.zones.monster.reduce((n,id)=>{if(!id)return n;const c=s.cards[id],card=ctx.cards.get(c.cardId)??unknown;return n+600+Math.max(Number(card.atk)||0,Number(card.def)||0)*.35;},0)+p.zones.spell.filter(Boolean).length*250;};
  // Support cards are resources/blockers, not free board value from weak ATK bodies.
  const own=s.players[seat],enemy=s.players[opponent],enemyMonsters=enemy.zones.monster.filter((id):id is string=>!!id);
  const resourceBonus=own.hand.filter(id=>s.cards[id].cardId===8131171).length*650;
  const exposure=own.zones.monster.reduce((n,id)=>{if(!id)return n;const c=s.cards[id];return n+([8131171,26202165].includes(c.cardId)&&c.position==='attack'?900:0);},0);
  const redundantSerpent=own.zones.monster.some(id=>id&&s.cards[id].cardId===8131171)&&(own.zones.monster.filter(Boolean).length>1||enemyMonsters.length===0)?500:0;
  return value(seat)-value(opponent)+(own.lp-enemy.lp)*.15+resourceBonus-exposure-redundantSerpent;
 };
 // Keep zone-equivalent actions from consuming the entire beam.
 const ranked=(s:DuelState,actions:readonly LegalAction[],who:Seat,count:number)=>{
  const remaining=[...actions],result:LegalAction[]=[],seen=new Set<string>();
  for(let attempts=0;remaining.length&&result.length<count&&attempts<64;attempts++){const pick=pilot(s,remaining,who,catalog)?.action;if(!pick)break;remaining.splice(remaining.indexOf(pick),1);const {description:_,...fields}=pick;const key=JSON.stringify({...fields,...('zone'in fields?{zone:0}:{}),...('monsterZone'in fields?{monsterZone:0}:{})});if(!seen.has(key)){seen.add(key);result.push(pick);}}
  return result;
 };
 const normalize=(s:DuelState)=>{
  for(let i=0;i<14&&!boundary(s);i++){
   const own=legalActions(s,ctx,seat),other=legalActions(s,ctx,opponent);
   // Stop at meaningful own choices; let the beam explore BLS extra attacks and targeting.
   const action=own.length&&own.every(a=>forced.has(a.type))?pilot(s,own,seat,catalog)?.action:!own.length?pilot(s,other,opponent,catalog)?.action:undefined;
   if(!action)break;
   // Never play a guessed opponent hand card. Only visible responses or passing are modeled.
   if(action.seat===opponent&&'instanceId'in action&&s.cards[action.instanceId]?.cardId===0)break;
   try{s=dispatchDuel(s,action,ctx);}catch{return undefined;}
  }
  return s;
 };
 const result=searchSequences(initial,{
  terminal:boundary,evaluate,
  actions:s=>{const options=legalActions(s,ctx,seat).filter(a=>tactical.has(a.type));const picks=ranked(s,options,seat,5);const advance=options.find(a=>a.type==='ADVANCE');if(advance&&!picks.includes(advance))picks.push(advance);return picks;},
  step:(s,a)=>{try{return normalize(dispatchDuel(s,a,ctx));}catch{return undefined;}}
 },{depth:5,width:3,nodes:64});
 if(!result||result.value<=evaluate(initial)+75)return;
 // Match back to an actual legal action, never dispatch a hypothetical action or state.
 const key=(a:LegalAction)=>JSON.stringify(Object.fromEntries(Object.entries(a).filter(([name])=>name!=='description').sort(([a],[b])=>a.localeCompare(b))));
 const action=legal.find(a=>key(a)===key(result.action));if(!action)return;
 return {action,reason:`Planned ${result.line.length}-action tactical line${result.value>=100000?' for lethal':''}; assumes unknown interaction may interrupt it.`};
}
