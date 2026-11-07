import {lazy,Suspense,useEffect,useRef,useState} from 'react';
import {publicRoute,PUBLIC_LINKS,type PublicRoute} from './routes';
import AboutDuelTheory from '../AboutDuelTheory';
import ContactDuelTheory from './ContactDuelTheory';
import LegacyDeckExport from './LegacyDeckExport';
import '../platformPages.css';
import './publicApp.css';
const Arena=lazy(()=>import('../AshenDuelArena'));
const Cards=lazy(()=>import('../AshenThrone'));
const Rules=lazy(()=>import('../games/ashen/AshenRulesPage'));
const Table=lazy(()=>import('../TableCompanion'));
const Account=lazy(()=>import('../account/AccountPanel'));
const Match=lazy(()=>import('../mobile/MobilePrivateRoom'));
export default function PublicApp(){
 const [route,setRoute]=useState(()=>publicRoute(location.hash,location.search));
 const [menu,setMenu]=useState(false);
 const previousUrl=useRef(location.href);
 useEffect(()=>{const change=()=>{if(location.href===previousUrl.current)return;if(!window.dispatchEvent(new CustomEvent('dt-before-route',{cancelable:true,detail:{hash:location.hash}}))){history.replaceState(null,'',previousUrl.current);return;}previousUrl.current=location.href;const next=publicRoute(location.hash,location.search);setRoute(next);setMenu(false);if(next==='contact')window.scrollTo(0,0);};window.addEventListener('hashchange',change);window.addEventListener('popstate',change);return()=>{window.removeEventListener('hashchange',change);window.removeEventListener('popstate',change);};},[]);
 const go=(next:PublicRoute)=>{const hash=`#/${next}`;if(!window.dispatchEvent(new CustomEvent('dt-before-route',{cancelable:true,detail:{hash}})))return;history.pushState(null,'',location.pathname+hash);previousUrl.current=location.href;setRoute(next);setMenu(false);window.scrollTo(0,0);};
 const playing=route==='play'||route==='match';
 return <div className="dt-public"><header className="dt-public-header"><button className="dt-public-brand" onClick={()=>go('home')} aria-label="DuelTheory Home"><img src="/branding/dt-forge-crest.svg" alt=""/><img src="/branding/dt-wordmark.svg" alt="DuelTheory"/></button><button className="secondary dt-public-toggle" aria-expanded={menu} onClick={()=>setMenu(!menu)}>Menu</button><nav aria-label="Main navigation" className={menu?'is-open':''}>{PUBLIC_LINKS.map(([label,id])=><button key={id} aria-current={route===id?'page':undefined} onClick={()=>go(id)}>{label}</button>)}<button onClick={()=>go('settings')}>Account</button></nav></header><main className={playing?'dt-public-main dt-public-play':'dt-public-main'}><Suspense fallback={<p role="status">Opening {route==='companion'?'Table Companion':'Ashen Throne'}…</p>}>
 {route==='home'&&<><section className="dt-public-intro"><div><p className="eyebrow">ASHEN FORGE GAMES</p><h1>Ashen Throne</h1><p>Command your Frontline. Wield the Ley. Break the enemy’s Command Station.</p><p>Play the Brute and Noble prototype decks on one device or invite a friend to a private match.</p><div className="builder-actions"><button className="primary" onClick={()=>go('play')}>Play Ashen Throne</button><button className="secondary" onClick={()=>go('cards')}>Browse the cards</button></div><small>Working prototype · Solo AI is in development.</small></div><img src="/ashen/artwork/ashen-noble-garrett-of-ashenfield.webp" alt="Garrett of Ashenfield"/></section><section className="panel padded"><h2>Playing at a physical table?</h2><p>Set your starting life, counters and damage sources. Invite friends by QR and track the game your way.</p><button className="secondary" onClick={()=>go('companion')}>Open Table Companion</button></section><p className="dt-site-tagline">Build. Simulate. Master.</p></>}
 {route==='play'&&<Arena/>}
 {route==='match'&&<Match mobile={false}/>}
 {route==='rules'&&<Rules/>}
 {(route==='cards'||route==='decks')&&<Cards key={route} initialSection={route} onPlay={()=>go('play')}/>}
 {route==='companion'&&<Table/>}
 {route==='about'&&<AboutDuelTheory contactHref="#/contact"/>}
 {route==='contact'&&<ContactDuelTheory/>}
 {route==='settings'&&<><Account/><LegacyDeckExport/></>}
 {route==='restricted'&&<section className="panel padded"><h1>Private development</h1><p>This tool is no longer part of the public site. Use your private-development invitation to continue.</p><button className="secondary" onClick={()=>go('home')}>Return home</button></section>}
 </Suspense></main>{!playing&&<footer className="dt-public-footer"><p>DuelTheory · By Ashen Forge Games · In development</p><nav aria-label="Contact and social links"><a href="#/contact" aria-current={route==='contact'?'page':undefined}>Contact</a><a href="https://ashenthronetcg.com/">Ashen Throne website</a><a href="https://www.facebook.com/profile.php?id=61583525884765">Facebook</a><a href="https://x.com/ashenthronetcg">X</a><a href="/table-privacy.html">Privacy</a></nav></footer>}</div>;
}
