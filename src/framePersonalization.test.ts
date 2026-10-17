import {describe,expect,it} from 'vitest';
import {DEFAULT_LOOK,normalizeLook} from './framePersonalization';

describe('frame personalization',()=>{
 it('uses safe defaults when settings are unavailable',()=>{
   expect(normalizeLook(null)).toEqual(DEFAULT_LOOK);
 });
 it('rejects invalid color values and clamps crop/zoom',()=>{
   expect(normalizeLook({accent:'red',paper:'#ABCDEF',zoom:12,panX:-40,panY:200})).toEqual({accent:DEFAULT_LOOK.accent,paper:'#ABCDEF',zoom:2,panX:0,panY:100});
 });
 it('accepts valid personalized colors and transforms',()=>{
   expect(normalizeLook({accent:'#123456',paper:'#ffdead',zoom:1.3,panX:32,panY:74})).toEqual({accent:'#123456',paper:'#ffdead',zoom:1.3,panX:32,panY:74});
 });
});
