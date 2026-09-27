#!/usr/bin/env node

/*
  Command-line interface for dawg-lookup package.

  Compress a file containing a dictionary of words into a packed
  directed acyclic graph to be used with the 'dawg-lookup/ptrie'
  decoder.

  Usage:

    dawg-lookup dictionary.txt > dictionary.dawg

  To load the resulting DAWG for decoding (ES6 or TypeScript):

    import { PTrie } from 'dawg-lookup/ptrie';

    let dawg: string = <load compressed dictionary from ajax or file system>;
    let ptrie = new PTrie(dawg);

    if (ptrie.isWord('hello')) {
      console.log("'Hello' is in the dictionary.");
    }

*/
import { Trie } from './trie';
import { readFile } from './file-util';

const USAGE = "Usage: dawg-lookup dictionary.txt > dictionary.dawg";

// Command-line argument processing.
async function main(args: string[]) {
  if (args.length !== 1) {
    throw new Error(USAGE);
  }

  let packed = await compressDictionaryFile(args[0]);
  process.stdout.write(packed + '\n');
}

// Pack a single file and return the packed string.
async function compressDictionaryFile(path: string): Promise<string> {
  let data = await readFile(path);
  let trie = new Trie(data);
  let packed = trie.pack();

  console.error('Compressed ' + trie.wordCount + ' words.');
  console.error('Input size: ' + data.length + ' bytes.');
  console.error('Compressed size: ' + packed.length + ' bytes.');

  return packed;
}

// Call main() if run from command line (as opposed to being required).
if (require.main === module) {
  main(process.argv.slice(2))
    .catch((e: Error) => {
      console.error(e.message);
      process.exit(1);
    });
}
