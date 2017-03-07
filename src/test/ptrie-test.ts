import { assert } from 'chai';
import { dataDrivenTest } from './test-helper';

import { PTrie } from '../ptrie';

suite("PTrie", () => {
  test("Export", () => {
    assert.isDefined(PTrie);
  });
});
