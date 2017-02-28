import { assert } from 'chai';
import { dataDrivenTest } from './test-helper';

import { sortByValues, unique } from '../util';

suite("Util", () => {
  suite("sortByValues", () => {
    const tests = [
      { data: {obj:{}}, expect: [] },
      { data: {obj: {a: 3, b: 2, c: 1}},
        expect: [['c', 1], ['b', 2], ['a', 3]] },
      { data: {obj: {a: 3, b: 2, c: 1},
               dir: 'asc'},
        expect: [['c', 1], ['b', 2], ['a', 3]] },
      { data: {obj: {a: 3, b: 2, c: 1},
               dir: 'desc'},
        expect: [['a', 3], ['b', 2], ['c', 1]] },
    ];

    dataDrivenTest(tests, (data, expect) => {
      assert.deepEqual(sortByValues(data.obj, data.dir), expect);
    });
  });

  suite("unique", () => {
    const tests = [
      [[1, 2, 3], [1, 2, 3]],
      [[1, 2, 3, 2], [1, 2, 3]]
    ];

    dataDrivenTest(tests, (data, expect) => {
      let copy = data.slice(0);
      unique(copy);
      assert.deepEqual(copy, expect);
    });
  });
});
