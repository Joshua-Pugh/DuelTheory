import {it,expect} from 'vitest';
import {analyzeSynergies} from './synergy';
it('reports evidence and missing partners without calling it engine validated',()=>{const result=analyzeSynergies({id:'1',name:'T',main:[1],side:[],extra:[]},[{id:1,name:'Thunder Dragon',type:'Effect Monster',desc:''}]);expect(result.find(x=>x.id==='thunder-chaos')?.missing).toEqual(['Chaos Sorcerer']);expect(result[0].status).toBe('documented');});
