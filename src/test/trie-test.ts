import { assert } from 'chai';
import { dataDrivenTest } from './test-helper';
import {
  testSamples, Expect, splitWords, readDictionary, DICTIONARY_DAWG_PATH
} from './trie-samples';

import { Node } from '../node';
import { readFile } from '../file-util';
import { Trie } from '../trie';

suite("Trie", () => {
  test("No initial words.", () => {
    let trie = new Trie();
    assert.equal(nodeCount(trie), 1);
    assert.equal(trie.wordCount, 0);
  });

  suite("Samples", () => {
    dataDrivenTest(testSamples, (data: string, expect: Expect) => {
      let trie = new Trie(data);
      trie.optimize();

      if (expect.nodeCount !== undefined) {
        assert.equal(nodeCount(trie), expect.nodeCount);
      }

      splitWords(data).forEach((word) => {
        if (word === '') {
          return;
        }
        assert.ok(trie.isWord(word), word + ' should be in Trie');
      });

      if (expect.wordCount !== undefined) {
        assert.equal(trie.wordCount, expect.wordCount);
      } else {
        assert.equal(trie.wordCount, splitWords(data).length);
      }

      if (expect.nonWords) {
        expect.nonWords.forEach((word) => {
          assert.ok(!trie.isWord(word), word + ' should not be in Trie');
        });
      }
    });
  });

  suite("Pack Samples", () => {
    let packTests = testSamples.filter((tests) => {
      return tests.expect && tests.expect.pack;
    });
    dataDrivenTest(packTests, (data: string, expect: Expect) => {
      let trie = new Trie(data);
      trie.optimize();

      assert.equal(trie.pack(), expect.pack);
    });
  });

  suite("Insertion order", () => {
    test("Later sorted batches can be added", () => {
      let trie = new Trie('bat bats');
      trie.insertWords('cat cats');
      trie.insert('dog');
      ['bat', 'bats', 'cat', 'cats', 'dog'].forEach((word) => {
        assert.ok(trie.isWord(word), word + ' should be in Trie');
      });
      assert.equal(trie.wordCount, 5);
      assert.equal(trie.pack(), new Trie('bat bats cat cats dog').pack());
    });

    test("Out of order insert throws", () => {
      let trie = new Trie('bats cats');
      assert.throws(() => trie.insertWords('bat'), /sorted order/);
      assert.throws(() => trie.insert('ca'), /sorted order/);
    });

    test("Re-inserting the last word is ignored", () => {
      let trie = new Trie('bat cat');
      trie.insert('cat');
      assert.equal(trie.wordCount, 2);
    });

    test("Insert after pack throws", () => {
      let trie = new Trie('bat');
      trie.pack();
      assert.throws(() => trie.insert('cat'), /optimized or packed/);
    });

    test("Blank words in a later batch are ignored", () => {
      let trie = new Trie('bat');
      trie.insertWords('  cat, dog ');
      assert.equal(trie.wordCount, 3);
    });
  });

  suite("Input handling", () => {
    test("Input array is not modified", () => {
      let words = ['Dog', 'cat', 'cat'];
      let trie = new Trie(words);
      assert.deepEqual(words, ['Dog', 'cat', 'cat']);
      assert.ok(trie.isWord('dog'));
      assert.equal(trie.wordCount, 2);
    });

    test("Repeated duplicates are counted once", () => {
      let trie = new Trie('a a a b b b b');
      assert.equal(trie.wordCount, 2);
    });

    test("Mixed case and punctuation", () => {
      let trie = new Trie("Hello, World!  it's");
      ['hello', 'world', 'it', 's'].forEach((word) => {
        assert.ok(trie.isWord(word), word + ' should be in Trie');
      });
      assert.equal(trie.wordCount, 4);
    });
  });

  suite("Packing", () => {
    test("pack() is idempotent", () => {
      let trie = new Trie('cat cats bat');
      let first = trie.pack();
      assert.equal(first, 'bat,cat0;!s');
      assert.equal(trie.pack(), first);
    });

    test("optimize() is idempotent", () => {
      let trie = new Trie('bat bats cat cats dog dogs fish fishing dogging');
      trie.optimize();
      trie.optimize();
      assert.equal(trie.pack(), 'b3c3dog1fish0;!i1;!gi0s;ng;at0;!s');
    });
  });

  suite("English dictionary", function() {
    let words: string[];
    let trie: Trie;

    this.timeout(100000);

    suiteSetup(() => {
      return readDictionary()
        .then((result: string[]) => {
          words = result;
          trie = new Trie(words);
        });
    });

    test("Read dictionary", function() {
      assert.equal(trie.wordCount, 80612, "expected size");
      assert.equal(words.length, 80612);
    });

    test("Packed format is unchanged", async () => {
      let expected = await readFile(DICTIONARY_DAWG_PATH);
      assert.ok(trie.pack() === expected.trim(),
                'pack() output differs from ' + DICTIONARY_DAWG_PATH);
    });

    test("Sample words in Trie", () => {
      for (let i = 0; i < words.length; i += 20) {
        let word = words[i];
        assert.ok(trie.isWord(word));
      }
      assert.ok(!trie.isWord('xyzzy'));
    });
  });
});

function nodeCount(trie: Trie): number {
  trie.prepDFS();
  return _nodeCount(trie, trie.root);
}

function _nodeCount(trie: Trie, node: Node): number {
  if (trie.visited(node)) {
    return 0;
  }
  let count = 0;
  for (let prop in node) {
    if (Node.isNode(node.child(prop))) {
      count += _nodeCount(trie, node.child(prop) as Node);
    }
  }
  return count + 1;
}
