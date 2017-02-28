import { sortByValues } from './util';

type Key = string | number;

export class Histogram {
  counts: {[key: string]: number} = {};

  init(key: Key) {
    if (typeof key === 'number') {
      key = key.toString();
    }
    if (this.counts[key] === undefined) {
      this.counts[key] = 0;
    }
  }

  add(key: Key, n?: number) {
    if (typeof key === 'number') {
      key = key.toString();
    }
    if (n === undefined) {
      n = 1;
    }
    this.init(key);
    this.counts[key] += n;
  }

  change(keyNew: Key, keyOld: Key, n?: number) {
    if (n === undefined) {
      n = 1;
    }
    this.add(keyOld, -n);
    this.add(keyNew, n);
  }

  countOf(key: Key): number {
    this.init(key);
    return this.counts[key];
  }

  highest(top?: number): [string, number][] {
    return sortByValues<number>(this.counts, 'desc').slice(0, top);
  }
}
