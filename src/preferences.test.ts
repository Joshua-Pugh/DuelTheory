import {describe,it,expect} from 'vitest';
import {DEFAULT_PREFERENCES,normalizePreferences} from './preferences';
import {explainLegalAction} from './engine/explain';
import type {DuelState} from './engine/model';
describe('locally saved duel preferences',()=>{
 it('defaults to guided experience',()=>expect(normalizePreferences(null)).toEqual(DEFAULT_PREFERENCES));
 it('keeps explicit boolean choices',()=>expect(normalizePreferences({mode:'competitive',confirmActions:true,showExplanations:false})).toMatchObject({mode:'competitive',confirmActions:true,showExplanations:false}));
 it('rejects invalid modes and preference types',()=>expect(normalizePreferences({mode:'arbitrary',confirmActions:'yes'})).toEqual(DEFAULT_PREFERENCES));
 it('uses rules-derived action types for explanations',()=>{
  const text=explainLegalAction({type:'NORMAL_SUMMON',seat:0,instanceId:'x',zone:0,position:'faceDownDefense',description:'Set'},{} as DuelState);
  expect(text).toContain('face-down in Defense Position');
 });
});
