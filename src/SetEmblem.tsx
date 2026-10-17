import type {CSSProperties} from 'react';

const colors:Record<string,string>={
  Iron:'#aab2bb',
  Bronze:'#e4a363',
  Silver:'#f0f5ff',
  Legendary:'#ffd35f',
  Unspecified:'#c0c7ce'
};

/** Ashen Throne set mark: a broken crown rendered from the custom emblem asset and recolored by rarity. */
export default function SetEmblem({rarity='Unspecified',size=28}:{rarity?:string;size?:number}){
  const tone=colors[rarity]||colors.Unspecified;
  return <span
    className="dt-set-emblem crown"
    role="img"
    aria-label={`${rarity} Ashen Throne set symbol`}
    style={{
      width:size,
      height:size,
      ['--set-metal' as any]:tone,
      ['--set-shadow' as any]:`${tone}55`
    } as CSSProperties}
  />;
}
