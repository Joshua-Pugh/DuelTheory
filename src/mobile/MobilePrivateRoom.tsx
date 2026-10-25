import { keepNativeScreenAwake } from "../platform/nativeAwake";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MatchView, MatchPoll, MatchCommand } from "../matches/model";
import {
  requestMatch,
  matchCredential,
  rememberMatch,
  forgetMatch,
  matchInvite,
  type Credential,
  type RoomInfo,
} from "../matches/client";
import { newRoomCode } from "../commander/client";
import { startVisiblePolling } from "../platform/polling";
import { loadDisplayName, rememberSeatName } from "../playerProfile";
import { OpeningCoinDialog } from "../DuelLifecycleDialogs";
import AshenBattlefield from "../AshenBattlefield";
import "../privateMatch.css";
export default function MobilePrivateRoom() {
  const initialCode =
    location.hash.match(/^#\/private\/([A-Z2-9]{8})$/)?.[1] || "";
  const [code, setCode] = useState(initialCode),
    [name, setName] = useState(loadDisplayName),
    [faction, setFaction] = useState<"Brute" | "Noble">("Noble"),
    [credential, setCredential] = useState<Credential | null>(null),
    [room, setRoom] = useState<MatchView | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [chat, setChat] = useState(false),
    [text, setText] = useState(""),
    [unread, setUnread] = useState(0),
    [confirmLeave, setConfirmLeave] = useState(false);
  const current = useRef<MatchView | null>(null),
    alive = useRef(true),
    sending = useRef(false),
    action = useRef<AbortController | null>(null),
    destination = useRef("#/home"),
    messages = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (room?.phase === "playing") return keepNativeScreenAwake();
  }, [room?.phase]);
  const accept = (next: MatchView) => {
    if (!alive.current || next.game !== "ashen") return;
    const old = current.current;
    if (old && next.revision < old.revision) return;
    if (
      old?.revision === next.revision &&
      JSON.stringify(old.waitingFor) === JSON.stringify(next.waitingFor)
    )
      return;
    if (old && next.chat.length > old.chat.length && !chat)
      setUnread(
        (n) =>
          n +
          next.chat.slice(old.chat.length).filter((m) => m.seat !== next.seat)
            .length,
      );
    current.current = next;
    setRoom(next);
    setError("");
    rememberSeatName(next.members[next.seat]?.name);
  };
  const acceptRef = useRef(accept);
  acceptRef.current = accept;
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      action.current?.abort();
    };
  }, []);
  useEffect(() => {
    if (!credential) return;
    return startVisiblePolling({
      interval: 1000,
      read: (signal) =>
        requestMatch<MatchPoll>(
          credential,
          "read",
          { since: current.current?.revision },
          crypto.randomUUID(),
          signal,
        ),
      onValue: (value) => {
        if (!("unchanged" in value)) acceptRef.current(value);
        else if (current.current)
          acceptRef.current({
            ...current.current,
            waitingFor: value.waitingFor,
          });
      },
      onError: (e) =>
        setError(
          e instanceof Error ? e.message : "Connection lost. Reconnecting…",
        ),
    });
  }, [credential]);
  useEffect(() => {
    if (!initialCode) return;
    const saved = matchCredential(initialCode);
    void requestMatch<RoomInfo>(saved, "info")
      .then((info) => {
        if (info.game !== "ashen")
          throw Error(
            "This app supports Ashen Throne rooms. Open this invite on the website for other games.",
          );
        return requestMatch(saved, "read");
      })
      .then((value) => {
        if (alive.current) {
          setCredential(saved);
          acceptRef.current(value);
        }
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    const guard = (e: Event) => {
      if (current.current && current.current.phase !== "complete") {
        e.preventDefault();
        destination.current = (e as CustomEvent<{ hash: string }>).detail.hash;
        setConfirmLeave(true);
      }
    };
    window.addEventListener("dt-before-route", guard);
    return () => window.removeEventListener("dt-before-route", guard);
  }, []);
  useEffect(() => {
    if (chat && messages.current)
      messages.current.scrollTop = messages.current.scrollHeight;
  }, [chat, room?.chat.at(-1)?.id]);
  const choosing = useCallback(
    (value: boolean) => {
      if (!credential || current.current?.phase !== "playing") return;
      void requestMatch(credential, "action", {
        command: { type: "choosing", value },
      })
        .then((next) => acceptRef.current(next))
        .catch(() => {});
    },
    [credential],
  );
  const enter = async (create: boolean) => {
    if (sending.current) return;
    sending.current = true;
    setBusy(true);
    setError("");
    const c = matchCredential(
      create ? newRoomCode() : code.trim().toUpperCase(),
    );
    action.current = new AbortController();
    try {
      if (!/^[A-Z2-9]{8}$/.test(c.code))
        throw Error("Enter an eight-character room code.");
      if (!create) {
        const info = await requestMatch<RoomInfo>(
          c,
          "info",
          {},
          crypto.randomUUID(),
          action.current.signal,
        );
        if (info.game !== "ashen") throw Error("Use an Ashen Throne invite.");
      }
      const next = await requestMatch(
        c,
        create ? "create" : "join",
        { game: "ashen", name, mode: "single", pick: { faction } },
        crypto.randomUUID(),
        action.current.signal,
      );
      if (alive.current) {
        rememberMatch(c);
        setCredential(c);
        acceptRef.current(next);
        location.hash = "/private/" + c.code;
      }
    } catch (e) {
      if (alive.current)
        setError(e instanceof Error ? e.message : "Unable to join.");
    } finally {
      sending.current = false;
      if (alive.current) setBusy(false);
    }
  };
  const send = async (command: MatchCommand) => {
    if (!credential || !current.current || sending.current) return false;
    sending.current = true;
    setBusy(true);
    action.current = new AbortController();
    try {
      const next = await requestMatch(
        credential,
        "action",
        { revision: current.current.revision, command },
        crypto.randomUUID(),
        action.current.signal,
      );
      if (alive.current) acceptRef.current(next);
      return true;
    } catch (e) {
      if (alive.current)
        setError(
          e instanceof Error
            ? e.message
            : "Action was not confirmed. Refresh before retrying.",
        );
      return false;
    } finally {
      sending.current = false;
      if (alive.current) setBusy(false);
    }
  };
  const leave = async () => {
    if (await send({ type: "leave" })) {
      if (credential) forgetMatch(credential.code);
      current.current = null;
      setCredential(null);
      setRoom(null);
      setConfirmLeave(false);
      location.hash = destination.current;
    }
  };
  const copy = () => {
    if (room)
      void navigator.clipboard
        .writeText(matchInvite(room.code))
        .catch(() => setError(matchInvite(room.code)));
  };
  const chatBox = (
    <section
      className={
        "pm-chat " + (room?.phase === "playing" ? "pm-floating-chat" : "")
      }
    >
      <header>
        <h2>Room chat</h2>
        {room?.phase === "playing" && (
          <button onClick={() => setChat(false)}>Close</button>
        )}
      </header>
      <div className="pm-messages" ref={messages}>
        {room?.chat.slice(-50).map((m) => (
          <p key={m.id}>
            <strong>{room.members[m.seat]?.name}</strong>
            <span>{m.text}</span>
          </p>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim())
            void send({ type: "chat", text: text.trim() }).then((ok) => {
              if (ok) setText("");
            });
        }}
      >
        <input
          aria-label="Chat message"
          maxLength={500}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button disabled={busy || !text.trim()}>Send</button>
      </form>
    </section>
  );
  return (
    <div className="pm-page">
      <section className="mobile-card">
        <h1>Private Ashen Throne match</h1>
        {!room ? (
          <>
            <label>
              Your name
              <input
                maxLength={32}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              Your deck
              <select
                value={faction}
                onChange={(e) =>
                  setFaction(e.target.value as "Noble" | "Brute")
                }
              >
                <option value="Noble">Nobles · Crown’s Might</option>
                <option value="Brute">Brutes · Broken Fist</option>
              </select>
            </label>
            <button
              disabled={busy || !name.trim()}
              onClick={() => void enter(true)}
            >
              Create AT room
            </button>
            <label>
              Room code
              <input
                maxLength={8}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
            </label>
            <button
              disabled={busy || !name.trim() || code.length !== 8}
              onClick={() => void enter(false)}
            >
              Join AT room
            </button>
          </>
        ) : (
          <>
            <p>
              {room.code} · {room.members.filter(Boolean).length}/2 players
            </p>
            <button onClick={copy}>Copy invite link</button>
            <button onClick={() => setConfirmLeave(true)}>Leave room</button>
            {room.phase === "lobby" && (
              <>
                <div className="pm-seats">
                  {room.members.map((m, i) => (
                    <article key={i}>
                      <strong>
                        Player {i + 1} · {m?.name || "Waiting…"}
                      </strong>
                      <p>{m?.deckName}</p>
                      <small>{m?.ready ? "Ready" : "Choosing deck"}</small>
                    </article>
                  ))}
                </div>
                <label>
                  Your deck
                  <select
                    disabled={busy}
                    value={
                      room.members[room.seat]?.deckName === "Brute"
                        ? "Brute"
                        : "Noble"
                    }
                    onChange={(e) =>
                      void send({
                        type: "pick",
                        pick: { faction: e.target.value as "Brute" | "Noble" },
                      })
                    }
                  >
                    <option value="Noble">Noble</option>
                    <option value="Brute">Brute</option>
                  </select>
                </label>
                <button
                  disabled={busy}
                  onClick={() =>
                    void send({
                      type: "ready",
                      value: !room.members[room.seat]?.ready,
                    })
                  }
                >
                  {room.members[room.seat]?.ready ? "Not ready" : "Ready"}
                </button>
                <p>
                  Both players choose their deck and mark Ready before the
                  shared coin toss.
                </p>
              </>
            )}
            {room.phase === "complete" && <p>Match complete.</p>}
            {room.phase !== "playing" && chatBox}
          </>
        )}
        {error && (
          <p className="pm-error" role="alert">
            {error}
          </p>
        )}
      </section>
      {room?.phase === "coin" && (
        <OpeningCoinDialog
          seed={room.seed!}
          onBegin={() => void send({ type: "begin" })}
          onExit={() => setConfirmLeave(true)}
        />
      )}
      {room?.phase === "playing" && room.ashen && (
        <>
          <AshenBattlefield
            mobile
            remote={{
              state: room.ashen,
              choosing,
              seat: room.seat,
              send: (c) => {
                void send({ type: "ashen", action: c });
              },
            }}
            onExit={() => setConfirmLeave(true)}
            learning
          />
          {chat && chatBox}
          <div className="pm-match-overlay">
            {room.waitingFor && room.waitingFor.seat !== room.seat && (
              <span className="pm-opponent-activity">
                Your opponent is{" "}
                {room.waitingFor.kind === "selection"
                  ? "choosing cards"
                  : "responding"}
                …
              </span>
            )}
            {busy && <span role="status">Saving move...</span>}
            {error && <span className="pm-error">{error}</span>}
            <button
              onClick={() => {
                setChat((v) => !v);
                setUnread(0);
              }}
            >
              Chat {unread ? `(${unread} new)` : ""}
            </button>
          </div>
        </>
      )}
      {confirmLeave && (
        <div className="ab-modal-backdrop" style={{ zIndex: 2400 }}>
          <section
            className="ab-pile-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Leave and concede"
          >
            <h2>Leave and concede?</h2>
            <p>Leaving an active game concedes immediately.</p>
            <button disabled={busy} onClick={() => void leave()}>
              Yes · leave room
            </button>
            <button onClick={() => setConfirmLeave(false)}>Cancel</button>
          </section>
        </div>
      )}
    </div>
  );
}
