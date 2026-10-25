import { useEffect } from "react";

export const DUEL_VIEW_EVENT = "dt-duel-view";

/** The host app owns orientation and chrome; game rules do not depend on native APIs. */
export function useDuelViewport(active: boolean) {
  useEffect(() => {
    if (!active) return;
    window.dispatchEvent(new CustomEvent(DUEL_VIEW_EVENT, { detail: true }));
    return () => {
      window.dispatchEvent(new CustomEvent(DUEL_VIEW_EVENT, { detail: false }));
    };
  }, [active]);
}
