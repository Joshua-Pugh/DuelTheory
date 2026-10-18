import type {AshenCardData} from '../ashenPresentation';
/** Rules-neutral manual tabletop. Explicit actions only; never reports rules-verified results. */
export type TabletopZone = {id:string;label:string;slots:number;faceDownDefault?:boolean};
export type GameDefinition = {schemaVersion:1;id:string;version:string;name:string;startingHand:number;healthLabel:string;startingHealth:number;zones:TabletopZone[];pileLabels?:Record<string,string>};
export type TabletopCard = {instanceId:string;cardId:string;name:string;image?:string;presentation?:AshenCardData;type:string;owner:0|1;controller:0|1;zone:string;faceDown:boolean;rotated:boolean;counters:number};
export type TabletopState = {schemaVersion:1;definition:GameDefinition;cards:Record<string,TabletopCard>;piles:Record<string,string[]>;health:[number,number];turn:number;active:0|1;events:string[];verified:false};
export type TabletopAction =
 | {type:'MOVE';instanceId:string;seat:0|1;zone:string;faceDown?:boolean}
 | {type:'DRAW';seat:0|1;count?:number}
 | {type:'ROTATE';instanceId:string}
 | {type:'FLIP';instanceId:string}
 | {type:'COUNTER';instanceId:string;delta:number}
 | {type:'HEALTH';seat:0|1;delta:number}
 | {type:'PASS_TURN'};
export const TABLETOP_KEY='dueltheory-creator-tabletop-v1';
export const GOAT_TABLETOP:GameDefinition={schemaVersion:1,id:'goat-manual',version:'1.0.0',name:'GOAT — Manual Playtest',startingHand:5,startingHealth:8000,healthLabel:'LP',zones:[{id:'monster',label:'Monster Zones',slots:5,faceDownDefault:true},{id:'spell',label:'Spell / Trap Zones',slots:5,faceDownDefault:true},{id:'field',label:'Field Spell',slots:1}]};
export const ASHEN_TABLETOP:GameDefinition={schemaVersion:1,id:'ashen-command-manual',version:'0.3.9',name:'Ashen Throne — Command Siege',startingHand:6,startingHealth:20,healthLabel:'Command HP',pileLabels:{graveyard:'Ossuary'},zones:[{id:'unit',label:'Frontline / Units',slots:7},{id:'support',label:'Runes / Relics',slots:5},{id:'ley',label:'Ley Fonts',slots:8},{id:'command',label:'Command Station',slots:1}]};
export function tabletopZoneLabel(definition:GameDefinition,zone:string){return definition.pileLabels?.[zone]||(definition.id===ASHEN_TABLETOP.id?ASHEN_TABLETOP.pileLabels?.[zone]:undefined)||zone;}
export type TabletopInput={cardId:string;name:string;type:string;image?:string;presentation?:AshenCardData};
export function createTabletop(definition:GameDefinition,decks:[TabletopInput[],TabletopInput[]]):TabletopState{
 const cards:Record<string,TabletopCard>={};const piles:Record<string,string[]>={};
 for(const seat of [0,1] as const){for(const zone of ['deck','hand','graveyard','banished',...definition.zones.map(z=>z.id)])piles[`${seat}:${zone}`]=[];
  decks[seat].forEach((input,index)=>{const instanceId=`${seat}-${index}`;cards[instanceId]={...input,instanceId,owner:seat,controller:seat,zone:'deck',faceDown:true,rotated:false,counters:0};piles[`${seat}:deck`].push(instanceId);});
  // Command Station is a separate object: it never enters the draw deck.
  if(definition.id==='ashen-command-manual'){const station=piles[`${seat}:deck`].find(id=>cards[id].type==='Command Station');if(station){piles[`${seat}:deck`].splice(piles[`${seat}:deck`].indexOf(station),1);piles[`${seat}:command`].push(station);cards[station].zone='command';cards[station].faceDown=false;}}
  // Stable dealing order for manual practice; automated simulations use their own seeded RNG.
  for(let i=0;i<definition.startingHand;i++){const id=piles[`${seat}:deck`].shift();if(!id)break;piles[`${seat}:hand`].push(id);cards[id].zone='hand';cards[id].faceDown=false;}
 }
 return {schemaVersion:1,definition:structuredClone(definition),cards,piles,health:[definition.startingHealth,definition.startingHealth],turn:1,active:0,events:['Manual playtest started. Actions are not rules validated.'],verified:false};
}
export function tabletopDispatch(state:TabletopState,action:TabletopAction):TabletopState{
 const s=structuredClone(state);const lines:string[]=[];
 const locate=(id:string)=>{const c=s.cards[id];if(!c)throw Error('Unknown card instance');return c;};
 if(action.type==='MOVE'){
  const c=locate(action.instanceId);const key=`${action.seat}:${action.zone}`;if(!s.piles[key])throw Error('Unknown destination zone');
  const definition=s.definition.zones.find(z=>z.id===action.zone);
  if(definition&&definition.slots>0&&s.piles[key].length>=definition.slots)throw Error(`${definition.label} is full`);
  const sourceKey=`${c.controller}:${c.zone}`;if(sourceKey===key)throw Error('Card is already in this zone');const list=s.piles[sourceKey];if(!list||!list.includes(c.instanceId))throw Error('Card not found in its source zone');
  list.splice(list.indexOf(c.instanceId),1);s.piles[key].push(c.instanceId);c.controller=action.seat;c.zone=action.zone;
  c.faceDown=action.faceDown??(definition?.faceDownDefault??action.zone==='deck');c.rotated=false;
  lines.push(`${c.name}: Player ${action.seat+1} ${tabletopZoneLabel(s.definition,action.zone)}${c.faceDown?' (face-down)':''}`);
 }else if(action.type==='DRAW'){
  const n=action.count??1;if(!Number.isInteger(n)||n<1||n>10)throw Error('Draw 1–10 cards at a time');
  const deck=s.piles[`${action.seat}:deck`],hand=s.piles[`${action.seat}:hand`];
  for(let i=0;i<n;i++){const id=deck.shift();if(!id)break;hand.push(id);s.cards[id].zone='hand';s.cards[id].faceDown=false;}
  lines.push(`Player ${action.seat+1} drew up to ${n} card(s)`);
 }else if(action.type==='ROTATE'){const c=locate(action.instanceId);c.rotated=!c.rotated;lines.push(`${c.name}: rotation toggled`);}
 else if(action.type==='FLIP'){const c=locate(action.instanceId);c.faceDown=!c.faceDown;lines.push(`${c.name}: flipped ${c.faceDown?'down':'up'}`);}
 else if(action.type==='COUNTER'){const c=locate(action.instanceId);c.counters=Math.max(0,Math.min(999,c.counters+action.delta));lines.push(`${c.name}: ${c.counters} counter(s)`);}
 else if(action.type==='HEALTH'){if(!Number.isFinite(action.delta)||Math.abs(action.delta)>100000)throw Error('Invalid health adjustment');s.health[action.seat]+=action.delta;lines.push(`Player ${action.seat+1}: ${s.health[action.seat]} ${s.definition.healthLabel}`);}
 else if(action.type==='PASS_TURN'){s.active=s.active===0?1:0;if(s.active===0)s.turn++;lines.push(`Turn ${s.turn}, Player ${s.active+1}`);}
 s.events.push(...lines);return s;
}
export function readSavedTabletop():TabletopState|null{try{const raw=localStorage.getItem(TABLETOP_KEY);if(!raw)return null;const s=JSON.parse(raw) as TabletopState;if(s.schemaVersion!==1||!s.definition?.id||!s.cards||!s.piles||!Array.isArray(s.health)||!Array.isArray(s.events))return null;return s;}catch{return null;}}
export function saveTabletop(s:TabletopState):boolean{try{localStorage.setItem(TABLETOP_KEY,JSON.stringify(s));return true;}catch{return false;}}
