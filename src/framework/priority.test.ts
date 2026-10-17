import {it,expect} from 'vitest';
import {openPriority,passPriority} from './priority';
it('cycles arbitrary participants and completes after every player passes',()=>{let p=openPriority(['alpha','beta','gamma'],'alpha');expect(p.holder).toBe('beta');expect(()=>passPriority(p,'alpha')).toThrow('priority');let result=passPriority(p,'beta');expect(result.done).toBe(false);result=passPriority(result.priority,'gamma');expect(result.done).toBe(false);result=passPriority(result.priority,'alpha');expect(result.done).toBe(true);});
