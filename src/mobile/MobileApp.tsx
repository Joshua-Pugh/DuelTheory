import { DUEL_VIEW_EVENT } from "../duelUi/useDuelViewport";
import {
  Component,
  Suspense,
  lazy,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  keepNativeScreenAwake,
  setNativeDuelMode,
} from "../platform/nativeAwake";
import { Capacitor } from "@capacitor/core";
import { mobileRoute, mobileInvite, type MobileRoute } from "./routes";
import { loadDisplayName, saveDisplayName } from "../playerProfile";
const AccountPanel=lazy(()=>import("../account/AccountPanel"));
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
export default function MobileApp({previewAT=import.meta.env.VITE_MOBILE_AT_PREVIEW==="true"}:{previewAT?:boolean}={}) {
  const [requestedRoute, setRoute] = useState<MobileRoute>(() =>
      new URLSearchParams(location.search).has("table")
        ? "table"
        : mobileRoute(location.hash),
    ),
    [online, setOnline] = useState(navigator.onLine),
    [reference, setReference] = useState<"rules" | "keywords" | null>(null),
    [name, setName] = useState(loadDisplayName);
  const route=previewAT||!["at","cards","private"].includes(requestedRoute)?requestedRoute:"home";
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
    const mode = (event: Event) => {
      const active = Boolean((event as CustomEvent<boolean>).detail);
      document.documentElement.classList.toggle("dt-in-duel", active);
      void setNativeDuelMode(active).catch(() => {});
    };
    window.addEventListener(DUEL_VIEW_EVENT, mode);
    return () => {
      window.removeEventListener(DUEL_VIEW_EVENT, mode);
      document.documentElement.classList.remove("dt-in-duel");
      void setNativeDuelMode(false).catch(() => {});
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
        if (!invite || !previewAT && invite.kind === "private") return;
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
          <span className="mobile-home-label">Home</span><img
            className="mobile-crest"
            src="/branding/dt-forge-crest.svg"
            alt=""
          />
          <img
            className="mobile-wordmark"
            src="/branding/dt-wordmark.svg"
            alt="DuelTheory"
          />
        </button>

      </header>
      {!online && (
        <p className="mobile-offline" role="status">
          Offline · shared tables need a connection. Your saved room details are kept on this device.
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
                  <span className="eyebrow">DUELTHEORY</span>
                  <h1>Your game. Your way.</h1>
                  <p>
                    One shared table, on every player’s device.
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
                      Set your starting totals and counters, save a game profile,
                      and invite friends by QR code or link.
                    </p>
                    <b>Create or join a table →</b>
                  </button>
                  {previewAT&&<button
                    className="mobile-feature"
                    onClick={() => navigate("at")}
                  >
                    <small>OUR ORIGINAL CARD GAME</small>
                    <h2>Ashen Throne</h2>
                    <p>
                      Play the Brute and Noble prototype decks locally or invite
                      a friend.
                    </p>
                    <b>Play Ashen Throne →</b>
                  </button>}
                </div>
                <p className="mobile-caption">
                  Free table tools · friends can join from the app or a phone browser.
                </p>
              </>
            )}
            {route === "table" && <Table key={inviteKey} />}
            {route === "at" && <Arena allowResume mobile />}
            {route === "cards" && <Cards />}
            {route === "private" && <Room key={inviteKey} />}
            {route === "account" && <section className="mobile-card"><h1>Account</h1><AccountPanel/></section>}
            {route === "more" && (
              <section className="mobile-card">
                <h1>Settings & support</h1>

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
                {previewAT&&<><button onClick={() => setReference("rules")}>
                  AT prototype rules
                </button>
                <button onClick={() => setReference("keywords")}>
                  AT keyword reference
                </button></>}
                <p>
                  Shared tables require internet. Your device keeps your display name and room reconnection details. You can join a friend’s table without an account.
                </p>
                <p>
                  The app follows your device’s reduced-motion setting. Purchases are not enabled in this test build.
                </p>
                <a href="/table-privacy.html">Privacy & data</a>
                <a href="mailto:designteam@ashenforgegames.com">Contact support</a>
                <a href="https://dueltheory.com/">
                  Visit DuelTheory
                </a>
              </section>
            )}
          </Suspense>
        </ScreenBoundary>
      </main>
      <nav className="mobile-nav" aria-label="Main navigation" style={{gridTemplateColumns:`repeat(${previewAT?6:4},1fr)`}}>
        {(["home", "table", ...(previewAT?["at", "cards"] as const:[]), "account", "more"] as const).map((id) => (
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
                account: "Account",
                more: "Settings",
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
