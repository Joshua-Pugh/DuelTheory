import {validateDeck} from '../core/decks';
import type {Card,Deck} from '../core/types';
import type {DuelState,LegalAction} from '../engine/model';
import type {Battlefield} from '../ashenBattlefieldState';
import type {AshenFaction} from '../ashenDecks';
import {newAshenDuel} from '../games/ashen/duel';
import {GameService,type SessionAction} from '../services/GameService';
import {openingCoin} from '../duelLifecycle';
import {applyAshenCommand,type AshenCommand} from './ashenCommands';
export type Game='goat'|'ashen';
export type Pick={deck:Deck}|{faction:AshenFaction};
export type Member={name:string;pick:Pick;ready:boolean;begun:boolean;left?:boolean};
export type ChatMessage={id:string;seat:0|1;text:string;at:number};
export type Match={code:string;game:Game;revision:number;members:[Member,Member|null];phase:'lobby'|'coin'|'playing'|'sideboarding'|'turnChoice'|'complete';series?:{mode:'single'|'best3';wins:[number,number];results:(0|1|'draw')[];registered?:[Deck,Deck];ready:[boolean,boolean];chooser?:0|1;forfeited?:0|1};seed?:number;goat?:DuelState;ashen?:Battlefield;manual?:boolean;chat:ChatMessage[];choosing?:{seat:0|1;until:number};reveal?:{id:string;controller:0|1;cardId:number;expiresAt?:number}};
export type MatchCommand={type:'leave'}|{type:'sideboard';deck?:Deck}|{type:'chooseFirst';first:0|1}|{type:'concede'}|{type:'choosing';value:boolean}|{type:'ackReveal';id:string}|{type:'pick';pick:Pick}|{type:'ready';value:boolean;pick?:Pick}|{type:'begin'}|{type:'chat';text:string}|{type:'goat';action:SessionAction}|{type:'goatPhase';destination:import('../engine/model').Phase|'NEXT'}|{type:'ashen';action:AshenCommand};
export function validPick(game:Game,input:unknown,catalog:readonly Card[]):Pick{
 const p=input as Pick;if(!p||typeof p!=='object')throw Error('Choose your deck.');
 if(game==='ashen'){if(!('faction'in p)||!['Brute','Noble'].includes(p.faction))throw Error('Choose Brutes or Nobles.');return {faction:p.faction};}
 if(!('deck'in p)||!p.deck||typeof p.deck.name!=='string')throw Error('Choose a deck.');const ids=new Set(catalog.map(c=>c.id));const d=p.deck;
 if(!['main','extra','side'].every(k=>Array.isArray(d[k as keyof Deck])&&(d[k as 'main'] as number[]).every(id=>Number.isSafeInteger(id)&&ids.has(id)))||d.main.length<40||d.main.length>60||d.extra.length>15||d.side.length>15)throw Error('Use a valid 40–60 card Main Deck with known card IDs.');
 return {deck:{id:'room-deck',name:d.name.slice(0,80),main:[...d.main],extra:[...d.extra],side:[...d.side]}};
}
export function member(name:unknown,pick:Pick):Member{if(typeof name!=='string'||!name.trim()||name.trim().length>32)throw Error('Enter a player name (1–32 characters).');return {name:name.trim(),pick,ready:false,begun:false};}
export function startMatch(s:Match,catalog:readonly Card[],seed:number,firstSeat?:0|1){s.seed=seed;s.phase=firstSeat===undefined?'coin':'playing';const first=firstSeat??openingCoin(seed).firstSeat;delete s.reveal;delete s.choosing;s.members.forEach(m=>{if(m)m.begun=false;});if(s.game==='ashen')s.ashen=newAshenDuel(s.members.map(m=>(m!.pick as {faction:AshenFaction}).faction) as [AshenFaction,AshenFaction],seed,first);else{const service=new GameService();const id=service.createGoatSession(s.members.map(m=>(m!.pick as {deck:Deck}).deck) as [Deck,Deck],catalog,seed,first);s.goat=service.getState(id);s.manual=service.isManual(id);}const game=s.goat??s.ashen;if(game){const cards=s.goat?s.goat.cards:s.ashen!.table.cards;const map=new Map(Object.keys(cards).map(id=>[id,crypto.randomUUID()]));const remap=(v:unknown):unknown=>typeof v==='string'?map.get(v)??v:Array.isArray(v)?v.map(remap):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[map.get(k)??k,remap(x)])):v;if(s.goat)s.goat=remap(game) as DuelState;else s.ashen=remap(game) as Battlefield;}}
export function applyMatchCommand(original:Match,seat:0|1,c:MatchCommand,catalog:readonly Card[],seed:number):Match{
 const s=structuredClone(original);releaseExpiredReveal(s);const m=s.members[seat];if(!m)throw Error('Join a seat first.');
 if(m.left)throw Error('You have left this room. Create or join a new match.');
 if(c.type==='leave'){m.left=true;m.ready=false;delete s.choosing;delete s.reveal;const series=s.series??={mode:'single',wins:[0,0],results:[],ready:[false,false]};series.forfeited=seat;if(s.phase==='playing'){if(s.goat)s.goat.winner=seat===0?1:0;else if(s.ashen?.rules?.duel)s.ashen.rules.duel.winner=seat===0?1:0;settleMatchResult(s);}s.phase='complete';}
 else if(c.type==='sideboard'){if(s.phase!=='sideboarding'||!s.series)throw Error('Sideboarding is only available between games.');if(s.series.ready[seat])throw Error('Your next-game deck is already locked.');if(s.game==='goat'){const d=validPick('goat',{deck:c.deck},catalog) as {deck:Deck};validateSideboard(s.series.registered![seat],d.deck);const errors=validateDeck(d.deck,new Map(catalog.map(c=>[c.id,c]))).filter(i=>i.kind==='error');if(errors.length)throw Error(errors.map(i=>i.message).join(' '));m.pick=d;}s.series.ready[seat]=true;if(s.series.ready.every(Boolean))s.phase='turnChoice';}
 else if(c.type==='chooseFirst'){if(s.phase!=='turnChoice'||s.series?.chooser!==seat||![0,1].includes(c.first))throw Error('The previous game’s loser chooses who goes first.');startMatch(s,catalog,seed,c.first);}
 else if(c.type==='concede'){if(s.phase!=='playing')throw Error('No active game to concede.');if(s.goat)s.goat.winner=seat===0?1:0;else if(s.ashen?.rules)s.ashen.rules.duel!.winner=seat===0?1:0;}
 else if(c.type==='choosing'){if(s.phase!=='playing'||typeof c.value!=='boolean')throw Error('Invalid selection activity.');if(c.value)s.choosing={seat,until:Date.now()+20000};else if(s.choosing?.seat===seat)delete s.choosing;return s;}
 else if(c.type==='chat'){if(typeof c.text!=='string'||!c.text.trim()||c.text.length>500)throw Error('Chat messages must be 1–500 characters.');s.chat.push({id:crypto.randomUUID(),seat,text:c.text.trim(),at:Date.now()});s.chat=s.chat.slice(-100);}
 else if(c.type==='ackReveal'){if(!s.reveal||s.reveal.id!==c.id)return s;if(s.reveal.controller===seat)throw Error('No reveal waiting for this player.');delete s.reveal;}
 else if(c.type==='pick'||c.type==='ready'){if(s.phase!=='lobby')throw Error('The match has started.');if(c.type==='pick'){m.pick=validPick(s.game,c.pick,catalog);m.ready=false;}else{if(typeof c.value!=='boolean')throw Error('Invalid ready state.');if(c.pick)m.pick=validPick(s.game,c.pick,catalog);m.ready=c.value;if(s.members.every(p=>p?.ready)){s.series??={mode:'single',wins:[0,0],results:[],ready:[false,false]};if(s.game==='goat')s.series.registered=s.members.map(m=>structuredClone((m!.pick as {deck:Deck}).deck)) as [Deck,Deck];startMatch(s,catalog,seed);}}}
 else if(c.type==='begin'){if(s.phase!=='coin')throw Error('Wait for both players to be ready.');m.begun=true;if(s.members.every(p=>p?.begun))s.phase='playing';}
 else{if(s.reveal)throw Error('Wait for your opponent to view the revealed card.');if(s.phase!=='playing')throw Error('Both players must finish the coin flip first.');if(c.type==='goatPhase'&&s.goat){if(s.goat.current!==seat)throw Error('Wait for your turn.');const service=new GameService(),id=service.restoreOnline(s.goat,catalog,!!s.manual);s.goat=service.advancePhase(id,c.destination);}
 else if(c.type==='goat'&&s.goat){if(c.action.type.startsWith('MANUAL_')&&!s.manual)throw Error('Manual overrides are disabled in guided online matches.');if(c.action.seat!==seat)throw Error('That action belongs to the other player.');const service=new GameService(),id=service.restoreOnline(s.goat,catalog,!!s.manual);s.goat=c.action.type.startsWith('MANUAL_')?service.dispatchManual(id,c.action as import('../services/GameService').TabletopAction):service.dispatch(id,c.action as LegalAction);}
 else if(c.type==='ashen'&&s.ashen)s.ashen=applyAshenCommand(s.ashen,seat,c.action);else throw Error('Invalid game action.');}
 if(!s.reveal&&original.goat&&s.goat){const flipped=Object.values(s.goat.cards).find(card=>original.goat!.cards[card.instanceId]?.faceDown&&!card.faceDown&&card.location==='monster'&&original.goat!.cards[card.instanceId]?.location==='monster');if(flipped)s.reveal={id:crypto.randomUUID(),controller:flipped.controller,cardId:flipped.cardId,expiresAt:Date.now()+15000};}
 settleMatchResult(s);s.revision++;return s;
}
export type MatchView=Omit<Match,'seed'|'members'|'series'> & {series?:Omit<NonNullable<Match['series']>,'registered'>;ownDeck?:Deck} & {seed?:number;seat:0|1;members:({name:string;deckName:string;ready:boolean;begun:boolean;left?:boolean}|null)[];actions:LegalAction[];waitingFor?:{seat:0|1;kind:'selection'|'response'|'reveal'}};
export function matchView(s:Match,seat:0|1,catalog:readonly Card[]):MatchView{
 const v=structuredClone(s) as unknown as MatchView;v.seat=seat;v.members=s.members.map(m=>m?{name:m.name,deckName:'deck'in m.pick?m.pick.deck.name:m.pick.faction,ready:m.ready,begun:m.begun,left:m.left}:null);v.actions=[];if(v.series)delete (v.series as {registered?:unknown}).registered;if(s.game==='goat'&&['sideboarding','turnChoice'].includes(s.phase))v.ownDeck=structuredClone((s.members[seat]!.pick as {deck:Deck}).deck);v.waitingFor=matchWaitingFor(s);delete v.choosing;
 // The shuffle seed never leaves the authority. Coin animation uses an equivalent face-only seed.
 v.seed=s.seed===undefined?undefined:Array.from({length:128},(_,i)=>Math.imul(i,0x9e3779b9)>>>0).find(n=>openingCoin(n).firstSeat===openingCoin(s.seed!).firstSeat);
 if(s.phase!=='playing'){delete v.goat;delete v.ashen;return v;}
 if(s.goat){const service=new GameService(),id=service.restoreOnline(s.goat,catalog,!!s.manual);v.actions=service.getLegalActions(id,seat);const g=v.goat!;g.seed=0;const exposed=new Set<string>();for(const a of v.actions)for(const value of Object.values(a)){if(typeof value==='string')exposed.add(value);else if(Array.isArray(value))for(const x of value)if(typeof x==='string')exposed.add(x);}
  const hiddenNames:string[]=[];for(const c of Object.values(g.cards)){const hidden=c.location==='deck'&&!exposed.has(c.instanceId)||c.controller!==seat&&(c.location==='hand'&&g.pendingChaos?.controller!==seat||c.location==='extra'||!!c.faceDown||!!c.equippedHidden);if(hidden){const name=catalog.find(x=>x.id===c.cardId)?.name;if(name)hiddenNames.push(name);c.cardId=0;}}
  for(const p of g.players)p.deck.sort();
  v.actions=v.actions.map(a=>{const target='targetId'in a&&typeof a.targetId==='string'?a.targetId:undefined;const name=target&&g.cards[target]?.cardId===0?catalog.find(c=>c.id===s.goat!.cards[target].cardId)?.name:undefined;return name?{...a,description:a.description.split(name).join('a face-down card')}:a;});
  g.events=g.events.map(e=>({...e,message:hiddenNames.reduce((text,name)=>text.split(name).join('a hidden card'),e.message)}));
  // Pending choice payloads can contain private deck/hand information. Only their owner receives them.
  for(const key of ['pendingSearch','pendingDiscard','pendingDeckChoice','pendingRandomDiscard','pendingLightChoice','pendingChaos','pendingRitual'] as const){const p=g[key] as {controller?:number}|undefined;if(p&&p.controller!==undefined&&p.controller!==seat)delete g[key];}
 }
 if(s.ashen){const b=v.ashen!;if(b.rules)delete b.rules.shuffleSeed;const pending=b.rules?.pending;const chooser=pending?.flow.context.player;const visibleChoice=chooser===String(seat);for(const c of Object.values(b.table.cards))if(c.zone==='deck'&&(!visibleChoice||c.controller!==seat)||c.controller!==seat&&(c.zone==='hand'||c.faceDown&&c.zone!=='ley')){c.cardId='hidden';c.name='Hidden card';delete c.image;delete c.presentation;c.type='Hidden';}for(const key of ['0:deck','1:deck'])b.table.piles[key].sort();if(pending&&!visibleChoice)delete b.rules!.pending;const secrets=Object.values(s.ashen.table.cards).filter(c=>b.table.cards[c.instanceId]?.cardId==='hidden');for(const c of secrets)b.table.events=b.table.events.map(text=>text.split(c.name).join('a hidden card'));const hiddenIds=new Set(secrets.map(c=>c.instanceId));const scrub=(x:unknown)=>{if(!x||typeof x!=='object')return;for(const value of Object.values(x))scrub(value);const entity=x as Record<string,unknown>;if(typeof entity.id==='string'&&hiddenIds.has(entity.id)){entity.type='Hidden';entity.tags=[];delete entity.stats;}};scrub(b.rules);}
 return v;
}

/** Public activity only: no target IDs, hand identities or private choices. */
export function matchWaitingFor(s:Match):MatchView['waitingFor']{
 if(s.phase!=='playing')return;
 if(s.reveal)return {seat:s.reveal.controller===0?1:0,kind:'reveal'};
 if(s.choosing&&s.choosing.until>Date.now())return {seat:s.choosing.seat,kind:'selection'};
 const g=s.goat;if(g){const p=g.pendingDiscard??g.pendingSearch??g.pendingDeckChoice??g.pendingLightChoice??g.pendingChaos??g.pendingRitual??g.pendingRandomDiscard;if(p)return {seat:p.controller,kind:'selection'};const trigger=g.pendingTriggers?.[0];if(trigger)return {seat:trigger.controller,kind:'selection'};if(g.chain.length)return {seat:g.priority,kind:'response'};if(g.summonResponse)return {seat:g.summonResponse.priority??(g.summonResponse.summoner===0?1:0),kind:'response'};if(g.freeResponse)return {seat:g.freeResponse.priority,kind:'response'};if(g.pendingAttack&&!g.pendingAttack.damageStep)return {seat:g.pendingAttack.defender,kind:'response'};}
 const b=s.ashen,d=b?.rules?.duel;if(b&&d){const player=b.rules?.pending?.flow.context.player;if(player==='0'||player==='1')return {seat:Number(player) as 0|1,kind:'selection'};if(d.callPermission||d.ordering)return {seat:b.table.active,kind:'selection'};if(d.priority)return {seat:Number(d.priority.holder) as 0|1,kind:'response'};if(d.combat?.stage==='block')return {seat:b.table.active===0?1:0,kind:'selection'};}
}

/** Bound the pause, including legacy records that had no expiry and could deadlock a live room. */
export function releaseExpiredReveal(s:Match,now=Date.now()):boolean{if(s.reveal&&(!s.reveal.expiresAt||s.reveal.expiresAt<=now||!s.goat||!Object.values(s.goat.cards).some(c=>c.cardId===s.reveal!.cardId&&c.controller===s.reveal!.controller&&c.location==='monster'&&!c.faceDown))){delete s.reveal;s.revision++;return true;}return false;}

/** Registered card pool and section sizes are immutable across a match. */
export function validateSideboard(original:Deck,next:Deck){
 const pool=(d:Deck)=>[...d.main,...d.extra,...d.side].sort((a,b)=>a-b).join(',');
 if(original.main.length!==next.main.length||original.extra.length!==next.extra.length||original.side.length!==next.side.length||pool(original)!==pool(next))throw Error('Exchange cards one for one from your registered Side Deck. Main, Extra and Side counts must stay the same.');
}
export function settleMatchResult(s:Match){
 if(s.phase!=='playing')return;
 const result=s.goat?(s.goat.drawnGame?'draw':s.goat.winner):s.ashen?.rules?.duel?.winner;
 if(result===null||result===undefined)return;
 const series=s.series??={mode:'single',wins:[0,0],results:[],ready:[false,false]};
 series.results.push(result);if(result!=='draw')series.wins[result]++;
 delete s.reveal;delete s.choosing;
 if(series.mode==='single'||series.wins.some(n=>n>=2)){s.phase='complete';return;}
 series.chooser=result==='draw'?(s.goat?.current??s.ashen?.table.active??0):result===0?1:0;
 series.ready=[false,false];s.phase='sideboarding';
}
