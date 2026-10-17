import {describe,it,expect} from 'vitest';
import {parseYdk,exportYdk} from './ydk';
import type {Deck} from './types';
describe('YDK interchange',()=>{
 it('roundtrips duplicate IDs and all three sections',()=>{const deck:Deck={id:'a',name:'Test',main:[1,1,2],extra:[3],side:[4,4]};expect(parseYdk(exportYdk(deck))).toEqual({main:deck.main,extra:deck.extra,side:deck.side});});
 it('rejects malformed IDs',()=>expect(()=>parseYdk('#main\nwrong')).toThrow());
 it('rejects missing main section',()=>expect(()=>parseYdk('!side\n123')).toThrow());
});
