import {cp,mkdir} from 'node:fs/promises';
export const publicAssets=['manifest.webmanifest','ashen','audio','branding','icons','account-deletion.html','table-privacy.html','third-party-notices.txt','public-pages.css','robots.txt'];
for(const item of publicAssets){await mkdir('dist',{recursive:true});await cp('public/'+item,'dist/'+item,{recursive:true});}
console.log('Copied public AT and Companion assets only.');
