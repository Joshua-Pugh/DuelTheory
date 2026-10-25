/** Native localhost URLs must never be sent to another player's phone. */
export function publicInviteBase() {
  const configured = (
    import.meta as ImportMeta & { env?: Record<string, string> }
  ).env?.VITE_PUBLIC_WEB_URL;
  const url = new URL(configured || location.href);
  url.search = "";
  url.hash = "";
  return url;
}
