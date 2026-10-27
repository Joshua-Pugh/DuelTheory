import {newAshenDuel,chooseAshenOpening} from './games/ashen/duel';
import {moveAshenCard} from './games/ashen/adapter';
import type {Battlefield} from './ashenBattlefieldState';
export const practiceLessons=[
 {id:'first-attack',title:'Brutes: pay for your first attack',setup:'Your hand contains Fury Font and Frenzied Grunt. The opposing Frontline is empty. Your Station is The Broken Fist Keep.',goal:'Deal 2 combat damage to the enemy Station with Frenzied Grunt.',steps:'Click Fury Font → Play. Click the Ready Font → Burn. Play Frenzied Grunt for one Fury. Enter SP, select the Grunt as an attacker, then declare the attack. If blocking pauses, switch to Player 2 and confirm no blockers.',reason:'Charge lets the Grunt attack now. The Keep adds 1 Attack when your Brute attacks: its printed 1 becomes 2. Paying for a card, deploying it, declaring an attack and dealing damage are separate events.'},
 {id:'refine',title:'Nobles: exchange a card with Refine',setup:'You have one Oath in the Basin, Shieldbearer Noble and two expensive Nobles in hand. Your next draw is Oath Font.',goal:'Play Shieldbearer Noble, draw the Font, then finish Refine by bottoming a hand card.',steps:'Play Shieldbearer Noble. Resolve its Refine 1 prompt. Compare the costs in your hand before choosing what to put on the bottom. Your Bastion may then ask you to choose its separate reward; finish that choice too.',reason:'Refine draws before you choose the card to bottom. Keeping the new Font can help you pay for a future turn. You do not have to return the card you just drew. The entering Shieldbearer is fatigued and stays upright.'},
 {id:'runes',title:'Nobles: resolve the Runes in order',setup:'Rune of Clarity and Rune of Foresight are already in play. You have exactly one Oath in the Basin. Your hand and the next two draws are fixed for this exercise.',goal:'Use Clarity to Refine 2, finish both bottoming choices and deal at least 4 damage to the enemy Station.',steps:'Click Rune of Clarity and pay one Oath for Refine 2. Each drawn card triggers Clarity; choose the enemy Station for each damage prompt. Finish Refine’s two bottoming choices. Each bottomed card triggers Foresight. Resolve the Bastion’s separate reward as well.',reason:'One Refine 2 produces two draw events and two bottoming events. Clarity watches draws; Foresight watches bottoming. Read the source and player on each prompt. A new prompt is often another trigger, not the same choice being repeated.'},
 {id:'command',title:'Nobles: pay a discounted Command cost',setup:'This prepared turn has already recorded one Plan and one Refine. You have 2 Untuned and 2 Oath in the Basin. Garrett is in hand and Shieldbearer Noble is on the Frontline.',goal:'Deploy Garrett for the reduced cost and let his entry Fortify both Nobles.',steps:'Read Garrett’s cost reduction, then open his card action menu and play him. Check that both the entering Garrett and your Shieldbearer receive Fortify 1. Compare the Basin before and after payment.',reason:'Command reduces the generic part of the cost by one per Plan or Refine. It does not remove Garrett’s two Oath requirement. His entry affects all Nobles you control, including himself. Fortify increases both Attack and Defense.'}
] as const;
export function createPractice(index:number):Battlefield{
 const lesson=practiceLessons[index];if(!lesson)throw Error('Unknown practice lesson');
 const noble=index>0;let s=newAshenDuel([noble?'Noble':'Brute',noble?'Brute':'Noble'],731+index,0);
 s=chooseAshenOpening(s,0,'keep');s=chooseAshenOpening(s,1,'keep');
 for(const seat of [0,1] as const)for(const id of [...s.table.piles[`${seat}:hand`]])moveAshenCard(s,id,'deck');
 const put=(slug:string,zone:string)=>{const card=Object.values(s.table.cards).find(c=>c.controller===0&&c.cardId===`ashen-${noble?'noble':'brute'}-${slug}`&&c.zone==='deck');if(!card)throw Error('Missing practice card '+slug);if(card.zone!==zone)moveAshenCard(s,card.instanceId,zone);card.faceDown=false;card.rotated=false;return card.instanceId;};
 const top=(slugs:string[])=>{const ids=slugs.map(slug=>put(slug,'deck'));s.table.piles['0:deck']=[...ids,...s.table.piles['0:deck'].filter(id=>!ids.includes(id))];};
 if(index===0){put('fury-font','hand');put('frenzied-grunt','hand');}
 if(index===1){put('shieldbearer-noble','hand');put('garrett-of-ashenfield','hand');put('royal-longbowman','hand');top(['oath-font']);s.basins[0].oath=1;}
 if(index===2){put('rune-of-clarity','support');put('rune-of-foresight','support');put('garrett-of-ashenfield','hand');put('royal-longbowman','hand');top(['oath-font','shieldbearer-noble']);s.basins[0].oath=1;}
 if(index===3){put('garrett-of-ashenfield','hand');put('shieldbearer-noble','unit');s.rules!.nobleMarks={0:{planned:1,refined:1}};s.basins[0].untuned=2;s.basins[0].oath=2;}
 s.table.events=['Practice situation prepared. No saved duel is changed.'];return s;
}
export function practiceComplete(index:number,s:Battlefield){
 if(s.rules?.pending||s.rules?.duel?.priority||s.rules?.duel?.stack.length)return false;
 const own=(slug:string)=>Object.values(s.table.cards).find(c=>c.controller===0&&c.cardId.endsWith('-'+slug));
 if(index===0)return s.table.health[1]===18&&own('frenzied-grunt')?.zone==='unit';
 if(index===1)return own('shieldbearer-noble')?.zone==='unit'&&(s.rules?.nobleMarks?.[0]?.refined||0)>=1;
 if(index===2)return s.table.health[1]<=16&&(s.rules?.nobleMarks?.[0]?.refined||0)>=1;
 return own('garrett-of-ashenfield')?.zone==='unit'&&(own('garrett-of-ashenfield')?.counters||0)>=1&&(own('shieldbearer-noble')?.counters||0)>=1;
}
