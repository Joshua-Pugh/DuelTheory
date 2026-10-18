/** Keep the chosen display name while removing characters unsafe in download filenames. */
export function goatDeckFilename(name:string,extension:'ydk'|'json'){
 const clean=name.normalize('NFC').replace(/[<>:"/\\|?*\u0000-\u001f]/g,'-').replace(/[. ]+$/g,'').trim()||'Untitled Deck';
 const base=clean.replace(/\.(?:ydk|json)$/i,'').replace(/(?:\s*-\s*GOAT)+$/i,'').trim()||'Untitled Deck';
 return `${base.slice(0,160)} - GOAT.${extension}`;
}
