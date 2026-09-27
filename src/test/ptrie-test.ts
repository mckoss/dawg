import { assert } from 'chai';
import { dataDrivenTest } from './test-helper';
import {
  testSamples, Expect, splitWords, readDictionary, DICTIONARY_DAWG_PATH
} from './trie-samples';

import { Trie } from '../trie';
import { PTrie } from '../ptrie';
import { readFile } from '../file-util';

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

  test("Invalid symbol table throws", () => {
    assert.throws(() => new PTrie("1:4;a1q0;!b"), /Invalid Symbol name/);
  });

  test("match", function() {
    let trie = new Trie("cat cats dog dogs rat rats hi hit hither");
    let ptrie = new PTrie(trie.pack());

    assert.equal(ptrie.match("catjzkd"), 'cat');
    assert.equal(ptrie.match("jzkdy"), '');
    assert.equal(ptrie.match("jcatzkd"), '');
    assert.equal(ptrie.match("hitherandyon"), 'hither');
  });

  test("matches", () => {
    let ptrie = new PTrie(new Trie("hi hit hither hitherto cat").pack());

    assert.deepEqual(ptrie.matches("hitherandyon"), ['hi', 'hit', 'hither']);
    assert.deepEqual(ptrie.matches("hitherto"),
                     ['hi', 'hit', 'hither', 'hitherto']);
    assert.deepEqual(ptrie.matches("h"), []);
    assert.deepEqual(ptrie.matches(""), []);
    assert.deepEqual(ptrie.matches("dog"), []);
  });

  test("Case-insensitive lookups", () => {
    let ptrie = new PTrie(new Trie("Cat cats").pack());

    assert.ok(ptrie.isWord('cat'));
    assert.ok(ptrie.isWord('CAT'));
    assert.equal(ptrie.match('CATS'), 'cats');
    assert.deepEqual(ptrie.completions('Ca'), ['cat', 'cats']);
  });

  test("Completions include words after 'zzzzzzzzz'", () => {
    let ptrie = new PTrie(new Trie("zz zzzzzzzzzz zzzzzzzzzzzz").pack());

    assert.deepEqual(ptrie.completions(''),
                     ['zz', 'zzzzzzzzzz', 'zzzzzzzzzzzz']);
    assert.deepEqual(ptrie.completions('zzz'),
                     ['zzzzzzzzzz', 'zzzzzzzzzzzz']);
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
    assert.deepEqual(ptrie.completions('hi', 0), []);
    assert.deepEqual(ptrie.completions('d', 1), ['dog']);
    assert.deepEqual(ptrie.completions('x'), []);
    assert.deepEqual(ptrie.completions('cattle'), []);
  });

  suite("English dictionary", function() {
    let words: string[];
    let ptrie: PTrie;

    suiteSetup(async () => {
      words = await readDictionary();
      ptrie = new PTrie(new Trie(words).pack());
    });

    test("All words round trip through completions", () => {
      let expected = words.slice().sort();
      assert.deepEqual(ptrie.completions(''), expected);
    });

    test("All words are found", () => {
      for (let word of words) {
        if (!ptrie.isWord(word)) {
          assert.fail(word + ' should be in PTrie');
        }
      }
    });

    test("Non-words are rejected", () => {
      let dict = new Set(words);
      let checked = 0;
      // Derive near-miss non-words from real words.
      for (let i = 0; i < words.length; i += 7) {
        let word = words[i];
        for (let candidate of [word + 'q', word.slice(0, -1), 'q' + word]) {
          if (candidate === '' || dict.has(candidate)) {
            continue;
          }
          checked++;
          if (ptrie.isWord(candidate)) {
            assert.fail(candidate + ' should not be in PTrie');
          }
        }
      }
      assert.isAbove(checked, 10000);
      assert.ok(!ptrie.isWord('xyzzy'));
    });

    test("Checked-in packed dictionary loads", async () => {
      let packed = await readFile(DICTIONARY_DAWG_PATH);
      let loaded = new PTrie(packed.trim());
      assert.deepEqual(loaded.completions('zyz'), ptrie.completions('zyz'));
      assert.ok(loaded.isWord('zyzzyva'));
    });
  });
});
