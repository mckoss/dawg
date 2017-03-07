export type Expect = {
  nodeCount?: number;
  nonWords?: string[]
  wordCount?: number;
  pack?: string;
};

export type Test = {
  label?: string;
  data?: string;
  expect: Expect
};

export const testSamples: Test[] = [
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
  {data: "aah aahed aahing aahs aal",
   expect: {
     pack: "aa0;h0l;!ed,ing,s"}},
  {label: "Issue #8 from lookups",
   data: "brian bruce bryan bryant bryce bryon buddy burton byron caleb calvin carlo carlton " +
   "carroll cedric cesar cha charle charli chester chri christian christopher chuck clarence " +
   "clark clay clayton damian damien damon daniel danny darin dariu darwin dav davi david " +
   "dean dejan deni denni derek derrick devin deven dewayne dewey",
   expect: {
   }},
];

export function splitWords(dict: string): string[] {
  let a = dict.split(/\s/);
  return a;
}
