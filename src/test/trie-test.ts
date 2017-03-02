import * as path from 'path';

import { assert } from 'chai';
import { dataDrivenTest } from './test-helper';
import { readFile } from '../file-util';

import { Node } from '../node';
import { Trie } from '../trie';

suite("Trie", () => {
  suite("Samples", () => {
    type Expect = {
      nodeCount?: number;
      nonWords?: string[]
      wordCount?: number;
      pack?: string;
    };

    type Test = {
      label?: string;
      data: string;
      expect: Expect
    };

    const tests: Test[] = [
      {data: "",
       expect: {nodeCount: 1, wordCount: 0}},
      {data: "cat",
       expect: {nonWords: ['ca'], nodeCount: 1, wordCount: 1}},
      {data: "cat cats",
       expect: {nonWords: ['cas'], nodeCount: 2, wordCount: 2}},

      {data: "cat bat",
       expect: {
         pack: "b0c0;at",
         nodeCount: 2}},
      {data: "a ab abc",
       expect: {
         nodeCount: 3,
         pack: "a0;!b0;!c"}},
      {data: "this is a test",
       expect: {
         wordCount: 4,
         pack: "a,is,t0;est,his",
         nonWords: ['t', 'te', 'tes'],
         nodeCount: 2}},

      {data: "them the",
       expect: {
         wordCount: 2,
         nonWords: ['th', 'there'],
         nodeCount: 2}},
      {data: "the them th",
       expect: {
         wordCount: 3,
         nonWords: ['t', 'they'],
         nodeCount: 3}},
      {data: "the them the they themselves",
       expect: {
         wordCount: 4,
         nonWords: ['thems'],
         nodeCount: 3}},
      {data: "abcde abcfg cat",
       expect: {
         wordCount: 3,
         nonWords: ['abc', 'cats'],
         nodeCount: 2}},
      {data: "to to",
       expect: {
         wordCount: 1,
         nonWords: ['t'],
         nodeCount: 1}},
      {data: "bat bats cat cats dog dogs fish fishing dogging",
       expect: {
         wordCount: 9,
         nonWords: ['ing', 's', 'cating', 'doging'],
         pack: "b3c3dog1fish0;!i1;!gi0s;ng;at0;!s",
         nodeCount: 6}},
      {data: "tap taps top tops cap caps cop cops",
       expect: {
         nonWords: ['c', 'ap'],
         nodeCount: 3,
         pack: "c0t0;ap0op0;!s"}},
      {data: "bing sing ding ring",
       expect: {
         nonWords: ['b', 'ing'],
         nodeCount: 2,
         pack: "b0d0r0s0;ing"}},
      {data: "bing sing ding ring bad sad dad rad",
       expect: {
         nonWords: ['b', 'ing', 'ad'],
         nodeCount: 2,
         pack: "b0d0r0s0;ad,ing"}},
      {label: "Issue #8 from lookups",
       data: "brian bruce bryan bryant bryce bryon buddy burton byron caleb calvin carlo carlton " +
       "carroll cedric cesar cha charle charli chester chri christian christopher chuck clarence " +
       "clark clay clayton damian damien damon daniel danny darin dariu darwin dav davi david " +
       "dean dejan deni denni derek derrick devin deven dewayne dewey",
       expect: {
       }},
    ];

    dataDrivenTest(tests, (data: string, expect: Expect) => {
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

  suite("English dictionary", () => {
    let data: string;

    suiteSetup(() => {
      return readFile(path.resolve(process.env['PROJ_DIR'], 'src/test/data/ospd3.txt'))
        .then((result: string) => {
          data = result;
        });
    });

    test("Read dictionary", function() {
      this.timeout(10000);
      let trie = new Trie(data);
      assert.equal(trie.wordCount, 80612, "expected size");
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
