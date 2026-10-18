import {it,expect} from 'vitest';
import {ashenGuidance} from './ashenGuidance';
import {newAshenDuel} from './games/ashen/duel';
it('guides the attacker and defender separately through combat',()=>{
 const s=newAshenDuel(['Brute','Noble'],42,0);
 expect(ashenGuidance(s).title).toContain('First main phase');
 s.rules!.duel!.phase='combat';s.rules!.duel!.combat={stage:'attack',attackers:[],blockers:{},blocked:[]};
 expect(ashenGuidance(s).title).toBe('Player 1: choose attackers');
 s.rules!.duel!.combat.stage='block';
 expect(ashenGuidance(s).title).toBe('Player 2: choose blockers');
 expect(ashenGuidance(s).text).toContain('including if you choose not to block');
});
