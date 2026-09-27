import { Trie } from '../src/trie';
import { PTrie, NODE_SEP } from '../src/ptrie';

const EXAMPLE = "the rain in spain falls mainly in the plain\n" +
  "main rains fall plainly\n" +
  "peter piper picked a peck of pickled peppers\n" +
  "pipers pickle pepper";

const SYMBOL_LINE = /^[0-9A-Z]+:[0-9A-Z]+$/;
const COMPLETION_LIMIT = 20;

function $<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

const dict = $<HTMLTextAreaElement>('dict');
const gutter = $<HTMLPreElement>('gutter');
const packedView = $<HTMLPreElement>('packed');
const stats = $<HTMLElement>('stats');
const wordInput = $<HTMLInputElement>('word');
const lookupResult = $<HTMLElement>('lookup-result');
const sampleButton = $<HTMLButtonElement>('sample');
const copyButton = $<HTMLButtonElement>('copy');

let packed = '';
let ptrie: PTrie | undefined;
let timer: number | undefined;
// Incremented on each pack, so stale async gzip results are discarded.
let generation = 0;

const compareBody = $<HTMLTableElement>('compare').tBodies[0];

async function gzipSize(text: string): Promise<number | undefined> {
  if (typeof CompressionStream === 'undefined') {
    return undefined;
  }
  const stream = new Blob([text]).stream()
    .pipeThrough(new CompressionStream('gzip'));
  return (await new Response(stream).arrayBuffer()).byteLength;
}

interface Row {
  label: string;
  bytes: number | undefined;
  dawg?: boolean;
}

function renderComparison(inputBytes: number, rows: Row[], pending: boolean) {
  // Highlight the smallest encoding (on tiny inputs, gzip overhead can
  // make the gzipped DAWG larger than the raw one).
  const sizes = rows.map((row) => row.bytes ?? Infinity);
  const best = sizes.indexOf(Math.min(...sizes));
  compareBody.textContent = '';
  rows.forEach((row, i) => {
    const tr = compareBody.insertRow();
    const th = document.createElement('th');
    th.scope = 'row';
    th.textContent = row.label;
    tr.append(th);

    const barCell = tr.insertCell();
    const numCell = tr.insertCell();
    numCell.className = 'num';
    if (row.bytes === undefined) {
      numCell.textContent = pending ? '…' : 'n/a';
      return;
    }
    const fraction = inputBytes ? row.bytes / inputBytes : 0;
    const bar = document.createElement('div');
    bar.className = 'bar' + (i === best ? ' best' : row.dawg ? ' dawg' : '');
    bar.style.width = Math.min(100, 100 * fraction).toFixed(2) + '%';
    barCell.append(bar);

    const pct = document.createElement('span');
    pct.className = 'pct';
    pct.textContent = inputBytes ? (100 * fraction).toFixed(1) + '%' : '–';
    numCell.append(pct, ' ' + row.bytes.toLocaleString() + ' bytes');
  });
}

async function compare(text: string, inputBytes: number) {
  const current = ++generation;
  const rows = (inputGzip?: number, packedGzip?: number): Row[] => [
    {label: 'Word list', bytes: inputBytes},
    {label: 'Word list, gzip', bytes: inputGzip},
    {label: 'Packed DAWG', bytes: packed.length, dawg: true},
    {label: 'Packed DAWG, gzip', bytes: packedGzip, dawg: true},
  ];
  renderComparison(inputBytes, rows(), true);
  const [inputGzip, packedGzip] =
    await Promise.all([gzipSize(text), gzipSize(packed)]);
  if (current === generation) {
    renderComparison(inputBytes, rows(inputGzip, packedGzip), false);
  }
}

function stat(label: string, value: string): string {
  return `<span>${label} <b>${value}</b></span>`;
}

function pack() {
  const text = dict.value;
  const start = performance.now();
  const trie = new Trie(text);
  packed = trie.pack();
  const ms = performance.now() - start;
  ptrie = new PTrie(packed);

  const lines = packed.split(NODE_SEP);
  let node = 0;
  let symbols = 0;
  gutter.textContent = lines.map((line) => {
    if (SYMBOL_LINE.test(line)) {
      symbols++;
      return '§';
    }
    return String(node++);
  }).join('\n');
  packedView.textContent = lines.join('\n');

  const inputBytes = new TextEncoder().encode(text).length;
  const ratio = inputBytes ? (100 * packed.length / inputBytes).toFixed(1) + '%' : '–';
  stats.innerHTML = [
    stat('Words', trie.wordCount.toLocaleString()),
    stat('Nodes', node.toLocaleString()),
    stat('Symbols', symbols.toLocaleString()),
    stat('Input', inputBytes.toLocaleString() + ' bytes'),
    stat('Packed', packed.length.toLocaleString() + ' bytes'),
    stat('Size', ratio),
    stat('Time', ms.toFixed(0) + ' ms'),
  ].join('');

  lookup();
  compare(text, inputBytes);
}

function schedulePack() {
  window.clearTimeout(timer);
  timer = window.setTimeout(pack, 250);
}

function lookup() {
  const word = wordInput.value.trim();
  lookupResult.textContent = '';
  if (!ptrie || word === '') {
    return;
  }
  const found = ptrie.isWord(word);
  const verdict = document.createElement('span');
  verdict.className = found ? 'good' : 'bad';
  verdict.textContent = found ? `“${word}” is a word.` : `“${word}” is not a word.`;
  lookupResult.append(verdict);

  const completions = ptrie.completions(word, COMPLETION_LIMIT + 1);
  if (completions.length > 0) {
    const more = completions.length > COMPLETION_LIMIT ? ', …' : '';
    lookupResult.append(' Completions: ' +
      completions.slice(0, COMPLETION_LIMIT).join(', ') + more);
  }
}

async function loadSample() {
  sampleButton.disabled = true;
  sampleButton.textContent = 'Loading…';
  try {
    const response = await fetch('ospd3.txt');
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    dict.value = await response.text();
    window.clearTimeout(timer);
    pack();
  } catch (e) {
    stats.textContent = 'Could not load sample dictionary: ' + (e as Error).message;
  } finally {
    sampleButton.disabled = false;
    sampleButton.textContent = 'Load OSPD3 (80k words)';
  }
}

dict.addEventListener('input', schedulePack);
wordInput.addEventListener('input', lookup);
sampleButton.addEventListener('click', loadSample);

$<HTMLButtonElement>('example').addEventListener('click', () => {
  dict.value = EXAMPLE;
  pack();
});

$<HTMLButtonElement>('clear').addEventListener('click', () => {
  dict.value = '';
  pack();
  dict.focus();
});

copyButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(packed);
    copyButton.textContent = 'Copied';
  } catch {
    copyButton.textContent = 'Copy failed';
  }
  window.setTimeout(() => { copyButton.textContent = 'Copy packed string'; }, 1500);
});

dict.value = EXAMPLE;
pack();
