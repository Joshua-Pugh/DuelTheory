// Local developer surface only; not imported or copied by any release entry.
import {useState} from 'react';
import {createRoot} from 'react-dom/client';
import AshenBattlefield from '../../src/AshenBattlefield';
import {newAshenDuel,chooseAshenOpening,declareAshenAttackers} from '../../src/games/ashen/duel';
import {moveAshenCard} from '../../src/games/ashen/adapter';
import {applyAshenCommand} from '../../src/matches/ashenCommands';
import '../../src/styles.css';
import '../../src/ashenLayered.css';
import '../../src/siteWorkbench.css';
function situation(blocking=false){
 let s=newAshenDuel(['Brute','Noble'],42,0);s=chooseAshenOpening(s,0,'keep');s=chooseAshenOpening(s,1,'keep');
 for(const seat of [0,1] as const)for(const id of [...s.table.piles[`${seat}:hand`]])moveAshenCard(s,id,'deck');
 const put=(slug:string,seat:0|1,zone='unit')=>{const c=Object.values(s.table.cards).find(c=>c.controller===seat&&c.cardId.endsWith('-'+slug))!;moveAshenCard(s,c.instanceId,zone);c.rotated=false;return c.instanceId;};
 const a=put('frenzied-grunt',0),air=put('ashen-warhawk',0),fatigued=put('bloodfang-raider',0);s.table.cards[fatigued].rotated=true;
 const archer=put('crown-archer',1),shield=put('shieldbearer-noble',1);put('royal-longbowman',1);s.table.cards[archer].rotated=true;s.table.cards[shield].rotated=true;
 const spent=put('fury-font',0,'ley');s.table.cards[spent].faceDown=true;put('oath-font',1,'ley');
 s.rules!.damage[fatigued]=0;s.rules!.duel!.phase='combat';s.rules!.duel!.combat={stage:'attack',attackers:[],blockers:{},blocked:[]};
 if(blocking)s=declareAshenAttackers(s,[a,air]);return s;
}
function Review(){const [state,setState]=useState(()=>situation()),[seat,setSeat]=useState<0|1>(0);
 return <><div className="review-controls" style={{position:'fixed',top:0,left:180,zIndex:5000,display:'flex',gap:5}}><button onClick={()=>{setState(situation());setSeat(0);}}>Review attackers</button><button onClick={()=>{setState(situation(true));setSeat(1);}}>Review blockers</button><button onClick={()=>setSeat(s=>s===0?1:0)}>Switch seat</button></div><AshenBattlefield remote={{state,seat,send:command=>setState(s=>applyAshenCommand(s,seat,command))}} learning={false}/></>;
}
createRoot(document.getElementById('root')!).render(<Review/>);
