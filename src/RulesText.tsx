/** Resource glyphs in source rule text remain inline, with readable labels. */
export const KEYWORD_PATTERN="Duelist[’']s Edge|Standfast|Relentless|Reckless|Charge|Soar|Ranged|Siege|Pierce|Rage|Command(?!\\s+[Ss]tation\\b)|Plan|Refine|Fortify|Nullify|Aegis|Exhaust|Sacrifice|Outfit|Burn";
export default function RulesText({text,emphasize=false}:{text:string;emphasize?:boolean}){
 return <>{text.split(/(\{(?:Oath|Fury|Untuned|Ash|Veil)\})/g).map((part,i)=>/^\{/.test(part)?<img key={i} className="ashen-rule-symbol" src={`/ashen/costs/${part.slice(1,-1).toLowerCase()}.png`} alt={part.slice(1,-1)}/>:emphasize?<span key={i}>{part.split(new RegExp(`(\\b(?:${KEYWORD_PATTERN})\\b(?:\\s+\\d+)?)`,'g')).map((piece,j)=>new RegExp(`^(?:${KEYWORD_PATTERN})(?:\\s+\\d+)?$`).test(piece)?<strong key={j}>{piece}</strong>:piece)}</span>:part)}</>;
}

/** Separate a leading keyword/reminder line from the following ability text. */
export function AshenRules({text}:{text:string}){
 const lines=text.split('\n');let leading=0;
 for(const line of lines){const plain=line.replace(/\([^)]*\)/g,'').replace(new RegExp(`\\b(?:${KEYWORD_PATTERN})\\b(?:\\s+\\d+)?`,'g'),'').replace(/[\s,.;—–-]/g,'');if(plain||!line.trim())break;leading++;}
 return <>{leading>0&&<span className={`ashen-keyword-block${leading<lines.length?' has-effect':''}`}><RulesText text={lines.slice(0,leading).join('\n')} emphasize/></span>}{leading<lines.length&&<span className="ashen-ability-block"><RulesText text={lines.slice(leading).join('\n')} emphasize/></span>}</>;
}
