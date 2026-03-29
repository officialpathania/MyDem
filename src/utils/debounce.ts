export function debounce<Args extends readonly unknown[]>(
  fn: (...args: Args) => void,
  waitMs: number,
): (...args: Args) => void {
  let handle: ReturnType<typeof setTimeout> | undefined;

  return (...args: Args) => {
    if (handle !== undefined) {
      clearTimeout(handle);
    }
    handle = setTimeout(() => {
      handle = undefined;
      fn(...args);
    }, waitMs);
  };
}
