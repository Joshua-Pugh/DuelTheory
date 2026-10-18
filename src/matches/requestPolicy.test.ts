import {describe,it,expect} from 'vitest';
import {matchRateKey,pollDelay,automaticActionKey,AutomaticActionGate} from './requestPolicy';
describe('private-room request policy',()=>{
 it('separates players sharing an IP while bounding anonymous entry traffic',()=>{expect(matchRateKey('ROOM','alice','read','shared')).not.toBe(matchRateKey('ROOM','bob','read','shared'));expect(matchRateKey('ROOM','alice','read','one')).toBe(matchRateKey('ROOM','alice','action','two'));expect(matchRateKey('ROOM','alice','join','shared')).toBe(matchRateKey('OTHER','bob','create','shared'));});
 it('backs off polling and honors the server cooldown with a bounded delay',()=>{expect(pollDelay(1)).toBe(4000);expect(pollDelay(4)).toBe(30000);expect(pollDelay(1,15000)).toBe(15000);expect(pollDelay(100,120000)).toBe(60000);});
 it('prevents a failed automatic action spinning until cooldown or a new revision',()=>{const gate=new AutomaticActionGate(),key=automaticActionKey(7,{type:'PASS_CHAIN'});expect(gate.claim(key,0)).toBe(true);expect(gate.claim(key,1)).toBe(false);gate.retryAfter(key,15000,2);expect(gate.claim(key,1000)).toBe(false);expect(gate.claim(key,15002)).toBe(true);expect(gate.claim(automaticActionKey(8,{type:'PASS_CHAIN'}),15003)).toBe(true);});
});
