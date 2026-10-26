/** Opening-hand policy shared by game modules; this does not draw or trigger effects. */
export type OpeningHandPolicy={size:number;freeRedraws:number;minimum:number};
export function openingHandSize(policy:OpeningHandPolicy,redraws:number){
 if(!Number.isInteger(redraws)||redraws<0)throw Error('Invalid opening redraw count.');
 return Math.max(policy.minimum,policy.size-Math.max(0,redraws-policy.freeRedraws));
}
export function canRedrawOpeningHand(policy:OpeningHandPolicy,redraws:number){
 return redraws<policy.freeRedraws+policy.size-policy.minimum;
}
