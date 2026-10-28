import { expect, it } from "vitest";
import { mobileInvite, mobileRoute } from "./routes";
it("accepts supported room invites and rejects unrelated hosts and schemes", () => {
  expect(mobileInvite("dueltheory://table/ABCDEFGH")).toEqual({
    kind: "table",
    code: "ABCDEFGH",
  });
  expect(
    mobileInvite("https://joshua-pugh.github.io/DuelTheory/#/private/ABCDEFGH"),
  ).toEqual({ kind: "private", code: "ABCDEFGH" });
  expect(
    mobileInvite("https://joshua-pugh.github.io/DuelTheory/?table=ABCDEFGH"),
  ).toEqual({ kind: "table", code: "ABCDEFGH" });
  for (const url of [
    "dueltheory://unknown/ABCDEFGH",
    "javascript:alert(1)",
    "https://evil.test/DuelTheory/?table=ABCDEFGH",
    "https://joshua-pugh.github.io/other/?table=ABCDEFGH",
    "dueltheory://table/../../oops",
  ])
    expect(mobileInvite(url)).toBeNull();
  expect(mobileRoute("#/private/ABCDEFGH")).toBe("private");
  expect(mobileRoute("#/goat")).toBe("home");
});

it('accepts the current DuelTheory domain while refusing lookalike hosts',()=>{
 expect(mobileInvite('https://dueltheory.com/?table=ABCDEFGH')).toEqual({kind:'table',code:'ABCDEFGH'});
 expect(mobileInvite('https://www.dueltheory.com/?table=ABCDEFGH')).toEqual({kind:'table',code:'ABCDEFGH'});
 expect(mobileInvite('https://dueltheory.com.evil.test/?table=ABCDEFGH')).toBeNull();
 expect(mobileInvite('https://dueltheory.com/unrelated?table=ABCDEFGH')).toBeNull();
});
