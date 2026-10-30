
export type AlgorithmExplanation = {
  name: string;
  principle: string;
  strategy: string;
  optimality: string;
  costBehaviour: string;
};

export const algorithmExplanations: Record<
  string,
  AlgorithmExplanation
> = {
  BFS: {
    name: "Breadth-first search",
    principle:
      "BFS explores the grid layer by layer, visiting cells according to their distance in number of steps from the start.",
    strategy:
      "It uses a queue: the earliest discovered cell is explored first. This allows it to find a path with the fewest steps on an unweighted grid.",
    optimality:
      "BFS guarantees the fewest-step path when every movement has equal cost.",
    costBehaviour:
      "Mud and water do not affect its route selection. Every move is treated as having a cost of 1.",
  },

  DFS: {
    name: "Depth-first search",
    principle:
      "DFS explores one direction as deeply as possible before backtracking to explore other available routes.",
    strategy:
      "It uses a stack: the most recently discovered cell is explored first.",
    optimality:
      "DFS can find a valid path, but it does not guarantee the shortest or lowest-cost path.",
    costBehaviour:
      "Mud and water do not affect its route selection. Every move is treated as having a cost of 1.",
  },

  DIJKSTRA: {
    name: "Dijkstra's algorithm",
    principle:
      "Dijkstra finds a lowest-cost route by considering the total movement cost accumulated from the starting point.",
    strategy:
      "It prioritises the available cell with the smallest known accumulated cost.",
    optimality:
      "Dijkstra guarantees a lowest-cost path when movement costs are non-negative.",
    costBehaviour:
      "Normal cells cost 1, mud costs 5, and water costs 10. The algorithm considers these weights when selecting a route.",
  },

  ASTAR: {
    name: "A* search",
    principle:
      "A* combines the cost already travelled with an estimate of the remaining distance to the target.",
    strategy:
      "It prioritises cells using f(n) = g(n) + h(n), where g(n) is the accumulated movement cost and h(n) is the Manhattan-distance estimate.",
    optimality:
      "With the current Manhattan heuristic and movement costs of at least 1, A* finds a lowest-cost path.",
    costBehaviour:
      "It considers the different movement costs of normal cells, mud, and water while using distance to guide its search.",
  },
};
