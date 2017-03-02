/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 *           2017 Mike Koss
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export interface LabeledSpec {
  label?: string;
  data: any;
  expect?: any;
};

export type PairSpec = [any, any];
export type ValueSpec = any;
export type Spec = LabeledSpec | PairSpec | ValueSpec;

export type TestFunction = (data: any, expect: any, spec: Spec) => void;

export type FormatFunction = (data: any) => string;

/*
 * Run data driven test with tests as and array of one the Spec formats.
 *
 * This function calls to assert each test.
 */
export function dataDrivenTest(tests: Spec[],
                               testIt: TestFunction,
                               formatter = format) {
  let data: any;
  let expect: any;
  let label: string;

  for (let i = 0; i < tests.length; i++) {
    // Must be a ValueSpec
    if (typeof tests[i] !== 'object') {
      label = formatter(tests[i]);
      data = tests[i];
      expect = undefined;
    } else {
      // LabeledSpec ...
      data = tests[i].data;

      // else PairSpec, ...
      if (data === undefined && tests[i] instanceof Array) {
        data = tests[i][0];
      }

      // else ValueSpec (where value is an Object)
      if (data === undefined) {
        data = tests[i];
      }

      // Clean data of label and expect if there.
      if (data instanceof Object && 'expect' in data) {
        data = Object.assign({}, data);
        delete data.expect;
        delete data.label;
      }

      expect = tests[i].expect || tests[i][1];

      label = tests[i].label;
      if (label === undefined) {
        label = formatter(data);
        if (expect !== undefined) {
          label += " => " + formatter(expect);
        }
      }
    }

    test(label, testIt.bind(undefined, data, expect, tests[i]));
  }
}

// Default formatting function to display values.
function format(o: any): string {
  if (o instanceof RegExp) {
    return trimTo(o.toString(), 30);
  }
  return trimTo(JSON.stringify(o), 40);
}

function trimTo(s: string, n: number): string {
  if (s.length > n) {
    s = s.slice(0, n - 4) + ' ...';
  }
  return s;
}
