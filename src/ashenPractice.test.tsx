import {describe,it,expect} from 'vitest';
import {ashenFaceVisible} from './ashenBattlefieldState';
import {createPractice,practiceComplete} from './ashenPracticeScenarios';
import {ashenAdapter} from './games/ashen/adapter';
import {candidates} from './framework';
import {submitAshenAction,burnInBruteDuel,nextAshenPhase,declareAshenAttackers,resolveAshenCombat,passAshenPriority,resumeBruteDuel,newAshenDuel,chooseAshenOpening} from './games/ashen/duel';

import type {Battlefield} from './ashenBattlefieldState';
const card=(s:Battlefield,slug:string)=>Object.values(s.table.cards).find(c=>c.controller===0&&c.cardId.endsWith('-'+slug))!.instanceId;
function finish(start:Battlefield){let s=start;for(let n=0;n<100;n++){
 const p=s.rules?.pending;
 if(p){const step=p.flow.steps[0];let ids:string[]=[];
  if(step.op==='plan')ids=(p.flow.planIds||[]).map(id=>'t:'+id);
  else if(step.op==='mode')ids=step.options.slice(0,step.min).map(o=>o.id);
  else if(step.op==='choose'||step.op==='select')ids=candidates(s,ashenAdapter,step.selection,p.flow.context).sort((a,b)=>Number(b.controller==='1')-Number(a.controller==='1')).slice(0,step.selection.min??step.selection.count).map(e=>e.id);
  s=resumeBruteDuel(s,ids);continue;
 }
 if(s.rules?.duel?.priority){s=passAshenPriority(s,Number(s.rules.duel.priority.holder) as 0|1);continue;}
 return s;
 }throw Error('Practice failed to settle');}
const play=(s:Battlefield,slug:string,ability?:string)=>{const id=card(s,slug);return finish(submitAshenAction(s,id,{source:id,player:'0'},ability));};
describe('live AT practice situations',()=>{
 it('keeps redraw hands face up for the owner and opponents hidden',()=>{
  let s=newAshenDuel(['Brute','Noble'],42,0);s=chooseAshenOpening(s,0,'redraw');for(const id of s.table.piles['0:hand'])expect(s.table.cards[id].faceDown).toBe(false);
  s=chooseAshenOpening(s,0,'keep');s=chooseAshenOpening(s,1,'keep');const own=s.table.piles['0:hand'][0];s.table.cards[own].faceDown=true;
  expect(ashenFaceVisible(s.table.cards[own],0)).toBe(true);expect(ashenFaceVisible(s.table.cards[own],1)).toBe(false);
  const opponent=s.table.cards[s.table.piles['1:hand'][0]];expect(ashenFaceVisible(opponent,0)).toBe(false);
  const field={...s.table.cards[own],zone:'unit',faceDown:true};expect(ashenFaceVisible(field,0)).toBe(false);
 });
 it('completes the first attack using real costs, Charge, and the Keep bonus',()=>{
  let s=createPractice(0);expect(practiceComplete(0,s)).toBe(false);s=play(s,'fury-font');s=burnInBruteDuel(s,card(s,'fury-font'),0);s=play(s,'frenzied-grunt');s=nextAshenPhase(s);s=finish(declareAshenAttackers(s,[card(s,'frenzied-grunt')]));s=finish(resolveAshenCombat(s));expect(practiceComplete(0,s)).toBe(true);
 });
 it('completes Refine, the separate Bastion reward, and the Rune trigger chain',()=>{
  let s=play(createPractice(1),'shieldbearer-noble');expect(practiceComplete(1,s)).toBe(true);
  s=play(createPractice(2),'rune-of-clarity','clarity-refine');expect(practiceComplete(2,s)).toBe(true);
 });
 it('pays the actual Command discount and Fortifies both Nobles',()=>{
  const s=play(createPractice(3),'garrett-of-ashenfield');expect(s.basins[0].oath).toBe(0);expect(s.basins[0].untuned).toBe(0);expect(practiceComplete(3,s)).toBe(true);
 });
});
