export function throttle<Args extends readonly unknown[]>(
  fn: (...args: Args) => void,
  windowMs: number,
): (...args: Args) => void {
  let lastCall = 0;
  let trailingTimer: ReturnType<typeof setTimeout> | undefined;

  return (...args: Args) => {
    const now = Date.now();
    const elapsed = now - lastCall;

    const invoke = () => {
      lastCall = Date.now();
      fn(...args);
    };

    if (elapsed >= windowMs) {
      if (trailingTimer !== undefined) {
        clearTimeout(trailingTimer);
        trailingTimer = undefined;
      }
      invoke();
      return;
    }

    if (trailingTimer !== undefined) {
      clearTimeout(trailingTimer);
    }
    trailingTimer = setTimeout(() => {
      trailingTimer = undefined;
      invoke();
    }, windowMs - elapsed);
  };
}
