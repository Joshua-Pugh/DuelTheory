/** Ads are Android-only, outside table play, and fail closed until configured. */
export type AdContext={native:boolean;screen:'home'|'settings'|'table'|'other';configured:boolean;consentCanRequest:boolean;entitlement:'unknown'|'free'|'ad-free';online:boolean;foreground:boolean};
export function canShowBanner(c:AdContext){return c.native&&c.configured&&c.consentCanRequest&&c.entitlement==='free'&&c.online&&c.foreground&&(c.screen==='home'||c.screen==='settings');}
export const REMOVE_ADS_PRODUCT='dueltheory_remove_ads';
// No purchase button until Play Billing and server verification are operational.
export const LIVE_MONETIZATION_ENABLED=false;
