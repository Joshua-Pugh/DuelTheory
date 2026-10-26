import {ashenOpeningPlayer,ashenResponseOptions} from './games/ashen/duel';
import type {Battlefield} from './ashenBattlefieldState';
export const ashenPhaseName=(phase:string)=>({start:'Start Phase',main1:'First main phase',combat:'Skirmish Phase',main2:'Second main phase',end:'End Phase'}[phase]||phase);
/** Presentation only: the same rules and legal choices apply in both modes. */
export function ashenGuidance(s:Battlefield){
 const d=s.rules?.duel,player=`Player ${s.table.active+1}`;
 if(!d)return {title:'Playtest table',text:'Select a card to view its actions.'};
 if(d.winner!==undefined)return {title:'Duel finished',text:'Start another duel or exit the battlefield.'};
 if(ashenOpeningPlayer(s)!==null)return {title:'Choose opening hands',text:'One free redraw, then one fewer card per redraw. Both players must keep a hand before play begins.'};
 if(s.rules?.pending)return {title:'Finish the card effect',text:s.rules.pending.label+'. Follow the selection below; the turn waits for this choice.'};
 if(d.ordering)return {title:'Several effects triggered together',text:'Choose which effect resolves first, then confirm the order.'};
 if(d.priority){const entry=d.stack.at(-1),name=entry&&(s.table.cards[entry.context.source]?.name||entry.program.label);return {title:`Player ${Number(d.priority.holder)+1}: response opportunity`,text:`${name?name+' is waiting to resolve.':'Combat is waiting to continue.'} Available: ${ashenResponseOptions(s,d.priority.holder).map(o=>o.label).join('; ')}. Burn Ready Fonts first if you need essence. Select your card, or choose No response. Responses resolve newest first; this is called the Clash.`};}
 if(d.combat?.stage==='attack')return {title:player+': choose attackers',text:'Click Ready Units and choose Select as attacker, then attack. Reckless Units must attack if able. Choose Skip attacks to continue without attacking.'};
 if(d.combat?.stage==='block')return {title:`Player ${s.table.active===0?2:1}: choose blockers`,text:'Switch to the defender. Click an attacking Unit, then one of your legal Ready blockers. Confirm blockers when finished, including if you choose not to block. Damage is then resolved automatically.'};
 if(d.combat?.stage==='finished')return {title:'Combat finished',text:'Continue to the second main phase to play more cards before ending your turn.'};
 return {title:player+' · '+ashenPhaseName(d.phase),text:'Play a Font, burn Ready Fonts for essence, then click cards in hand and choose a play action or use abilities on your battlefield. F means fatigued: that card cannot Exhaust again until it Readies. Unspent essence fades at turn’s end.'};
}
