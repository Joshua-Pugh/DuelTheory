import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {attackPresentation,attackPath,battleVisual,battleVisuals} from './attackPresentation';
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

describe('fast online attack visibility',()=>{
 function finished(){const {s,attacker}=setup();s.pendingAttack=undefined;s.events.push({type:'BATTLE',turn:s.turn,seat:0,message:'Direct attack'});s.lastBattle={turn:s.turn,eventIndex:s.events.length,attackerId:attacker,sourceId:attacker,damage:1600,damagedSeat:1,attack:1600};return {s,attacker};}
 it('keeps a completed attack visible across snapshots and reconnect renders',()=>{const {s,attacker}=finished();expect(battleVisual(s)).toMatchObject({completed:true,attack:{attackerId:attacker}});expect(battleVisual(structuredClone(s))).toEqual(battleVisual(s));const view=html(s,0);expect(view).toContain('LAST ATTACK');expect(view).toContain('data-attack-stage="last"');});
 it('clears the last line when Battle Phase ends or the turn changes',()=>{const {s}=finished();s.phase='MAIN_2';expect(battleVisual(s)).toBeNull();s.phase='BATTLE';s.turn++;expect(battleVisual(s)).toBeNull();});
 it('replaces the last line with a new attack, and clears it if that attack is canceled',()=>{const {s,attacker}=finished();s.pendingAttack={attackerId:attacker,attacker:0,defender:1};s.events.push({type:'ATTACK_DECLARE',turn:s.turn,seat:0,message:'New attack'});expect(battleVisual(s)?.completed).toBe(false);s.pendingAttack=undefined;s.events.push({type:'ATTACK_CANCEL',turn:s.turn,seat:0,message:'Canceled'});expect(battleVisual(s)).toBeNull();});
});

it('renders multiple completed attacks and keeps a new declaration distinct',()=>{
 const {s,attacker}=setup();s.pendingAttack=undefined;const second=Object.values(s.cards).find(c=>c.owner===0&&c.cardId===24317029)!.instanceId;
 const result={attackerSeat:0 as const,turn:s.turn,attackerId:attacker,attackerZone:0,sourceId:attacker,damagedSeat:1 as const,damage:1600,attack:1600,eventIndex:s.events.length};s.lastBattle={...result,attackerId:second,sourceId:second,attackerZone:1,eventIndex:s.events.length+2};s.battleHistory=[result,s.lastBattle];
 expect(html(s,1)).toContain('data-attack-count="2"');expect(html(s,1)).toContain('ATTACKED');
 s.pendingAttack={attackerId:'another',attacker:0,defender:1};s.events.push({type:'ATTACK_DECLARE',message:'Next attack',turn:s.turn,seat:0});s.events.push({type:'PASS',message:'',turn:s.turn,seat:1});s.events.push({type:'ATTACK_DECLARE',message:'Third attack',turn:s.turn,seat:0});
 expect(battleVisuals(s).filter(v=>v.completed)).toHaveLength(2);expect(battleVisuals(s).at(-1)?.completed).toBe(false);
});
