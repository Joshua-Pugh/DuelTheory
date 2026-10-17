import type {AshenDuel} from './games/ashen/duel';
import type {EffectContinuation,EffectEvent,EffectStackEntry} from './framework';
import {ASHEN_TABLETOP,createTabletop,tabletopDispatch,type TabletopAction,type TabletopState,type TabletopInput} from './services/CreatorTabletop';
import {ashenCardMap,starterDeck} from './ashenDecks';
import {RESOURCES,type Resource} from './ashenPresentation';
export type Basin=Record<Resource,number>;
export type AshenWork={events:EffectEvent[];triggers:EffectStackEntry[];budget:number};
export type AshenRulesState={duel?:AshenDuel;attachments?:Record<string,string>;pending?:{flow:EffectContinuation;label:string;work?:AshenWork};shuffleSeed?:number;turn:number;fontPlayed:[boolean,boolean];damage:Record<string,number>;modifiers:{id:string;stats:Record<string,number>;keywords:string[];duration:'turn'|'permanent'}[];serial:number;triggerUses?:Record<string,number>;counters?:Record<string,Record<string,number>>};
export const emptyAshenRules=():AshenRulesState=>({turn:1,fontPlayed:[false,false],damage:{},modifiers:[],serial:0});
export type Battlefield={version:1;table:TabletopState;basins:[Basin,Basin];preview:boolean;rules?:AshenRulesState};
export const BATTLEFIELD_KEY='dueltheory-ashen-battlefield-v1';
export const emptyBasin=():Basin=>({untuned:0,oath:0,fury:0,ash:0,veil:0});
export function fontEssence(cardId:string):Resource{
 const type=(ashenCardMap.get(cardId)?.subtype||'').toLowerCase();
 return RESOURCES.find(r=>type.includes(r))||'untuned';
}
function deckFor(seat:0|1,random:()=>number,mirror=false):TabletopInput[]{
 const deck=starterDeck(seat===0||mirror?'Brute':'Noble');
 const ids=deck.entries.flatMap(e=>Array.from({length:e.count},()=>e.cardId));
 for(let i=ids.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}
 ids.push(deck.commandStationId);
 return ids.map(id=>{const c=ashenCardMap.get(id);if(!c)throw Error(`Missing Ashen card ${id}`);return {cardId:id,name:c.name,type:c.type};});
}
export function newBattlefield(preview=false,random:()=>number=Math.random,mirror=false):Battlefield{
 // Zero slots means unlimited in this definition; creator saves are separate.
 const definition={...ASHEN_TABLETOP,zones:ASHEN_TABLETOP.zones.map(z=>({...z,slots:z.id==='command'?1:0}))};
 let table=createTabletop(definition,[deckFor(0,random,mirror),deckFor(1,random,mirror)]);
 if(preview)for(const seat of [0,1] as const){
  for(const [type,zone,count] of [['Unit','unit',3],['Ley Font','ley',3],['Relic','support',1],['Rune','support',1]] as const){
   const ids=table.piles[`${seat}:deck`].filter(id=>table.cards[id].type===type).slice(0,count);
   for(const id of ids)table=tabletopDispatch(table,{type:'MOVE',instanceId:id,seat,zone});
  }
 }
 table.events=[preview?'Populated layout preview. Cards placed for demonstration; effects and costs are not resolved.':'Manual Ashen Throne playtest started. Resolve card effects and costs yourself.'];
 return {version:1,table,basins:[emptyBasin(),emptyBasin()],preview,rules:{...emptyAshenRules(),shuffleSeed:Math.floor(random()*4294967296)>>>0}};
}
export type BattlefieldAction=TabletopAction|{type:'BURN';instanceId:string}|{type:'ESSENCE';seat:0|1;resource:Resource;delta:number}|{type:'END_TURN'}|{type:'NAMED_COUNTER';instanceId:string;counter:string;delta:number};
export function battlefieldDispatch(state:Battlefield,action:BattlefieldAction):Battlefield{
 if(state.rules?.pending)throw Error('Finish the pending effect choice before taking another action.');
 const next=structuredClone(state);
 if(action.type==='NAMED_COUNTER'){
  if(!next.table.cards[action.instanceId]||!['momentum','fury'].includes(action.counter)||!Number.isInteger(action.delta)||Math.abs(action.delta)>99)throw Error('Invalid named counter adjustment.');
  next.rules??=emptyAshenRules();next.rules.counters??={};next.rules.counters[action.instanceId]??={};const counters=next.rules.counters[action.instanceId],count=(counters[action.counter]||0)+action.delta;
  if(count<0||count>999)throw Error('Invalid counter balance.');counters[action.counter]=count;next.table.events.push(`Manual: ${next.table.cards[action.instanceId].name} ${action.delta>0?'+':''}${action.delta} ${action.counter} counter.`);
 }else if(action.type==='BURN'){
  const card=next.table.cards[action.instanceId];
  if(!card||card.zone!=='ley'||card.type!=='Ley Font')throw Error('Select a Ley Font on the battlefield.');
  if(card.faceDown||card.rotated)throw Error('This font is already spent. Ready it before burning.');
  const resource=fontEssence(card.cardId);
  next.table=tabletopDispatch(next.table,{type:'FLIP',instanceId:card.instanceId});
  next.basins[card.controller][resource]++;
  next.table.events.push(`${card.name} burned: Player ${card.controller+1} gains 1 ${resource} essence. Resolve additional font effects manually.`);
 }else if(action.type==='ESSENCE'){
  if(!RESOURCES.includes(action.resource)||!Number.isInteger(action.delta)||Math.abs(action.delta)>99)throw Error('Invalid essence adjustment.');
  const count=next.basins[action.seat][action.resource]+action.delta;
  if(count<0||count>999)throw Error('Not enough essence, or basin limit reached.');
  next.basins[action.seat][action.resource]=count;
  next.table.events.push(`Player ${action.seat+1}: ${action.delta>0?'+':''}${action.delta} ${action.resource} essence (manual adjustment).`);
 }else if(action.type==='END_TURN'){
  if(next.rules){next.rules.turn++;next.rules.fontPlayed=[false,false];next.rules.damage={};next.rules.modifiers=next.rules.modifiers.filter(m=>m.duration==='permanent');next.rules.triggerUses={};}
  next.basins=[emptyBasin(),emptyBasin()];
  next.table=tabletopDispatch(next.table,{type:'PASS_TURN'});
  for(const id of next.table.piles[`${next.table.active}:ley`]){next.table.cards[id].faceDown=false;next.table.cards[id].rotated=false;}
  next.table.events.push('Unused essence fades. Incoming player’s Ley Fonts readied. Draw and other start/end effects are manual.');
 }else next.table=tabletopDispatch(next.table,action);
 return next;
}
export function readBattlefield():Battlefield|null{
 try{
  const saved=JSON.parse(localStorage.getItem(BATTLEFIELD_KEY)||'null') as Battlefield|null;
  if(!saved||saved.version!==1||saved.table?.definition?.id!==ASHEN_TABLETOP.id||!saved.table.cards||!saved.table.piles||!Array.isArray(saved.table.events)||!Array.isArray(saved.table.health)||saved.table.health.length!==2||!Array.isArray(saved.basins)||saved.basins.length!==2)return null;
  for(const seat of [0,1])for(const zone of ['deck','hand','graveyard','banished','unit','ley','support','command'])if(!Array.isArray(saved.table.piles[`${seat}:${zone}`])||saved.table.piles[`${seat}:${zone}`].some(id=>!saved.table.cards[id]))return null;
  if(saved.basins.some(b=>RESOURCES.some(r=>!Number.isInteger(b[r])||b[r]<0||b[r]>999)))return null;
  return saved;
 }catch{return null;}
}
