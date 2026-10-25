import { useMemo, useState } from "react";
import catalog from "../ashenCatalog.json";
import AshenCardFrame from "../AshenCardFrame";
export default function MobileCards() {
  const [query, setQuery] = useState(""),
    [page, setPage] = useState(0),
    [id, setId] = useState(catalog.cards[0].id);
  const cards = useMemo(
    () =>
      catalog.cards.filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );
  const selected = catalog.cards.find((c) => c.id === id)!;
  return (
    <section className="mobile-card">
      <h1>Ashen Throne cards</h1>
      <label>
        Find a card
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          placeholder="Search names…"
        />
      </label>
      <div className="mobile-library">
        <div>
          <div className="mobile-card-list">
            {cards.slice(page * 15, page * 15 + 15).map((c) => (
              <button
                key={c.id}
                aria-pressed={id === c.id}
                onClick={() => setId(c.id)}
              >
                <strong>{c.name}</strong>
                <small>
                  {c.faction} · {c.type}
                </small>
              </button>
            ))}
          </div>
          <div className="mobile-pages">
            <button disabled={!page} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <span>{cards.length} cards</span>
            <button
              disabled={(page + 1) * 15 >= cards.length}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
        <aside>
          <AshenCardFrame card={selected} />
        </aside>
      </div>
    </section>
  );
}
