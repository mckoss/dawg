/*
  A JavaScript implementation of a Trie search datastructure.

  Usage:

  trie = new Trie(dictionary-string);
  bool = trie.isWord(word);

  To use a packed (compressed) version of the trie stored as a string:

  compressed = trie.pack();
  ptrie = new PackedTrie(compressed);
  bool = ptrie.isWord(word)

*/
import * as ptrie from './ptrie';
import { Histogram } from './histogram';
import { unique } from './util';
import { Node } from './node';

const DEBUG = false;

// Create a Trie data structure for searching for membership of strings
// in a dictionary in a very space efficient way.
export class Trie {
  root = new Node();
  lastWord = '';
  suffixes: {[s: string]: Node} = {};
  cNext = 1;
  wordCount = 0;
  vCur = 0;

  constructor(words?: string) {
    this.insertWords(words);
  }

  // Insert words from one big string, or from an array.
  insertWords(words?: string | string[]) {
    let i;

    if (words === undefined) {
      return;
    }
    if (typeof words === 'string') {
      words = words.split(/[^a-zA-Z]+/);
    }
    for (i = 0; i < words.length; i++) {
      words[i] = words[i].toLowerCase();
    }
    unique(words);
    for (i = 0; i < words.length; i++) {
      this.insert(words[i]);
    }
  }

  insert(word: string) {
    this._insert(word, this.root);
    let lastWord = this.lastWord;
    this.lastWord = word;

    let prefix = commonPrefix(word, lastWord);
    if (prefix === lastWord) {
      return;
    }

    let freeze = this.uniqueNode(lastWord, word, this.root);
    if (freeze) {
      this.combineSuffixNode(freeze);
    }
  }

  _insert(word: string, node: Node) {
    let i: number;
    let prefix: string;
    let next: Node;
    let prop: string;

    // Duplicate word entry - ignore
    if (word.length === 0) {
      return;
    }

    // Do any existing props share a common prefix?
    for (prop in node) {
      if (!node.hasOwnProperty(prop)) {
        continue;
      }
      prefix = commonPrefix(word, prop);
      if (prefix.length === 0) {
        continue;
      }
      // Prop is a proper prefix - recurse to child node
      if (prop === prefix && Node.isNode(node.child(prop))) {
        this._insert(word.slice(prefix.length), node.child(prop) as Node);
        return;
      }
      // Duplicate terminal string - ignore
      if (prop === word && node.isTerminalString(prop)) {
        return;
      }
      next = new Node();
      next.setChild(prop.slice(prefix.length), node.child(prop));
      this.addTerminal(next, word = word.slice(prefix.length));

      node.deleteChild(prop);
      node.setChild(prefix, next);
      this.wordCount++;
      return;
    }

    // No shared prefix.  Enter the word here as a terminal string.
    this.addTerminal(node, word);
    this.wordCount++;
  }

  // Add a terminal string to node.
  // If 2 characters or less, just add with value === 1.
  // If more than 2 characters, point to shared node
  // Note - don't prematurely share suffixes - these
  // terminals may become split and joined with other
  // nodes in this part of the tree.
  addTerminal(node: Node, prop: string) {
    if (prop.length <= 1) {
      node.setChild(prop, 1);
      return;
    }
    let next = new Node();
    node.setChild(prop[0], next);
    this.addTerminal(next, prop.slice(1));
  }

  optimize() {
    let scores = [];

    this.combineSuffixNode(this.root);
    this.prepDFS();
    this.countDegree(this.root);
    this.prepDFS();
    this.collapseChains(this.root);
  }

  // Convert Trie to a DAWG by sharing identical nodes
  combineSuffixNode(node: Node) {
    // Frozen node - can't change.
    if (node._c) {
      return node;
    }
    // Make sure all children are combined and generate unique node
    // signature for this node.
    let sig = [];
    if (node.isTerminal()) {
      sig.push('!');
    }
    let props = node.props();
    for (let i = 0; i < props.length; i++) {
      let prop = props[i];
      if (Node.isNode(node.child(prop))) {
        node.setChild(prop, this.combineSuffixNode(node.child(prop) as Node));
        sig.push(prop);
        sig.push((node.child(prop) as Node)._c);
      } else {
        sig.push(prop);
      }
    }

    let sigString = sig.join('-');

    let shared = this.suffixes[sigString];
    if (shared) {
      return shared;
    }
    this.suffixes[sigString] = node;
    node._c = this.cNext++;
    return node;
  }

  prepDFS() {
    this.vCur++;
  }

  visited(node: Node) {
    if (node._v === this.vCur) {
      return true;
    }
    node._v = this.vCur;
  }

  countDegree(node: Node) {
    if (node._d === undefined) {
      node._d = 0;
    }
    node._d++;
    if (this.visited(node)) {
      return;
    }
    let props = node.props(true);
    for (let i = 0; i < props.length; i++) {
      this.countDegree(node.child(props[i]) as Node);
    }
  }

  // Remove intermediate singleton nodes by hoisting into their parent
  collapseChains(node: Node) {
    let prop: string = '-invalid-';
    let props: string[];
    let i: number;

    if (this.visited(node)) {
      return;
    }
    props = node.props();
    for (i = 0; i < props.length; i++) {
      prop = props[i];
      let child = node.child(prop) as Node;
      if (!Node.isNode(child)) {
        continue;
      }
      this.collapseChains(child);
      // Hoist the singleton child's single property to the parent
      if (child._g !== undefined && (child._d === 1 || child._g.length === 1)) {
        node.deleteChild(prop);
        prop += child._g;
        node.setChild(prop, child.child(child._g));
      }
    }
    // Identify singleton nodes
    if (props.length === 1 && !node.isTerminal()) {
      node._g = prop;
    }
  }

  isWord(word: string): boolean {
    return this.isFragment(word, this.root);
  }

  isFragment(word: string, node: Node): boolean {
    if (word.length === 0) {
      return node.isTerminal();
    }

    if (node.child(word) === 1) {
      return true;
    }

    // Find a prefix of word reference to a child
    let props = node.props(true);
    for (let i = 0; i < props.length; i++) {
      let prop = props[i];
      if (prop === word.slice(0, prop.length)) {
        return this.isFragment(word.slice(prop.length),
                               node.child(prop) as Node);
      }
    }

    return false;
  }

  // Find highest node in Trie that is on the path to word
  // and that is NOT on the path to other.
  uniqueNode(word: string, other: string, node: Node): Node | undefined {
    let props = node.props(true);
    for (let i = 0; i < props.length; i++) {
      let prop = props[i];
      if (prop === word.slice(0, prop.length)) {
        if (prop !== other.slice(0, prop.length)) {
          return node.child(prop) as Node;
        }
        return this.uniqueNode(word.slice(prop.length),
                               other.slice(prop.length),
                               node.child(prop) as Node);
      }
    }
    return undefined;
  }

  // Return packed representation of Trie as a string.
  //
  // Each node of the Trie is output on a single line.
  //
  // For example Trie("the them there thesis this"):
  // {
  //    "th": {
  //      "is": 1,
  //      "e": {
  //        "": 1,
  //        "m": 1,
  //        "re": 1,
  //        "sis": 1
  //      }
  //    }
  //  }
  //
  // Would be reperesented as:
  //
  // th0
  // e0is
  // !m,re,sis
  //
  // The line begins with a '!' iff it is a terminal node of the Trie.
  // For each string property in a node, the string is listed, along
  // with a (relative!) line number of the node that string references.
  // Terminal strings (those without child node references) are
  // separated by ',' characters.
  pack(): string {
    let self = this;
    let nodes: Node[] = [];
    let nodeCount: number;
    let syms: {[i: string]: string} = {};
    let pos = 0;

    // Make sure we've combined all the common suffixes
    this.optimize();

    function nodeLine(node: Node): string {
      let line = '';
      let sep = '';

      if (node.isTerminal()) {
        line += ptrie.TERMINAL_PREFIX;
      }

      let props = node.props();
      for (let i = 0; i < props.length; i++) {
        let prop = props[i];
        if (node.isTerminalString(prop)) {
          line += sep + prop;
          sep = ptrie.STRING_SEP;
          continue;
        }
        let child = node.child(prop) as Node;
        if (syms[child._n]) {
          line += sep + prop + syms[child._n];
          sep = '';
          continue;
        }
        let ref = ptrie.toAlphaCode(node._n - child._n - 1 + symCount);
        // Large reference to smaller string suffix -> duplicate suffix
        if (child._g && ref.length >= child._g.length &&
            node.isTerminalString(child._g)) {
          ref = child._g;
          line += sep + prop + ref;
          sep = ptrie.STRING_SEP;
          continue;
        }
        line += sep + prop + ref;
        sep = '';
      }

      return line;
    }

    // Topological sort into nodes array
    function numberNodes(node: Node) {
      if (node._n !== undefined) {
        return;
      }
      let props = node.props(true);
      for (let i = 0; i < props.length; i++) {
        numberNodes(node.child(props[i]) as Node);
      }
      node._n = pos++;
      nodes.unshift(node);
    }

    let histAbs = new Histogram();
    let histRel = new Histogram();

    function analyzeRefs(node: Node) {
      if (self.visited(node)) {
        return;
      }
      let props = node.props(true);
      for (let i = 0; i < props.length; i++) {
        let prop = props[i];
        let child = node.child(prop) as Node;
        let ref = node._n - child._n - 1;
        // Count the number of single-character relative refs
        if (ref < ptrie.BASE) {
          histRel.add(ref);
        }
        // Count the number of characters saved by converting an absolute
        // reference to a one-character symbol.
        histAbs.add(child._n, ptrie.toAlphaCode(ref).length - 1);
        analyzeRefs(child);
      }
    }

    function symbolCount(): [number, [string, number][]] {
      let topNodes = histAbs.highest(ptrie.BASE);
      let savings = [];
      savings[-1] = 0;
      let best = 0;
      let count = 0;
      let defSize = 3 + ptrie.toAlphaCode(nodeCount).length;
      for (let sym = 0; sym < ptrie.BASE; sym++) {
        if (topNodes[sym] === undefined) {
          break;
        }
        // Cumulative savings of:
        //   saved characters in refs
        //   minus definition size
        //   minus relative size wrapping to 2 digits
        savings[sym] = topNodes[sym][1] - defSize -
          histRel.countOf(ptrie.BASE - sym - 1) +
          savings[sym - 1];

        log("savings[" + sym + "] " + savings[sym] + ' = ' +
            savings[sym - 1] + ' +' +
            topNodes[sym][1] + ' - ' + defSize + ' - ' +
            histRel.countOf(ptrie.BASE - sym - 1) + ')');

        if (savings[sym] >= best) {
          best = savings[sym];
          count = sym + 1;
        }
      }
      return [count, topNodes];
    }

    numberNodes(this.root);
    nodeCount = nodes.length;

    this.prepDFS();
    analyzeRefs(this.root);

    let [symCount, topNodes] = symbolCount();
    let symDefs = [];

    for (let sym = 0; sym < symCount; sym++) {
      syms[topNodes[sym][0]] = ptrie.toAlphaCode(sym);
    }

    let nodeLines: string[] = [];

    for (let i = 0; i < nodeCount; i++) {
      nodeLines[i] = nodeLine(nodes[i]);
    }

    // Prepend symbols
    for (let sym = symCount - 1; sym >= 0; sym--) {
      nodeLines.unshift(ptrie.toAlphaCode(sym) + ':' +
                        ptrie.toAlphaCode(nodeCount -
                                          parseInt(topNodes[sym][0], 10) - 1));
    }

    return nodeLines.join(ptrie.NODE_SEP);
  }
}

function commonPrefix(w1: string, w2: string) {
  let i: number;

  let maxlen = Math.min(w1.length, w2.length);

  for (i = 0; i < maxlen && w1[i] === w2[i]; i++) {/*_*/}

  return w1.slice(0, i);
}

function log(message?: string, ...args: any[]) {
  if (DEBUG) {
    console.log(message, ...args);
  }
}
