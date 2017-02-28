import { assert } from 'chai';
import { dataDrivenTest } from './test-helper';

import { Histogram } from '../histogram';

suite("Histogram", () => {
  suite("Samples", () => {
    const tests = [
      [[], []],
      [['a', 'b', 'c'], [['a', 1], ['b', 1], ['c', 1]]],
      [['a', 'b', 'b'], [['b', 2], ['a', 1]]]
    ];

    dataDrivenTest(tests, (data, expect) => {
      let hist = new Histogram();
      for (let j = 0; j < data.length; j++) {
        hist.add(data[j]);
      }
      assert.deepEqual(hist.highest(), expect);
    });
  });
});
