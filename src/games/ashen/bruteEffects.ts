import type {EffectProgram,EffectStep,Selector,TokenDefinition,TriggerDefinition} from '../../framework';
const allyUnits:Selector={zones:['unit'],types:['Unit'],controller:'self'};
const allyBrutes:Selector={...allyUnits,tags:['Brute']};
const stations:Selector={zones:['command'],types:['Command Station']};
const anyDamage:Selector={zones:['unit','command'],types:['Unit','Command Station']};
const token:TokenDefinition={name:'Frenzied Brute',type:'Unit',tags:['Brute','Token'],stats:{attack:1,defense:1},zone:'unit'};
const create=(n:number):EffectStep=>({op:'token',token,count:n});
const p=(id:string,label:string,steps:EffectStep[],rest:Partial<EffectProgram>={}):EffectProgram=>({version:1,id,label,steps,...rest});
export type AshenEffectDefinition={onPlay?:EffectProgram;activated?:EffectProgram[];onBurn?:EffectProgram;entersSpent?:boolean;keywords?:string[];triggers?:TriggerDefinition[];coverage:'implemented'|'partial';notes?:string};
const rules:Record<string,AshenEffectDefinition>={
 'the-broken-fist-keep':{coverage:'partial',notes:'Destroyed-Brute token trigger is automated (3 per turn). Attack bonus waits for combat.',triggers:[{id:'keep-destroyed',event:'destroyed',sourceZones:['command'],subject:{types:['Unit'],tags:['Brute'],controller:'self'},limitPerTurn:3,program:p('keep-token','Broken Fist Keep: create a Frenzied Brute',[create(1)])}]},
 'pit-sired-warmonger':{coverage:'implemented',triggers:[{id:'warmonger-enter',event:'entered',sourceZones:['unit'],subject:{types:['Unit'],tags:['Brute'],excludeTags:['Token'],controller:'self'},program:p('warmonger-token','Pit-Sired Warmonger: create a Frenzied Brute',[create(1)])}]},
 'warhowl-instigator':{coverage:'implemented',triggers:[{id:'instigator-enter',event:'entered',sourceZones:['unit'],subject:{types:['Unit'],tags:['Brute'],excludeTags:['Token'],controller:'self'},program:p('instigator-draw','Warhowl Instigator: draw 1',[{op:'draw',count:1}])}]},
 'frenzied-grunt':{coverage:'implemented',keywords:['Charge']},
 'bloodpit-initiate':{coverage:'implemented',keywords:['Charge'],onPlay:p('initiate-enter','Create a Frenzied Brute',[create(1)])},
 'bloodfang-raider':{coverage:'partial',onPlay:p('raider-enter','Create a Frenzied Brute',[create(1)]),notes:'Exhaust / draw / discard ability is still manual.'},
 'ashclaw-skyreaver':{coverage:'partial',keywords:['Soar'],onPlay:p('skyreaver-enter','Create three Frenzied Brutes',[create(3)]),notes:'Sacrifice / damage ability is still manual.'},
 'rubble-flinger':{coverage:'implemented',keywords:['Ranged'],onPlay:p('flinger-enter','Deal 1 to a Command Station',[{op:'damage',targets:'targets',amount:1}],{targets:{filter:stations,count:1,label:'Choose a Command Station'}})},
 'howling-skyterror':{coverage:'implemented',keywords:['Charge','Soar']},
 'ashen-warhawk':{coverage:'implemented',keywords:['Charge','Soar']},
 'stonehide-juggernaut':{coverage:'implemented',keywords:['Charge','Reckless','Siege']},
 'ironhide-catapult':{coverage:'implemented',keywords:['Siege']},
 'feral-axebreaker':{coverage:'implemented',activated:[p('axebreaker-token','Exhaust + 1 Fury: create a Frenzied Brute',[create(1)],{cost:{exhaust:true,resources:{fury:1}}})]},
 'ring-of-the-ley':{coverage:'implemented',activated:[p('ring-essence','Exhaust: add 2 Untuned',[{op:'resource',resource:'untuned',amount:2}],{cost:{exhaust:true}})]},
 'ragekindle':{coverage:'implemented',onPlay:p('ragekindle','Add Fury for each Unit you control',[{op:'resource',resource:'fury',amount:{count:allyUnits}}])},
 'ashen-strike':{coverage:'implemented',onPlay:p('ashen-strike','Deal 3 damage; draw if a Unit is destroyed',[{op:'damage',targets:'targets',amount:3},{op:'if',condition:{kind:'destroyed',filter:{types:['Unit']}},then:[{op:'draw',count:1}]}],{targets:{filter:anyDamage,count:1,label:'Choose a Unit or Command Station'}})},
 'frenzied-stampede':{coverage:'implemented',onPlay:p('stampede','Your Brutes get +3/+3 and Pierce this turn',[{op:'modify',targets:allyBrutes,stats:{attack:3,defense:3},keywords:['Pierce'],duration:'turn'}])},
 'bloodfire-collapse':{coverage:'implemented',onPlay:p('collapse','Destroy all Units; damage both Command Stations',[{op:'destroy',targets:{zones:['unit'],types:['Unit']}},{op:'damage',targets:stations,amount:{result:'destroyed'}}])},
 'pit-digger-s-howl':{coverage:'implemented',onPlay:p('pit-digger','Sacrifice a Unit; draw 2',[{op:'draw',count:2}],{cost:{cards:{filter:allyUnits,count:1,label:'Choose a Unit to sacrifice'},cardDestination:'graveyard'}})},
 'fury-font':{coverage:'implemented'},
 'fury-pit':{coverage:'implemented',entersSpent:true,onBurn:p('fury-pit-burn','Your Units get +1 Attack this turn',[{op:'modify',targets:allyUnits,stats:{attack:1},duration:'turn'}])},
 'bloodforge-hollow':{coverage:'implemented',onPlay:p('hollow-enter','Create a Frenzied Brute',[create(1)])},
 'ashfang-ravine':{coverage:'implemented',onPlay:p('ravine-enter','Deal 2 damage to any target',[{op:'damage',targets:'targets',amount:2}],{targets:{filter:anyDamage,count:1,label:'Choose a Unit or Command Station'}})},
};
export const bruteEffects:Readonly<Record<string,AshenEffectDefinition>>=Object.fromEntries(Object.entries(rules).map(([id,rule])=>[`ashen-brute-${id}`,rule]));
export const BRUTE_EFFECT_PACK={schemaVersion:1,game:'ashen-command',id:'brute-first-batch',rules:bruteEffects};
