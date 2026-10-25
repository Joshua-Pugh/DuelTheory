import {
  Component,
  Suspense,
  lazy,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { keepNativeScreenAwake } from "../platform/nativeAwake";
import { Capacitor } from "@capacitor/core";
import { mobileRoute, mobileInvite, type MobileRoute } from "./routes";
import { loadDisplayName, saveDisplayName } from "../playerProfile";
const AshenReference = lazy(() => import("../AshenReference"));
const Table = lazy(() => import("../TableCompanion")),
  Arena = lazy(() => import("../AshenDuelArena")),
  Cards = lazy(() => import("./MobileCards")),
  Room = lazy(() => import("./MobilePrivateRoom"));
class ScreenBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <section className="mobile-card" role="alert">
        <h2>This screen could not open</h2>
        <p>
          Your saved data has not been cleared. Return home or restart the app.
        </p>
        <button onClick={() => location.reload()}>Restart app</button>
      </section>
    ) : (
      this.props.children
    );
  }
}
export default function MobileApp() {
  const [route, setRoute] = useState<MobileRoute>(() =>
      new URLSearchParams(location.search).has("table")
        ? "table"
        : mobileRoute(location.hash),
    ),
    [online, setOnline] = useState(navigator.onLine),
    [reference, setReference] = useState<"rules" | "keywords" | null>(null),
    [name, setName] = useState(loadDisplayName);
  const [inviteKey, setInviteKey] = useState(location.href);
  const navigate = (next: MobileRoute) => {
    const hash = "#/" + next,
      event = new CustomEvent("dt-before-route", {
        cancelable: true,
        detail: { hash },
      });
    if (!window.dispatchEvent(event)) return;
    location.hash = hash;
  };
  useEffect(() => {
    const change = () => setRoute(mobileRoute(location.hash)),
      connection = () => setOnline(navigator.onLine);
    window.addEventListener("hashchange", change);
    window.addEventListener("online", connection);
    window.addEventListener("offline", connection);
    return () => {
      window.removeEventListener("hashchange", change);
      window.removeEventListener("online", connection);
      window.removeEventListener("offline", connection);
    };
  }, []);
  useEffect(() => {
    if (route === "at") return keepNativeScreenAwake();
  }, [route]);
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let disposed = false;
    const cleanups: (() => Promise<void>)[] = [];
    const install = async () => {
      const { App } = await import("@capacitor/app");
      const track = async (
        promise: Promise<{ remove: () => Promise<void> }>,
      ) => {
        const handle = await promise;
        if (disposed) await handle.remove();
        else cleanups.push(() => handle.remove());
      };
      await track(
        App.addListener("appStateChange", (v) =>
          window.dispatchEvent(
            new CustomEvent("dt-app-active", { detail: v.isActive }),
          ),
        ),
      );
      const open = (raw: string) => {
        if (disposed) return;
        const invite = mobileInvite(raw);
        if (!invite) return;
        const hash =
          invite.kind === "table" ? "#/table" : "#/private/" + invite.code;
        const event = new CustomEvent("dt-before-route", {
          cancelable: true,
          detail: { hash },
        });
        if (!window.dispatchEvent(event)) return;
        const url = new URL(location.href);
        url.search = invite.kind === "table" ? "?table=" + invite.code : "";
        url.hash = hash;
        history.replaceState(null, "", url);
        setInviteKey(url.href);
        setRoute(invite.kind === "table" ? "table" : "private");
      };
      await track(App.addListener("appUrlOpen", (v) => open(v.url)));
      const launch = await App.getLaunchUrl();
      if (launch) open(launch.url);
      await track(
        App.addListener("backButton", () => {
          if (document.querySelector("dialog[open]")) {
            document
              .querySelector("dialog[open]")
              ?.dispatchEvent(new Event("cancel", { cancelable: true }));
            return;
          }
          if (mobileRoute(location.hash) !== "home") navigate("home");
          else void App.minimizeApp();
        }),
      );
    };
    void install().catch(() => {});
    return () => {
      disposed = true;
      cleanups.forEach((remove) => void remove());
    };
  }, []);
  return (
    <div className="mobile-shell">
      <header className="mobile-brand">
        <button aria-label="DuelTheory home" onClick={() => navigate("home")}>
          <img
            className="mobile-crest"
            src="/branding/dueltheory-crest.png"
            alt=""
          />
          <img
            className="mobile-wordmark"
            src="/branding/dueltheory-wordmark.png"
            alt="DuelTheory — Build. Simulate. Master."
          />
        </button>
        <small>PREVIEW</small>
      </header>
      {!online && (
        <p className="mobile-offline" role="status">
          Offline · local AT works. Shared tables need a connection.
        </p>
      )}
      <main>
        <ScreenBoundary key={route}>
          <Suspense
            fallback={
              <p className="mobile-loading" role="status">
                Opening {route}…
              </p>
            }
          >
            {route === "home" && (
              <>
                <section className="mobile-intro">
                  <span className="eyebrow">YOUR TABLE. YOUR GAME.</span>
                  <h1>Build. Simulate. Master.</h1>
                  <p>
                    Bring everyone to the table, then discover Ashen Throne.
                  </p>
                </section>
                <div className="mobile-home-grid">
                  <button
                    className="mobile-feature"
                    onClick={() => navigate("table")}
                  >
                    <small>PLAY TOGETHER</small>
                    <h2>Table Companion</h2>
                    <p>
                      Shared totals, counters, source damage, dice and turn
                      tracking on your own phones.
                    </p>
                    <b>Join or create a table →</b>
                  </button>
                  <button
                    className="mobile-feature"
                    onClick={() => navigate("at")}
                  >
                    <small>OUR ORIGINAL CARD GAME</small>
                    <h2>Ashen Throne</h2>
                    <p>
                      Play the Brute and Noble prototype decks locally or invite
                      a friend.
                    </p>
                    <b>Enter the duel arena →</b>
                  </button>
                </div>
                <p className="mobile-caption">
                  Development preview · purchases and account sign-in are not
                  enabled.
                </p>
              </>
            )}
            {route === "table" && <Table key={inviteKey} />}
            {route === "at" && <Arena allowResume />}
            {route === "cards" && <Cards />}
            {route === "private" && <Room key={inviteKey} />}
            {route === "more" && (
              <section className="mobile-card">
                <h1>Your DuelTheory</h1>
                <label>
                  Display name
                  <input
                    maxLength={32}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      saveDisplayName(e.target.value);
                    }}
                  />
                </label>
                <button onClick={() => setReference("rules")}>
                  AT prototype rules
                </button>
                <button onClick={() => setReference("keywords")}>
                  AT keyword reference
                </button>
                <p>
                  Local duels, rules and cards are bundled with this app. Shared
                  rooms require internet. Your device stores your decks, artwork
                  and display name.
                </p>
                <p>
                  Reduced-motion settings are respected. Purchases and DT
                  account synchronization will be added separately.
                </p>
                <a href="https://joshua-pugh.github.io/DuelTheory/">
                  Visit DuelTheory
                </a>
              </section>
            )}
          </Suspense>
        </ScreenBoundary>
      </main>
      <nav className="mobile-nav" aria-label="Main navigation">
        {(["home", "table", "at", "cards", "more"] as const).map((id) => (
          <button
            key={id}
            aria-current={route === id ? "page" : undefined}
            onClick={() => navigate(id)}
          >
            {
              {
                home: "Home",
                table: "Table",
                at: "Play AT",
                cards: "Cards",
                more: "More",
              }[id]
            }
          </button>
        ))}
      </nav>
      {reference && (
        <Suspense fallback={null}>
          <AshenReference kind={reference} onClose={() => setReference(null)} />
        </Suspense>
      )}
    </div>
  );
}
