import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import records from './data/goatHistoricalText.json';

it('uses self-contained faces with unchanged scans and protected type/stat regions',()=>{
 for(const [id,entry] of Object.entries(records)){
  const original=readFileSync(`public/cards/full/${id}.jpg`);
  expect(createHash('sha256').update(original).digest('hex')).toBe(entry.originalSha256);
  const svg=readFileSync(`public${entry.overlay}`,'utf8');
  expect(svg).toContain(`data:image/jpeg;base64,${original.toString('base64')}`);
  expect(svg).toContain('viewBox="0 0 813 1185"');
  const rectangle=svg.match(/<rect x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)"/);
  expect(Number(rectangle[1])).toBeGreaterThan(50);
  expect(Number(rectangle[2])+Number(rectangle[4])).toBeLessThan(id==='83555666'?1115:1078);
  if(id!=='83555666')expect(Number(rectangle[2])).toBeGreaterThanOrEqual(925);
 }
});
