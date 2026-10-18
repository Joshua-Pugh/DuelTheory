import {describe,it,expect} from 'vitest';
import {parseCommanderDamageInput} from './damageInput';
import {applyRoomCommand,newCommanderRoom} from './model';
describe('manual commander damage entry',()=>{
 it.each(['7','-7','−7',' 7 '])('accepts %s as seven damage received',text=>expect(parseCommanderDamageInput(text)).toBe(7));
 it('uses an explicit plus for a correction',()=>expect(parseCommanderDamageInput('+3')).toBe(-3));
 it.each(['','0','+0','-0','1000','1.5','7 damage','--7','NaN'])('rejects invalid entry %s',text=>expect(parseCommanderDamageInput(text)).toBeNull());
 it('applies plain-number damage and a correction to received damage and linked life',()=>{
  let s=newCommanderRoom('ABCDEFGH','Input test',2,'a');s=applyRoomCommand(s,'a',{type:'join',name:'A',commanders:['A']},'ja');s=applyRoomCommand(s,'b',{type:'join',name:'B',commanders:['B']},'jb');s=applyRoomCommand(s,'a',{type:'start'},'s');s=applyRoomCommand(s,'a',{type:'roll',round:1},'ra',0,()=>6);s=applyRoomCommand(s,'b',{type:'roll',round:1},'rb',0,()=>1);
  s=applyRoomCommand(s,'a',{type:'adjust',field:'damage',key:'b:0',delta:parseCommanderDamageInput('7')!,loseLife:true},'hit');expect(s.players[0]).toMatchObject({life:33,damage:{'b:0':7}});
  s=applyRoomCommand(s,'a',{type:'adjust',field:'damage',key:'b:0',delta:parseCommanderDamageInput('+3')!,loseLife:true},'fix');expect(s.players[0]).toMatchObject({life:36,damage:{'b:0':4}});
 });
});
