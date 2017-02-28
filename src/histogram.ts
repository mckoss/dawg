import { sortByValues } from './util';

type Key = string | number;

export class Histogram {
  counts: {[key: string]: number} = {};

  init(key: Key, n = 0) {
    if (typeof key === 'number') {
      key = key.toString();
    }
    if (this.counts[key] === undefined) {
      this.counts[key] = 0;
    }
    this.counts[key] += n;
  }

  add(key: Key, n = 1) {
    this.init(key, n);
  }

  countOf(key: Key): number {
    this.init(key);
    return this.counts[key];
  }

  highest(top?: number): [string, number][] {
    return sortByValues<number>(this.counts, 'desc').slice(0, top);
  }
}
