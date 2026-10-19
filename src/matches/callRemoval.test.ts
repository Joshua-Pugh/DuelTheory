import {it,expect} from 'vitest';
import data from '../../public/catalog.json';
import type {Card,Deck} from '../core/types';
import {createDuel} from '../engine/model';
import {legalActions} from '../engine/rules';
import {applyMatchCommand,member,matchView,type Match} from './model';
const catalog=data as Card[],ctx={cards:new Map(catalog.map(c=>[c.id,c]))};
const deck:Deck={id:'call-test',name:'Call test',main:[97077563,51945556,4178474,...Array(37).fill(71413901)],side:[],extra:[]};
it('private Call keeps its Zaborg link through save/restore and Raigeki Break destroys both',()=>{
 let m:Match={code:'TESTCALL',game:'goat',revision:1,members:[member('One',{deck}),member('Two',{deck})],phase:'playing',chat:[],manual:false,goat:createDuel(deck,deck,ctx,42)};
 m.goat!.turn=3;m.goat!.phase='MAIN_1';m.goat!.pendingDraw=false;
 function place(cardId:number,seat:0|1,location:'spell'|'graveyard',faceDown=false){const g=m.goat!,c=Object.values(g.cards).find(c=>c.cardId===cardId&&c.owner===seat)!;for(const p of g.players)for(const k of ['deck','hand'] as const)p[k]=p[k].filter(x=>x!==c.instanceId);Object.assign(c,{location,zone:location==='spell'?0:undefined,faceDown,setTurn:1});if(location==='spell')g.players[seat].zones.spell[0]=c.instanceId;else g.players[seat].graveyard.push(c.instanceId);return c.instanceId;}
 const call=place(97077563,0,'spell',true),zaborg=place(51945556,0,'graveyard'),breakId=place(4178474,1,'spell',true);
 function perform(test:(a:ReturnType<typeof legalActions>[number])=>boolean,seat:0|1){const a=matchView(m,seat,catalog).actions.find(test);expect(a).toBeDefined();m=applyMatchCommand(m,seat,{type:'goat',action:a!},catalog,42);m=JSON.parse(JSON.stringify(m));}
 function pass(){for(let i=0;i<10&&m.goat!.chain.length;i++){perform(a=>a.type==='PASS_CHAIN',m.goat!.priority);}}
 perform(a=>a.type==='ACTIVATE_DECK_EFFECT'&&a.instanceId===call&&a.targetId===zaborg,0);pass();
 expect(m.goat!.cards[call].linkedTarget).toBe(zaborg);expect(m.goat!.cards[zaborg].faceDown).toBe(false);
 // Finish any summon window before the separate removal action.
 for(let i=0;i<6&&m.goat!.summonResponse;i++){const g=m.goat!,seat=g.summonResponse!.priority??1;perform(a=>a.type==='PASS_SUMMON_RESPONSE'||a.type==='PASS_SUMMON_NEGATION',seat);}
 perform(a=>a.type==='ACTIVATE_DECK_EFFECT'&&a.instanceId===breakId&&a.targetId===call,1);pass();
 expect(m.goat!.cards[call].location).toBe('graveyard');expect(m.goat!.cards[zaborg].location).toBe('graveyard');
});
