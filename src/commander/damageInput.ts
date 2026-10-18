/** Unsigned/negative amounts are hits; an explicit plus corrects recorded damage. */
export function parseCommanderDamageInput(input:string):number|null{
 const text=input.trim().replace('−','-');if(!/^[+-]?\d+$/.test(text))return null;
 const amount=Math.abs(Number(text));if(!Number.isSafeInteger(amount)||amount<1||amount>999)return null;
 return text.startsWith('+')?-amount:amount;
}
