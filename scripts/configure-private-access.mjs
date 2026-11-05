import {readFile,writeFile,unlink} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import path from 'node:path';
const [team,audience,only]=process.argv.slice(2),emails=process.env.DT_PRIVATE_ACCESS_EMAILS;
if(!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(team||'')||!/^[a-f0-9]{64}$/.test(audience||'')||!emails?.split(',').every(s=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim())))throw Error('Provide team issuer, audience and DT_PRIVATE_ACCESS_EMAILS. Never supply assertion/session tokens.');
const cli=path.resolve('services/commander/node_modules/wrangler/bin/wrangler.js');
const run=(cwd,args,input)=>new Promise((resolve,reject)=>{const child=spawn(process.execPath,[cli,...args],{cwd,stdio:['pipe','inherit','inherit']});child.stdin.end(input||'');child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error('Wrangler failed; access stays closed where configuration is incomplete.')));});
if(only&&!['matches','commander','private-dev'].includes(only))throw Error('Unknown service.');
const secretsFile=path.resolve('.env.private-access-upload.json');
await writeFile(secretsFile,JSON.stringify({PRIVATE_ACCESS_EMAILS:emails.trim()}),{mode:0o600});
try{for(const service of only?[only]:['matches','commander','private-dev']){
 const dir='services/'+service,file=dir+'/wrangler.jsonc',config=JSON.parse(await readFile(file,'utf8'));config.vars.PRIVATE_ACCESS_TEAM=team;config.vars.PRIVATE_ACCESS_AUD=audience;delete config.vars.PRIVATE_ACCESS_EMAILS;config.secrets={required:['PRIVATE_ACCESS_EMAILS']};await writeFile(file,JSON.stringify(config,null,2)+'\n');
 await run(dir,['deploy','--secrets-file',secretsFile]);
}}finally{await unlink(secretsFile);}
console.log('Private identity settings applied. Tester addresses are stored only in Worker secrets.');
