import { assert } from 'chai';

import { PTrie, toAlphaCode, fromAlphaCode } from '../ptrie';

suite("PTrie", () => {
  test("PTrie", () => {
    assert.isDefined(PTrie);
  });
});

suite("Alpha Codes", () => {
  test("Encode and decode", () => {
    const tests: [number, string][] = [
      [0, '0'], [1, '1'], [2, '2'], [9, '9'],
      [10, 'A'], [11, 'B'], [12, 'C'], [35, 'Z'],
      [36, '00'], [37, '01'],
      [36 + 10 * 36, 'A0'], [46 + 10 * 36, 'AA'],
      [36 + 36 * 36, '000']
    ];

    for (let i = 0; i < tests.length; i++) {
      let test = tests[i];
      assert.equal(toAlphaCode(test[0]), test[1]);
      assert.equal(fromAlphaCode(test[1]), test[0]);
    }
  });
});
