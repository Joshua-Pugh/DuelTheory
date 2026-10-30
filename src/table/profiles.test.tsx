// @vitest-environment happy-dom
import {beforeEach,describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import TableCompanion from '../TableCompanion';
import {DUEL_PROFILE,MULTIPLAYER_PROFILE,saveTableProfile,savedTableProfiles} from './profiles';
import {pageFromLocation,pageHash} from '../platformRoutes';
import {roomInvite} from '../commander/client';
describe('Table Companion profiles and entry',()=>{
 beforeEach(()=>{localStorage.clear();history.replaceState(null,'','/DuelTheory/#/companion');});
 it('saves independent portable presets and safely ignores malformed storage',()=>{saveTableProfile(DUEL_PROFILE);saveTableProfile({...DUEL_PROFILE,health:{...DUEL_PROFILE.health,start:25}});saveTableProfile(MULTIPLAYER_PROFILE);expect(savedTableProfiles()).toHaveLength(2);expect(savedTableProfiles()[0].health.start).toBe(25);expect(DUEL_PROFILE.health.start).toBe(20);localStorage.setItem('dueltheory.table.profiles.v1','{"bad":true}');expect(savedTableProfiles()).toEqual([]);});
 it('offers common profiles and a compact editor entry without opening all settings',()=>{const html=renderToStaticMarkup(<TableCompanion/>);for(const label of ['Table Companion','Classic Duel','Multiplayer Table','MTG Commander','8 players','Edit profile','Export profile','Import profile','Start guided practice'])expect(html).toContain(label);expect(html).not.toContain('Starting total');});
 it('loads Creator Studio definitions as companion profile choices',()=>{localStorage.setItem('dueltheory-creator-projects-v1',JSON.stringify([{schemaVersion:1,id:'custom',name:'My tabletop',definition:{name:'My tabletop',zones:[],startingHealth:32,healthLabel:'Resolve'},cards:[]}]));expect(renderToStaticMarkup(<TableCompanion/>)).toContain('My tabletop · Creator Studio');});
 it('uses neutral routes and invites while preserving original room bookmarks',()=>{expect(pageHash('commander')).toBe('#/companion');expect(pageFromLocation('#/companion')).toBe('commander');expect(pageFromLocation('#/commander')).toBe('commander');expect(pageFromLocation('','?table=ABCDEFGH')).toBe('commander');expect(pageFromLocation('','?commander=ABCDEFGH')).toBe('commander');const invite=new URL(roomInvite('ABCDEFGH'));expect(invite.searchParams.get('table')).toBe('ABCDEFGH');expect(invite.searchParams.has('commander')).toBe(false);expect(invite.hash).toBe('');});
});
