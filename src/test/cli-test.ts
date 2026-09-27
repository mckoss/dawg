import { assert } from 'chai';
import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { PTrie } from '../ptrie';

const CLI = path.resolve(__dirname, '../dawg.js');

function run(...args: string[]) {
  return spawnSync(process.execPath, [CLI, ...args], {encoding: 'utf-8'});
}

suite("CLI", () => {
  let dir: string;

  suiteSetup(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dawg-test-'));
  });

  suiteTeardown(() => {
    fs.rmSync(dir, {recursive: true, force: true});
  });

  test("Packs a dictionary file", () => {
    let file = path.join(dir, 'words.txt');
    fs.writeFileSync(file, 'cat\ncats\ndog\n');

    let result = run(file);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stderr, /Compressed 3 words/);

    let ptrie = new PTrie(result.stdout.trim());
    assert.deepEqual(ptrie.completions(''), ['cat', 'cats', 'dog']);
  });

  test("No arguments prints usage and fails", () => {
    let result = run();
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Usage: dawg-lookup/);
  });

  test("Missing file fails", () => {
    let result = run(path.join(dir, 'missing.txt'));
    assert.equal(result.status, 1);
    assert.match(result.stderr, /ENOENT/);
  });
});
