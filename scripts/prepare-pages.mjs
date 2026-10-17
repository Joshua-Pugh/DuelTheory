import {readdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';

// Vite handles bundled assets; catalog records and dynamic public-image URLs
// also need the project path when hosted on GitHub Pages.
const base='/DuelTheory/';
const roots=(await readdir('public')).concat('assets');
const escaped=roots.map(name=>name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
const pattern=new RegExp('(["\'`])/('+escaped.join('|')+')(?=[/"\'`?#])','g');
async function visit(directory){
 for(const entry of await readdir(directory,{withFileTypes:true})){
  const file=path.join(directory,entry.name);
  if(entry.isDirectory())await visit(file);
  else if(/\.(?:html|js|css|json)$/.test(entry.name)){
   const text=await readFile(file,'utf8');
   const next=text.replace(pattern,(_,quote,root)=>`${quote}${base}${root}`);
   if(next!==text)await writeFile(file,next);
  }
 }
}
await visit('dist');
await writeFile('dist/.nojekyll','');
console.log(`Prepared public assets for ${base}`);
