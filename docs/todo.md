# Some misc stuff to do for DAWG.

X Finish migration of PTrie!
X Include .d.ts files in lib directory.
X Add CI (GitHub Actions)
X Demo hosting on github pages.

- Performance measurements (use to determine effect of refactorings).
- Refactor Node to use sub-objects for childNodes and terminals.  This will
  also normalize some of the awkward type casts used in Node.
- Allow unsorted incremental inserts (currently throws).
- Interactive performance metrics in the demo, like the Pageforest site.
