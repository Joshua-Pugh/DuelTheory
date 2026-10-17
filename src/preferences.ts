/** Local-only preferences. No account or network required. */
export type DuelMode = 'guided' | 'competitive' | 'manual';
export type DuelPreferences = {
  mode: DuelMode;
  showExplanations: boolean;
  showLegalTargetHints: boolean;
  confirmActions: boolean;
  showEventTimeline: boolean;
};
export const PREFERENCE_KEY='dueltheory.preferences.v1';
export const DEFAULT_PREFERENCES:DuelPreferences={
  mode:'guided',showExplanations:true,showLegalTargetHints:true,
  confirmActions:false,showEventTimeline:true,
};
const isObject=(value:unknown):value is Record<string,unknown>=>typeof value==='object'&&value!==null&&!Array.isArray(value);
export function normalizePreferences(value:unknown):DuelPreferences {
  if(!isObject(value))return {...DEFAULT_PREFERENCES};
  const mode: DuelMode=value.mode==='guided'||value.mode==='competitive'||value.mode==='manual'?value.mode:DEFAULT_PREFERENCES.mode;
  const result={...DEFAULT_PREFERENCES,mode};
  for(const key of ['showExplanations','showLegalTargetHints','confirmActions','showEventTimeline'] as const){
    if(typeof value[key]==='boolean')result[key]=value[key] as boolean;
  }
  return result;
}
export function loadPreferences():DuelPreferences {
  try {return normalizePreferences(JSON.parse(localStorage.getItem(PREFERENCE_KEY)||'null'));}
  catch{return {...DEFAULT_PREFERENCES};}
}
export function persistPreferences(value:DuelPreferences):boolean {
  try{localStorage.setItem(PREFERENCE_KEY,JSON.stringify(normalizePreferences(value)));return true;}
  catch{return false;}
}
