import {describe,it,expect} from 'vitest';
import {createPractice} from './ashenPracticeScenarios';
import {ownResponsePassKey} from './ashenResponsePolicy';
function responding(){const s=createPractice(0);const d=s.rules!.duel!;d.stack=[{kind:'action',program:{version:1,id:'font',label:'Play Font',steps:[]},context:{source:'font-1',player:'0'}}];d.priority={players:['0','1'],holder:'0',passed:['1']};return s;}
describe('own response convenience',()=>{
 it('passes only the acting players own opportunity unless held',()=>{const s=responding();expect(ownResponsePassKey(s,0,false)).toBeTruthy();expect(ownResponsePassKey(s,0,true)).toBeNull();expect(ownResponsePassKey(s,1,false)).toBeNull();});
 it('preserves the opponents response opportunity',()=>{const s=responding();s.rules!.duel!.priority!.holder='1';expect(ownResponsePassKey(s,1,false)).toBeNull();});
 it('does not pass while trigger ordering or a card permission needs a choice',()=>{const s=responding();s.rules!.duel!.ordering=true;expect(ownResponsePassKey(s,0,false)).toBeNull();s.rules!.duel!.ordering=false;s.rules!.duel!.callPermission='call';expect(ownResponsePassKey(s,0,false)).toBeNull();});
});
