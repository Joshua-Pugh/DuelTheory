// April 2005 TCG Forbidden & Limited list. Source: goatformat.com/cardpool.html.
// Note: format legality also requires period-correct release eligibility.
export const forbidden = [
 'Chaos Emperor Dragon - Envoy of the End','Fiber Jar','Magical Scientist','Makyura the Destructor','Witch of the Black Forest','Yata-Garasu',
 'Butterfly Dagger - Elma','Change of Heart','Confiscation','Dark Hole',"Harpie's Feather Duster",'Mirage of Nightmare','Monster Reborn','Painful Choice','Raigeki','The Forceful Sentry','Imperial Order'
];
export const limited = [
 'Black Luster Soldier - Envoy of the Beginning','Breaker the Magical Warrior','Cyber Jar','Dark Magician of Chaos','D.D. Warrior Lady','Exodia the Forbidden One','Exiled Force','Injection Fairy Lily','Jinzo','Left Arm of the Forbidden One','Left Leg of the Forbidden One','Morphing Jar','Protector of the Sanctuary','Reflect Bounder','Right Arm of the Forbidden One','Right Leg of the Forbidden One','Sacred Phoenix of Nephthys','Sangan','Sinister Serpent','Tribe-Infecting Virus','Twin-Headed Behemoth','Card Destruction','Delinquent Duo','Graceful Charity','Heavy Storm','Lightning Vortex','Mage Power','Mystical Space Typhoon','Pot of Greed','Premature Burial','Snatch Steal','Swords of Revealing Light','United We Stand','Call of the Haunted','Ceasefire','Deck Devastation Virus','Magic Cylinder','Mirror Force','Reckless Greed','Ring of Destruction','Torrential Tribute'
];
export const semiLimited = [
 'Abyss Soldier','Dark Scorpion - Chick the Yellow','Manticore of Darkness','Marauding Captain','Night Assailant','Vampire Lord','Creature Swap','Emergency Provisions','Level Limit - Area B','Nobleman of Crossout','Reinforcement of the Army','Upstart Goblin','Good Goblin Housekeeping','Gravity Bind','Last Turn'
];
const key = (x:string) => x.trim().toLowerCase();
const f = new Set(forbidden.map(key)); const l = new Set(limited.map(key)); const s = new Set(semiLimited.map(key));
export function copyLimit(name:string):number { const n=key(name); return f.has(n)?0:l.has(n)?1:s.has(n)?2:3; }
// Confirmed 2005 product prefixes only; unusual promotional printings must be reviewed.
const legalSetPrefixes = new Set(['LOB','SDY','SDK','MRD','MRL','SRL','PSV','SDJ','SDP','LON','LOD','PGD','MFC','DCR','SYE','SKE','IOC','AST','SOD','DB1','RDS','FET','DR1','TLM','SD1','SD2','SD3','SD4','DB2']);
export function periodStatus(card:{card_sets?:Array<{set_code:string}>}):'verified-set'|'needs-review' {
  return card.card_sets?.some(set=>legalSetPrefixes.has(set.set_code.split('-')[0]?.toUpperCase())) ? 'verified-set' : 'needs-review';
}
export const FORMAT = {id:'goat-2005', name:'GOAT Format', banlist:'April 2005', mainMin:40, mainMax:60, sideMax:15, extraMax:15};

// Tournament-profile caps above are a practical simulator convention, not original 2005 limits.
export const GOAT_HISTORICAL = {mainMin:40, mainMax:null, fusionMax:null, sideSizes:[0,15], firstTurnDraw:true} as const;
