export function pctLabel(value: number): string {
  if (value < 0) {
    return 'n/a';
  }
  return `${Math.round(value)}%`;
}

export function fixed3(n: number): string {
  return n.toFixed(3);
}
