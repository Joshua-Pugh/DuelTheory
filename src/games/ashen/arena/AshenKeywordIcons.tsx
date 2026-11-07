const symbols={
 Soar:<path d="M12 17c-4-1-7-5-9-11l5 3 4 5 4-5 5-3c-2 6-5 10-9 11Z"/>,
 Ranged:<path d="M5 4c11 0 15 4 15 15L5 4Zm2 13L18 6m-5 0h5v5M7 17H4v3h3Z"/>,
 Siege:<path d="m5 20 11-11m-7 0 10 11M3 7l4-4 5 5-4 4Zm9 1 5-5 4 4-5 5Z"/>,
};

export default function AshenKeywordIcons({keywords}:{keywords:string[]}){
 const shown=(Object.keys(symbols) as (keyof typeof symbols)[]).filter(keyword=>keywords.includes(keyword));
 if(!shown.length)return null;
 return <span className="ab-keyword-icons" aria-hidden="true">{shown.map(keyword=><span key={keyword} title={keyword}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{symbols[keyword]}</svg></span>)}</span>;
}
