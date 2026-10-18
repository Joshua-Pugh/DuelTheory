import type {Deck} from './types';
// YDK is a card-ID based interchange format; names and metadata are resolved from the catalog.
export function parseYdk(text:string):Pick<Deck,'main'|'extra'|'side'> {
  const result:{main:number[];extra:number[];side:number[]}={main:[],extra:[],side:[]};
  let zone:keyof typeof result|null=null;
  for(const raw of text.replace(/\r/g,'').split('\n')) {
    const line=raw.trim();
    if(!line || line.startsWith('#created') || line.startsWith('#main deck'))continue;
    if(line==='#main'){zone='main';continue;}
    if(line==='#extra'){zone='extra';continue;}
    if(line==='!side'){zone='side';continue;}
    if(line.startsWith('#'))continue;
    if(!zone)throw Error('YDK file must start with #main.');
    if(!/^\d+$/.test(line))throw Error(`Invalid YDK card ID: ${line}`);
    const id=Number(line);if(!Number.isSafeInteger(id)||id<=0)throw Error('Invalid card ID.');
    result[zone].push(id);
    if(result.main.length+result.extra.length+result.side.length>300)throw Error('Deck import exceeds 300 cards.');
  }
  if(!text.includes('#main'))throw Error('Missing #main YDK section.');
  return result;
}
export function exportYdk(deck:Deck):string {
  return ['#created by DuelTheory · GOAT 2005',`#name ${deck.name.replace(/[\r\n]/g,' ')}`,'#main',...deck.main.map(String),'#extra',...deck.extra.map(String),'!side',...deck.side.map(String),''].join('\n');
}
