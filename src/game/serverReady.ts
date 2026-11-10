/** Health polling is only startup readiness, never a paid-provider retry. */
export async function waitForServer(onSlow: () => void, signal: AbortSignal) {
  const slow = setTimeout(onSlow, 2000);
  try {
    while (!signal.aborted) {
      const request = new AbortController(),
        cancel = () => request.abort();
      signal.addEventListener("abort", cancel, { once: true });
      const deadline = setTimeout(() => request.abort(), 5000);
      try {
        const r = await fetch("/api/health", {
          signal: request.signal,
          cache: "no-store",
        });
        if (r.ok) {
          const data = await r.json();
          if (data.ok) return;
        }
      } catch {
        if (signal.aborted) return;
      } finally {
        clearTimeout(deadline);
        signal.removeEventListener("abort", cancel);
      }
      await new Promise<void>((resolve) => {
        if (signal.aborted) return resolve();
        const done = () => {
          clearTimeout(t);
          signal.removeEventListener("abort", done);
          resolve();
        };
        const t = setTimeout(done, 2500);
        signal.addEventListener("abort", done, { once: true });
      });
    }
  } finally {
    clearTimeout(slow);
  }
}
