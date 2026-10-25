// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from "vitest";
import { startVisiblePolling, requestSignal } from "./polling";
const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});
it("aborts on background, resumes once, and ignores late responses from the previous read", async () => {
  vi.useFakeTimers();
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
  const requests: { signal: AbortSignal; resolve: (value: number) => void }[] =
    [];
  const read = vi.fn(
      (signal: AbortSignal) =>
        new Promise<number>((resolve) => requests.push({ signal, resolve })),
    ),
    onValue = vi.fn();
  const dispose = startVisiblePolling({
    read,
    onValue,
    onError: vi.fn(),
    interval: 1000,
  });
  expect(read).toHaveBeenCalledTimes(1);
  window.dispatchEvent(new CustomEvent("dt-app-active", { detail: false }));
  expect(requests[0].signal.aborted).toBe(true);
  window.dispatchEvent(new CustomEvent("dt-app-active", { detail: true }));
  expect(read).toHaveBeenCalledTimes(2);
  requests[0].resolve(1);
  await flush();
  await vi.advanceTimersByTimeAsync(2000);
  expect(read).toHaveBeenCalledTimes(2);
  expect(onValue).not.toHaveBeenCalled();
  requests[1].resolve(2);
  await flush();
  expect(onValue).toHaveBeenCalledWith(2);
  await vi.advanceTimersByTimeAsync(1000);
  expect(read).toHaveBeenCalledTimes(3);
  dispose();
  expect(requests[2].signal.aborted).toBe(true);
  requests[2].resolve(3);
  await flush();
  await vi.advanceTimersByTimeAsync(30000);
  expect(read).toHaveBeenCalledTimes(3);
});
it("cancels request timeouts and respects pre-aborted callers", () => {
  vi.useFakeTimers();
  const external = new AbortController();
  external.abort();
  const request = requestSignal(1000, external.signal);
  expect(request.signal.aborted).toBe(true);
  request.dispose();
  expect(vi.getTimerCount()).toBe(0);
});
it("backs off failures instead of overlapping slow reads", async () => {
  vi.useFakeTimers();
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
  const read = vi.fn().mockRejectedValue(Error("offline")),
    onError = vi.fn();
  const dispose = startVisiblePolling({
    read,
    onValue: vi.fn(),
    onError,
    interval: 1000,
  });
  await flush();
  await vi.advanceTimersByTimeAsync(1999);
  expect(read).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(1);
  expect(read).toHaveBeenCalledTimes(2);
  dispose();
});
