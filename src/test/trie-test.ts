import * as path from 'path';
import { readFile } from '../file-util';

import { assert } from 'chai';
import { dataDrivenTest } from './test-helper';
import { testSamples, Expect, splitWords } from './trie-samples';

import { Node } from '../node';
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

  suite("English dictionary", function() {
    let data: string;
    let words: string[];
    let trie: Trie;

    this.timeout(100000);

    suiteSetup(() => {
      return readFile(path.resolve(process.env['PROJ_DIR'], 'src/test/data/ospd3.txt'))
        .then((result: string) => {
          data = result;
          words = splitWords(data);
          // Remove blank word at the end
          words.splice(-1);

          trie = new Trie(data);
          let packed = trie.pack();
          console.log("Packed length: " + packed.length);
          console.log("Header: " + packed.slice(0, 100));
        });
    });

    test("Read dictionary", function() {
      assert.equal(trie.wordCount, 80612, "expected size");
      assert.equal(words.length, 80612);
    });

    test("Sample words in Trie", () => {
      for (let i = 0; i < words.length; i += 20) {
        let word = words[i];
        assert.ok(trie.isWord(word));
      }
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
