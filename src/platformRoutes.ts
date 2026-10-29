export type Page='ai'|'private'|'home'|'play'|'build'|'test'|'table'|'create'|'more'|'games'|'saved'|'about'|'help'|'ritual-guide'|'library'|'decks'|'duel'|'studio'|'lab'|'ashen'|'settings'|'commander';
export type NavigationItem={label:string;page?:Page;description?:string;planned?:boolean};
export const NAV_GROUPS:{id:Page;label:string;items:NavigationItem[]}[]=[
 {id:'play',label:'Play',items:[{label:'Duel Arena',page:'duel',description:'GOAT or Ashen Throne · local play'},{label:'AI Practice',page:'ai',description:'Chaos Turbo or Goat Control'},{label:'Private Match',page:'private',description:'Invite a friend'}]},
 {id:'build',label:'Decks',items:[{label:'Card Library',page:'library'},{label:'Deck Builder',page:'decks'},{label:'My Decks',page:'saved'}]},
 {id:'table',label:'Table Tools',items:[{label:'Table Companion',page:'commander',description:'Life, damage, counters and turns'}]}
];
/** Unfinished tools stay in source, outside the public release. */
export const publicPage=(page:Page):Page=>['test','lab','create','studio'].includes(page)?'home':page;
export const PAGE_LABELS:Record<Page,string>={ai:'AI Practice',private:'Private Match',home:'Home',play:'Play',build:'Build',test:'Test',table:'Table Tools',create:'Create',more:'More',games:'Games',saved:'My Decks',about:'About DuelTheory',help:'Rules / Help','ritual-guide':'Chaos Ritual Turbo · Deck Guide',library:'Card Library',decks:'Deck Builder',duel:'Duel Arena',studio:'Creator Studio',lab:'Testing Lab',ashen:'Ashen Throne',settings:'Account & settings',commander:'Table Companion'};
export const pageHash=(page:Page)=>page==='ritual-guide'?'#/guides/chaos-ritual-turbo':page==='commander'?'#/companion':`#/${page}`;
export function pageFromLocation(hash:string,search=''):Page{if(hash==='#/companion')return 'commander';if(hash==='#/private/ashen'||/^#\/private\/[A-Z2-9]{8}$/.test(hash))return 'private';if(hash==='#/guides/chaos-ritual-turbo')return 'ritual-guide';const name=hash.replace(/^#\//,'');if(Object.hasOwn(PAGE_LABELS,name))return publicPage(name as Page);return (new URLSearchParams(search).has('table')||new URLSearchParams(search).has('commander'))?'commander':'home';}
export const inGroup=(page:Page,id:Page)=>page===id||NAV_GROUPS.find(g=>g.id===id)?.items.some(i=>i.page===page)||id==='build'&&page==='ritual-guide';
