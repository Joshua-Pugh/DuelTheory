import {mkdir,writeFile} from 'node:fs/promises';

import {pages} from './public-page-content.mjs';
const escape=text=>text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const links=pages.map(p=>`<a href="/#/${p.launch}">${escape(p.slug==='deck-builder'?'Ashen Throne Deck Builder':p.label.split(' · ')[0])}</a>`).join('');
for(const p of pages){
 const url=`https://dueltheory.com/${p.slug}/`;
 const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(p.title)}</title><meta name="description" content="${escape(p.description)}"><link rel="canonical" href="${url}"><meta name="robots" content="index,follow"><meta name="theme-color" content="#14382b"><link rel="icon" href="/branding/dt-forge-icon.svg"><meta property="og:title" content="${escape(p.title)}"><meta property="og:description" content="${escape(p.description)}"><meta property="og:url" content="${url}"><meta property="og:type" content="website"><link rel="stylesheet" href="/public-pages.css"></head><body><a class="skip" href="#content">Skip to content</a><header><a class="brand" href="/"><img src="/branding/dt-forge-crest.svg" alt="" width="56" height="64"><span>DuelTheory</span></a><nav aria-label="Tools">${links}</nav></header><main id="content"><p class="label">${escape(p.label)}</p><h1>${escape(p.heading)}</h1><p class="intro">${escape(p.intro)}</p><a class="launch" href="/#/${p.launch}">${escape(p.action)} →</a><p class="status">Working prototype · By Ashen Forge Games</p><div class="sections">${p.sections.map(([h,t])=>`<section><h2>${escape(h)}</h2><p>${escape(t)}</p></section>`).join('')}</div>${p.slug==='ashen-throne'?'<p><a href="https://ashenthronetcg.com/">Visit the Ashen Throne website →</a></p>':''}<p><a href="mailto:designteam@ashenforgegames.com">Questions or feedback? Email our design team.</a></p></main><footer><p>DuelTheory · Ashen Forge Games</p><nav aria-label="More">${links}<a href="/#/about">About</a></nav></footer></body></html>`;
 await mkdir(`dist/${p.slug}`,{recursive:true});
 await writeFile(`dist/${p.slug}/index.html`,html);
}
await writeFile('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['',...pages.map(p=>`${p.slug}/`)].map(p=>`<url><loc>https://dueltheory.com/${p}</loc></url>`).join('')}</urlset>\n`);
console.log('Built three crawlable public pages and sitemap.');
