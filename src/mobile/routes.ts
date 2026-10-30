export type MobileRoute =
  | "account"
  | "home"
  | "table"
  | "at"
  | "cards"
  | "more"
  | "private";
const codePattern = /^[A-Z2-9]{8}$/;
export function mobileRoute(hash: string): MobileRoute {
  const path = hash.replace(/^#\//, "");
  if (path.startsWith("private")) return "private";
  return ["home", "table", "at", "cards", "more", "account"].includes(path)
    ? (path as MobileRoute)
    : "home";
}
export function mobileInvite(raw: string) {
  try {
    const url = new URL(raw);
    if (url.protocol === "dueltheory:") {
      if (!["table", "private"].includes(url.hostname)) return null;
      const code = url.pathname.replace(/^\//, "").toUpperCase();
      return codePattern.test(code)
        ? { kind: url.hostname === "table" ? "table" : "private", code }
        : null;
    }
    if (
      url.protocol !== "https:" ||
      !((url.hostname === "dueltheory.com" || url.hostname === "www.dueltheory.com") && url.pathname === "/" || url.hostname === "joshua-pugh.github.io" && url.pathname.startsWith("/DuelTheory/"))
    )
      return null;
    const table =
      url.searchParams.get("table") || url.searchParams.get("commander");
    if (table && codePattern.test(table)) return { kind: "table", code: table };
    const code = url.hash.match(/^#\/private\/([A-Z2-9]{8})$/)?.[1];
    return code ? { kind: "private", code } : null;
  } catch {
    return null;
  }
}
