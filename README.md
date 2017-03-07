# A Directed Acyclic Word Graph implementation in TypeScript/JavaScript

[ ![Codeship Status for mckoss/dawg](https://app.codeship.com/projects/1f493ab0-e53d-0134-5322-3a71122f3fca/status?branch=master)](https://app.codeship.com/projects/206435)

This library takes a dictionary of (ascii) words as input, and generates a
compressed datastructure based on a [DAWG] (like a [Trie], but whose
representation shares common suffixes as well as common prefixes).

Inspired by several blog posts by John Resig:

- [Dictionary Lookups in
  JavaScript](http://ejohn.org/blog/dictionary-lookups-in-javascript/)
- [JavaScript Trie Performance
  Analysis](http://ejohn.org/blog/javascript-trie-performance-analysis/)
- [Revised JavaScript Dictionary
  Search](http://ejohn.org/blog/revised-javascript-dictionary-search/)

_Ported from my [2011 experiment: lookups](https://github.com/mckoss/lookups)_

You can try out (a previously) hosted version of this software at:

- [JavaScript Lookups](http://lookups.pageforest.com/)
- [Unit Tests](http://lookups.pageforest.com/test/test-runner.html)

# Usage

There are two classes exposed by this library:

- Trie: This class takes a dictionary of words and can output a packed
  prepresentation of it.
- PTrie: This class can read in a packed representation, and determine
  if a word is a member.

To get started:

```
$ npm install --save dawg-lookup
```

## Creating a Packed Representation of a Dictionary

```
var Trie = require('dawg-lookup').Trie

var trie = new Trie("the rain in spain falls mainly in the plain " +
                    "main rains fall plainly " +
                    "peter piper picked a peck of pickled peppers " +
                    "pipers pickle pepper");
var packed = trie.pack();

// This packed representation would usually be stored or embedded
// in your program, for use later.
console.log(packed.split(';').join('\n'));
/*
a,fall8in,m6of,p0rain8spain,the
e3i0l5
ck0p3
ed,le0
!d
ck,pp0ter
er2
ain0
!ly
!s
*/
```

## Using a Packed Dictionary to test for Membership

```
// This dependency will not load the Trie class, which is only needed
// for packing a dictionary, not interpreting it.
var PTrie = require('dawg-lookup/lib/ptrie').PTrie;

// Using 'packed' string from above.
var ptrie = new PTrie(packed);

console.log(ptrie.isWord('picked')); // true
console.log(ptrie.isWord('foobar')); // false
console.log(ptrie.isWord('ain'));    // false

console.log(ptrie.completions("pi"));
// [ 'picked', 'pickle', 'pickled', 'piper', 'pipers' ]
```

# Packed Trie Encoding Format

A Packed Trie is an encoding of a textual Trie using 7-bit ascii. None of
the characters need be quoted themselves when placed inside a
JavaScript string, so dictionaries can be easily included in
JavaScript source files or read via ajax.

## Example

Suppose our dictionary contains the words:

    cat cats dog dogs bat bats rat rats

The corresponding Packed Trie string is:

    b0c0dog1r0
    at0
    !s

Visually, this looks like:

![DAWG diagram](https://g.gravizo.com/g?
digraph DAWG {
  aize = "4, 4";
  0 [label="start"]
  1 [label=""]
  2 [label="bat, cat, rat, dog"]
  3 [label="bats, cats, rats, dogs"]
  0 -> 1 [label="b"]
  0 -> 1 [label="c"]
  0 -> 2 [label="dog"]
  0 -> 1 [label="r"]
  1 -> 2 [label="at"]
  2 -> 3 [label="s"]
}
)

This [Trie] (actually, a [DAWG]) has 3 nodes. If we follow the path of
"cats" through the Trie we get the squence:

    node 0. match 'c': continue at node + 1
    node 1. match 'at': continue at node + 1
    node 2. match s: Found!

Or 'dog':

    node 0. match 'dog': continue at node + 2
    node 2. nothing left to match - '!' indicates Found!

_While there are conceptually 4 nodes in this [DAWG], we overload the terminal
's' in the 3rd node._

## Nodes

A file consists of a sequence of nodes, which are nodes in a Trie
representing a dictionary. Nodes are separated by ';' characters (you
can split(';') to get an array of node strings).

A node string contains an optional '!' first character, which
indicates that this node is a terminal (matching) node in the Trie if
there are zero characters left in the pattern.

The rest of the node is a sequence of character strings. Each string
is either associated with a *node reference*, or is a terminal string
completing a match. *Node references* are base 36.1 encoded relative
node numbers ('0' == +1, '1' == +2, ...). A comma follows each
terminal string to separate it from the next string in the sequence.

A *Node reference* can also be a *symbol* - an absolute node
reference, instead of a relative one.

## Symbols

Large dictionaries can be further compressed by recognizing that node
references to some common suffixes can be quite large (i.e., spanning
1,000's of nodes). While encoded as only 3 or 4 characters, we can
reduce the file size by replacing selected row references with
symbolic references.

To do so, we prepend the file with a collection of symbol definitions:

    0:B9M
    1:B9O
    2:B6R
    3:B6B
    ...
    aA5Kb971c82Ud7FFe6Y5f6E5g5Y7h5IDi58Tj53Xk4XOl4J0m3WMn3N0o38Sp2E3q2BZr1QIs0JFtXHuLPvE2w4Kx41y24zS

When used in a Node, a symbol reference indicates the absolute row
number as defined in it's symbol definition line (above).

For each symbol we define (up to 36), we shift the meaning of all
relative references down by 1. E.g.,if we define 1 symbol ('0'), then
the node reference 1 now means "+1 row", whereas it normally means "+2
rows".

### Base 36.1 numbers

Unlike base 36 numbers (digits 0-9, A-Z), base "36.1" distinguished
between leading zeros. The counting numbers are hence:

    0, 1, 2, 3, ..., 9, A, B, C, ..., Y, Z, 00, 01, 02, ... AA, ...

so we eke out a bit more space by not ignoring leading zeros.

## Building this Repo

```
$ source tools/use
$ configure-project
$ run-tests
```

  [Trie]: http://en.wikipedia.org/wiki/Trie
  [DAWG]: http://en.wikipedia.org/wiki/Directed_acyclic_word_graph
