/** Explicit, versioned card behavior definitions, never inferred from prose. */
import type {Card} from '../core/types';
import type {RitualLevelRule} from './model';
export const CONTRACT_WITH_THE_ABYSS=69035382;
export const CONTRACT_WITH_THE_DARK_MASTER=96420087;
export const SHINATOS_ARK=60365591;
export const DARK_MASTER_ZORC=97642679;
export const SHINATO=86327225;
export type RitualDefinition={spellId:number; levelRule:RitualLevelRule; eligible:(card:Card)=>boolean; label:string};
export const ritualDefinitions:Record<number,RitualDefinition>={
 [CONTRACT_WITH_THE_ABYSS]:{spellId:CONTRACT_WITH_THE_ABYSS,levelRule:'EXACT',eligible:c=>c.type.includes('Ritual')&&c.type.includes('Monster')&&c.attribute==='DARK',label:'Contract with the Abyss'},
 [CONTRACT_WITH_THE_DARK_MASTER]:{spellId:CONTRACT_WITH_THE_DARK_MASTER,levelRule:'AT_LEAST',eligible:c=>c.id===DARK_MASTER_ZORC,label:'Contract with the Dark Master'},
 [SHINATOS_ARK]:{spellId:SHINATOS_ARK,levelRule:'AT_LEAST',eligible:c=>c.id===SHINATO,label:"Shinato's Ark"},
};
