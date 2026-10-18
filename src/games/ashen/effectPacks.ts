import {bruteEffects} from './bruteEffects';
import {nobleEffects} from './nobleEffects';
export const ashenEffects={...bruteEffects,...nobleEffects};
export const ASHEN_EFFECT_PACK={schemaVersion:1,game:'ashen-command',id:'brute-noble-prototypes',rules:ashenEffects};
