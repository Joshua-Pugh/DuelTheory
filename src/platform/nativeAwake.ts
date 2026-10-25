import { Capacitor, registerPlugin } from "@capacitor/core";
import type { ScreenLock } from "../commander/wakeLock";
const ScreenAwake = registerPlugin<{
  setEnabled(options: { enabled: boolean }): Promise<void>;
}>("ScreenAwake");
export const nativeScreen = Capacitor.isNativePlatform();
export async function requestScreenAwake(): Promise<ScreenLock> {
  if (!nativeScreen) return navigator.wakeLock.request("screen");
  await ScreenAwake.setEnabled({ enabled: true });
  const events = new EventTarget();
  let released = false;
  return {
    get released() {
      return released;
    },
    async release() {
      if (released) return;
      released = true;
      await ScreenAwake.setEnabled({ enabled: false });
      events.dispatchEvent(new Event("release"));
    },
    addEventListener: (_event, listener) =>
      events.addEventListener("release", listener),
    removeEventListener: (_event, listener) =>
      events.removeEventListener("release", listener),
  };
}
export function keepNativeScreenAwake() {
  if (!nativeScreen) return () => {};
  void ScreenAwake.setEnabled({ enabled: true }).catch(() => {});
  return () => {
    void ScreenAwake.setEnabled({ enabled: false }).catch(() => {});
  };
}
