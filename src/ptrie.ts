import { fromAlphaCode, toAlphaCode } from './alphacode';

export const NODE_SEP = ';';
export const STRING_SEP = ',';
export const TERMINAL_PREFIX = '!';
export const MIN_LETTER = 'a';
export const MAX_LETTER = 'z';
export const MAX_WORD = new Array(10).join(MAX_LETTER);

const reNodePart = new RegExp('([' + MIN_LETTER + '-' + MAX_LETTER +
                              ']+)(' + STRING_SEP + '|[0-9A-Z]+|$)', 'g');
const reSymbol = new RegExp("([0-9A-Z]+):([0-9A-Z]+)");

interface Context {
  from: string;
  beyond: string;
  fn: (word: string, ctx: Context) => void;
  prefixes: boolean;
  abort?: boolean;
}

/*
 * Packed Trie structure.
 *
 * This class can read in a packed Trie (actually DAWG) in the form
 * of a string encoding of a set of nodes.  It will then spilt it
 * into an array of strings, and use the resulting array to
 * resolve dictionary membership.
 *
 * Usage:
 *
 *   ptrie = new PTrie(packedString);
 *
 *   // All the words that have pattern as a prefix.
 *   let matches = ptrie.matches(prefix);
 *
 *   // Return (at most limit) word beginning alphabetically with from
 *   // and less than beyond.
 *   let words = ptrie.words(from, beyond, limit);
 */
export class PTrie {
  readonly nodes: string[];
  readonly syms: number[] = [];
  readonly symCount: number;

  constructor(packed: string) {
    this.nodes = packed.split(NODE_SEP);
    this.syms = [];
    this.symCount = 0;

    while (true) {
      let m = reSymbol.exec(this.nodes[this.symCount]);
      if (!m) {
        break;
      }
      if (fromAlphaCode(m[1]) !== this.symCount) {
        throw new Error("Invalid Symbol name - found " + m[1] +
                        " when expecting " + toAlphaCode(this.symCount));
      }
      this.syms[this.symCount] = fromAlphaCode(m[2]);
      this.symCount++;
    }
    this.nodes.splice(0, this.symCount);
  }

  // Is word in the dictionary (exact match).
  isWord(word: string): boolean {
    if (word === '') {
      return false;
    }
    return this.match(word) === word;
  }

  // Returns the longest match that is prefix of word.
  match(word: string): string {
    let matches = this.matches(word);
    if (matches.length === 0) {
      return '';
    }
    return matches[matches.length - 1];
  }

  // Return all of entries that match a prefix of word (in order of increasing
  // length.
  matches(word: string): string[] {
    return this.words(word, word + MIN_LETTER);
  }

  private words(from: string, beyond: string, limit?: number): string[] {
    let words: string[] = [];

    function catchWords(word: string, ctx: Context) {
      if (limit !== undefined && words.length >= limit) {
        ctx.abort = true;
        return;
      }
      words.push(word);
    }

    this.enumerate(0, '',
                   {from: from,
                    beyond: beyond,
                    fn: catchWords,
                    prefixes: (from + MIN_LETTER) === beyond
                   });
    return words;
  }

  private enumerate(inode: number, prefix: string, ctx: Context) {
    let node = this.nodes[inode];
    let cont = true;

    function emit(word: string) {
      if (ctx.prefixes) {
        if (word === ctx.from.slice(0, word.length)) {
          ctx.fn(word, ctx);
        }
        return;
      }
      if (ctx.from <= word && word < ctx.beyond) {
        ctx.fn(word, ctx);
      }
    }

    if (node[0] === TERMINAL_PREFIX) {
      emit(prefix);
      if (ctx.abort) {
        return;
      }
      node = node.slice(1);
    }

    node.replace(reNodePart, (w: string, str: string, ref: string): string => {
      let match = prefix + str;

      // Done or no possible future match from str
      if (ctx.abort ||
          match >= ctx.beyond ||
          match < ctx.from.slice(0, match.length)) {
        return '';
      }

      let isTerminal = ref === STRING_SEP || ref === '';

      if (isTerminal) {
        emit(match);
        return '';
      }

      this.enumerate(this.inodeFromRef(ref, inode), match, ctx);
      return '';
    });
  }

  // References are either absolute (symbol) or relative (1 based).
  private inodeFromRef(ref: string, inodeFrom: number): number {
    let dnode = fromAlphaCode(ref);
    if (dnode < this.symCount) {
      return this.syms[dnode];
    }
    dnode -= this.symCount;

    return inodeFrom + dnode + 1;
  }
}
