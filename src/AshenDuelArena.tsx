import AshenPractice from './AshenPractice';
import {useState} from 'react';
import AshenBattlefield from './AshenBattlefield';
import {OpeningCoinDialog} from './DuelLifecycleDialogs';
import {openingCoin} from './duelLifecycle';
import {freshRandomSeed as freshDuelSeed} from './framework/random';
import {newAshenDuel} from './games/ashen/duel';
import type {AshenFaction} from './ashenDecks';
import {readBattlefield,type Battlefield} from './ashenBattlefieldState';
import './duelRoom.css';
import AshenStartScreen from './games/ashen/arena/AshenStartScreen';

export default function AshenDuelArena({mobile=false}:{allowResume?:boolean;mobile?:boolean}={}){
 const [practice,setPractice]=useState(false);
 const [saved,setSaved]=useState(()=>readBattlefield());
 const [learning,setLearning]=useState(true);
 const [decks,setDecks]=useState<[AshenFaction,AshenFaction]>(['Brute','Noble']);
 const [seed,setSeed]=useState<number|null>(null),[game,setGame]=useState<Battlefield|null>(null);
 const start=()=>{setGame(null);setSeed(freshDuelSeed());};
 if(practice)return <AshenPractice mobile={mobile} onExit={()=>setPractice(false)}/>;
 if(game)return <AshenBattlefield key={seed} mobile={mobile} initialState={game} learning={learning} onAgain={start} onExit={()=>{setSaved(readBattlefield());setGame(null);setSeed(null);}}/>;
 return <>
  <AshenStartScreen decks={decks} onDeck={(seat,faction)=>setDecks(current=>{const next:[AshenFaction,AshenFaction]=[...current];next[seat]=faction;return next;})} learning={learning} onLearning={setLearning} onStart={start} onPractice={()=>setPractice(true)} onResume={saved?.rules?.duel&&saved.rules.duel.winner==null?()=>setGame(saved):undefined}/>
  {seed!==null&&<OpeningCoinDialog key={seed} seed={seed} onExit={()=>setSeed(null)} onBegin={()=>setGame(newAshenDuel(decks,seed,openingCoin(seed).firstSeat))}/>}
 </>;
}
