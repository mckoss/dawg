import { assert } from 'chai';

import { Trie, PTrie } from '../index';

suite("Exports", () => {
  test("Trie", () => {
    assert.isDefined(Trie);
  });

  test("PTrie", () => {
    assert.isDefined(PTrie);
  });
});
