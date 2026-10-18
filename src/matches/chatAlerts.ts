import type {ChatMessage} from './model';
/** IDs keep notifications correct when the server trims its 100-message history. */
export function incomingChat(previous:readonly string[]|null,messages:readonly ChatMessage[],seat:0|1):ChatMessage[]{if(previous===null)return [];const known=new Set(previous);return messages.filter(m=>m.seat!==seat&&!known.has(m.id));}
