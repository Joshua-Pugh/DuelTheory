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
  case 'ACTIVATE_LIGHT_EFFECT':return a.effectId==='LILY_BOOST'||a.effectId==='LILY_SKIP'?a.description:a.effectId==='METAMORPHOSIS'?'Activate · tribute for Fusion Summon':a.effectId==='TER_ABSORB'?'Equip an opponent monster…':a.effectId==='VENUS'?'Pay 500 LP · summon Mystical Shine Ball':a.effectId==='CANNON'?'Tribute 1 monster · inflict 500 damage':a.effectId==='ARCHER'?'Tribute 2 monsters · inflict 1200 damage':'Activate effect…';
  case 'SPECIAL_SUMMON_SOUL':return `Special Summon · ${a.declaredType==='attack'?'ATK':'DEF'}`;
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
  const deck=!(first.type==='COMPLETE_LIGHT_CHOICE'&&state.pendingLightChoice?.kind==='VENUS')&&(field==='searchIds'&&ids.some(id=>state.cards[id]?.location==='deck')||field==='searchId'||(field==='choiceId'&&ids.some(id=>state.cards[id]?.location==='deck')));
  const zoneKind=field==='monsterZone'||first.type==='NORMAL_SUMMON'||first.type==='TRIBUTE_SUMMON'?'monster':'spell';
  const trigger=first.type==='ACTIVATE_TRIGGER'?state.pendingTriggers?.find(t=>t.sourceId===first.sourceId):undefined;
  const fieldTarget=field==='choiceId'&&['ZABORG_DESTROY','NIGHT_DESTROY','TSUKUYOMI_SET'].includes(trigger?.effectId??'');
  const selectionTitle=first.type==='ACTIVATE_LIGHT_EFFECT'&&first.effectId==='BOOK_LIFE'&&field==='searchIds'?'Book of Life · choose an opponent Graveyard monster to banish':first.type==='ACTIVATE_LIGHT_EFFECT'&&first.effectId==='BOOK_LIFE'&&field==='targetId'?'Book of Life · choose your Zombie to revive':state.pendingLightChoice?.kind==='SOUL_RELEASE_TARGET'?`Soul Release · ${state.pendingLightChoice.chosenIds?.length??0}/5 targets chosen`:state.pendingLightChoice?.kind==='RETURN_PICK'?'Return from the Different Dimension · choose returning monsters':state.pendingLightChoice?.kind==='VAMPIRE_SEND'?`Vampire Lord · send a ${state.pendingLightChoice.declaredType} from your Deck`:field==='declaredType'&&trigger?.effectId==='VAMPIRE_SEND'?'Vampire Lord · declare Monster, Spell or Trap':fieldTarget?(trigger?.effectId==='ZABORG_DESTROY'?'Zaborg · choose a monster to destroy':trigger?.effectId==='NIGHT_DESTROY'?'Night Assailant · choose an opponent monster to destroy':'Tsukuyomi · choose a face-up monster to turn face-down'):state.pendingLightChoice?.kind==='REASON_LEVEL'?'Reasoning · opponent declares a Level (1–12)':state.pendingLightChoice?.kind==='DIMENSION_PICK'?`Dimension Fusion · Player ${first.seat+1}: choose monsters and positions`:state.pendingLightChoice?.kind==='GATE_SUMMON'?'Choose where and how to Special Summon the excavated monster':field==='choiceId'&&trigger?.effectId==='SANGAN_SEARCH'?'Sangan · choose a monster with 1500 or less ATK':field==='choiceId'&&trigger?.effectId==='MOF_RECOVER'?'Magician of Faith · choose a Spell from your Graveyard':undefined;
  return {field,title:selectionTitle??(state.pendingLightChoice?.kind==='MIND_CRUSH_NAME'?'Name a card':field==='declaredType'&&first.type==='ACTIVATE_TRIGGER'&&state.cards[first.sourceId]?.cardId===76922029?'Choose Don Zaloog effect':field==='declaredType'?((['ACTIVATE_TRIGGER','SPECIAL_SUMMON_SOUL','COMPLETE_LIGHT_CHOICE'].includes(first.type)||first.type==='ACTIVATE_LIGHT_EFFECT'&&first.effectId==='BOOK_LIFE')?'Choose summon position':'Declare a monster Type'):field==='costId'?'Choose a card to discard as cost':field==='discardIds'?`Choose ${state.pendingDiscard?.count??2} card(s) to discard`:field==='materials'?(first.type==='SPECIAL_SUMMON_SOUL'?'Banish 2 LIGHT monsters from your Graveyard':first.type==='SPECIAL_SUMMON_CHAOS'?'Banish 1 LIGHT and 1 DARK monster from your Graveyard':first.type==='ACTIVATE_LIGHT_EFFECT'?(first.effectId==='BAZOO'?'Banish 1–3 monsters from your Graveyard as cost':['VORTEX','REINCARNATION'].includes(first.effectId)?'Choose 1 card to discard as cost':'Choose monsters to Tribute as cost'):'Choose tribute materials'):field==='ritualId'?'Choose a Ritual Monster':deck?'Search your deck':field==='targetId'?ids.every(id=>['monster','spell'].includes(state.cards[id]?.location))?'Choose a target on the field':ids.some(id=>state.cards[id]?.location==='hand')?'Choose a monster from the revealed hand':'Choose a card from the Graveyard':field==='searchIds'&&!deck?(first.type==='ACTIVATE_TRIGGER'&&state.cards[first.sourceId]?.cardId===4929256?'Choose up to two Spell / Trap cards':'Choose up to two monsters from the opponent Graveyard'):field==='choiceId'?'Choose a card':`Choose a ${zoneKind==='monster'?'Monster':'Spell / Trap'} Zone`),kind:field==='declaredType'?'option':fieldTarget?'target':field==='targetId'&&ids.every(id=>['monster','spell'].includes(state.cards[id]?.location))?'target':field==='zone'||field==='monsterZone'?'zone':'cards',ids,sets,multiple,owner:first.seat,zoneKind,zones:values.filter((v):v is number=>typeof v==='number'),deck};
 }
}
export function narrowChoice(options:LegalAction[],field:ChoiceField,value:string|number|string[]):LegalAction[]{
 return options.filter(a=>{const candidate=actionValue(a,field);return Array.isArray(value)&&Array.isArray(candidate)?value.length===candidate.length&&value.every(id=>candidate.includes(id)):candidate===value;});
}
export function choiceCardOrder(step:ChoiceStep,state:DuelState):string[]{
 return step.deck?[...state.players[step.owner].deck]:step.field==='materials'?[...state.players[step.owner].hand,...state.players[step.owner].graveyard,...state.players[step.owner].zones.monster.filter((id):id is string=>id!==null)].filter(id=>step.ids.includes(id)):step.ids;
}

/** Mandatory card choices open immediately for their owner; effects without a choice still use the decision prompt. */
export function requiredCardChoice(state:DuelState,actions:LegalAction[]){
 const options=actions.filter(a=>a.type==='ACTIVATE_TRIGGER'&&state.pendingTriggers?.some(t=>t.sourceId===a.sourceId&&t.mandatory));
 if(!options.length)return;
 const source=actionSource(options[0]);const same=options.filter(a=>actionSource(a)===source);const step=nextChoice(same,[],state);
 if(step&&['cards','target'].includes(step.kind)&&step.ids.length)return {options:same,done:[] as ChoiceField[],label:step.title,step};
}
