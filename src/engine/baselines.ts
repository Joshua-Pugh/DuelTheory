export type ArchetypeKey='goat-control'|'chaos-turbo'|'chaos-control'|'warrior'|'aggro'|'burn-stall'|'reasoning-gate';
export type Baseline={id:ArchetypeKey;label:string;strategicPlan:string;sourceUrl:string;sourceType:'archetype-guide'|'aggregated-metagame';verifiedDeckList:false;};
/** These are archetype DESCRIPTIONS, not invented 40-card tournament lists or win rates. */
export const BASELINES:Baseline[]=[
{id:'goat-control',label:'Goat Control',strategicPlan:'Scapegoat, Metamorphosis, Thousand-Eyes Restrict and incremental resource advantage.',sourceUrl:'https://www.goatformat.com/',sourceType:'archetype-guide',verifiedDeckList:false},
{id:'chaos-turbo',label:'Chaos Turbo',strategicPlan:'Thunder Dragon discard fodder, flip-effect draw engines and Chaos Sorcerer finishers.',sourceUrl:'https://www.goatformat.com/chaos-turbo.html',sourceType:'archetype-guide',verifiedDeckList:false},
{id:'chaos-control',label:'Chaos Control',strategicPlan:'Control and LIGHT/DARK graveyard access for Chaos finishers.',sourceUrl:'https://www.formatlibrary.com/formats/goat',sourceType:'aggregated-metagame',verifiedDeckList:false},
{id:'warrior',label:'Warrior',strategicPlan:'Efficient Warrior threats, searches and tempo-based removal.',sourceUrl:'https://www.formatlibrary.com/formats/goat',sourceType:'aggregated-metagame',verifiedDeckList:false},
{id:'aggro',label:'Aggro',strategicPlan:'Pressure opposing life points with efficient threats and tempo plays.',sourceUrl:'https://www.formatlibrary.com/formats/goat',sourceType:'aggregated-metagame',verifiedDeckList:false},
{id:'burn-stall',label:'Burn / Stall',strategicPlan:'Defensive denial combined with effect damage; distinct variants require separate eventual baselines.',sourceUrl:'https://www.formatlibrary.com/formats/goat',sourceType:'aggregated-metagame',verifiedDeckList:false},
{id:'reasoning-gate',label:'Reasoning Gate',strategicPlan:'Reasoning and Monster Gate exploit specialized monster configurations.',sourceUrl:'https://www.formatlibrary.com/decktypes/reasoning_gate_turbo?format=goat',sourceType:'aggregated-metagame',verifiedDeckList:false}
];
