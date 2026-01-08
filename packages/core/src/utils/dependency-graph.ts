/**
 * Simple Dependency Graph for managing hierarchical dependencies
 * Used for column group hierarchy management
 */
export class DependencyGraph<T = string> {
  private nodes: Map<T, Set<T>> = new Map();
  private reverseNodes: Map<T, Set<T>> = new Map();

  /**
   * Add a node to the graph
   */
  addNode(node: T): void {
    if (!this.nodes.has(node)) {
      this.nodes.set(node, new Set());
    }
    if (!this.reverseNodes.has(node)) {
      this.reverseNodes.set(node, new Set());
    }
  }

  /**
   * Add a dependency: from depends on to
   */
  addDependency(from: T, to: T): void {
    this.addNode(from);
    this.addNode(to);
    this.nodes.get(from)!.add(to);
    this.reverseNodes.get(to)!.add(from);
  }

  /**
   * Remove a dependency
   */
  removeDependency(from: T, to: T): void {
    this.nodes.get(from)?.delete(to);
    this.reverseNodes.get(to)?.delete(from);
  }

  /**
   * Remove a node and all its dependencies
   */
  removeNode(node: T): void {
    // Remove dependencies to this node
    const dependents = this.reverseNodes.get(node);
    if (dependents) {
      dependents.forEach((dependent) => {
        this.nodes.get(dependent)?.delete(node);
      });
    }

    // Remove dependencies from this node
    const dependencies = this.nodes.get(node);
    if (dependencies) {
      dependencies.forEach((dependency) => {
        this.reverseNodes.get(dependency)?.delete(node);
      });
    }

    this.nodes.delete(node);
    this.reverseNodes.delete(node);
  }

  /**
   * Get all dependencies of a node (nodes it depends on)
   */
  getDependencies(node: T): T[] {
    return Array.from(this.nodes.get(node) || []);
  }

  /**
   * Get all dependents of a node (nodes that depend on it)
   */
  getDependents(node: T): T[] {
    return Array.from(this.reverseNodes.get(node) || []);
  }

  /**
   * Check if the graph has a cycle
   */
  hasCycle(): boolean {
    const visited = new Set<T>();
    const recursionStack = new Set<T>();

    const hasCycleUtil = (node: T): boolean => {
      visited.add(node);
      recursionStack.add(node);

      const dependencies = this.nodes.get(node) || new Set();
      for (const dependency of dependencies) {
        if (!visited.has(dependency)) {
          if (hasCycleUtil(dependency)) {
            return true;
          }
        } else if (recursionStack.has(dependency)) {
          return true;
        }
      }

      recursionStack.delete(node);
      return false;
    };

    for (const node of this.nodes.keys()) {
      if (!visited.has(node)) {
        if (hasCycleUtil(node)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get topological sort order
   * Returns null if graph has a cycle
   */
  topologicalSort(): T[] | null {
    if (this.hasCycle()) {
      return null;
    }

    const visited = new Set<T>();
    const stack: T[] = [];

    const dfs = (node: T): void => {
      visited.add(node);

      const dependencies = this.nodes.get(node) || new Set();
      for (const dependency of dependencies) {
        if (!visited.has(dependency)) {
          dfs(dependency);
        }
      }

      stack.push(node);
    };

    for (const node of this.nodes.keys()) {
      if (!visited.has(node)) {
        dfs(node);
      }
    }

    return stack.reverse();
  }

  /**
   * Get all nodes
   */
  getNodes(): T[] {
    return Array.from(this.nodes.keys());
  }

  /**
   * Check if node exists
   */
  hasNode(node: T): boolean {
    return this.nodes.has(node);
  }

  /**
   * Clear all nodes and dependencies
   */
  clear(): void {
    this.nodes.clear();
    this.reverseNodes.clear();
  }

  /**
   * Get size (number of nodes)
   */
  size(): number {
    return this.nodes.size;
  }
}
