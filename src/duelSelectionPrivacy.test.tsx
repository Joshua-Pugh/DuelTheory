import {it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {CardPicker} from './DuelField';
import {selectionCard,materialOrigins} from './duelSelectionPrivacy';
import {clampCardMenu} from './AnchoredCardMenu';
import {createDuel} from './engine/model';
import fixture from './engine/fixtures/chaos-ritual-turbo-20261018.json';
import catalogJson from '../public/catalog.json';
import type {Card} from './core/types';
const catalog=catalogJson as Card[],ctx={cards:new Map(catalog.map(c=>[c.id,c]))};
it('clamps tall menus to every viewport edge using their measured size',()=>{
 expect(clampCardMenu(900,650,250,600,1000,720)).toEqual({left:742,top:112});
 expect(clampCardMenu(-20,-30,250,1000,400,720)).toEqual({left:8,top:8});
});
it('renders no hidden opposing identity, artwork, stats, tooltip or searchable card text',()=>{
 const s=createDuel(fixture.deck,fixture.deck,ctx),id=s.players[1].hand[0];Object.assign(s.cards[id],{faceDown:true,location:'monster',zone:2});const real=ctx.cards.get(s.cards[id].cardId)!;
 const lookup=(id:string)=>ctx.cards.get(s.cards[id].cardId),masked=selectionCard(s,id,0,lookup)!;
 expect(masked).toEqual({id:0,name:'Player 2 face-down Monster · Zone 3',type:'Hidden card',desc:'Identity stays hidden until the rules reveal this card.'});
 const html=renderToStaticMarkup(<CardPicker title="Choose target" ids={[id]} eligible={[id]} multiple={false} deck={false} hiddenIds={[id]} lookup={id=>selectionCard(s,id,0,lookup)} onConfirm={()=>{}} onClose={()=>{}}/>);
 expect(html).not.toContain(real.name);expect(html).not.toContain('Level ');expect(html).toContain('dt-card-back');expect(selectionCard(s,id,1,lookup)).toBe(real);
 s.cards[id].faceDown=false;expect(selectionCard(s,id,0,lookup)).toBe(real);
});
it('separates field and hand tribute materials while keeping exact instance IDs',()=>{
 const s=createDuel(fixture.deck,fixture.deck,ctx),[a,b]=s.players[0].hand;s.cards[a].location='monster';const origins=materialOrigins(s,[a,b]);
 const html=renderToStaticMarkup(<CardPicker title="Ritual materials" ids={[a,b]} eligible={[a,b]} multiple sets={[[a,b]]} deck={false} groupByOrigin origins={origins} lookup={id=>ctx.cards.get(s.cards[id].cardId)} onConfirm={()=>{}} onClose={()=>{}}/>);
 expect(html).toContain('aria-label="On your field"');expect(html).toContain('aria-label="In your hand"');
});
