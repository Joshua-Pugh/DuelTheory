import type {Card} from '../core/types';import type {DuelState,LegalAction,Seat} from '../engine/model';
import {chooseResourceHeuristic} from './resourcePolicy';import {absorbedMonster,TER,METAMORPHOSIS} from '../engine/goatControlEffects';import {battleAttack} from '../engine/ritualDeckEffects';
import {publicSetRead} from './opponentRead';
/** Control profile over the shared resource/response policy. All scoring sees only its legal observation. */
export function chooseGoatControl(state:DuelState,legal:readonly LegalAction[],seat:Seat,catalog:readonly Card[]){
 const cards=new Map(catalog.map(c=>[c.id,c]));
 const setRead=publicSetRead(state,seat,cards);
 return chooseResourceHeuristic(state,legal,seat,catalog,(s,a,base)=>{
  const own=s.players[seat],foe=s.players[seat===0?1:0],ours=own.zones.monster.filter((id):id is string=>!!id),theirs=foe.zones.monster.filter((id):id is string=>!!id),card=(id:string)=>cards.get(s.cards[id]?.cardId),atk=(id:string)=>card(id)?battleAttack(s,id,{cards}):1600;
  const ter=ours.find(id=>s.cards[id].cardId===TER&&!s.cards[id].faceDown),meta=own.hand.some(id=>card(id)?.id===METAMORPHOSIS)||own.zones.spell.some(id=>id&&card(id)?.id===METAMORPHOSIS),tsuku=own.hand.some(id=>card(id)?.id===34853266);
  const score=(value:number,reason:string)=>({value,reason});
  const threat=(id:string)=>s.cards[id].faceDown?setRead.defenseEstimate+setRead.urgency:atk(id)+(s.cards[id].cardId===79575620&&foe.lp>2000?3000:0)+([72989439,9596126,88240808,77585513].includes(s.cards[id].cardId)?800:0);
  if(a.type==='ACTIVATE_LIGHT_EFFECT'){
   if(a.effectId==='SCAPEGOAT'){
    const targeted=s.chain.some(l=>l.instanceId!==a.instanceId&&(l.targets.includes(a.instanceId)||l.effectId==='HEAVY_STORM'));
    const defending=s.pendingAttack?.defender===seat,opponentEnd=s.current!==seat&&s.phase==='END';
    return score(defending?135:targeted?125:opponentEnd&&meta?110:s.current!==seat&&theirs.length>0&&ours.length===0?65:s.current===seat&&s.phase==='END'&&meta?55:-20,'Use Sheep Tokens for defense and next-turn Metamorphosis; never assume another summon is legal this turn.');
   }
   if(a.effectId==='METAMORPHOSIS'){
    const material=a.materials?.[0];if(!material)return score(-100,'Keep a valid Metamorphosis material.');
    const level=card(material)?.level??(s.cards[material].token?1:0),fusions=(own.extra??[]).filter(id=>card(id)?.level===level),cheap=s.cards[material].token||[8131171,74713516].includes(s.cards[material].cardId),spentFaith=s.cards[material].cardId===31560081&&!s.cards[material].faceDown;
    const bestFusion=Math.max(0,...fusions.map(id=>Number(card(id)?.atk)||0)),strongest=Math.max(0,...theirs.map(threat));
    const liveFlip=s.cards[material].faceDown&&card(material)?.type.includes('Flip'),emergency=strongest>=2500||own.lp<=2000;
    return score(!fusions.length?-100:level===1?(!ter&&theirs.length?liveFlip&&!emergency?-20:125+(cheap?8:spentFaith?2:-25):!ter&&s.current!==seat?35:-20):!ter&&bestFusion>atk(material)&&bestFusion>strongest&&theirs.length?75:-20,'Convert material only into a Fusion that improves the board; preserve live flips unless Restrict is urgently needed.');
   }
   if(a.effectId==='TER_ABSORB'&&a.targetId)return score(140+threat(a.targetId)/100,'Absorb the most relevant visible threat; evaluate opposing set monsters without knowing their identities.');
  }
  if(a.type==='COMPLETE_LIGHT_CHOICE'&&s.pendingLightChoice?.kind==='METAMORPHOSIS'&&a.choiceId){const chosen=card(a.choiceId);return score(100+(chosen?.id===TER?80:Math.max(Number(chosen?.atk)||0,Number(chosen?.def)||0)/100)+(a.declaredType==='attack'?5:0),'Select a matching Fusion; prioritize Thousand-Eyes Restrict for the Level 1 control line.');}
  if(a.type==='ACTIVATE_TRIGGER'&&a.choiceId){const effect=s.pendingTriggers?.find(t=>t.sourceId===a.sourceId)?.effectId;
   if(effect==='TSUKUYOMI_SET'&&ter&&a.choiceId===ter)return score(absorbedMonster(s,ter)&&theirs.length?160:-25,'Reset an equipped Restrict to absorb again, including on later turns.');
   if(effect==='MOF_RECOVER'&&card(a.choiceId)?.id===METAMORPHOSIS)return score(theirs.length&&ours.some(id=>s.cards[id].token)?145:85,'Recover Metamorphosis when a token can convert it into control.');
  }
  if(a.type==='NORMAL_SUMMON'&&card(a.instanceId)?.id===34853266){const reset=ter&&absorbedMonster(s,ter)&&theirs.length;return score(a.position==='attack'&&reset?150:a.position==='attack'&&ours.some(id=>!s.cards[id].faceDown&&[31560081,74713516].includes(s.cards[id].cardId))?90:-15,'Use Tsukuyomi to reset an equipped Restrict or a useful flip engine.');}
  if(a.type==='NORMAL_SUMMON'&&card(a.instanceId)?.id===2134346&&s.turn===1)return score(-20,'Keep the Spirit in hand when it cannot attack before returning at the End Phase.');
  if(a.type==='TRIBUTE_SUMMON'){const c=card(a.instanceId),cost=a.materials.reduce((n,id)=>n+(s.cards[id].faceDown?2200:s.cards[id].cardId===TER&&absorbedMonster(s,id)?3000:atk(id)+300),0);return score(a.position==='attack'&&[18036057,77585513].includes(c?.id??0)&&cost<2600?70+(c?.id===18036057&&theirs.some(id=>s.cards[id].token)?30:0):-20,'Tribute a spent small body for a useful threat; Sheep Tokens remain excluded by the rules.');}
  if(a.type==='SET_SPELL_TRAP'&&card(a.instanceId)?.id===73915051)return score(own.zones.spell.some(id=>id&&card(id)?.id===73915051)?-25:45,'Set Scapegoat for the opponent’s turn to preserve next-turn summon options.');
  if(a.type==='ACTIVATE_BOOK_OF_MOON'&&s.cards[a.targetId]?.controller===seat&&s.cards[a.targetId].cardId===TER&&base.value<100)return score(!s.chain.length&&absorbedMonster(s,a.targetId)&&theirs.length&&!tsuku?105:-25,'Reset Restrict only when another absorption is useful, or preserve it from a real threat.');
  return base;
 });
}
