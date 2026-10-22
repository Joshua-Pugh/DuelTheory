import {expect,it} from 'vitest';
import json from '../../public/catalog.json';
import type {Card,Deck} from '../core/types';
import {createDuel,type DuelState} from './model';
import {dispatchDuel,legalActions,MANJU,SENJU} from './rules';
import {SHINATO,SHINATOS_ARK} from './rituals';
const cards=new Map((json as Card[]).map(c=>[c.id,c])),ctx={cards};
const deck:Deck={id:'ritual-search',name:'Ritual search test',main:[MANJU,SENJU,SHINATO,SHINATOS_ARK,...Array(36).fill(31786629)],side:[],extra:[]};
function move(s:DuelState,cardId:number,location:'hand'|'graveyard'|'monster'){
 const c=Object.values(s.cards).find(c=>c.owner===0&&c.cardId===cardId)!;for(const key of ['hand','deck','graveyard'] as const)s.players[0][key]=s.players[0][key].filter(id=>id!==c.instanceId);
 c.location=location;if(location==='monster'){c.zone=0;c.faceDown=true;c.position='faceDownDefense';c.summonedTurn=1;s.players[0].zones.monster[0]=c.instanceId;}else s.players[0][location].push(c.instanceId);return c.instanceId;
}
it.each([MANJU,SENJU].flatMap(cardId=>['normal','flip'].map(mode=>({cardId,mode}))))('continues after $cardId $mode with no Ritual targets left',({cardId,mode})=>{
 let s=createDuel(deck,deck,ctx,42);s.turn=3;s.phase='MAIN_1';s.pendingDraw=false;move(s,SHINATO,'graveyard');move(s,SHINATOS_ARK,'graveyard');const id=move(s,cardId,mode==='normal'?'hand':'monster');
 const action=legalActions(s,ctx,0).find(a=>a.type===(mode==='normal'?'NORMAL_SUMMON':'FLIP_SUMMON')&&'instanceId'in a&&a.instanceId===id&&(!('position'in a)||a.position==='attack'))!;
 expect(action).toBeDefined();s=dispatchDuel(s,action,ctx);expect(s.pendingSearch).toBeUndefined();expect(legalActions(s,ctx,0).some(a=>a.type==='ADVANCE')).toBe(true);expect(s.events.some(e=>e.type==='SEARCH_UNAVAILABLE')).toBe(true);
});
it.each([MANJU,SENJU])('offers a remaining Ritual Spell only for Manju (source %i)',cardId=>{
 let s=createDuel(deck,deck,ctx,42);s.turn=3;s.phase='MAIN_1';s.pendingDraw=false;move(s,SHINATO,'graveyard');const ark=move(s,SHINATOS_ARK,'graveyard');s.players[0].graveyard=s.players[0].graveyard.filter(id=>id!==ark);s.cards[ark].location='deck';s.players[0].deck.push(ark);const id=move(s,cardId,'hand');
 s=dispatchDuel(s,legalActions(s,ctx,0).find(a=>a.type==='NORMAL_SUMMON'&&a.instanceId===id&&a.position==='attack')!,ctx);expect(Boolean(s.pendingSearch)).toBe(cardId===MANJU);
 if(cardId===MANJU)expect(legalActions(s,ctx,0).some(a=>a.type==='TRIGGER_SEARCH'&&a.searchId===ark)).toBe(true);
});
