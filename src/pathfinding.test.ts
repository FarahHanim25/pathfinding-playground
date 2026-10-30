
import { describe, it, expect } from "vitest";
import { findPath, type Point } from "./pathfinding";

describe("Pathfinding algorithms", () => {
  const start: Point = { row: 0, col: 0 };
  const finish: Point = { row: 0, col: 3 };
  const walls = new Set<string>();

  it("BFS should find the shortest path", () => {
    const result = findPath(start, finish, walls, "BFS");

    expect(result.path.length).toBe(4);
    expect(result.cost).toBe(3);
  });

  it("Dijkstra should find the lowest-cost path", () => {
    const result = findPath(start, finish, walls, "DIJKSTRA");

    expect(result.path.length).toBe(4);
    expect(result.cost).toBe(3);
  });

  it("A* should find the lowest-cost path", () => {
    const result = findPath(start, finish, walls, "ASTAR");

    expect(result.path.length).toBe(4);
    expect(result.cost).toBe(3);
  });

  it("DFS should find a valid path", () => {
    const result = findPath(start, finish, walls, "DFS");

    expect(result.path.length).toBeGreaterThan(0);
    expect(result.path[0]).toEqual(start);
    expect(result.path[result.path.length - 1]).toEqual(finish);
  });

  it("Dijkstra should choose the cheaper weighted route", () => {
    const terrain = new Map<string, number>([
      ["0,1", 10],
      ["0,2", 10],
    ]);

    const result = findPath(
      { row: 0, col: 0 },
      { row: 0, col: 3 },
      new Set<string>(),
      "DIJKSTRA",
      terrain
    );

    expect(result.cost).toBe(5);
    expect(result.path.length).toBe(6);
  });

  it("A* should choose the cheaper weighted route", () => {
    const terrain = new Map<string, number>([
      ["0,1", 10],
      ["0,2", 10],
    ]);

    const result = findPath(
      { row: 0, col: 0 },
      { row: 0, col: 3 },
      new Set<string>(),
      "ASTAR",
      terrain
    );

    expect(result.cost).toBe(5);
    expect(result.path.length).toBe(6);
  });

      it("Dijkstra should return no path when the target is unreachable", () => {
    const walls = new Set<string>([
      "0,1",
      "1,0",
      "1,1",
    ]);

    const result = findPath(
      { row: 0, col: 0 },
      { row: 0, col: 2 },
      walls,
      "DIJKSTRA"
    );

    expect(result.path).toEqual([]);
    expect(result.cost).toBe(0);
  });

  it("A* should return no path when the target is unreachable", () => {
    const walls = new Set<string>([
      "0,1",
      "1,0",
      "1,1",
    ]);

    const result = findPath(
      { row: 0, col: 0 },
      { row: 0, col: 2 },
      walls,
      "ASTAR"
    );

    expect(result.path).toEqual([]);
    expect(result.cost).toBe(0);
  });

    it("BFS should find a path around walls", () => {
    const walls = new Set<string>([
      "0,1",
      "1,1",
    ]);

    const result = findPath(
      { row: 0, col: 0 },
      { row: 0, col: 2 },
      walls,
      "BFS"
    );

    expect(result.path.length).toBeGreaterThan(0);
    expect(result.path[0]).toEqual({ row: 0, col: 0 });
    expect(result.path[result.path.length - 1]).toEqual({ row: 0, col: 2 });
    expect(result.path.some((point) => walls.has(`${point.row},${point.col}`))).toBe(false);
  });

  it("Dijkstra should avoid walls when finding the lowest-cost path", () => {
    const walls = new Set<string>([
      "0,1",
      "1,1",
    ]);

    const result = findPath(
      { row: 0, col: 0 },
      { row: 0, col: 2 },
      walls,
      "DIJKSTRA"
    );

    expect(result.path.length).toBe(7);
    expect(result.cost).toBe(6);
  });

    it("A* should avoid walls when finding the lowest-cost path", () => {
    const walls = new Set<string>([
      "0,1",
      "1,1",
    ]);

    const result = findPath(
      { row: 0, col: 0 },
      { row: 0, col: 2 },
      walls,
      "ASTAR"
    );

    expect(result.path.length).toBe(7);
    expect(result.cost).toBe(6);
  });

    it("A* should include the start and target in its path", () => {
    const result = findPath(
      { row: 5, col: 5 },
      { row: 5, col: 8 },
      new Set<string>(),
      "ASTAR"
    );

    expect(result.path[0]).toEqual({ row: 5, col: 5 });
    expect(result.path[result.path.length - 1]).toEqual({ row: 5, col: 8 });
  });

    it("should return a single-cell path when start equals target", () => {
    const point = { row: 5, col: 5 };

    const result = findPath(
      point,
      point,
      new Set<string>(),
      "ASTAR"
    );

    expect(result.path).toEqual([point]);
    expect(result.cost).toBe(0);
  });

    it("should include terrain movement costs in the total cost", () => {
    const terrain = new Map<string, number>([
      ["0,1", 5],
      ["0,2", 10],
    ]);

    const result = findPath(
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      new Set<string>(),
      "DIJKSTRA",
      terrain
    );

    expect(result.cost).toBe(5);
  });

    it("should apply the correct movement cost for water terrain", () => {
    const terrain = new Map<string, number>([
      ["0,1", 10],
    ]);

    const result = findPath(
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      new Set<string>(),
      "DIJKSTRA",
      terrain
    );

    expect(result.cost).toBe(10);
  });

    it("BFS should treat weighted terrain as normal movement", () => {
    const terrain = new Map<string, number>([
      ["0,1", 10],
    ]);

    const result = findPath(
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      new Set<string>(),
      "BFS",
      terrain
    );

    expect(result.path.length).toBe(2);
    expect(result.cost).toBe(1);
  });

    it("DFS should find a valid path around walls", () => {
    const walls = new Set<string>([
      "0,1",
      "1,1",
    ]);

    const result = findPath(
      { row: 0, col: 0 },
      { row: 0, col: 2 },
      walls,
      "DFS"
    );

    expect(result.path.length).toBeGreaterThan(0);
    expect(result.path[0]).toEqual({ row: 0, col: 0 });
    expect(result.path[result.path.length - 1]).toEqual({ row: 0, col: 2 });
    expect(result.path.some((point) => walls.has(`${point.row},${point.col}`))).toBe(false);
  });

    it("BFS should return no path when the target is unreachable", () => {
    const walls = new Set<string>([
      "0,1",
      "1,0",
      "1,1",
    ]);

    const result = findPath(
      { row: 0, col: 0 },
      { row: 0, col: 2 },
      walls,
      "BFS"
    );

    expect(result.path).toEqual([]);
    expect(result.cost).toBe(0);
  });

  it("DFS should return no path when the target is unreachable", () => {
    const walls = new Set<string>([
      "0,1",
      "1,0",
      "1,1",
    ]);

    const result = findPath(
      { row: 0, col: 0 },
      { row: 0, col: 2 },
      walls,
      "DFS"
    );

    expect(result.path).toEqual([]);
    expect(result.cost).toBe(0);
  });

    it("A* and Dijkstra should find the same optimal cost", () => {
    const walls = new Set<string>([
      "1,1",
      "1,2",
      "2,2",
    ]);

    const terrain = new Map<string, number>([
      ["0,1", 5],
      ["0,2", 10],
      ["2,1", 10],
    ]);

    const start = { row: 0, col: 0 };
    const finish = { row: 0, col: 3 };

    const dijkstra = findPath(
      start,
      finish,
      walls,
      "DIJKSTRA",
      terrain
    );

    const astar = findPath(
      start,
      finish,
      walls,
      "ASTAR",
      terrain
    );

    expect(astar.cost).toBe(dijkstra.cost);
    expect(astar.path.length).toBeGreaterThan(0);
    expect(dijkstra.path.length).toBeGreaterThan(0);
  });

});
