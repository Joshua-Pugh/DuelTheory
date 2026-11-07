import {useState} from 'react';
import AshenCardFrame from './AshenCardFrame';

export default function AshenZoomCard({card}:Pick<Parameters<typeof AshenCardFrame>[0],'card'>) {
 const [expanded,setExpanded]=useState(false);
 return <button type="button" className="ab-zoom-card" aria-expanded={expanded}
   aria-label={(expanded?'Shrink ':'Enlarge ')+card.name} onClick={()=>setExpanded(!expanded)}>
   <AshenCardFrame card={card} size={expanded?undefined:'mini'}/>
 </button>;
}
