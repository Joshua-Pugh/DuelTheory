import {CHAOS_TURBO,GOAT_CONTROL} from '../supportedDecks';import {chooseChaosTurbo} from './chaosTurbo';import {chooseGoatControl} from './goatControl';import {PILOT_VERSION} from './practiceMatch';
export const AI_PILOTS={chaos:{name:'Chaos Turbo',version:PILOT_VERSION,deck:CHAOS_TURBO,choose:chooseChaosTurbo},goat:{name:'Goat Control',version:'goat-control-2026-10-21-v2',deck:GOAT_CONTROL,choose:chooseGoatControl}};
export type AiPilotId=keyof typeof AI_PILOTS;
