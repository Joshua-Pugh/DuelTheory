import {applyRoomCommand} from '../table/model';
import type {EventTable} from './model';
export function addDemoPlayers(t:EventTable,count:number,requestId:string,now:number){
 for(let i=0;i<count;i++){
  let number=1;while(t.state.players.some(p=>p.name===`Demo T${t.number} player ${number}`))number++;
  const id=`demo-${crypto.randomUUID()}`;
  t.state=applyRoomCommand(t.state,id,{type:'join',name:`Demo T${t.number} player ${number}`,sources:[`Demo source ${number}`]},`${requestId}-add-${i}`,now);
  t.demoPlayerIds=[...(t.demoPlayerIds??[]),id];
 }
}
export function removeDemoPlayer(t:EventTable,id:string,requestId:string,now:number){
 t.state=applyRoomCommand(t.state,id,{type:'leave'},requestId,now);
 t.demoPlayerIds=(t.demoPlayerIds??[]).filter(p=>p!==id);
}
/** Roll only simulated seats. Human seats must roll from their own authenticated device. */
export function rollDemoPlayers(t:EventTable,requestId:string,now:number){
 if(t.deletedAt||t.finished||t.archived||!t.state.started)return;
 for(let step=0;step<32;step++){
  const roll=t.state.firstPlayer;if(!roll||roll.winner)return;
  const id=roll.eligible.find(id=>t.demoPlayerIds?.includes(id)&&!Object.hasOwn(roll.rolls,id));if(!id)return;
  t.state=applyRoomCommand(t.state,id,{type:'roll',round:roll.round},`${requestId}-demo-${t.number}-${step}`,now);
 }
}
