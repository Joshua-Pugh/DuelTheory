// @vitest-environment happy-dom
import {describe,it,expect} from 'vitest';
import {canShowBanner,type AdContext} from './policy';
const allowed:AdContext={native:true,screen:'home',configured:true,consentCanRequest:true,entitlement:'free',online:true,foreground:true};
describe('nonintrusive ad boundaries',()=>{
 it('allows only configured consented free Android menu sessions',()=>{expect(canShowBanner(allowed)).toBe(true);expect(canShowBanner({...allowed,screen:'settings'})).toBe(true);});
 it('never shows in a table, on web, for paid/unknown entitlement or without consent',()=>{for(const change of [{screen:'table'},{screen:'other'},{native:false},{configured:false},{consentCanRequest:false},{entitlement:'unknown'},{entitlement:'ad-free'},{online:false},{foreground:false}] as Partial<AdContext>[])expect(canShowBanner({...allowed,...change})).toBe(false);});
});
