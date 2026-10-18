import {describe,it,expect} from 'vitest';
import catalogJson from '../../public/catalog.json';
import type {Card} from '../core/types';
import MATT_MONARCHS from '../engine/fixtures/matt-monarchs.json';
import {applyMatchCommand,matchView,member,validateSideboard,type Match} from './model';
const catalog=catalogJson as Card[];
function started(game:'goat'|'ashen'='goat',mode:'best3'|'single'='best3'){
 const pick=game==='goat'?{deck:MATT_MONARCHS}:{faction:'Noble' as const};let s:Match={code:'ABCDEFGH',game,revision:0,phase:'lobby',members:[member('A',pick),member('B',pick)],chat:[],series:{mode,wins:[0,0],results:[],ready:[false,false]}};
 for(const seat of [0,1] as const)s=applyMatchCommand(s,seat,{type:'ready',value:true},catalog,42);
 for(const seat of [0,1] as const)s=applyMatchCommand(s,seat,{type:'begin'},catalog,42);return s;
}
const act=(s:Match,seat:0|1,c:Parameters<typeof applyMatchCommand>[2])=>applyMatchCommand(s,seat,c,catalog,123456);
describe('private match series',()=>{
 it('single games finish with no sideboarding',()=>{const s=act(started('goat','single'),1,{type:'concede'});expect(s.phase).toBe('complete');expect(s.series?.wins).toEqual([1,0]);expect(()=>act(s,0,{type:'sideboard',deck:MATT_MONARCHS})).toThrow();});
 it('validates one-for-one swaps against the complete registered card multiset',()=>{const d=structuredClone(MATT_MONARCHS);[d.main[0],d.side[0]]=[d.side[0],d.main[0]];expect(()=>validateSideboard(MATT_MONARCHS,d)).not.toThrow();d.main[0]=55144522;expect(()=>validateSideboard(MATT_MONARCHS,d)).toThrow();expect(()=>validateSideboard(MATT_MONARCHS,{...d,main:d.main.slice(1)})).toThrow();});
 it('locks both decks, gives loser turn choice, resets board and ends on second win',()=>{let s=act(started(),1,{type:'concede'});expect(s.phase).toBe('sideboarding');expect(s.series?.chooser).toBe(1);expect(s.series?.wins).toEqual([1,0]);const before=JSON.stringify(s.series);s=act(s,0,{type:'chat',text:'gg'});expect(JSON.stringify(s.series)).toBe(before);
 const d=structuredClone(MATT_MONARCHS);[d.main[0],d.side[0]]=[d.side[0],d.main[0]];s=act(s,0,{type:'sideboard',deck:d});expect(s.phase).toBe('sideboarding');expect(()=>act(s,0,{type:'sideboard',deck:d})).toThrow();expect(()=>act(s,1,{type:'chooseFirst',first:1})).toThrow();s=act(s,1,{type:'sideboard',deck:MATT_MONARCHS});expect(s.phase).toBe('turnChoice');expect(()=>act(s,0,{type:'chooseFirst',first:0})).toThrow();s=act(s,1,{type:'chooseFirst',first:1});expect(s.phase).toBe('playing');expect(s.goat?.current).toBe(1);expect(s.goat?.turn).toBe(1);expect(s.goat?.players.map(p=>p.hand.length)).toEqual([5,5]);expect(s.manual).toBe(false);s=act(s,1,{type:'concede'});expect(s.phase).toBe('complete');expect(s.series?.wins).toEqual([2,0]);});
 it('never discloses registered pools or opponent swaps',()=>{const s=act(started(),0,{type:'concede'}),v=matchView(s,1,catalog);expect(v.series).not.toHaveProperty('registered');expect(v.ownDeck).toEqual(MATT_MONARCHS);expect(v).not.toHaveProperty('goat');expect(v.members[0]).not.toHaveProperty('pick');});
 it('supports AT series without introducing side decks',()=>{let s=act(started('ashen'),0,{type:'concede'});expect(s.phase).toBe('sideboarding');for(const seat of [0,1] as const)s=act(s,seat,{type:'sideboard'});s=act(s,0,{type:'chooseFirst',first:0});expect(s.ashen?.table.health).toEqual([20,20]);expect(s.series?.wins).toEqual([0,1]);});
 it('does not award a game win for a draw',()=>{let s=started();s.goat!.drawnGame=true;s=act(s,0,{type:'chat',text:'draw'});expect(s.series?.results).toEqual(['draw']);expect(s.series?.wins).toEqual([0,0]);expect(s.phase).toBe('sideboarding');});
 it('leaving immediately forfeits the entire series, clears waiting pauses and rejects future moves',()=>{let s=started();s.choosing={seat:0,until:Date.now()+20000};s.reveal={id:'pending',controller:0,cardId:71413901,expiresAt:Date.now()+15000};s=act(s,0,{type:'leave'});expect(s.phase).toBe('complete');expect(s.members[0].left).toBe(true);expect(s.series?.forfeited).toBe(0);expect(s.goat?.winner).toBe(1);expect(s.reveal).toBeUndefined();expect(s.choosing).toBeUndefined();expect(()=>act(s,0,{type:'chat',text:'late action'})).toThrow('left this room');});
 it('leaving during siding closes the match immediately',()=>{let s=act(started(),1,{type:'concede'});s=act(s,0,{type:'leave'});expect(s.phase).toBe('complete');expect(s.series?.forfeited).toBe(0);expect(()=>act(s,1,{type:'sideboard',deck:MATT_MONARCHS})).toThrow();});

});
