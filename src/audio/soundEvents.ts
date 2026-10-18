import type {Card} from '../core/types';
import type {DuelState} from '../engine/model';
export type SoundEvent='draw'|'place'|'special'|'set'|'flip'|'spell'|'trap'|'attack'|'destroy'|'damage'|'turn'|'victory'|'defeat'|'chain'|'resolve';
export type SoundCue={event:SoundEvent;intensity?:number};
/** Baseline on mount/reconnect. Only an appended event history represents new play. */
export function duelSounds(before:DuelState|null,after:DuelState,viewer?:0|1,catalog:readonly Card[]=[]):SoundCue[]{
 if(!before||after.events.length<=before.events.length||before.events.some((e,i)=>e.type!==after.events[i]?.type||e.turn!==after.events[i]?.turn||e.seat!==after.events[i]?.seat))return [];
 const events=after.events.slice(before.events.length),cues:SoundCue[]=[];
 const add=(event:SoundEvent,intensity=1)=>{if(!cues.some(c=>c.event===event))cues.push({event,intensity});};
 for(const e of events){
  if(e.type==='DRAW'||e.type==='SEARCH')add('draw');
  if(['NORMAL_SUMMON','TRIBUTE_SUMMON'].includes(e.type))add(/set/i.test(e.message)?'set':'place');
  if(['SPECIAL_SUMMON','RITUAL_SUMMON','FUSION_SUMMON'].includes(e.type))add('special');
  if(e.type==='SET')add('set');
  if(e.type==='FLIP_SUMMON'||e.type==='BATTLE_FLIP')add('flip');
  if(e.type==='ATTACK_DECLARE')add('attack');
  if(e.type==='ACTIVATE'){
   const link=after.chain.at(-1),source=link&&after.cards[link.instanceId];
   // No inspection of private cards: the room supplies only public state here.
   add(source&&catalog.find(c=>c.id===source.cardId)?.type.includes('Trap')?'trap':'spell');
  }
 }
 if(after.chain.length>before.chain.length)add('chain',Math.min(after.chain.length,5));
 if(after.chain.length<before.chain.length)add('resolve');
 if(after.turn>before.turn)add('turn');
 const damage=Math.max(...after.players.map((p,i)=>before.players[i].lp-p.lp));if(damage>0)add('damage',Math.min(2,0.5+damage/2000));
 if(events.some(e=>e.type==='BATTLE'||/destroyed/i.test(e.message))&&Object.values(before.cards).some(c=>c.location==='monster'&&after.cards[c.instanceId]?.location==='graveyard'))add('destroy');
 if(before.winner===null&&after.winner!==null)add(viewer!==undefined&&after.winner!==viewer?'defeat':'victory');
 return cues;
}
