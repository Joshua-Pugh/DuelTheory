import {readdir,readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const walk=async dir=>(await Promise.all((await readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?walk(dir+'/'+e.name):/\.test\.tsx?$/.test(e.name)?[dir+'/'+e.name]:[]))).flat();
const actual=(await walk('src')).sort(),ownership=JSON.parse(await readFile('tests/ownership.json','utf8')),owned=Object.values(ownership).flat().sort();
assert.deepEqual(owned,actual,'Every test must have exactly one owning suite. Add new tests to tests/ownership.json.');
console.log('All '+actual.length+' test files have exactly one owning suite.');
