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

  suite("Symbols", () => {
    let tests = [
      ["0:4;a1q0;!b1;!c1;!d1;!e1;!f",
       ['a', 'ab', 'abc', 'abcd', 'abcde', 'abcdef',
        'q', 'qe', 'qef']]
    ];

    dataDrivenTest(tests, (data: string, expect: string[]) => {
      let ptrie = new PTrie(data);
      expect.forEach((word) => {
        assert.ok(ptrie.isWord(word), word + " is a word");
      });
    });
  });
});
