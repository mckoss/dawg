import { assert } from 'chai';

import { Trie } from '../trie';

suite("Trie", () => {
  test("Empty dictionary", () => {
    let t = new Trie('');
    assert.isDefined(t);
  });
});
