import {expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {newAshenDuel,submitAshenAction,resumeBruteDuel,passAshenPriority,advanceAshenTo,declareAshenAttackers,settleAshenDuel} from './duel';
import {moveAshenCard,ashenStats,drainTriggers,ashenAdapter} from './adapter';
import {executeProgram} from '../../framework';
import AshenStatBreakdown from '../../AshenStatBreakdown';
import type {Battlefield} from '../../ashenBattlefieldState';
function put(s:Battlefield,slug:string,zone='unit'){const id=Object.values(s.table.cards).find(c=>c.controller===0&&c.cardId==='ashen-noble-'+slug)!.instanceId;if(s.table.cards[id].zone!==zone)moveAshenCard(s,id,zone);return id;}
function finish(start:Battlefield){let s=start,steps=0;for(;steps<100;steps++){
 const flow=s.rules?.pending?.flow,step=flow?.steps[0];
 if(step?.op==='plan')s=resumeBruteDuel(s,flow!.planIds!.map(id=>'t:'+id));
 else if(step?.op==='mode')s=resumeBruteDuel(s,['draw']);
 else if(step?.op==='choose')s=resumeBruteDuel(s,step.selection.optional?[]:s.table.piles[`${flow!.context.player}:hand`].slice(0,step.selection.count));
 else if(step?.op==='select')s=resumeBruteDuel(s,[s.table.piles['1:command'][0]]);
 else if(s.rules!.duel!.priority)s=passAshenPriority(s,Number(s.rules!.duel!.priority!.holder) as 0|1);else break;
 }expect(steps).toBeLessThan(100);return s;}
it('keeps Seraphine at 4/6 with Longbowman and both Runes through finite Plan/Refine damage chains',()=>{
 let s=newAshenDuel(['Noble','Noble'],42,0);s.basins[0].oath=99;const seraphine=put(s,'seraphine-royal-advisor');put(s,'royal-longbowman');const clarity=put(s,'rune-of-clarity','support'),foresight=put(s,'rune-of-foresight','support');
 s=finish(submitAshenAction(s,foresight,{player:'0',source:foresight},'foresight-plan'));expect(s.table.health[1]).toBe(19);
 s=finish(submitAshenAction(s,clarity,{player:'0',source:clarity},'clarity-refine'));expect(s.table.health[1]).toBe(13);expect(ashenStats(s,seraphine)).toMatchObject({attack:4,defense:6,bonuses:[]});expect(s.rules!.nobleMarks?.[0]).toMatchObject({planned:1,refined:1});
 // Bastion is the stat-granting effect: it Fortifies both stats at End after Plan + Refine.
 s=advanceAshenTo(s,'end');expect(s.rules!.pending?.flow.context.source).toBe(s.table.piles['0:command'][0]);s=resumeBruteDuel(s,[seraphine]);while(s.rules!.duel!.priority)s=passAshenPriority(s,Number(s.rules!.duel!.priority!.holder) as 0|1);expect(ashenStats(s,seraphine)).toMatchObject({attack:5,defense:7});
});
it('keeps Royal Guard’s Refine attack bonus on Royal Guard, with source metadata',()=>{
 const s=newAshenDuel(['Noble','Noble'],42,0),seraphine=put(s,'seraphine-royal-advisor'),guard=put(s,'royal-guard'),entity=ashenAdapter.entities(s).find(e=>e.id===seraphine)!;
 const next=finish(settleAshenDuel(drainTriggers(s,[{kind:'refined',source:seraphine,player:'0',entity}])));expect(ashenStats(next,seraphine)).toMatchObject({attack:4,defense:6,bonuses:[]});expect(ashenStats(next,guard).bonuses).toContainEqual({label:'Royal Guard',attack:1,defense:0});
});
it('does not grant the Keep’s Brute-only attack bonus to a Noble attacker',()=>{
 let s=newAshenDuel(['Noble','Brute'],42,0);const seraphine=put(s,'seraphine-royal-advisor'),station=s.table.piles['0:command'][0];s.table.cards[station].cardId='ashen-brute-the-broken-fist-keep';s.table.cards[station].name='The Broken Fist Keep';s.rules!.duel!.phase='combat';s.rules!.duel!.combat={stage:'attack',attackers:[],blockers:{},blocked:[]};s=finish(declareAshenAttackers(s,[seraphine]));expect(ashenStats(s,seraphine).attack).toBe(4);
});
it('shows the source of an Attack-only modifier in the reader',()=>{
 const s=newAshenDuel(['Noble','Noble'],42,0),seraphine=put(s,'seraphine-royal-advisor'),source=put(s,'royal-guard');const result=executeProgram(s,ashenAdapter,{version:1,id:'audit',label:'Audit',targets:{filter:{zones:['unit']},count:1,label:'Unit'},steps:[{op:'modify',targets:'targets',stats:{attack:1},duration:'turn'}]},{player:'0',source,targets:[seraphine]});
 expect(renderToStaticMarkup(<AshenStatBreakdown state={result.state} id={seraphine}/>)).toContain('Royal Guard: +1A / +0D');
});
