export type Point = {
  row: number;
  col: number;
};

export type Algorithm = "BFS" | "DFS" | "DIJKSTRA" | "ASTAR";

export type PathResult = {
  explored: Point[];
  path: Point[];
  cost: number;
  steps: SearchStep[];
};

export type SearchStep = {
  point: Point;
  exploredCount: number;
  frontierSize: number;
  costSoFar: number;
  heuristic: number;
  priority: number;
};

const ROWS = 20;
const COLS = 32;

const keyOf = ({ row, col }: Point) => `${row},${col}`;

const samePoint = (a: Point, b: Point) =>
  a.row === b.row && a.col === b.col;

function getNeighbors(point: Point): Point[] {
  return [
    { row: point.row - 1, col: point.col },
    { row: point.row + 1, col: point.col },
    { row: point.row, col: point.col - 1 },
    { row: point.row, col: point.col + 1 },
  ].filter(
    (p) =>
      p.row >= 0 &&
      p.row < ROWS &&
      p.col >= 0 &&
      p.col < COLS
  );
}

export function findPath(
  start: Point,
  finish: Point,
  walls: Set<string>,
  algorithm: string = "BFS",
  terrain: Map<string, number> = new Map()
): PathResult {
  const startKey = keyOf(start);
  const finishKey = keyOf(finish);

  const previous = new Map<string, string>();
  const explored: Point[] = [];
  const steps: SearchStep[] = [];
  const closed = new Set<string>();

  const distance = (point: Point) =>
    Math.abs(point.row - finish.row) +
    Math.abs(point.col - finish.col);

  const movementCost = (point: Point) =>
    terrain.get(keyOf(point)) ?? 1;

  const frontier: Point[] = [start];
  let head = 0;

  const scores = new Map<string, number>([[startKey, 0]]);

  while (
    algorithm === "BFS"
      ? head < frontier.length
      : frontier.length > 0
  ) {
    let current: Point;

    if (algorithm === "BFS") {
      current = frontier[head++];
    } else if (algorithm === "DFS") {
      current = frontier.pop()!;
    } else {
      frontier.sort((a, b) => {
        const scoreA = scores.get(keyOf(a)) ?? Infinity;
        const scoreB = scores.get(keyOf(b)) ?? Infinity;

        const priorityA =
          algorithm === "ASTAR"
            ? scoreA + distance(a)
            : scoreA;

        const priorityB =
          algorithm === "ASTAR"
            ? scoreB + distance(b)
            : scoreB;

        return priorityA - priorityB;
      });

      current = frontier.shift()!;
    }

    const currentKey = keyOf(current);

    if (closed.has(currentKey)) continue;

    closed.add(currentKey);
    explored.push(current);

    steps.push({
        point: current,
        exploredCount: explored.length,
        frontierSize: frontier.length - (algorithm === "BFS" ? head : 0),
        costSoFar: scores.get(currentKey) ?? 0,
        heuristic: distance(current),
        priority:
            algorithm === "ASTAR"
            ? (scores.get(currentKey) ?? 0) + distance(current)
            : scores.get(currentKey) ?? 0,
    });

    if (currentKey === finishKey) break;

    for (const next of getNeighbors(current)) {
      const nextKey = keyOf(next);

      if (walls.has(nextKey) || closed.has(nextKey)) continue;

      const stepCost =
        algorithm === "BFS" || algorithm === "DFS"
          ? 1
          : movementCost(next);

      const newScore =
        (scores.get(currentKey) ?? 0) + stepCost;

      const oldScore = scores.get(nextKey) ?? Infinity;

      if (algorithm === "BFS" || algorithm === "DFS") {
        if (scores.has(nextKey)) continue;
      } else if (newScore >= oldScore) {
        continue;
      }

      scores.set(nextKey, newScore);
      previous.set(nextKey, currentKey);
      frontier.push(next);
    }
  }

  const path: Point[] = [];

  if (closed.has(finishKey)) {
    let current: string | undefined = finishKey;

    while (current) {
      const [row, col] = current.split(",").map(Number);
      path.unshift({ row, col });

      if (current === startKey) break;

      current = previous.get(current);
    }
  }

  return {
    explored,
    path:
      path.length > 0 && samePoint(path[0], start)
        ? path
        : [],
    cost: scores.get(finishKey) ?? 0,
    steps,
  };
}
