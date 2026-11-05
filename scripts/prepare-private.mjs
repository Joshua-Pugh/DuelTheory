import {cp,rename,mkdir} from 'node:fs/promises';
await rename('dist-private/private/index.html','dist-private/index.html');
for(const item of ['ashen','audio','branding','icons','cards','decks','catalog.json','third-party-notices.txt']){await mkdir('dist-private',{recursive:true});await cp('public/'+item,'dist-private/'+item,{recursive:true});}
console.log('Prepared protected private-development assets. Deploy only through its authenticated Worker.');
