import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import catalog from '../public/catalog.json';
import {withGoatHistoricalText,goatHistoricalText,GOAT_TEXT_CUTOFF} from './goatHistoricalText';
import HistoricalTextNote from './HistoricalTextNote';

describe('GOAT historical presentation',()=>{
 it('keeps originals, applies only reviewed IDs and remains safe to apply twice',()=>{
  for(const [id,entry] of Object.entries(goatHistoricalText)){
   const card=catalog.find(c=>c.id===Number(id))!;
   const corrected=withGoatHistoricalText(card);
   expect(corrected.desc).toBe(entry.text);
   expect(corrected.image).toBe(entry.overlay);
   expect(corrected.fullImage).toBe(entry.overlay);
   expect(corrected.goatText?.originalDesc).toBe(card.desc);
   expect(corrected.goatText?.originalFullImage).toBe(card.fullImage);
   expect(withGoatHistoricalText(corrected)).toBe(corrected);
   expect(entry.cutoff).toBe(GOAT_TEXT_CUTOFF);
   expect(entry.text).not.toContain('GOAT effect:');
  }
  const unreviewed=catalog.find(c=>c.name==='Pot of Greed')!;
  expect(withGoatHistoricalText(unreviewed)).toBe(unreviewed);
 });
 it('does not reinstate later restrictions in the five historical corrections',()=>{
  const text=(id:number)=>goatHistoricalText[String(id)].text;
  expect(text(26202165)).not.toMatch(/once per turn|cannot activate/);
  expect(text(8131171)).not.toMatch(/banish|once per turn/);
  expect(text(16226786)).not.toContain('except "Night Assailant"');
  expect(text(40737112)).not.toContain('End Phase');
  expect(text(83555666)).not.toMatch(/opponent's turn|original ATK|once per turn/);
 });
 it('distinguishes reviewed overlays from unverified catalog text and links provenance',()=>{
  const reviewed=withGoatHistoricalText(catalog.find(c=>c.id===26202165)!);
  const markup=renderToStaticMarkup(<HistoricalTextNote card={reviewed}/>);
  expect(markup).toContain('reconstructed rules-box overlay');
  expect(markup).toContain('https://www.goatformat.com/rulings7.html');
  expect(markup).toContain('/cards/full/26202165.jpg');
  expect(renderToStaticMarkup(<HistoricalTextNote card={catalog[0]}/>)).toContain('not yet verified');
 });
});
