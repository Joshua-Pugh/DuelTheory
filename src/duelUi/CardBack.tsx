import "./cardBack.css";
/** DuelTheory-owned artwork shared by every game. */
export default function CardBack() {
  return (
    <span className="dt-card-back" aria-hidden="true">
      <span className="dt-back-orbit" />
      <img src="/branding/dueltheory-crest.png" alt="" />
      <span className="dt-back-word">DUELTHEORY</span>
    </span>
  );
}
