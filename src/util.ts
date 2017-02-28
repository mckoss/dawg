// Return a sorted list of [key, value] pairs, sorted by values
// (default 'asc').
type Dir = 'asc' | 'desc';

export function sortByValues<V>(o: {[p: string]: V},
                         dir: Dir = 'asc')
: [string, V][] {
  let result: [string, V][] = [];

  for (let key in o) {
    result.push( [key, o[key]] );
  }

  result.sort(function (a: [string, V], b: [string, V]) {
    let cmp = 0;

    if (a[1] < b[1]) {
      cmp = -1;
    } else if (a[1] > b[1]) {
      cmp = 1;
    }

    return dir === 'asc' ? cmp : -cmp;
  });

  return result;
}

// Sort elements and remove duplicates from array (modified in place).
export function unique<T>(a: T[]) {
  a.sort();
  for (let i = 1; i < a.length; i++) {
    if (a[i - 1] === a[i]) {
      a.splice(i, 1);
    }
  }
}
