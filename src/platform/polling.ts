/** One visible screen owns one cancellable read. Backgrounding releases timers and requests. */
export function startVisiblePolling<T>({
  read,
  onValue,
  onError,
  interval = 2000,
}: {
  read: (signal: AbortSignal) => Promise<T>;
  onValue: (value: T) => void;
  onError: (error: unknown) => void;
  interval?: number;
}) {
  let disposed = false,
    nativeActive = true,
    timer: ReturnType<typeof setTimeout> | undefined,
    controller: AbortController | undefined,
    failures = 0;
  const visible = () =>
    !disposed && !document.hidden && nativeActive && navigator.onLine;
  const stop = () => {
    clearTimeout(timer);
    controller?.abort();
    controller = undefined;
  };
  const run = async () => {
    if (!visible() || controller) return;
    const own = new AbortController();
    controller = own;
    try {
      const result = await read(own.signal);
      if (!disposed && !own.signal.aborted) {
        failures = 0;
        onValue(result);
      }
    } catch (e) {
      if (!disposed && !own.signal.aborted) {
        failures++;
        onError(e);
      }
    } finally {
      if (controller === own) {
        controller = undefined;
        if (visible())
          timer = setTimeout(
            run,
            Math.min(30000, interval * 2 ** Math.min(failures, 4)),
          );
      }
    }
  };
  const resume = () => {
    stop();
    if (visible()) void run();
  };
  const native = (e: Event) => {
    nativeActive = (e as CustomEvent<boolean>).detail;
    resume();
  };
  document.addEventListener("visibilitychange", resume);
  window.addEventListener("online", resume);
  window.addEventListener("offline", resume);
  window.addEventListener("dt-app-active", native);
  void run();
  return () => {
    disposed = true;
    stop();
    document.removeEventListener("visibilitychange", resume);
    window.removeEventListener("online", resume);
    window.removeEventListener("offline", resume);
    window.removeEventListener("dt-app-active", native);
  };
}
export function requestSignal(milliseconds: number, external?: AbortSignal) {
  const controller = new AbortController(),
    abort = () => controller.abort();
  if (external?.aborted) abort();
  else external?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, milliseconds);
  return {
    signal: controller.signal,
    dispose: () => {
      clearTimeout(timer);
      external?.removeEventListener("abort", abort);
    },
  };
}
