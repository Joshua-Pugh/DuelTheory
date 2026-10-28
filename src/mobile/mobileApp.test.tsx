import {readyAshenDuel as newAshenDuel} from '../test/ashenReady';
// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import MobileApp from "./MobileApp";
import AshenDuelArena from "../AshenDuelArena";
let root: Root, host: HTMLDivElement;
const button = (label: string) =>
  Array.from(document.querySelectorAll("button")).find(
    (b) => b.textContent?.trim() === label,
  );
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  Object.defineProperty(document, "fonts", {
    configurable: true,
    value: { ready: Promise.resolve() },
  });
  localStorage.clear();
  history.replaceState(null, "", "/#/home");
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
it("opens the real Table Companion from the mobile navigation", async () => {
  await import("../TableCompanion");
  await act(async () => root.render(<MobileApp previewAT />));
  await act(async () => {
    button("Table")!.click();
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
  expect(document.querySelector("h1")?.textContent).toContain(
    "Table Companion",
  );
  expect(document.body.textContent).toContain("Create");
  expect(document.body.textContent).toContain("Join");
  expect(document.body.textContent).not.toContain("GOAT");
});
it("starts the bundled Brute/Noble duel after the coin flip and draws both hands", async () => {
  vi.useFakeTimers();
  await act(async () => root.render(<AshenDuelArena />));
  act(() => button("Flip coin & start AT duel")!.click());
  expect(button("Begin duel")!.disabled).toBe(true);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1300);
  });
  act(() => button("Begin duel")!.click());
  expect(document.querySelector(".ab-table")).toBeTruthy();
  expect(document.querySelectorAll(".ab-hand .ab-card").length).toBeGreaterThan(
    0,
  );
  expect(document.querySelectorAll(".dt-card-back").length).toBeGreaterThan(0);
  expect(document.body.textContent).toContain("Ley Basin");
  expect(document.body.textContent).toContain("Ossuary");
  expect(document.body.textContent).not.toContain("could not open");
});

import { BATTLEFIELD_KEY } from "../ashenBattlefieldState";
it("resumes a saved local duel without dealing a second opening hand", async () => {
  const state = newAshenDuel(["Noble", "Brute"], 42, 0);
  localStorage.setItem(BATTLEFIELD_KEY, JSON.stringify(state));
  await act(async () => root.render(<AshenDuelArena allowResume />));
  expect(button("Resume local duel")).toBeTruthy();
  act(() => button("Resume local duel")!.click());
  const restored = JSON.parse(localStorage.getItem(BATTLEFIELD_KEY)!);
  expect(restored.table.piles["0:hand"]).toEqual(state.table.piles["0:hand"]);
  expect(restored.table.piles["1:hand"]).toEqual(state.table.piles["1:hand"]);
  expect(document.querySelector(".ab-table")).toBeTruthy();
  expect(button("Begin duel")).toBeUndefined();
});
import * as nativeViewport from "../platform/nativeAwake";
it("locks the duel viewport on entry and restores normal app mode on exit", async () => {
  vi.useFakeTimers();
  const nativeMode = vi
    .spyOn(nativeViewport, "setNativeDuelMode")
    .mockResolvedValue();
  history.replaceState(null, "", "/#/at");
  await act(async () => root.render(<MobileApp previewAT />));
  act(() => button("Flip coin & start AT duel")!.click());
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1300);
  });
  act(() => button("Begin duel")!.click());
  expect(nativeMode).toHaveBeenCalledWith(true);
  expect(document.documentElement.classList.contains("dt-in-duel")).toBe(true);
  act(() => button("Exit AT duel")!.click());
  expect(nativeMode).toHaveBeenLastCalledWith(false);
  expect(document.documentElement.classList.contains("dt-in-duel")).toBe(false);
  nativeMode.mockRestore();
});

it("keeps the initial store build focused on tables, even with a saved AT route",async()=>{
 history.replaceState(null,'','/#/at');await act(async()=>root.render(<MobileApp/>));
 expect(button('Play AT')).toBeUndefined();expect(button('Cards')).toBeUndefined();expect(document.body.textContent).toContain('Table Companion');expect(document.querySelector('.ab-shell')).toBeNull();
});
