import {useState} from 'react';
import AshenBattlefield from './AshenBattlefield';
import {OpeningCoinDialog} from './DuelLifecycleDialogs';
import {openingCoin} from './duelLifecycle';
import {freshRandomSeed as freshDuelSeed} from './framework/random';
import {newAshenDuel} from './games/ashen/duel';
import type {AshenFaction} from './ashenDecks';
import {readBattlefield,type Battlefield} from './ashenBattlefieldState';
import './duelRoom.css';

export default function AshenDuelArena({allowResume=false}:{allowResume?:boolean}={}){
 const [saved]=useState(()=>allowResume?readBattlefield():null);
 const [learning,setLearning]=useState(true);
 const [decks,setDecks]=useState<[AshenFaction,AshenFaction]>(['Brute','Noble']);
 const [seed,setSeed]=useState<number|null>(null),[game,setGame]=useState<Battlefield|null>(null);
 const start=()=>{setGame(null);setSeed(freshDuelSeed());};
 if(game)return <AshenBattlefield key={seed} initialState={game} learning={learning} onAgain={start} onExit={()=>{setGame(null);setSeed(null);}}/>;
 return <section className="panel padded"><h2>Ashen Throne · Command Siege</h2><p><a className="secondary" href="#/private/ashen">Private AT match · invite a friend</a></p><p>Private matches include room chat, deck selection, a ready check, and a shared opening coin flip.</p><h3>Local duel · same device</h3>{saved?.rules?.duel&&saved.rules.duel.winner==null&&<button onClick={()=>setGame(saved)}>Resume local duel</button>}<p>Choose each player’s prototype deck. Both players may use the same deck.</p><div className="builder-actions">{([0,1] as const).map(seat=><label key={seat}>Player {seat+1} deck <select aria-label={`Player ${seat+1} Ashen deck`} value={decks[seat]} onChange={e=>setDecks(current=>{const next:[AshenFaction,AshenFaction]=[...current];next[seat]=e.target.value as AshenFaction;return next;})}><option value="Brute">Brutes · Broken Fist</option><option value="Noble">Nobles · Crown’s Bastion</option></select></label>)}<label>Play guidance <select aria-label="AT play guidance" value={learning?'guided':'standard'} onChange={e=>setLearning(e.target.value==='guided')}><option value="guided">Guided · learn as you play</option><option value="standard">Standard · compact controls</option></select></label><button className="primary" onClick={start}>Flip coin & start AT duel</button></div>{seed!==null&&<OpeningCoinDialog key={seed} seed={seed} onExit={()=>setSeed(null)} onBegin={()=>setGame(newAshenDuel(decks,seed,openingCoin(seed).firstSeat))}/>}</section>;
}
