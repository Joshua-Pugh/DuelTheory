import type {DuelState,LegalAction,Seat} from './engine/model';

export const actionSource=(a:LegalAction):string|undefined=>'instanceId' in a?a.instanceId:'sourceId' in a?a.sourceId:'attackerId' in a?a.attackerId:undefined;
export function actionLabel(a:LegalAction):string {
 switch(a.type){
  case 'NORMAL_SUMMON':return a.position==='faceDownDefense'?'Set monster':'Normal Summon';
  case 'TRIBUTE_SUMMON':return a.position==='faceDownDefense'?'Tribute Set':'Tribute Summon';
  case 'SET_SPELL_TRAP':return 'Set';
  case 'FLIP_SUMMON':return 'Flip Summon';
  case 'CHANGE_POSITION':return a.position==='attack'?'Change to Attack':'Change to Defense';
  case 'DECLARE_ATTACK':return a.targetId?'Attack…':'Direct attack';
  case 'ACTIVATE_DECK_EFFECT':return a.effectId==='ZORC_ROLL'?'Activate · roll a die':'Activate effect…';
  case 'SPECIAL_SUMMON_CHAOS':return `Special Summon · ${a.position==='attack'?'ATK':'DEF'}`;
  case 'BEGIN_RITUAL':return 'Activate · Ritual Summon';
  case 'ACTIVATE_CONTRACT':return 'Activate · Ritual Summon';
  case 'ACTIVATE_THUNDER_DRAGON':return 'Discard & search deck…';
  case 'TRIGGER_SEARCH':return 'Activate · search deck…';
  case 'ACTIVATE_TRIGGER':return a.monsterZone!==undefined?'Activate · Special Summon…':'Activate effect…';
  case 'DECLINE_PENDING_TRIGGER':return 'Decline effect';
  case 'ACTIVATE_GRACEFUL_CHARITY':case 'ACTIVATE_POT_OF_GREED':case 'ACTIVATE_MST':case 'ACTIVATE_BOOK_OF_MOON':case 'ACTIVATE_ATTACK_TRAP':return 'Activate';
  default:return a.description;
 }
}
export function cardActionGroups(actions:LegalAction[],id:string){
 const groups=new Map<string,{label:string;options:LegalAction[]}>();
 for(const action of actions.filter(a=>actionSource(a)===id&&!(a.type==='ACTIVATE_CONTRACT'&&actions.some(x=>x.type==='BEGIN_RITUAL'&&x.instanceId===id)))){
  const label=actionLabel(action),key=`${action.type}:${label}`;
  if(!groups.has(key))groups.set(key,{label,options:[]});
  groups.get(key)!.options.push(action);
 }
 return [...groups.values()];
}
export type ChoiceField='costId'|'declaredType'|'discardIds'|'ritualId'|'materials'|'searchIds'|'searchId'|'choiceId'|'targetId'|'monsterZone'|'zone';
export type ChoiceStep={field:ChoiceField;title:string;kind:'cards'|'target'|'zone'|'option';ids:string[];sets:string[][];multiple:boolean;owner:Seat;zoneKind?:'monster'|'spell';zones?:number[];deck:boolean};
export const actionValue=(a:LegalAction,field:ChoiceField):unknown=>(a as unknown as Record<string,unknown>)[field];
const spellActivation=(a:LegalAction)=>(a.type.startsWith('ACTIVATE_')||a.type==='BEGIN_RITUAL')&&'zone' in a;
/** Each step narrows existing legal actions; the UI never constructs a rules action. */
export function nextChoice(options:LegalAction[],done:ChoiceField[],state:DuelState):ChoiceStep|undefined {
 const first=options[0];if(!first)return;
 for(const field of ['costId','declaredType','discardIds','ritualId','materials','searchIds','searchId','choiceId','targetId','monsterZone','zone'] as ChoiceField[]){
  if(done.includes(field)||actionValue(first,field)===undefined)continue;
  // Activation uses a free S/T slot automatically. Setting always asks for a slot.
  if(field==='zone'&&spellActivation(first))continue;
  const values=options.map(a=>actionValue(a,field));
  const multiple=field==='discardIds'||field==='materials'||field==='searchIds';
  const sets=multiple?Array.from(new Map((values as string[][]).map(v=>[[...v].sort().join('|'),v])).values()):[];
  const ids=[...new Set(multiple?sets.flat():values.filter((v):v is string=>typeof v==='string'))];
  const deck=field==='searchIds'&&ids.some(id=>state.cards[id]?.location==='deck')||field==='searchId'||(field==='choiceId'&&ids.some(id=>state.cards[id]?.location==='deck'));
  const zoneKind=field==='monsterZone'||first.type==='NORMAL_SUMMON'||first.type==='TRIBUTE_SUMMON'?'monster':'spell';
  return {field,title:field==='declaredType'?(first.type==='ACTIVATE_TRIGGER'?'Choose summon position':'Declare a monster Type'):field==='costId'?'Choose a card to discard as cost':field==='discardIds'?`Choose ${state.pendingDiscard?.count??2} card(s) to discard`:field==='materials'?'Choose tribute materials':field==='ritualId'?'Choose a Ritual Monster':deck?'Search your deck':field==='targetId'?ids.every(id=>['monster','spell'].includes(state.cards[id]?.location))?'Choose a target on the field':ids.some(id=>state.cards[id]?.location==='hand')?'Choose a monster from the revealed hand':'Choose a card from the Graveyard':field==='searchIds'&&!deck?'Choose up to two monsters from the opponent Graveyard':field==='choiceId'?'Choose a card':`Choose a ${zoneKind==='monster'?'Monster':'Spell / Trap'} Zone`,kind:field==='declaredType'?'option':field==='targetId'&&ids.every(id=>['monster','spell'].includes(state.cards[id]?.location))?'target':field==='zone'||field==='monsterZone'?'zone':'cards',ids,sets,multiple,owner:first.seat,zoneKind,zones:values.filter((v):v is number=>typeof v==='number'),deck};
 }
}
export function narrowChoice(options:LegalAction[],field:ChoiceField,value:string|number|string[]):LegalAction[]{
 return options.filter(a=>{const candidate=actionValue(a,field);return Array.isArray(value)&&Array.isArray(candidate)?value.length===candidate.length&&value.every(id=>candidate.includes(id)):candidate===value;});
}
export function choiceCardOrder(step:ChoiceStep,state:DuelState):string[]{
 return step.deck?[...state.players[step.owner].deck]:step.field==='materials'?[...state.players[step.owner].hand,...state.players[step.owner].graveyard,...state.players[step.owner].zones.monster.filter((id):id is string=>id!==null)].filter(id=>step.ids.includes(id)):step.ids;
}
