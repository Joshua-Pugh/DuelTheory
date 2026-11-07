/** Authoritative combat receipts. Presentation reads these; it never predicts damage. */
export type AshenCombatReport={
 serial:number;
 hits:{source:string;sourceName:string;target:string;targetName:string;amount:number;station:boolean}[];
 fallen:{id:string;name:string}[];
};
