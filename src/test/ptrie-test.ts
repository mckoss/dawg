import { assert } from 'chai';
import { dataDrivenTest } from './test-helper';
import { testSamples, Expect, splitWords } from './trie-samples';

import { Trie } from '../trie';
import { PTrie } from '../ptrie';

suite("PTrie", () => {
  suite("Samples", () => {
    dataDrivenTest(testSamples, (data: string, expect: Expect) => {
      let trie = new Trie(data);
      let packed = trie.pack();

      if (expect.nodeCount !== undefined) {
        assert.equal(packed.split(';').length, expect.nodeCount, "node count");
      }

      let ptrie = new PTrie(packed);

      splitWords(data).forEach((word) => {
        if (word === '') {
          return;
        }
        assert.ok(ptrie.isWord(word), word + ' should be in PTrie.');
      });

      if (expect.nonWords) {
        expect.nonWords.forEach((word) => {
          assert.ok(!ptrie.isWord(word), word + ' should not be in PTrie');
        });
      }
    });
  });
});
