import {it,expect} from 'vitest';import {goatDeckFilename} from './deckFilename';
it('preserves chosen names and adds one GOAT tag to either format',()=>{
 expect(goatDeckFilename('Venus & Angels','ydk')).toBe('Venus & Angels - GOAT.ydk');
 expect(goatDeckFilename('My Deck - GOAT.ydk','json')).toBe('My Deck - GOAT.json');
 expect(goatDeckFilename('','ydk')).toBe('Untitled Deck - GOAT.ydk');
 expect(goatDeckFilename('Light/OTK: Test','json')).toBe('Light-OTK- Test - GOAT.json');
});
