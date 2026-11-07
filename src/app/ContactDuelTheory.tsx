const supportEmail = 'designteam@ashenforgegames.com';

export default function ContactDuelTheory() {
 return (
  <article className="dt-contact">
   <div>
    <p className="eyebrow">Ashen Forge Games</p>
    <h1>Contact DuelTheory</h1>
    <p>Send us your DuelTheory questions, Ashen Throne feedback, or ideas for working together.</p>
    <a href={`mailto:${supportEmail}?subject=DuelTheory%20inquiry`}>{supportEmail}</a>
    <section>
     <h2>Report a problem</h2>
     <p>Tell us what you were doing, what happened, and which device and browser you used. For a match issue, include the cards or effects involved. A screenshot can help if you have one.</p>
     <a href={`mailto:${supportEmail}?subject=DuelTheory%20bug%20report`}>Email a bug report</a>
    </section>
   </div>
   <img src="/branding/ashen-forge-games.png" alt="Ashen Forge Games" width="1254" height="1254"/>
  </article>
 );
}
