declare module "javascript-astar" {
  export type GridNode = { x: number; y: number; weight: number };
  export class Graph {
    grid: GridNode[][];
    constructor(grid: number[][], options?: { diagonal?: boolean });
  }
  export const astar: { search(graph: Graph, start: GridNode, end: GridNode): GridNode[] };
}