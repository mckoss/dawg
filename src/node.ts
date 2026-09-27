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
  _c!: number;

  // Created when packing the Trie, the sequential node number (in pre-order
  // traversal).
  _n!: number;

  // The number of times a node is shared (it's in-degree from other nodes).
  _d?: number;

  // For singleton nodes, the name of it's single property.
  _g?: string;

  // Visit marker used by Trie depth-first traversals.
  _v?: number;

  child(prop: string): Node | number {
    return (this as any as {[prop: string]: Node | number})[prop];
  }

  setChild(prop: string, value: Node | number) {
    (this as any as {[prop: string]: Node | number})[prop] = value;
  }

  deleteChild(prop: string) {
    delete (this as any as {[prop: string]: Node | number})[prop];
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
    let props: string[] = [];

    for (let prop of Object.keys(this)) {
      if (prop !== '' && prop[0] !== '_') {
        if (!nodesOnly || Node.isNode(this.child(prop))) {
          props.push(prop);
        }
      }
    }
    props.sort();
    return props;
  }

  // This function can be used as a Type Guard (TypeScript)
  static isNode(n: number | Node | undefined): n is Node {
    return n instanceof Node;
  }
}
