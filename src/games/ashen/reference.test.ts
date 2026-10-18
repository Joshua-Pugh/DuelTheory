import {describe,it,expect} from 'vitest';
import {ASHEN_KEYWORDS,ASHEN_RULES} from './reference';
import {ashenEffects} from './effectPacks';
describe('current AT duel reference',()=>{
 it('defines every explicit deck keyword without duplicate headings',()=>{
  const names=ASHEN_KEYWORDS.map(([name])=>name.toLowerCase());expect(new Set(names).size).toBe(names.length);
  for(const effect of Object.values(ashenEffects))for(const keyword of effect.keywords||[])expect(names.some(name=>name===keyword.toLowerCase()||name.startsWith(keyword.toLowerCase()+' ')),keyword).toBe(true);
 });
 it('retains the creator rulings and the actual prototype deck-out rule',()=>{
  const text=ASHEN_RULES.map(r=>r.text).join(' ');expect(text).toContain('hand or Ossuary');expect(text).toContain('zero damage does not trigger');expect(text).toContain('both draw decks are empty');expect(text).toContain('no mulligan');
 });
});
