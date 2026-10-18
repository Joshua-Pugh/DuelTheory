import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {NAV_GROUPS,pageFromLocation,pageHash} from './platformRoutes';
import PlatformHome from './PlatformHome';
import PlatformNavigation from './PlatformNavigation';
import RitualDeckGuide from './RitualDeckGuide';
import {CHAOS_RITUAL_TURBO,assessDeck} from './supportedDecks';
import catalogJson from '../public/catalog.json';
import ydk from '../public/decks/chaos-ritual-turbo.ydk?raw';
import {parseYdk} from './core/ydk';
import type {Card} from './core/types';
const catalog=catalogJson as Card[];
describe('DuelTheory platform',()=>{
 it('routes direct guide links and Commander invitations without listing the guide in navigation',()=>{expect(pageFromLocation(pageHash('ritual-guide'))).toBe('ritual-guide');expect(pageFromLocation('','?commander=ROOM')).toBe('commander');expect(pageFromLocation('#/decks','?commander=ROOM')).toBe('decks');expect(pageFromLocation('#/unknown')).toBe('home');expect(NAV_GROUPS.flatMap(g=>g.items).some(i=>i.page==='ritual-guide')).toBe(false);expect(NAV_GROUPS.flatMap(g=>g.items).filter(i=>i.planned).every(i=>!i.page)).toBe(true);});
 it('orients users around platform jobs and identifies the MTG physical-table tool',()=>{const home=renderToStaticMarkup(<PlatformHome navigate={()=>{}}/>),nav=renderToStaticMarkup(<PlatformNavigation page="home" navigate={()=>{}}/>);expect(home).toContain('Build. Simulate. Master.');expect(home).toContain('Start Playing');expect(home).toContain('Magic: The Gathering');expect(nav).toContain('Mobile navigation');expect(nav).toContain('Table Tools');expect(nav).toContain('Settings and help');});
 it('ships the supported Ritual main and preserves all fifteen side cards in the download',()=>{expect(CHAOS_RITUAL_TURBO.main).toHaveLength(40);expect(CHAOS_RITUAL_TURBO.side).toHaveLength(15);expect(parseYdk(ydk)).toEqual({main:CHAOS_RITUAL_TURBO.main,extra:[],side:CHAOS_RITUAL_TURBO.side});expect(assessDeck(CHAOS_RITUAL_TURBO,catalog).supported).toBe(true);});
 it('renders the original guide and its full list with sideboarding limitations',()=>{const html=renderToStaticMarkup(<RitualDeckGuide catalog={catalog} onLoad={()=>{}} onPlay={()=>{}}/>);expect(html).toContain('Main Deck · 40');expect(html).toContain('Side Deck · 15');expect(html).toContain('Sideboarding is not available');expect(html).toContain('Magical Merchant');expect(html).toContain('Ritual sequencing');expect(html).toContain('chaos-ritual-turbo.ydk');});
});
