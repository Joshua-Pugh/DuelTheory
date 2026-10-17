import {describe,it,expect} from 'vitest';
import type {Card,Deck} from '../core/types';
import {createDuel,type DuelState} from './model';
import {dispatchDuel,legalActions,SANGAN,DEKOICHI} from './rules';
const data:Card[]=[
 {id:SANGAN,name:'Sangan',type:'Effect Monster',level:3,atk:1000,def:600,desc:''},
 {id:DEKOICHI,name:'Dekoichi',type:'Flip Effect Monster',level:4,atk:1400,def:1000,desc:''},
 {id:918,name:'Vanilla',type:'Normal Monster',level:4,atk:1800,def:1000,desc:''},
];
const ctx={cards:new Map(data.map(c=>[c.id,c]))};
const deck=(main:number[]):Deck=>({id:'x',name:'x',main,side:[],extra:[]});
function setup(){
 const s=createDuel(deck(Array(32).fill(918)),deck([SANGAN,DEKOICHI,...Array(30).fill(918)]),ctx,91);
 s.current=0;s.pendingDraw=false;s.phase='BATTLE';s.turn=2;
 for(const [seat,cardId,zone,faceDown] of [[0,918,0,false],[1,DEKOICHI,0,true],[1,SANGAN,1,false]] as const){
  const id=Object.keys(s.cards).find(id=>s.cards[id].owner===seat&&s.cards[id].cardId===cardId&&s.cards[id].location==='deck')!;
  s.players[seat].deck=s.players[seat].deck.filter(x=>x!==id);
  s.cards[id].location='monster';s.cards[id].zone=zone;s.cards[id].position=faceDown?'faceDownDefense':'attack';s.cards[id].faceDown=faceDown;s.players[seat].zones.monster[zone]=id;
 }
 return s;
}
function addMandatory(s:DuelState){
 const ids=s.players[1].zones.monster.filter((x):x is string=>Boolean(x));
 s.pendingTriggers=[{sourceId:ids[1],controller:1,effectId:'SANGAN_SEARCH',mandatory:true},{sourceId:ids[0],controller:1,effectId:'DEKOICHI_DRAW',mandatory:true}];
 return s;
}
describe('mandatory trigger batch scheduler',()=>{
 it('offers both trigger orders, then builds one chain before response priority',()=>{
  let s=addMandatory(setup());
  const options=legalActions(s,ctx,1).filter(x=>x.type==='ACTIVATE_TRIGGER');
  expect(new Set(options.map(x=>x.sourceId)).size).toBe(2);
  const deko=options.find(x=>x.sourceId===s.players[1].zones.monster[0]);
  expect(deko).toBeDefined();s=dispatchDuel(s,deko!,ctx);
  expect(s.chain).toHaveLength(1);
  expect(legalActions(s,ctx,0)).toEqual([]);
  const second=legalActions(s,ctx,1).find(x=>x.type==='ACTIVATE_TRIGGER');
  expect(second).toBeDefined();s=dispatchDuel(s,second!,ctx);
  expect(s.chain).toHaveLength(2);
  expect(legalActions(s,ctx,0).some(x=>x.type==='PASS_CHAIN')).toBe(true);
 });
 it('prioritizes turn player mandatory triggers before non-turn player',()=>{
  const s=addMandatory(setup());const attacker=s.players[0].zones.monster[0]!;
  s.pendingTriggers!.push({sourceId:attacker,controller:0,effectId:'DEKOICHI_DRAW',mandatory:true});
  expect(legalActions(s,ctx,1)).toEqual([]);
  expect(legalActions(s,ctx,0).some(x=>x.type==='ACTIVATE_TRIGGER')).toBe(true);
 });
});
