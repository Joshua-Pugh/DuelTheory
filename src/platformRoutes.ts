export type Page='private'|'home'|'play'|'build'|'test'|'table'|'create'|'more'|'games'|'saved'|'about'|'help'|'ritual-guide'|'library'|'decks'|'duel'|'studio'|'lab'|'ashen'|'settings'|'commander';
export type NavigationItem={label:string;page?:Page;description?:string;planned?:boolean};
export const NAV_GROUPS:{id:Page;label:string;items:NavigationItem[]}[]=[
 {id:'play',label:'Play',items:[{label:'Duel Arena',page:'duel',description:'Yu-Gi-Oh! and Ashen Throne'},{label:'AI Practice',planned:true},{label:'Private Match',page:'private',description:'Invite a friend · GOAT or Ashen Throne'}]},
 {id:'build',label:'Build',items:[{label:'Card Library',page:'library'},{label:'Deck Builder',page:'decks'},{label:'My Decks',page:'saved'}]},
 {id:'test',label:'Test',items:[{label:'Testing Lab / Opening Hands',page:'lab',description:'Consistency, hand simulation and deck statistics'},{label:'Matchup Analysis',planned:true},{label:'AI Gauntlet',planned:true}]},
 {id:'table',label:'Table Tools',items:[{label:'MTG Commander Table',page:'commander',description:'Companion for physical Magic: The Gathering games'}]},
 {id:'create',label:'Create',items:[{label:'Creator Studio',page:'studio'},{label:'Ashen Throne',page:'ashen',description:'DuelTheory’s native game'},{label:'Custom Games Community',planned:true}]}
];
export const PAGE_LABELS:Record<Page,string>={private:'Private Match',home:'Home',play:'Play',build:'Build',test:'Test',table:'Table Tools',create:'Create',more:'More',games:'Games',saved:'My Decks',about:'About DuelTheory',help:'Rules / Help','ritual-guide':'Chaos Ritual Turbo · Deck Guide',library:'Card Library',decks:'Deck Builder',duel:'Duel Arena',studio:'Creator Studio',lab:'Testing Lab',ashen:'Ashen Throne',settings:'Preferences',commander:'MTG Commander Table'};
export const pageHash=(page:Page)=>page==='ritual-guide'?'#/guides/chaos-ritual-turbo':`#/${page}`;
export function pageFromLocation(hash:string,search=''):Page{if(/^#\/private\/[A-Z2-9]{8}$/.test(hash))return 'private';if(hash==='#/guides/chaos-ritual-turbo')return 'ritual-guide';const name=hash.replace(/^#\//,'');if(Object.hasOwn(PAGE_LABELS,name))return name as Page;return new URLSearchParams(search).has('commander')?'commander':'home';}
export const inGroup=(page:Page,id:Page)=>page===id||NAV_GROUPS.find(g=>g.id===id)?.items.some(i=>i.page===page)||id==='build'&&page==='ritual-guide';
