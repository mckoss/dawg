import { assert } from 'chai';
import { dataDrivenTest } from './test-helper';
import {
  testSamples, Expect, splitWords, readDictionary
} from './trie-samples';

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

  test("match", function() {
    let trie = new Trie("cat cats dog dogs rat rats hi hit hither");
    let ptrie = new PTrie(trie.pack());

    assert.equal(ptrie.match("catjzkd"), 'cat');
    assert.equal(ptrie.match("jzkdy"), '');
    assert.equal(ptrie.match("jcatzkd"), '');
    assert.equal(ptrie.match("hitherandyon"), 'hither');
  });

  test("completions", function () {
    let trie = new Trie("cat cats dog dogs rat rats hi hit hither");
    let ptrie = new PTrie(trie.pack());

    assert.deepEqual(ptrie.completions(''),
                     ['cat', 'cats', 'dog', 'dogs', 'hi',
                      'hit', 'hither', 'rat', 'rats']);
    assert.deepEqual(ptrie.completions('', 2), ['cat', 'cats']);
    assert.deepEqual(ptrie.completions('c'), ['cat', 'cats']);
    assert.deepEqual(ptrie.completions('cat'), ['cat', 'cats']);
    assert.deepEqual(ptrie.completions('hi'),
                     ['hi', 'hit', 'hither']);
  });

  test("English dictionary", function() {
    this.timeout(100000);

    return readDictionary()
      .then((words) => {
        let trie = new Trie(words);
        let ptrie = new PTrie(trie.pack());

        // Test 5% of words
        for (let i = 0; i < words.length; i += 20) {
          assert.ok(ptrie.isWord(words[i]));
        }

        assert.ok(!ptrie.isWord('xyzzy'));
      });
  });
});
