/** Portable alternating priority. Games decide which actions are reactive. */
export type Priority={players:string[];holder:string;passed:string[]};
export function openPriority(players:string[],after:string):Priority{if(players.length<2||new Set(players).size!==players.length||!players.includes(after))throw Error('Invalid priority participants.');return {players:[...players],holder:players[(players.indexOf(after)+1)%players.length],passed:[]};}
export function passPriority(p:Priority,player:string){if(player!==p.holder)throw Error('Another player has priority.');const passed=[...p.passed,player];return {done:passed.length===p.players.length,priority:{...p,passed,holder:p.players[(p.players.indexOf(player)+1)%p.players.length]}};}
