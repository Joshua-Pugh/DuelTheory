export type PublicRoute='home'|'play'|'decks'|'cards'|'companion'|'about'|'contact'|'settings'|'rules'|'match'|'restricted';
export function publicRoute(hash:string,search=''):PublicRoute{
 if(new URLSearchParams(search).has('event')||hash==='#/event-hub'||['#/ai','#/studio','#/create','#/lab','#/test','#/guides/chaos-ritual-turbo'].includes(hash))return 'restricted';
 if(/^#\/private\/(?:ashen|[A-Z2-9]{8})$/.test(hash))return 'match';
 if(new URLSearchParams(search).has('table')||new URLSearchParams(search).has('commander'))return 'companion';
 const name=hash.replace(/^#\//,'');
 if(['duel','play'].includes(name))return 'play';
 if(['library','cards'].includes(name))return 'cards';
 if(['build','decks','saved'].includes(name))return 'decks';
 if(['table','commander','companion'].includes(name))return 'companion';
 if(['ashen','rules','help'].includes(name))return 'rules';
 return ['home','about','contact','settings'].includes(name)?name as PublicRoute:'home';
}
export const PUBLIC_LINKS=[['Home','home'],['Play Ashen Throne','play'],['Starter Decks','decks'],['Card Library','cards'],['Rules','rules'],['Table Companion','companion'],['About','about']] as const;
