/*
  A JavaScript implementation of a Trie search datastructure.

  Usage:

  trie = new Trie(dictionary-string);
  bool = trie.isWord(word);

  To use a packed (compressed) version of the trie stored as a string:

  compressed = trie.pack();
  ptrie = new PackedTrie(compressed);
  bool = ptrie.isWord(word)

  Node structure:

  Each node of the Trie is an Object that can contain the following properties:

  Special properties:

  '_c': A unique name for the node (starting from 1), used in combining
        Suffixes.

  '_n': Created when packing the Trie, the sequential node number (in pre-order
        traversal).

  '_d': The number of times a node is shared (it's in-degree from other nodes).
  '_v': Visited in DFS.
  '_g': For singleton nodes, the name of it's single property.

  Other properties - the property name is zero or more characters to be consumed
  from the prefix of the test string, with the remainder to be checked in the
  child node which is the value of the property.

  '' (empty string): If present (with value === 1), the node is a Terminal Node
  The prefix leading to this node is a word in the dictionary.

  numeric properties (value === 1) - the property name is a terminal string so
  that the prefix + string is a word in the dictionary.

*/
import * as ptrie from './ptrie';

class Node {
  '_c': number;
  '_n': number;
  '_d': number;
  '_v': number;
  '_g': string;

  child(prop: string): Node | number {
    return (this as any as {[prop: string]: Node | number})[prop];
  }

  setChild(prop: string, value: Node | number) {
    (this as any as {[prop: string]: Node | number})[prop] = value;
  }

  deleteChild(prop: string) {
    delete (this as any as {[prop: string]: Node | number})[prop];
  }

  // A property is a terminal string
  isTerminalString(prop: string): boolean {
    return typeof this.child(prop) === 'number';
  }

  // This node is a terminal node (the prefix string is a word in the
  // dictionary).
  isTerminal(): boolean {
    return this.isTerminalString('');
  }

  // Well ordered list of properties in a node (string or object properties)
  // Use nodesOnly === true to return only properties of child nodes (not
  // terminal strings).
  props(nodesOnly?: boolean): string[] {
    let me: {[prop: string]: Node | number} = this as any;
    let props: string[] = [];

    for (let prop in me) {
      if (prop !== '' && prop[0] !== '_') {
        if (!nodesOnly || isNode(this.child(prop))) {
          props.push(prop);
        }
      }
    }
    props.sort();
    return props;
  }
}

function isNode(n: number | Node): n is Node {
  return typeof n === 'object';
}

// Create a Trie data structure for searching for membership of strings
// in a dictionary in a very space efficient way.
export class Trie {
  root = new Node();
  lastWord = '';
  suffixes: {[s: string]: Node} = {};
  cNext = 1;
  wordCount = 0;
  vCur = 0;

  constructor(words: string) {
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
      prefix = commonPrefix(word, prop);
      if (prefix.length === 0) {
        continue;
      }
      // Prop is a proper prefix - recurse to child node
      if (prop === prefix && isNode(node.child(prop))) {
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
      if (isNode(node.child(prop))) {
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
      if (node.isTerminalString(prop)) {
        continue;
      }
      let child = node.child(prop) as Node;
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
  pack() {
    let self = this;
    let nodes: Node[] = [];
    let nodeCount: number;
    let syms: {[i: number]: string} = {};
    let symCount: number;
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
    function numberNodes(node) {
      if (node._n !== undefined) {
        return;
      }
      let props = node.props(true);
      for (let i = 0; i < props.length; i++) {
        numberNodes(node[props[i]]);
      }
      node._n = pos++;
      nodes.unshift(node);
    }

    let histAbs = new Histogram();
    let histRel = new Histogram();

    function analyzeRefs(node) {
      if (self.visited(node)) {
        return;
      }
      let props = node.props(true);
      for (let i = 0; i < props.length; i++) {
        let prop = props[i];
        let ref = node._n - node[prop]._n - 1;
        // Count the number of single-character relative refs
        if (ref < ptrie.BASE) {
          histRel.add(ref);
        }
        // Count the number of characters saved by converting an absolute
        // reference to a one-character symbol.
        histAbs.add(node[prop]._n, ptrie.toAlphaCode(ref).length - 1);
        analyzeRefs(node[prop]);
      }
    }

    function symbolCount() {
      histAbs = histAbs.highest(ptrie.BASE);
      let savings = [];
      savings[-1] = 0;
      let best = 0;
      let count = 0;
      let defSize = 3 + ptrie.toAlphaCode(nodeCount).length;
      for (let sym = 0; sym < ptrie.BASE; sym++) {
        if (histAbs[sym] === undefined) {
          break;
        }
        // Cumulative savings of:
        //   saved characters in refs
        //   minus definition size
        //   minus relative size wrapping to 2 digits
        savings[sym] = histAbs[sym][1] - defSize -
          histRel.countOf(ptrie.BASE - sym - 1) +
          savings[sym - 1];
        console.log("savings[" + sym + "] " + savings[sym] + ' = ' +
                    savings[sym - 1] + ' +' +
                    histAbs[sym][1] + ' - ' + defSize + ' - ' +
                    histRel.countOf(ptrie.BASE - sym - 1) + ')');
        if (savings[sym] >= best) {
          best = savings[sym];
          count = sym + 1;
        }
      }
      return count;
    }

    numberNodes(this.root, 0);
    nodeCount = nodes.length;

    this.prepDFS();
    analyzeRefs(this.root);
    symCount = symbolCount();
    let symDefs = [];
    for (let sym = 0; sym < symCount; sym++) {
      syms[histAbs[sym][0]] = ptrie.toAlphaCode(sym);
    }

    for (let i = 0; i < nodeCount; i++) {
      nodes[i] = nodeLine(nodes[i]);
    }

    // Prepend symbols
    for (sym = symCount - 1; sym >= 0; sym--) {
      nodes.unshift(ptrie.toAlphaCode(sym) + ':' +
                    ptrie.toAlphaCode(nodeCount - histAbs[sym][0] - 1));
    }

    return nodes.join(ptrie.NODE_SEP);
  }
});

function commonPrefix(w1, w2) {
  let maxlen = Math.min(w1.length, w2.length);
  for (let i = 0; i < maxlen && w1[i] === w2[i]; i++) {/*_*/}
  return w1.slice(0, i);
}

function Histogram() {
  this.counts = {};
}

Histogram.methods({
  init(sym) {
    if (this.counts[sym] === undefined) {
      this.counts[sym] = 0;
    }
  }

  add(sym, n) {
    if (n === undefined) {
      n = 1;
    }
    this.init(sym);
    this.counts[sym] += n;
  }

  change(symNew, symOld, n) {
    if (n === undefined) {
      n = 1;
    }
    this.add(symOld, -n);
    this.add(symNew, n);
  }

  countOf(sym) {
    this.init(sym);
    return this.counts[sym];
  }

  highest(top) {
    sorted = [];
    for (let sym in this.counts) {
      sorted.push([sym, this.counts[sym]]);
    }
    sorted.sort(function (a, b) {
      return b[1] - a[1];
    });
    if (top) {
      sorted = sorted.slice(0, top);
    }
    return sorted;
  }
});

/* Sort elements and remove duplicates from array (modified in place) */
function unique(a) {
  a.sort();
  for (let i = 1; i < a.length; i++) {
    if (a[i - 1] === a[i]) {
      a.splice(i, 1);
    }
  }
}
