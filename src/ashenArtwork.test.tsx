import {expect,it} from 'vitest';
import {existsSync} from 'node:fs';
import {renderToStaticMarkup} from 'react-dom/server';
import AshenCardFrame from './AshenCardFrame';
import {ashenArtwork} from './ashenArtwork';
it('ships every mapped artwork file and keeps the corrected pit and shared Ring assignments',()=>{
 expect(Object.keys(ashenArtwork)).toHaveLength(15);
 for(const a of Object.values(ashenArtwork))for(const image of [a.image,...(a.alternates??[]).map(x=>x.image)])expect(existsSync('public'+image)).toBe(true);
 expect(ashenArtwork['ashen-brute-fury-pit'].source).toBe('Warlord at the Bloodfire Pit.png');
 expect(ashenArtwork['ashen-brute-pit-of-the-frenzied'].source).toBe('Inferno Arena_ Charge of the Bloodied Brutes.png');
 expect(ashenArtwork['ashen-brute-korgath-lord-of-ruin']).toBeUndefined();
 expect(ashenArtwork['ashen-noble-ring-of-the-ley'].image).toBe(ashenArtwork['ashen-brute-ring-of-the-ley'].image);
 expect(ashenArtwork['ashen-brute-fury-offering']).toBeUndefined();
});
it('uses bundled art in shared frames while explicit artwork still overrides it',()=>{
 const card={id:'ashen-noble-seraphine-royal-advisor',name:'Seraphine',type:'Unit'};
 expect(renderToStaticMarkup(<AshenCardFrame card={card}/>)).toContain(ashenArtwork[card.id].image);
 const custom=renderToStaticMarkup(<AshenCardFrame card={card} artworkUrl="/custom.webp"/>);
 expect(custom).toContain('/custom.webp');expect(custom).not.toContain(ashenArtwork[card.id].image);
});
