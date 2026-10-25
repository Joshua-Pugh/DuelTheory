import {defaultAshenArtwork} from './ashenArtwork';
import useFittedCardTitle from './useFittedCardTitle';
import {useEffect,useId,useRef,useState,type CSSProperties} from 'react';
import SetEmblem from './SetEmblem';
import CardMaterials from './CardMaterials';
import RulesText,{AshenRules} from './RulesText';
import useFittedRules from './useFittedRules';
import CostSymbols from './ResourceCost';
import {cardPresentation,rulesForCard,cleanTypeLine,type AshenCardData} from './ashenPresentation';
import type {FrameTemplate} from './cardStudio';
import {getArtwork} from './cardStudio';
import {loadCardLook,type FrameLook} from './framePersonalization';
const metalRamps={
 Noble:[[.025,.08,.18,.35,.58,.8,.96],[.02,.055,.12,.25,.44,.67,.94],[.015,.025,.055,.11,.23,.43,.87]],
 Brute:[[.02,.09,.2,.37,.57,.79,.96],[.025,.095,.21,.39,.59,.8,.96],[.025,.1,.22,.41,.61,.82,.97]],
 Neutral:[[.025,.1,.23,.42,.63,.83,.97],[.025,.1,.23,.42,.63,.83,.97],[.03,.11,.25,.44,.65,.85,.98]]
};
const inlayRamps={
 Noble:[[.02,.025,.035,.055,.095,.25,.9],[.025,.11,.23,.37,.5,.68,.94],[.025,.045,.07,.125,.2,.34,.9]],
 Brute:[[.025,.13,.26,.42,.58,.76,.96],[.02,.025,.035,.055,.105,.25,.9],[.02,.025,.03,.045,.075,.18,.9]],
 Neutral:[[.02,.07,.16,.28,.43,.65,.93],[.025,.075,.17,.3,.45,.67,.94],[.03,.09,.19,.33,.49,.71,.96]]
};
function ToneFilter({id,channels}:{id:string;channels:number[][]}){return <filter id={id} colorInterpolationFilters="sRGB"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="table" tableValues={channels[0].join(' ')}/><feFuncG type="table" tableValues={channels[1].join(' ')}/><feFuncB type="table" tableValues={channels[2].join(' ')}/></feComponentTransfer></filter>;}
export default function AshenCardFrame({card,size='full',className='',template='ornate',artworkUrl,look}:{card:AshenCardData;size?:'full'|'mini';className?:string;template?:FrameTemplate;artworkUrl?:string;look?:FrameLook}){
 const uid=useId().replace(/:/g,'');
 const artworkKey=card.id??card.cardId??'';
 const [storedArt,setStoredArt]=useState<{key:string;url:string}>();
 const [artVersion,setArtVersion]=useState(0);
 const [,setLookVersion]=useState(0);
 useEffect(()=>{const changed=(event:Event)=>{if((event as CustomEvent<string>).detail===artworkKey)setLookVersion(v=>v+1);};window.addEventListener('dueltheory-card-look',changed);return()=>window.removeEventListener('dueltheory-card-look',changed);},[artworkKey]);
 const bundledArt=defaultAshenArtwork(artworkKey);
 const effectiveLook=look??loadCardLook(artworkKey,bundledArt?.crop);
 useEffect(()=>{const changed=(event:Event)=>{if((event as CustomEvent<string>).detail===artworkKey)setArtVersion(v=>v+1);};window.addEventListener('dueltheory-artwork',changed);return()=>window.removeEventListener('dueltheory-artwork',changed);},[artworkKey]);
 useEffect(()=>{if(artworkUrl||card.image||!artworkKey.startsWith('ashen-'))return;let disposed=false;let url:string|undefined;setStoredArt(undefined);getArtwork(artworkKey).then(blob=>{if(blob&&!disposed){url=URL.createObjectURL(blob);setStoredArt({key:artworkKey,url});}}).catch(()=>{});return()=>{disposed=true;if(url)URL.revokeObjectURL(url);};},[artworkKey,artworkUrl,card.image,artVersion]);
 const {faction,resourceCost,outfitCost}=cardPresentation(card);
 const rules=rulesForCard(card);
 let text=rules.text;
 const hasStats=card.type==='Unit'||card.type==='Command Station';
 const stationHP=card.type==='Command Station'?text.match(/^HP\s*:\s*(\d+)\s*$/im)?.[1]:undefined;
 if(stationHP)text=text.replace(/^HP\s*:\s*\d+\s*\n?/im,'');
 if(card.outfitCost===null)text=text.replace(/^Outfit\s*\([^)]*\):[^\n]*\n?/im,'');
 else if(outfitCost!==undefined)text=text.replace(/\bOutfit\s*\([^)]*\)/i,`Outfit (${outfitCost} {Untuned})`);
 const flavor=rules.flavor;
 const expanded=true;
 const titleRef=useRef<HTMLHeadingElement>(null);
 useFittedCardTitle(titleRef,`${card.name}|${JSON.stringify(resourceCost)}|${card.cost||''}`);
 const rulesRef=useRef<HTMLDivElement>(null);
 useFittedRules(rulesRef,`${text}|${flavor}|${outfitCost}|${expanded}`);
 const subtype=cleanTypeLine(card);
 const showOutfit=outfitCost!==undefined&&!/\bOutfit\s*\(/i.test(text);
 const stats=card.type==='Command Station'?(stationHP?`HP ${stationHP}`:'HP —'):card.attack!=null&&card.defense!=null?`A${card.attack} / D${card.defense}`:'';
 const art=artworkUrl??card.image??(storedArt?.key===artworkKey?storedArt.url:undefined)??bundledArt?.image;
 return <article className={`ashen-frame-card frame-ornate layered-frame ${faction.toLowerCase()} ${size==='mini'?'mini':''} ${expanded?'rules-expanded':''} ${hasStats?'has-stats':'statless-frame'} ${className}`} data-legacy-template={template} data-faction={faction} aria-label={`${card.name} ${card.type} card`} style={{'--art-zoom':effectiveLook.zoom,'--art-x':`${effectiveLook.panX}%`,'--art-y':`${effectiveLook.panY}%`} as CSSProperties}>
  <svg className="ashen-material-filters" aria-hidden="true"><defs><ToneFilter id={`${uid}-metal`} channels={metalRamps[faction]}/><ToneFilter id={`${uid}-inlay`} channels={inlayRamps[faction]}/></defs></svg>
  <div className="ashen-frame-art paper inset"><div className="ashen-frame-artfill">{art?<img className="ashen-frame-art-image" src={art} alt={`${card.name} artwork`}/>:<><span className="ashen-frame-watermark">AT</span></>}</div></div>
  <div className="ashen-material-layers" aria-hidden="true"><CardMaterials hasStats={hasStats} expanded={expanded} metalFilter={`url(#${uid}-metal)`} inlayFilter={`url(#${uid}-inlay)`}/></div>
  <div className="ashen-frame-title paper"><h3 ref={titleRef}>{card.name}</h3><div className="ashen-frame-topright">{resourceCost?<CostSymbols cost={resourceCost}/>:card.cost?<span className="ashen-legacy-cost">{card.cost}</span>:null}</div></div>
  <div className="ashen-frame-typeline paper"><span>{subtype}</span><span className="ashen-rarity-icon" title={`${card.rarity??'Unspecified'} set symbol`}><SetEmblem rarity={card.rarity} size={22}/></span></div>
  <div className="ashen-frame-effect paper inset" ref={rulesRef}><p><AshenRules text={text||'No rules text.'}/></p>{flavor&&<p className="ashen-flavor"><RulesText text={flavor}/></p>}{showOutfit&&<div className="ashen-outfit-cost"><span>Outfit</span><CostSymbols cost={{untuned:outfitCost}} label="Outfit"/></div>}</div>
  <div className="ashen-frame-footer paper"><span>{card.setName||'Ashen Throne'}</span></div>{hasStats&&<div className="ashen-frame-stats paper"><strong>{stats}</strong></div>}
 </article>;
}
