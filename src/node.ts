/*
  Node

  Each node contains some special properties (begining with '_'), as well as
  arbitrary string properties for string fragments contained in the input word
  dictionary.

  String properties can be "terminal" (have a numeric value of 1), or can
  referance another child Node.

  Note that a Node containing a terminal '' (empty string) property, is itself
  marked as a terminal Node (the prefix leading to this node is a word in the
  dictionary.
*/
export class Node {
  // A unique name for the node (starting from 1), used in combining Suffixes.
  _c: number;

  // Created when packing the Trie, the sequential node number (in pre-order
  // traversal).
  _n: number;

  // The number of times a node is shared (it's in-degree from other nodes).
  _d: number;

  // For singleton nodes, the name of it's single property.
  _g: string;

  // Number of child properties.
  _p = 0;

  child(prop: string): Node | number {
    return (this as any as {[prop: string]: Node | number})[prop];
  }

  setChild(prop: string, value: Node | number) {
    const self = this as any as {[prop: string]: Node | number};
    if (prop !== this._g) {
      delete self._g;
    }
    if (self[prop] !== undefined) {
      this._p += 1;
    }
    if (this._p === 1) {
      this._g = prop;
    }

    self[prop] = value;
  }

  deleteChild(prop: string) {
    if (prop === this._g) {
      delete this._g;
    }
    this._p -= 1;
    delete (this as any as {[prop: string]: Node | number})[prop];
    if (this._p === 1) {
      this._g = this.props()[0];
    }
  }

  // A property is a terminal string
  isTerminalString(prop: string): boolean {
    return typeof this.child(prop) === 'number';
  }

  // This node is a terminal node (the prefix string is a word in the
  // dictionary).
  isTerminal(): boolean {
    return this.isTerminalString('');
  }

  // Well ordered list of properties in a node (string or object properties)
  // Use nodesOnly === true to return only properties of child nodes (not
  // terminal strings).
  props(nodesOnly?: boolean): string[] {
    let me: {[prop: string]: Node | number} = this as any;
    let props: string[] = [];

    for (let prop in me) {
      if (prop !== '' && prop[0] !== '_') {
        if (!nodesOnly || Node.isNode(this.child(prop))) {
          props.push(prop);
        }
      }
    }
    props.sort();
    return props;
  }

  // Compute in-degree of all nodes and mark the
  // singleton nodes.
  static countDegree(root: Node) {
    let walker = new Walker(root);

    walker.dfs((order, node) => {
      if (order === 'post') {
        return;
      }
      if (node._d === undefined) {
        node._d = 0;
      }
      node._d++;
    });
  }

  // Node has just a single (non-special) property.
  isSingleton(): boolean {
    return this._p === 1 && !this.isTerminal();
  }

  // This function can be used as a Type Guard (TypeScript)
  static isNode(n: number | Node): n is Node {
    return typeof n === 'object';
  }
}

export type WalkOrder = 'pre' | 'post';
export type WalkHandler = (order: WalkOrder,
                           node: Node,
                           parent: Node | null,
                           prop: string) => void;

export class Walker {
  visitMap = new Map<Node, boolean>();

  constructor(public root: Node) {/*_*/}

  reset(): Walker {
    this.visitMap = new Map();
    return this;
  }

  visit(node: Node) {
    this.visitMap.set(node, true);
  }

  visited(node: Node): boolean {
    return this.visitMap.get(node) || false;
  }

  dfs(handler: WalkHandler) {
    this.reset();
    this._dfs(this.root, null, '', handler);
  }

  // Depth-first search via callback handler.
  private _dfs(node: Node,
               parent: Node | null,
               propParent: string,
               handler: WalkHandler) {
    // The handler can be called multiple times from different parents
    // since Nodes can form a multi-graph.
    handler('pre', node, parent, propParent);

    if (this.visited(node)) {
      return;
    }

    this.visit(node);

    let props = node.props(true);
    for (let prop of props) {
      this._dfs(node.child(prop) as Node, node, prop, handler);
    }

    handler('post', node, parent, propParent);
  }
}
