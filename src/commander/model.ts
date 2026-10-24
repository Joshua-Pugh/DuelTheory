/** Compatibility entry point for the original table protocol. New products use table/model. */
import {newTableRoom,LEGACY_PROFILE} from '../table/model';
export {applyRoomCommand,RoomError,sourceKey as commanderKey,tableSources as commanderSources,tableWarnings as commanderWarnings,tableEliminated as commanderEliminated,activeTablePlayers as activeCommanderPlayers,tableGameOver as commanderGameOver,tableGameReady as commanderGameReady,currentTurnPlayer,rollSixSidedDie} from '../table/model';
export type {TablePlayer as CommanderPlayer,TableRoomState as CommanderRoomState,RoomCommand,FirstPlayerRoll} from '../table/model';
export function newCommanderRoom(code:string,title:unknown,capacity:unknown,host:string){const s=newTableRoom(code,title,capacity,host,LEGACY_PROFILE);delete s.profile;return s;}
