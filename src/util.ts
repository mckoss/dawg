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
    return cmpDefault(a[1], b[1], dir);
  });

  return result;
}

function cmpDefault(a: any, b: any, dir: Dir = 'asc') {
  let result = 0;

  if (a < b) {
    result = -1;
  } else if (a > b) {
    result = 1;
  }

  return dir === 'asc' ? result : -result;
}

// Sort elements and remove duplicates from array (modified in place).
export function unique<T>(a: T[], cmp = cmpDefault) {
  a.sort(cmp);
  for (let i = 1; i < a.length; i++) {
    if (cmp(a[i - 1], a[i])  === 0) {
      a.splice(i, 1);
    }
  }
}
