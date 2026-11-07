const contactForm = 'https://docs.google.com/forms/d/e/1FAIpQLSczpkzbyD9RH3u33TWgSOd_pVqiV7yI4_hptxAizOmJkdke6A/viewform';

export default function ContactDuelTheory() {
 return (
  <article className="dt-contact">
   <div>
    <p className="eyebrow">Ashen Forge Games</p>
    <h1>Contact DuelTheory</h1>
    <p>Send us your DuelTheory questions, Ashen Throne feedback, or ideas for working together.</p>
    <section>
     <h2>Send a message</h2>
     <p>For a bug report, include the device and browser you used, what happened, and any cards or effects involved.</p>
     <iframe className="dt-contact-form" src={`${contactForm}?embedded=true`} title="Contact Ashen Forge Games form"/>
     <p><a href={contactForm}>Open the form directly</a></p>
    </section>
   </div>
   <img src="/branding/ashen-forge-games.png" alt="Ashen Forge Games" width="1254" height="1254"/>
  </article>
 );
}
