import {graveyardStat} from './graveyardDeckEffects';
import {jinzo} from './trapStatus';
export {jinzo} from './trapStatus';
import {battleAttack} from './ritualDeckEffects';
import {draw,getCard,log,toGraveyard,toBanished,seededShuffle,settleLifePoints,type DuelState,type EngineContext,type Seat,type LegalAction,type ChainLink} from './model';
import type {LightEffect} from './lightDeckEffects';
export const GARDNA=65240384,THESTA=26205777;
export const monarchIds=new Set([79853073,37520316,51452091,15800838,36361633,65240384,26205777,77585513,23205979,87910978,4929256,33508719,76922029,57182235,97169186,98045062,29401950,41420027,62279055]);
const other=(n:Seat):Seat=>n===0?1:0;
const units=(s:DuelState,seat?:Seat)=>Object.values(s.cards).filter(c=>c.location==='monster'&&(seat===undefined||c.controller===seat));
export function monarchActions(s:DuelState,ctx:EngineContext,seat:Seat,responses=false):LegalAction[]{
 const p=s.players[seat],op=other(seat),actions:LegalAction[]=[];
 for(const id of [...p.hand,...p.zones.spell.filter((x):x is string=>!!x)]){
 const c=s.cards[id],hand=c.location==='hand';if(hand&&s.current!==seat||!hand&&(!c.faceDown||responses&&c.setTurn===s.turn))continue;
 const add=(effectId:LightEffect,targetId?:string,materials?:string[])=>{for(const zone of hand?p.zones.spell.flatMap((x,i)=>x===null?[i]:[]):[c.zone!])actions.push({type:'ACTIVATE_LIGHT_EFFECT',seat,instanceId:id,effectId,zone,targetId,materials,description:`${getCard(s,id,ctx).name} · ${effectId.replaceAll('_',' ').toLowerCase()}`});};
 const targets=units(s,op).filter(c=>!c.faceDown);
 if(!responses){if(c.cardId===37520316&&p.zones.monster.includes(null))for(const t of units(s,op))add('MIND_CONTROL',t.instanceId);if(c.cardId===87910978&&p.lp>800&&p.zones.monster.includes(null))for(const t of targets)add('BRAIN',t.instanceId);
 if(c.cardId===57182235&&units(s).some(c=>c.token))add('THANKSGIVING');
 if(c.cardId===97169186&&targets.length){const max=Math.max(...targets.map(c=>graveyardStat(s,c.instanceId,'def',ctx)));for(const t of targets.filter(c=>graveyardStat(s,c.instanceId,'def',ctx)===max))add('SMASHING',t.instanceId);}}
 if(c.cardId===98045062&&(!hand&&c.setTurn!==s.turn||hand)){for(const t of targets){add('ENEMY_POSITION',t.instanceId);if(p.zones.monster.includes(null)||units(s,seat).length)for(const cost of units(s,seat).filter(c=>c.cannotTributeTurn!==s.turn))add('ENEMY_CONTROL',t.instanceId,[cost.instanceId]);}}
 if(!hand&&c.setTurn!==s.turn&&(!jinzo(s)||c.cardId===41420027&&s.summonResponse?.negatable&&units(s).filter(c=>c.cardId===77585513&&!c.faceDown).every(c=>c.instanceId===s.summonResponse?.sourceId))){
 if(c.cardId===36361633)add('ROAR');
 if(c.cardId===51452091)add('DECREE');
 if(c.cardId===15800838&&p.hand.length&&s.players[op].hand.length)add('MIND_CRUSH');
 if(c.cardId===29401950&&s.summonResponse&&(s.summonResponse.sourceIds||s.summonResponse.summoner===op)){const target=(s.summonResponse.sourceIds??[s.summonResponse.sourceId]).find(id=>s.cards[id]?.location==='monster'&&s.cards[id].controller===op&&!s.cards[id].faceDown&&battleAttack(s,id,ctx)>=1500);if(target)add('BOTTOMLESS',target);}
 if(c.cardId===62279055&&s.pendingAttack?.defender===seat&&!s.pendingAttack.damageStep)add('CYLINDER',s.pendingAttack.attackerId);
 if(c.cardId===41420027){const top=s.chain.at(-1);if(top&&/Spell|Trap/.test(getCard(s,top.instanceId,ctx).type))add('SOLEMN_CHAIN',top.instanceId);else if(!s.chain.length&&s.summonResponse&&s.summonResponse.summoner!==seat&&s.summonResponse.negatable)add('SOLEMN_SUMMON',s.summonResponse.sourceId);}
 }
 }return actions;
}
export function temporaryControl(s:DuelState,id:string,seat:Seat,allowSet=false){const c=s.cards[id],zone=s.players[seat].zones.monster.findIndex(x=>x===null);if(c?.location!=='monster'||c.faceDown&&!allowSet||c.controller===seat||zone<0)return;const previous=c.controller;s.players[previous].zones.monster[c.zone!]=null;s.players[seat].zones.monster[zone]=id;c.controller=seat;c.zone=zone;c.returnControl={seat:previous,turn:s.turn};}
export function returnTemporaryControl(s:DuelState){for(const c of units(s))if(c.returnControl?.turn===s.turn){const owner=c.returnControl.seat;delete c.returnControl;if(c.controller===owner)continue;const zone=s.players[owner].zones.monster.findIndex(x=>x===null);if(zone<0)toGraveyard(s,c.instanceId,'rule');else{s.players[c.controller].zones.monster[c.zone!]=null;s.players[owner].zones.monster[zone]=c.instanceId;c.zone=zone;c.controller=owner;}}}
function randomDiscard(s:DuelState,owner:Seat,ctx:EngineContext,burn=false){const p=s.players[owner];if(!p.hand.length)return;const [id]=seededShuffle(p.hand,s.seed+Math.imul(s.events.length+1,7919)),card=getCard(s,id,ctx);p.hand.splice(p.hand.indexOf(id),1);toGraveyard(s,id,'discard');log(s,'RANDOM_DISCARD',`Random discard: ${card.name}.`,owner);if(burn&&card.type.includes('Monster')){p.lp=Math.max(0,p.lp-Number(card.level)*100);settleLifePoints(s);}}
export function resolveMonarch(s:DuelState,l:ChainLink,ctx:EngineContext):boolean{
 const seat=l.controller,op=other(seat),p=s.players[seat],target=l.targets[0],t=s.cards[target];
 switch(l.effectId){
 case 'ROAR':s.attackLockedTurn??=[0,0];s.attackLockedTurn[op]=s.turn;break;
 case 'DECREE':if(s.cards[l.instanceId].location==='spell'&&!s.cards[l.instanceId].faceDown)s.cards[l.instanceId].decreeActive??=s.events.length;break;
 case 'MIND_CRUSH':{const matches=s.players[op].hand.filter(id=>getCard(s,id,ctx).name===l.declaredType);if(matches.length)for(const id of matches){s.players[op].hand.splice(s.players[op].hand.indexOf(id),1);toGraveyard(s,id,'discard');}else randomDiscard(s,seat,ctx);log(s,'DECLARE',`Mind Crush declared ${l.declaredType}; ${matches.length} matching card(s) discarded.`,seat);break;}
 case 'MIND_CONTROL':temporaryControl(s,target,seat,true);if(t?.controller===seat&&t.location==='monster'){t.cannotAttackTurn=s.turn;t.cannotTributeTurn=s.turn;}break;
 case 'BRAIN':case 'ENEMY_CONTROL':temporaryControl(s,target,seat);break;
 case 'ENEMY_POSITION':if(t?.location==='monster'&&!t.faceDown)t.position=t.position==='attack'?'faceUpDefense':'attack';break;
 case 'THANKSGIVING':{const tokens=units(s).filter(c=>c.token);for(const c of tokens)toGraveyard(s,c.instanceId);p.lp+=tokens.length*800;break;}
 case 'SMASHING':{const selected=l.nonTargetId;const ts=units(s,op).filter(c=>!c.faceDown);if(ts.length){const max=Math.max(...ts.map(c=>graveyardStat(s,c.instanceId,'def',ctx)));const chosen=ts.find(c=>c.instanceId===selected&&graveyardStat(s,c.instanceId,'def',ctx)===max)??ts.find(c=>graveyardStat(s,c.instanceId,'def',ctx)===max)!;toGraveyard(s,chosen.instanceId);}break;}
 case 'BOTTOMLESS':for(const id of s.summonResponse?.sourceIds??[target]){const c=s.cards[id];if(c?.location==='monster'&&c.controller===op&&!c.faceDown&&battleAttack(s,id,ctx)>=1500)toBanished(s,id,true);}break;
 case 'CYLINDER':if(s.pendingAttack?.attackerId===target&&t?.location==='monster'){s.players[op].lp=Math.max(0,s.players[op].lp-battleAttack(s,target,ctx));s.pendingAttack=undefined;settleLifePoints(s);}break;
 case 'SOLEMN_CHAIN':{const previous=s.chain.at(-1);if(previous?.instanceId===target){s.chain.pop();if(['monster','spell'].includes(t?.location))toGraveyard(s,target);}break;}
 case 'SOLEMN_SUMMON':if(t?.location==='monster'){toGraveyard(s,target);s.pendingTriggers=s.pendingTriggers?.filter(x=>x.sourceId!==target);if(s.pendingSearch?.sourceId===target)s.pendingSearch=undefined;s.summonResponse=undefined;}break;
 case 'THESTALOS':randomDiscard(s,op,ctx,true);break;
 case 'MOBIUS':for(const id of l.searchIds??[])if(s.cards[id]?.location==='spell')toGraveyard(s,id);break;
 case 'JAR':{const hands=s.players.map(p=>[...p.hand]);for(const owner of [seat,op])for(const id of hands[owner]){s.players[owner].hand.splice(s.players[owner].hand.indexOf(id),1);toGraveyard(s,id,'discard');}const bothOut=s.players.every(p=>p.deck.length<5);draw(s,seat,5);draw(s,op,5);if(bothOut){s.winner=null;s.drawnGame=true;}break;}
 case 'DON':if(l.declaredType==='Discard 1 random card')randomDiscard(s,op,ctx);else for(let i=0;i<2;i++){const id=s.players[op].deck.shift();if(id)toGraveyard(s,id,'send');}break;
 case 'REAPER_DISCARD':randomDiscard(s,op,ctx);break;
 default:return false;
 }log(s,'RESOLVE',`${l.effectId.replaceAll('_',' ')} resolved.`,seat);return true;
}

