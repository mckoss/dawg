# A Directed Acyclic Word Graph implementation in TypeScript/JavaScript

[![CI](https://github.com/mckoss/dawg/actions/workflows/main.yml/badge.svg)](https://github.com/mckoss/dawg/actions/workflows/main.yml)

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

Try it out in the browser: **[DAWG Packer demo](https://mckoss.github.io/dawg/)**.
Paste in a word list and see the packed DAWG, one node per line.

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

Lookups are case-insensitive (the Trie lowercases its input words).
TypeScript type declarations are included.

## Adding Words Incrementally

`Trie` shares common suffixes as words are inserted, so words must be added
in sorted order. `insertWords()` sorts each batch it is given, and later
batches must sort after every word already inserted. Inserting out of order,
or after calling `optimize()` or `pack()`, throws an `Error`.

```
var trie = new Trie("apple banana");
trie.insertWords("cherry date");  // OK - sorts after "banana".
trie.insertWords("avocado");      // Throws - sorts before "banana".
```

## Command Line

```
$ npx dawg-lookup dictionary.txt > dictionary.dawg
```

# Effective Compression

How does a packed DAWG compare with general-purpose compressors? These are
results for the 80,612-word OSPD3 Scrabble dictionary
(`src/test/data/ospd3.txt`, one word per line), as a percentage of the
original 625,324-byte word list:

| Encoding                       |          Raw |          zip -9 |         gzip -9 |      brotli -11 |          xz -9e |
|--------------------------------|-------------:|----------------:|----------------:|----------------:|----------------:|
| Word list (sorted by length)   | 625,324 100% | 239,116 (38.2%) | 241,098 (38.6%) | 193,451 (30.9%) | 148,772 (23.8%) |
| Word list (alphabetical)       | 625,324 100% | 200,248 (32.0%) | 201,617 (32.2%) | 148,438 (23.7%) | 142,976 (22.9%) |
| **Packed DAWG**                | **179,452 (28.7%)** | 110,481 (17.7%) | **109,311 (17.5%)** | 103,000 (16.5%) | 104,568 (16.7%) |

Takeaways:

- **The packed DAWG on its own (28.7%) is smaller than zip or gzip of the
  word list (32-39%)** - and unlike a zip file, it can be searched directly,
  with no decompression step and no need to expand the dictionary in memory.
- **The DAWG still compresses well.** Its text form has plenty of repeated
  suffix fragments, so gzip shrinks it by another 39%. Since web servers
  typically gzip (or brotli) text in transit, 17.5% is the realistic
  download size - about **46% smaller than the gzipped alphabetical word
  list** (109 KB vs 202 KB), and 24% smaller than even `xz -9e` on the word
  list.
- Sorting the word list alphabetically helps every compressor, because
  shared prefixes land next to each other - but a DAWG goes further by also
  sharing common suffixes.

The [demo site](https://mckoss.github.io/dawg/) shows the same gzip
comparison, computed in the browser, for any word list you enter.

_Measured with `zip -9`, `xz -9e`, and Node's `zlib` for gzip (level 9) and
brotli (quality 11, 16 MB window)._

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

![DAWG diagram](https://g.gravizo.com/svg?digraph%20DAWG%20{%20%20aize%20=%20%224,%204%22;%20%200%20[label=%22start%22]%20%201%20[label=%22%22]%20%202%20[label=%22bat,%20cat,%20rat,%20dog%22]%20%203%20[label=%22bats,%20cats,%20rats,%20dogs%22]%20%200%20-%3E%201%20[label=%22b%22]%20%200%20-%3E%201%20[label=%22c%22]%20%200%20-%3E%202%20[label=%22dog%22]%20%200%20-%3E%201%20[label=%22r%22]%20%201%20-%3E%202%20[label=%22at%22]%20%202%20-%3E%203%20[label=%22s%22]})

<!-- 
Source code for the above, which can be edited at g.gravizo.com:

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

-->

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

Use the Node version in `.nvmrc` (the current LTS):

```
$ nvm use
$ npm install
$ npm test              # Build and run unit tests.
$ npm run lint
$ npm run coverage      # Tests with a code coverage report.
$ npm run serve:site    # Build the demo site and serve it on localhost:8080.
```

CI (GitHub Actions) runs lint and tests on every push and pull request, and
deploys the demo site in `site/` to GitHub Pages on pushes to `master`.

  [Trie]: http://en.wikipedia.org/wiki/Trie
  [DAWG]: http://en.wikipedia.org/wiki/Directed_acyclic_word_graph
