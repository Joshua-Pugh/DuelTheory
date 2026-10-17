import {describe,it,expect} from 'vitest';
import {qualifies,runHandReport} from './simulation';
import type {Deck} from './types';
const demo:Deck={id:'demo',name:'Test',main:[...Array(20).fill(1),...Array(20).fill(2)],side:[],extra:[]};
describe('testing lab report',()=>{
 it('understands OR within a group and AND between groups',()=>{
  expect(qualifies([1,3,5],[[1,2],[3,4]])).toBe(true);
  expect(qualifies([1,5],[[1,2],[3,4]])).toBe(false);
  expect(qualifies([1,5],[])).toBe(false);
 });
 it('reproduces reports with identical seeds',()=>{
  const conditions=[{name:'two types',groups:[[1],[2]]}];
  expect(runHandReport(demo,conditions,1000,5,42)).toEqual(runHandReport(demo,conditions,1000,5,42));
 });
 it('returns meaningful hit counts and zero for missing cards',()=>{
  const r=runHandReport(demo,[{name:'always',groups:[[1,2]]},{name:'never',groups:[[3]]}],500);
  expect(r.conditions[0].hits).toBe(500);
  expect(r.conditions[1].hits).toBe(0);
  expect(r.conditions[1].standardError).toBe(0);
 });
 it('rejects impossible hand sizes and invalid runs',()=>{
  expect(()=>runHandReport(demo,[],0)).toThrow();
  expect(()=>runHandReport(demo,[],100,41)).toThrow();
 });
});
