import {readyBruteDuel as newBruteDuel} from './test/ashenReady';
import {expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';

import {ashenAdapter,moveAshenCard} from './games/ashen/adapter';
import {ashenVisualEvents} from './ashenVisualEvents';
import CardMotionLayer,{motionBetween} from './duelUi/CardMotionLayer';
it('detects draws for either seat and does not replay them for unrelated updates',()=>{
 const before=newBruteDuel(()=>.4),after=structuredClone(before);ashenAdapter.draw(after,'1',1);const events=ashenVisualEvents(before,after);expect(events).toEqual([{kind:'draw',seat:1,id:after.table.piles['1:hand'].at(-1)}]);expect(ashenVisualEvents(after,structuredClone(after))).toEqual([]);
});
it('recognizes a hand Action deployed through the Clash and a later Ossuary move',()=>{
 const before=newBruteDuel(()=>.4),id=before.table.piles['0:hand'][0],clash=structuredClone(before);moveAshenCard(clash,id,'clash');expect(ashenVisualEvents(before,clash)).toEqual([]);
 const field=structuredClone(clash);moveAshenCard(field,id,'unit');expect(ashenVisualEvents(clash,field)).toEqual([{kind:'place',seat:0,id}]);const dead=structuredClone(field);moveAshenCard(dead,id,'graveyard');expect(ashenVisualEvents(field,dead)).toEqual([{kind:'ossuary',seat:0,id}]);
});
it('animates explicit shuffles, including unchanged order, but not Plan reordering',()=>{
 const before=newBruteDuel(()=>.4),after=structuredClone(before);ashenAdapter.shuffle!(after,'0','deck');expect(ashenVisualEvents(before,after)).toContainEqual({kind:'shuffle',seat:0});expect(after.rules!.shuffleCounts).toEqual([1,0]);
 const plan=structuredClone(before),deck=plan.table.piles['0:deck'];[deck[0],deck[1]]=[deck[1],deck[0]];expect(ashenVisualEvents(before,plan)).toEqual([]);
});
it('does not replay a late reconnect or backwards turn as opening draws',()=>{
 const s=newBruteDuel(()=>.4);s.rules!.turn=10;expect(ashenVisualEvents(undefined,s)).toEqual([]);const old=structuredClone(s);old.rules!.turn=9;expect(ashenVisualEvents(s,old)).toEqual([]);
});
it('shares geometry and a pointer-free motion layer without any game state callbacks',()=>{
 const flight={...motionBetween({x:10,y:20,width:30,height:40},{x:60,y:80,width:30,height:40}),key:'one',content:<span>Back</span>};expect(flight.dx).toBe(50);expect(flight.dy).toBe(60);
 const html=renderToStaticMarkup(<CardMotionLayer flights={[flight]}/>);expect(html).toContain('aria-hidden="true"');expect(html).toContain('--motion-x:50px');expect(html).not.toContain('button');
});
