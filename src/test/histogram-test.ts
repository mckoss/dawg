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

  test("countOf", () => {
    let hist = new Histogram();
    assert.equal(hist.countOf(1), 0);
    hist.add(1);
    assert.equal(hist.countOf(1), 1);
    hist.add(2);
    assert.equal(hist.countOf(2), 1);
  });
});
