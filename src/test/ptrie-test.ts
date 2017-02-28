import { assert } from 'chai';
import { dataDrivenTest } from './test-helper';

import { PTrie, toAlphaCode, fromAlphaCode } from '../ptrie';

suite("PTrie", () => {
  test("Export", () => {
    assert.isDefined(PTrie);
  });
});

suite("Alpha Codes", () => {
  suite("Encode and decode", () => {
    const tests: [number, string][] = [
      [0, '0'], [1, '1'], [2, '2'], [9, '9'],
      [10, 'A'], [11, 'B'], [12, 'C'], [35, 'Z'],
      [36, '00'], [37, '01'],
      [36 + 10 * 36, 'A0'], [46 + 10 * 36, 'AA'],
      [36 + 36 * 36, '000']
    ];

    dataDrivenTest(tests, (num: number, code: string) => {
      assert.equal(toAlphaCode(num), code);
      assert.equal(fromAlphaCode(code), num);
    });
  });
});
