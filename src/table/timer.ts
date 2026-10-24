export type TurnTimer={durationSeconds:number;version:number;remainingMs:number;runningSince?:number;turn?:number};
export const defaultTurnTimer=():TurnTimer=>({durationSeconds:0,version:0,remainingMs:0});
export function turnTimeRemaining(timer:TurnTimer,now:number){return Math.max(0,timer.remainingMs-(timer.runningSince===undefined?0:Math.max(0,now-timer.runningSince)));}
export function timerText(ms:number){const seconds=Math.max(0,Math.ceil(ms/1000));return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;}
