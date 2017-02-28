export const NODE_SEP = ';';
export const STRING_SEP = ',';
export const TERMINAL_PREFIX = '!';
export const BASE = 36;
export const MAX_WORD = 'zzzzzzzzzz';

// Placeholder
export class PTrie {
}

// 0, 1, 2, ..., A, B, C, ..., 00, 01, ... AA, AB, AC, ..., AAA, AAB, ...
export function toAlphaCode(n: number): string {
  let s = '';
  let places = 1;

  for (let range = BASE;
       n >= range;
       n -= range, places++, range *= BASE) {/*_*/}

  while (places--) {
    let d = n % BASE;
    s = String.fromCharCode((d < 10 ? 48 : 55) + d) + s;
    n = (n - d) / BASE;
  }
  return s;
}

export function fromAlphaCode(s: string): number {
  let n = 0;

  for (let places = 1, range = BASE;
       places < s.length;
       n += range, places++, range *= BASE) {/*_*/}

  for (let i = s.length - 1, pow = 1;
       i >= 0;
       i--, pow *= BASE) {
    let d = s.charCodeAt(i) - 48;
    if (d > 10) {
      d -= 7;
    }
    n += d * pow;
  }
  return n;
}
