import { assert } from 'chai';
import { dataDrivenTest } from './test-helper';

import { Node } from '../node';
import { Trie } from '../trie';

suite("Trie", () => {
  test("Empty dictionary", () => {
    let t = new Trie('');
    assert.isDefined(t);
  });

  suite("Samples", () => {
    type Expect = {
      nodeCount: number;
      nonWords?: string[]
    };

    type Test = {
      data: string;
      expect: Expect
    };

    const tests: Test[] = [
      {data: "",
       expect: {nodeCount: 1}},
      {data: "cat",
       expect: {nonWords: ['ca'], nodeCount: 1}},
      {data: "cat cats",
       expect: {nonWords: ['cas'], nodeCount: 2}},
    ];

    dataDrivenTest(tests, (data: string, expect: Expect) => {
      let trie = new Trie(data);
      trie.optimize();

      assert.equal(nodeCount(trie), expect.nodeCount);

      splitWords(data).forEach((word) => {
        if (word === '') {
          return;
        }
        assert.ok(trie.isWord(word), word + ' should be in Trie');
      });

      if (expect.nonWords) {
        expect.nonWords.forEach((word) => {
          assert.ok(!trie.isWord(word), word + ' should not be in Trie');
        });
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

function splitWords(dict: string): string[] {
  let a = dict.split(/\s/);
  return a;
}
