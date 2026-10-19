import {trapNegated} from './trapStatus';
import type {LightAction,LightChoice} from './lightDeckEffects';
import {seededShuffle} from '../framework/random';
import type {DeckEffectAction} from './ritualDeckEffects';
import type {Card, Deck} from '../core/types';
export type Seat = 0 | 1;
export type Phase = 'DRAW'|'STANDBY'|'MAIN_1'|'BATTLE'|'MAIN_2'|'END';
export type Location = 'deck'|'hand'|'monster'|'spell'|'graveyard'|'banished'|'extra';
export type Position = 'attack'|'faceDownDefense'|'faceUpDefense';
export type CardInstance = {decreeActive?:number;cannotTributeTurn?:number;returnControl?:{seat:Seat;turn:number};fusionOrigin?:boolean;absorbed?:boolean;equippedHidden?:boolean;token?:boolean;tokenGone?:boolean;asuraAttacks?:{turn:number;targets:string[];direct:boolean};instanceId:string; cardId:number; owner:Seat; controller:Seat; location:Location; position?:Position; faceDown?:boolean; zone?:number; setTurn?:number; summonedTurn?:number; lastPositionTurn?:number; attackedTurn?:number; spellCounters?:number;effectUsedTurn?:number;cannotAttackTurn?:number;spiritReturnTurn?:number;properlySummoned?:boolean;linkedTarget?:string;previousController?:Seat;extraAttackTurn?:number;attacksThisTurn?:{turn:number;count:number}};
export type DuelPlayer = {extra?:string[];lp:number; zones:{monster:(string|null)[]; spell:(string|null)[]}; deck:string[];hand:string[];graveyard:string[];banished:string[];normalSummoned:boolean};
export type EngineEvent = {type:string; message:string; turn:number; seat:Seat};
export type DamageStepStage = 'START'|'FLIP'|'CALCULATE'|'AFTER_CALCULATE'|'END';
export type PendingAttack = {attackerId:string;targetId?:string;defender:Seat;attacker:Seat; replay?:boolean; defenderField?:string[]; damageStep?:DamageStepStage; revealedFlip?:string; ddLadyId?:string; battleDestruction?:string[];shinatoDamage?:number};
export type BattleResult={turn:number;eventIndex:number;attackerId:string;targetId?:string;sourceId:string;damagedSeat:Seat;damage:number;attack:number;defense?:number};
export type DuelState = {lastBattle?:BattleResult;attackLockedTurn?:[number,number];battleEntryTurn?:number;pendingLightChoice?:LightChoice;lastWills?:{sourceId:string;controller:Seat;turn:number}[];summonLockedTurn?:[number,number];summonedThisTurn?:[number,number];wabokuTurn?:[number,number];tokenSerial?:number;freeResponse?:{priority:Seat;passed:Seat[]};deferredTriggers?:PendingTrigger[];pendingChaos?:{kind:'DUSTSHOOT';sourceId:string;controller:Seat};pendingRitual?:{sourceId:string;controller:Seat};pendingRoll?:{sourceId:string;controller:Seat;result:number};pendingRandomDiscard?:{sourceId:string;controller:Seat;order:string[]};drawnGame?:boolean;summonResponse?:{negatable?:boolean;summoner:Seat;sourceId:string;priority?:Seat;passed?:Seat[]};pendingDeckChoice?:{sourceId:string;controller:Seat;kind:'ZORC_DESTROY_ONE'};pendingAttack?:PendingAttack;format:'goat-2005'; turn:number; current:Seat; phase:Phase; players:[DuelPlayer,DuelPlayer]; cards:Record<string,CardInstance>; chain:ChainLink[]; events:EngineEvent[]; winner:Seat|null; pendingDraw:boolean; seed:number; priority:Seat; consecutivePasses:number; pendingDiscard?:{sourceId:string;controller:Seat;count:number;drawnIds?:string[]}; pendingSearch?:{sourceId:string;controller:Seat;kind:'RITUAL_ANY'|'RITUAL_MONSTER'}; pendingTriggers?:PendingTrigger[]};
export type PendingTrigger = {sourceId:string;controller:Seat;effectId:'THESTALOS'|'MOBIUS'|'JAR'|'DON'|'REAPER_DISCARD'|'MIMIC_DRAW'|'MERCHANT_EXCAVATE'|'LAST_WILL_SUMMON'|'ZABORG_DESTROY'|'PARSHATH_DRAW'|'SPY_SUMMON'|'NIGHT_DESTROY'|'NIGHT_RECOVER'|'KYCOO_BANISH'|'SANGAN_SEARCH'|'MOF_RECOVER'|'DEKOICHI_DRAW'|'TOMATO_SUMMON'|'SHINING_ANGEL_SUMMON'|'APPRENTICE_RECRUIT'|'APPRENTICE_COUNTER'|'TSUKUYOMI_SET'|'BREAKER_COUNTER'|'SERPENT_RECOVER'|'ZORC_DESTROY_ONE'|'DMOC_RECOVER'|'BLS_EXTRA_ATTACK'|'SHINATO_DAMAGE';mandatory:boolean;value?:number;eligibleIds?:string[]};
export type RitualLevelRule = 'EXACT'|'AT_LEAST';
export type ChainLink = {instanceId:string; controller:Seat; effectId:string; targets:string[]; spellSpeed:1|2|3;nonTargetId?:string; ritual?:{ritualId:string;materials:string[];monsterZone:number}; searchIds?:string[]; monsterZone?:number;declaredType?:string;value?:number};
export type DuelAction = LightAction | {type:'PASS_FREE_RESPONSE';seat:Seat} | DeckEffectAction | {type:'BEGIN_RITUAL';seat:Seat;instanceId:string;zone:number} | {type:'FINISH_RITUAL';seat:Seat} | {type:'ACTIVATE_GRACEFUL_CHARITY';seat:Seat;instanceId:string;zone:number} | {type:'CHOOSE_DISCARD';seat:Seat;discardIds:string[]} | {type:'DRAW_PHASE'; seat:Seat} | {type:'ADVANCE';seat:Seat} | {type:'NORMAL_SUMMON';seat:Seat;instanceId:string;zone:number;position?:'attack'|'faceDownDefense'} | {type:'SET_SPELL_TRAP';seat:Seat;instanceId:string;zone:number} | {type:'ACTIVATE_POT_OF_GREED';seat:Seat;instanceId:string;zone:number} | {type:'ACTIVATE_MST';seat:Seat;instanceId:string;zone:number;targetId:string} | {type:'ACTIVATE_BOOK_OF_MOON';seat:Seat;instanceId:string;zone:number;targetId:string} | {type:'TRIBUTE_SUMMON';seat:Seat;instanceId:string;zone:number;materials:string[];position:'attack'|'faceDownDefense'} | {type:'ACTIVATE_CONTRACT';seat:Seat;instanceId:string;zone:number;ritualId:string;materials:string[];monsterZone:number} | {type:'ACTIVATE_THUNDER_DRAGON';seat:Seat;instanceId:string;searchIds:string[]} | {type:'TRIGGER_SEARCH';seat:Seat;sourceId:string;searchId:string} | {type:'DECLINE_TRIGGER';seat:Seat} | {type:'FLIP_SUMMON';seat:Seat;instanceId:string} | {type:'CHANGE_POSITION';seat:Seat;instanceId:string;position:'attack'|'faceUpDefense'} | {type:'ACTIVATE_TRIGGER';seat:Seat;sourceId:string;choiceId?:string;monsterZone?:number;declaredType?:string;searchIds?:string[]} | {type:'DECLINE_PENDING_TRIGGER';seat:Seat;sourceId:string} | {type:'DECLARE_ATTACK';seat:Seat;attackerId:string;targetId?:string} | {type:'PASS_ATTACK_RESPONSE';seat:Seat} | {type:'ADVANCE_DAMAGE_STEP';seat:Seat} | {type:'ACTIVATE_DD_WARRIOR_LADY';seat:Seat} | {type:'DECLINE_DD_WARRIOR_LADY';seat:Seat} | {type:'REPLAY_ATTACK';seat:Seat;targetId?:string} | {type:'CANCEL_REPLAY';seat:Seat} | {type:'ACTIVATE_ATTACK_TRAP';seat:Seat;instanceId:string;effectId:'MIRROR_FORCE'|'SAKURETSU_ARMOR';targetId?:string} | {type:'RESOLVE_CHAIN';seat:Seat} | {type:'PASS_CHAIN';seat:Seat};
export type EngineContext = {cards:ReadonlyMap<number,Card>};
export type LegalAction = DuelAction & {description:string};
export type EngineErrorCode = 'ILLEGAL_ACTION'|'UNKNOWN_CARD'|'UNSUPPORTED_EFFECT';
export class DuelEngineError extends Error {constructor(public code:EngineErrorCode,message:string){super(message);this.name='DuelEngineError';}}
export const emptyPlayer=():DuelPlayer=>({lp:8000,zones:{monster:Array(5).fill(null),spell:Array(5).fill(null)},extra:[],deck:[],hand:[],graveyard:[],banished:[],normalSummoned:false});
export const phases:Phase[]=['DRAW','STANDBY','MAIN_1','BATTLE','MAIN_2','END'];
export const SHEEP_TOKEN_CARD:Card={id:73915052,name:'Sheep Token',type:'Token Monster',race:'Beast',attribute:'EARTH',level:1,atk:0,def:0,desc:'Scapegoat Token. Cannot be Tributed for a Tribute Summon.'};
export const getCard=(state:DuelState,instanceId:string,ctx:EngineContext):Card=>{const instance=state.cards[instanceId];const card=instance?.token?SHEEP_TOKEN_CARD:instance&&ctx.cards.get(instance.cardId);if(!card)throw new DuelEngineError('UNKNOWN_CARD',`Unrecognized card ${instanceId}`);return card;};
export const isMonster=(card:Card)=>card.type.includes('Monster');
export const isSpellTrap=(card:Card)=>card.type.includes('Spell')||card.type.includes('Trap');
export const isNormalSummonable=(card:Card)=>![9596126,72989439,77527210].includes(card.id)&&isMonster(card)&&!card.type.includes('Ritual')&&!card.type.includes('Fusion')&&!card.type.includes('Special Summon')&&Number(card.level||0)>0&&Number(card.level||0)<=4;
export {seededShuffle} from '../framework/random';
export function createDuel(a:Deck,b:Deck,ctx:EngineContext,seed=20261014,firstSeat:Seat=0):DuelState {if(firstSeat!==0&&firstSeat!==1)throw new DuelEngineError('ILLEGAL_ACTION','Starting seat must be Player 1 or Player 2');const players:[DuelPlayer,DuelPlayer]=[emptyPlayer(),emptyPlayer()];const cards:Record<string,CardInstance>={};for(const seat of [0,1] as Seat[]){const deck=seat===0?a:b;deck.main.forEach((cardId,i)=>{if(!ctx.cards.has(cardId))throw new DuelEngineError('UNKNOWN_CARD',`Card ${cardId} missing from catalog`);const instanceId=`p${seat}-${i}`;cards[instanceId]={instanceId,cardId,owner:seat,controller:seat,location:'deck'};players[seat].deck.push(instanceId);});deck.extra.forEach((cardId,i)=>{if(!ctx.cards.has(cardId))throw new DuelEngineError('UNKNOWN_CARD',`Fusion ${cardId} missing from catalog`);const instanceId=`p${seat}-extra-${i}`;cards[instanceId]={instanceId,cardId,owner:seat,controller:seat,location:'extra',fusionOrigin:true};players[seat].extra!.push(instanceId);});players[seat].deck=seededShuffle(players[seat].deck,seed+seat*7919);for(let i=0;i<5;i++){const instanceId=players[seat].deck.shift();if(instanceId){players[seat].hand.push(instanceId);cards[instanceId].location='hand';}}}return {pendingTriggers:[],format:'goat-2005',turn:1,current:firstSeat,phase:'DRAW',players,cards,chain:[],events:[{type:'START',message:`Both players drew 5 cards. Player ${firstSeat+1} goes first and draws 1 card in the opening Draw Phase (GOAT 2005).`,turn:1,seat:firstSeat}],winner:null,pendingDraw:true,seed,priority:firstSeat,consecutivePasses:0};}
export function log(s:DuelState,type:string,message:string,seat:Seat){s.events.push({type,message,turn:s.turn,seat});}
export function draw(s:DuelState,seat:Seat,count:number){const p=s.players[seat];for(let n=0;n<count;n++){const id=p.deck.shift();if(!id){s.winner=seat===0?1:0;log(s,'DECK_OUT',`Player ${seat+1} could not draw from an empty Deck.`,seat);return;}p.hand.push(id);s.cards[id].location='hand';}log(s,'DRAW',`Player ${seat+1} drew ${count} card(s).`,seat);}
export function removeFromHand(p:DuelPlayer,id:string){const i=p.hand.indexOf(id);if(i<0)throw new DuelEngineError('ILLEGAL_ACTION','Card is not in your hand');p.hand.splice(i,1);}
export function removeToken(s:DuelState,id:string){const c=s.cards[id];if(!c?.token)return false;if((c.location==='monster'||c.location==='spell')&&c.zone!==undefined)s.players[c.controller].zones[c.location][c.zone]=null;c.decreeActive=undefined;if(c.returnControl){c.returnControl=undefined;c.cannotTributeTurn=undefined;c.cannotAttackTurn=undefined;}c.location='banished';c.zone=undefined;c.position=undefined;c.tokenGone=true;resolveAttachments(s,id,true);return true;}
export function toBanished(s:DuelState,id:string,destroyed=false){if(removeToken(s,id))return;
 const c=s.cards[id];if(!c)throw new DuelEngineError('UNKNOWN_CARD','Card instance is missing');
 const controller=s.players[c.controller];
 if(c.location==='monster'&&c.zone!==undefined)controller.zones.monster[c.zone]=null;
 if(c.location==='spell'&&c.zone!==undefined)controller.zones.spell[c.zone]=null;
 if(c.location==='hand'){const hand=s.players[c.controller].hand;const index=hand.indexOf(id);if(index>=0)hand.splice(index,1);}
 if(c.location==='graveyard'){const gy=s.players[c.owner].graveyard;const index=gy.indexOf(id);if(index>=0)gy.splice(index,1);}
 c.decreeActive=undefined;if(c.returnControl){c.returnControl=undefined;c.cannotTributeTurn=undefined;c.cannotAttackTurn=undefined;}c.location='banished';c.zone=undefined;c.faceDown=false;c.position=undefined;c.controller=c.owner;s.players[c.owner].banished.push(id);resolveAttachments(s,id,destroyed);
}
export function toGraveyard(s:DuelState,id:string,reason:'battle'|'effect'|'cost'|'rule'|'discard'='effect'){if(removeToken(s,id))return;const c=s.cards[id];if(c?.location==='monster'&&!c.faceDown&&c.cardId===40737112){toBanished(s,id,reason==='battle'||reason==='effect');return;}if(!c)throw new DuelEngineError('UNKNOWN_CARD','Card instance is missing');const wasOnField=['monster','spell'].includes(c.location);const wasMonster=c.location==='monster';if(wasMonster&&c.controller===c.owner){const wills=(s.lastWills??[]).filter(w=>w.controller===c.owner&&w.turn===s.turn);s.lastWills=(s.lastWills??[]).filter(w=>!wills.includes(w));for(const w of wills)(s.deferredTriggers??=[]).push({sourceId:w.sourceId,controller:w.controller,effectId:'LAST_WILL_SUMMON',mandatory:false});}const controller=s.players[c.controller];if(c.location==='spell'&&c.zone!==undefined)controller.zones.spell[c.zone]=null;if(c.location==='monster'&&c.zone!==undefined)controller.zones.monster[c.zone]=null;c.decreeActive=undefined;if(c.returnControl){c.returnControl=undefined;c.cannotTributeTurn=undefined;c.cannotAttackTurn=undefined;}c.location='graveyard';c.faceDown=false;c.position=undefined;c.zone=undefined;c.controller=c.owner;s.players[c.owner].graveyard.push(id);c.spellCounters=0;if(wasMonster&&reason==='battle'&&c.cardId===9156135){(s.pendingTriggers??=[]).push({sourceId:id,controller:c.owner,effectId:'APPRENTICE_RECRUIT',mandatory:false});log(s,'TRIGGER_QUEUED','Apprentice Magician destroyed by battle.',c.owner);}if(wasMonster&&reason==='battle'&&([83011277,83011278].includes(c.cardId)||c.cardId===95956346)){
 const effectId=[83011277,83011278].includes(c.cardId)?'TOMATO_SUMMON':'SHINING_ANGEL_SUMMON';
 (s.pendingTriggers??=[]).push({sourceId:id,controller:c.owner,effectId,mandatory:false});
 log(s,'TRIGGER_QUEUED',`${effectId==='TOMATO_SUMMON'?'Mystic Tomato':'Shining Angel'} destroyed by battle and sent to the Graveyard.`,c.owner);
}if(c.cardId===16226786&&(reason==='discard'||reason==='cost')&&!wasMonster)(s.deferredTriggers??=[]).push({sourceId:id,controller:c.owner,effectId:'NIGHT_RECOVER',mandatory:true});resolveAttachments(s,id,reason==='battle'||reason==='effect');if(wasOnField&&c.cardId===26202165){(s.pendingTriggers??=[]).push({sourceId:id,controller:c.owner,effectId:'SANGAN_SEARCH',mandatory:true});log(s,'TRIGGER_QUEUED','Sangan was sent from the field to the Graveyard.',c.owner);}}

/** Zone-safe movement shared by tribute costs and resolving card effects. */
export function sendMaterialToGraveyard(s:DuelState,id:string,seat:Seat){
 const instance=s.cards[id]; if(!instance||instance.cannotTributeTurn===s.turn||instance.controller!==seat||!['hand','monster'].includes(instance.location))throw new DuelEngineError('ILLEGAL_ACTION','Material must be in your hand or under your control on the field');
 if(instance.location==='hand')removeFromHand(s.players[seat],id);
 toGraveyard(s,id,'cost');
}
/** Combinations have stable IDs and never use the summoning monster as material. */
export function materialCombinations(s:DuelState,ctx:EngineContext,seat:Seat,level:number,excluded:string[]=[],rule:RitualLevelRule='EXACT'):string[][]{
 const candidates=[...s.players[seat].hand,...s.players[seat].zones.monster.filter((id):id is string=>id!==null)]
   .filter(id=>s.cards[id].cannotTributeTurn!==s.turn&&!excluded.includes(id) && isMonster(getCard(s,id,ctx)) && Number(getCard(s,id,ctx).level)>0);
 const result:string[][]=[];
 function visit(index:number,sum:number,chosen:string[]){if(chosen.length && (rule==='EXACT'?sum===level:sum>=level)){result.push([...chosen]);return;}if(sum>level)return;for(let i=index;i<candidates.length;i++){const id=candidates[i];visit(i+1,sum+Number(getCard(s,id,ctx).level),[...chosen,id]);}}
 visit(0,0,[]);return result;
}

/** Shared monster-placement operation. Callers must define the positions allowed by their own summon/effect rules. */
export function placeMonster(s:DuelState,id:string,seat:Seat,zone:number,position:Position,allowed:readonly Position[]){
 if(!allowed.includes(position))throw new DuelEngineError('ILLEGAL_ACTION',`Position ${position} is not allowed by this summoning method`);
 if(zone<0||zone>=5||s.players[seat].zones.monster[zone]!==null)throw new DuelEngineError('ILLEGAL_ACTION','Destination Monster Zone is not empty');
 const c=s.cards[id];if(!c)throw new DuelEngineError('UNKNOWN_CARD','Card instance missing');
 if(position!=='faceDownDefense'||allowed.length===1){s.summonedThisTurn??=[0,0];s.summonedThisTurn[seat]=s.turn;}
 s.players[seat].zones.monster[zone]=id;Object.assign(c,{location:'monster',controller:seat,zone,position,faceDown:position==='faceDownDefense',summonedTurn:s.turn,lastPositionTurn:s.turn});
}

/** Linked Equip/Continuous cards are detached before recursive movement. */
function resolveAttachments(s:DuelState,id:string,destroyed:boolean){
 const c=s.cards[id],linked=c.linkedTarget;c.linkedTarget=undefined;c.absorbed=false;c.equippedHidden=false;
 if(linked&&s.cards[linked]?.location==='monster'){
  if(c.cardId===97077563&&!trapNegated(s,id)||c.cardId===70828912&&destroyed)toGraveyard(s,linked);
  if(c.cardId===45986603){const target=s.cards[linked],owner=c.previousController??target.owner,zone=s.players[owner].zones.monster.findIndex(x=>x===null);if(target.controller!==owner){if(zone<0)toGraveyard(s,linked);else{s.players[target.controller].zones.monster[target.zone!]=null;target.controller=owner;target.zone=zone;s.players[owner].zones.monster[zone]=linked;}}}
 }
 for(const equip of Object.values(s.cards).filter(x=>x.location==='spell'&&x.linkedTarget===id)){
  equip.linkedTarget=undefined;if(equip.cardId!==97077563||destroyed&&!trapNegated(s,equip.instanceId))toGraveyard(s,equip.instanceId,'rule');
 }
}
export function returnToHand(s:DuelState,id:string){
 if(removeToken(s,id))return;const c=s.cards[id];if(c.location==='monster'&&c.cardId===40737112&&!c.faceDown){toBanished(s,id);return;}
 if(c.location==='monster'||c.location==='spell')s.players[c.controller].zones[c.location][c.zone!]=null;
 else {const list=s.players[c.owner][c.location==='graveyard'?'graveyard':c.location==='banished'?'banished':c.location==='deck'?'deck':'hand'];const i=list.indexOf(id);if(i>=0)list.splice(i,1);}
 c.decreeActive=undefined;if(c.returnControl){c.returnControl=undefined;c.cannotTributeTurn=undefined;c.cannotAttackTurn=undefined;}Object.assign(c,{location:c.fusionOrigin?'extra':'hand',zone:undefined,position:undefined,faceDown:false,controller:c.owner});if(c.fusionOrigin)(s.players[c.owner].extra??=[]).push(id);else s.players[c.owner].hand.push(id);resolveAttachments(s,id,false);
}
export function settleLifePoints(s:DuelState){if(s.players.every(p=>p.lp<=0)){s.drawnGame=true;s.winner=null;log(s,'GAME_DRAW','Both players have no Life Points. The duel is a draw.',s.current);}else if(s.players.some(p=>p.lp<=0)){s.winner=s.players[0].lp<=0?1:0;log(s,'GAME_END',`Player ${s.winner+1} wins by Life Points.`,s.winner);}}
export function detachFaceDown(s:DuelState,id:string){if(s.cards[id].cardId===63519819)s.cards[id].effectUsedTurn=undefined;s.cards[id].asuraAttacks=undefined;s.cards[id].spellCounters=0;for(const equip of Object.values(s.cards).filter(c=>c.location==='spell'&&c.linkedTarget===id)){equip.linkedTarget=undefined;if(equip.cardId!==97077563)toGraveyard(s,equip.instanceId,'rule');}}
