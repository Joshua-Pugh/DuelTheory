import type {Card} from './types';

/** Presentation-only sort: never mutate the actual deck order used for export/simulation. */
export function sortDeckSection(ids:readonly number[], lookup:ReadonlyMap<number,Card>, section:'Monster'|'Spell'|'Trap'|'Other'):number[]{
 const count=new Map<number,number>();
 for(const id of ids)count.set(id,(count.get(id)||0)+1);
 return [...ids].sort((a,b)=>{
  const ac=lookup.get(a),bc=lookup.get(b);
  if(section==='Monster'){
   const byLevel=(bc?.level??-1)-(ac?.level??-1);
   if(byLevel)return byLevel;
   const byAtk=(bc?.atk??-1)-(ac?.atk??-1);
   if(byAtk)return byAtk;
  }else{
   const byCopies=(count.get(b)??0)-(count.get(a)??0);
   if(byCopies)return byCopies;
  }
  return (ac?.name??'').localeCompare(bc?.name??'') || a-b;
 });
}
