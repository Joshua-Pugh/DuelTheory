import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {attackPresentation,attackPath} from './attackPresentation';
import DuelField from './DuelField';
import {createDuel} from './engine/model';
import {dispatchDuel,legalActions} from './engine/rules';
import data from '../public/catalog.json';
import {CHAOS_TURBO} from './supportedDecks';
import type {Card} from './core/types';
const catalog=data as Card[],cards=new Map(catalog.map(c=>[c.id,c])),ctx={cards};
function setup(target=false){let s=createDuel(CHAOS_TURBO,{...CHAOS_TURBO,main:[...CHAOS_TURBO.main,56120475]},ctx,42);s.turn=3;s.current=0;s.pendingDraw=false;s.phase='BATTLE';const attacker=Object.values(s.cards).find(c=>c.owner===0&&c.cardId===71413901)!.instanceId;
 function move(id:string,owner:0|1,zone:number,location:'monster'|'spell',faceDown=false){for(const p of s.players)for(const k of ['deck','hand'] as const)p[k]=p[k].filter(x=>x!==id);Object.assign(s.cards[id],{controller:owner,location,zone,faceDown,position:faceDown?'faceDownDefense':'attack',setTurn:1,summonedTurn:1});s.players[owner].zones[location][zone]=id;}
 move(attacker,0,0,'monster');const armor=Object.values(s.cards).find(c=>c.owner===1&&c.cardId===56120475)!.instanceId;move(armor,1,0,'spell',true);
 const defender=Object.values(s.cards).find(c=>c.owner===1&&c.cardId===31560081)!.instanceId;if(target)move(defender,1,2,'monster',true);
 s=dispatchDuel(s,legalActions(s,ctx,0).find(a=>a.type==='DECLARE_ATTACK'&&a.attackerId===attacker)!,ctx);return {s,attacker,defender};}
function html(s:ReturnType<typeof setup>['s'],seat:0|1){return renderToStaticMarkup(<DuelField fixedSeat={seat} state={s} catalog={catalog} actions={legalActions(s,ctx,seat)} onAction={()=>{}} onManual={()=>{}} manualMode={false} onSkipPhase={()=>{}} onUndo={()=>{}} onVerify={()=>{}} onExit={()=>{}} notice=""/>);}
describe('attack indicators and response context',()=>{
 it('identifies a direct attack and marks the attacker for both seats',()=>{const {s}=setup();expect(attackPresentation(s,cards)?.label).toContain('Breaker the Magical Warrior → Player 2 · direct attack');for(const seat of [0,1] as const){const view=html(s,seat);expect(view).toContain('dt-is-attacking');expect(view).toContain('ATTACKING');expect(view).toContain('dt-attack-line');expect(view).toContain('data-player="1"');}});
 it('names the attacker on Sakuretsu Armor’s response button',()=>{const {s}=setup();const view=html(s,1);expect(view).toContain('Activate Sakuretsu Armor · destroy Breaker the Magical Warrior');expect(view).toContain('dt-attack-details');});
 it('marks a face-down target without revealing its identity',()=>{const {s}=setup(true);expect(attackPresentation(s,cards)?.targetName).toBe('face-down monster (Zone 3)');const view=html(s,0);expect(view).toContain('dt-is-attack-target');expect(view).not.toContain('Breaker the Magical Warrior → Magician of Faith');});
 it('shows replay context and removes active indicators when an attack ends',()=>{const {s}=setup();s.pendingAttack!.replay=true;expect(attackPresentation(s,cards)?.label).toContain('choose a new target');s.pendingAttack=undefined;expect(attackPresentation(s,cards)).toBeNull();expect(html(s,1)).not.toContain('dt-is-attacking');});
 it('uses board coordinates for a curved source-to-target arrow',()=>{expect(attackPath({x:20,y:300},{x:100,y:80})).toBe('M 20 300 C 20 190, 100 190, 100 80');});
});
