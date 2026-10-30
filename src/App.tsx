import { useRef, useState } from "react";
import {
  Activity,
  ArrowDown,
  CircleHelp,
  Clock3,
  Eraser,
  Grid2X2,
  MousePointer2,
  Play,
  RotateCcw,
  Shuffle,
  Sparkles,
  Target,
  Waves,
  Zap,
} from "lucide-react";
import "./index.css";

const ROWS = 20;
const COLS = 32;
const START = { row: 10, col: 4 };
const FINISH = { row: 10, col: 27 };

import {
  findPath,
  type Point,
  type SearchStep,
} from "./pathfinding";
import { algorithmExplanations } from "./algorithmExplanations";
type CellAction = "wall" | "start" | "finish" | "mud" | "water" | null;

type ComparisonResult = {
  algorithm: string;
  exploredCount: number;
  pathLength: number | null;
  totalCost: number | null;
  timeMs: number;
  pathFound: boolean;
};


const keyOf = ({ row, col }: Point) => `${row},${col}`;
const samePoint = (a: Point, b: Point) =>
  a.row === b.row && a.col === b.col;

export default function App() {
  const [start, setStart] = useState<Point>(START);
  const [finish, setFinish] = useState<Point>(FINISH);
  const [walls, setWalls] = useState<Set<string>>(new Set());
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [path, setPath] = useState<Set<string>>(new Set());
  const [isRunning, setIsRunning] = useState(false);
  const [searchCompleted, setSearchCompleted] = useState(false);
  const [exploredCount, setExploredCount] = useState(0);
  const [pathLength, setPathLength] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [pathFound, setPathFound] = useState(false);
  const [comparisonResults, setComparisonResults] = useState<ComparisonResult[]>([]);
  const [elapsed, setElapsed] = useState("0.00");
  const [notice, setNotice] = useState("Ready to explore");
  const [showHelp, setShowHelp] = useState(false);
  const [algorithm, setAlgorithm] = useState("BFS");
  const currentExplanation = algorithmExplanations[algorithm];
  const [animationSpeed, setAnimationSpeed] = useState(12);
  const [currentStep, setCurrentStep] = useState<SearchStep | null>(null);
  const [paintMode, setPaintMode] = useState<
    "wall" | "mud" | "water"
  >("wall");
  const [randomMode, setRandomMode] = useState<
  "walls" | "terrain" | "mixed"
>("walls");

  const [terrain, setTerrain] = useState<Map<string, number>>(
    new Map(),
  );

  const action = useRef<CellAction>(null);
  const drawingValue = useRef(true);
  const runId = useRef(0);

  function stopRun() {
    runId.current += 1;
    setIsRunning(false);
  }

  function clearSearch() {
    setVisited(new Set());
    setPath(new Set());
    setExploredCount(0);
    setPathLength(0);
    setElapsed("0.00");
    setPathFound(false);
    setSearchCompleted(false);
    setCurrentStep(null);
  }

  
  function handleCellDown(point: Point) {
    if (isRunning) return;

    if (samePoint(point, start)) {
      action.current = "start";
      return;
    }

    if (samePoint(point, finish)) {
      action.current = "finish";
      return;
    }

    action.current = paintMode;
    drawingValue.current =
      paintMode === "wall" ? !walls.has(keyOf(point)) : true;

    paintCell(point, paintMode);
  }
  
  function paintCell(
      point: Point,
      mode: "wall" | "mud" | "water",
    ) {
      if (samePoint(point, start) || samePoint(point, finish)) {
        return;
      }

      const key = keyOf(point);

      if (mode === "wall") {
        setWalls((old) => {
          const next = new Set(old);
          if (drawingValue.current) next.add(key);
          else next.delete(key);
          return next;
        });

        setTerrain((old) => {
          const next = new Map(old);
          next.delete(key);
          return next;
        });
      } else {
        setWalls((old) => {
          const next = new Set(old);
          next.delete(key);
          return next;
        });

        setTerrain((old) => {
          const next = new Map(old);
          next.set(key, mode === "mud" ? 5 : 10);
          return next;
        });
      }

      clearSearch();
    }
  
  function handleCellEnter(point: Point) {
    if (!action.current || isRunning) return;

    if (action.current === "start") {
      if (!samePoint(point, finish) && !walls.has(keyOf(point))) {
        setStart(point);
        clearSearch();
      }
      return;
    }

    if (action.current === "finish") {
      if (!samePoint(point, start) && !walls.has(keyOf(point))) {
        setFinish(point);
        clearSearch();
      }
      return;
    }

    if (samePoint(point, start) || samePoint(point, finish)) return;

    if (action.current === "wall") {
      paintCell(point, "wall");
    } else if (action.current === "mud") {
      paintCell(point, "mud");
    } else if (action.current === "water") {
      paintCell(point, "water");
    }
  }

  function endDrawing() {
    action.current = null;
  }

  async function runSearch() {
    if (isRunning) return;

    clearSearch();
    setIsRunning(true);
    setNotice("Searching the grid...");
    const thisRun = ++runId.current;
    const began = performance.now();

    const result = findPath(start, finish, walls, algorithm, terrain);
    const pathKeys = result.path.map(keyOf);
    const explored = new Set<string>();

    for (let i = 0; i < result.steps.length; i++) {
      if (runId.current !== thisRun) return;

      const step = result.steps[i];

      explored.add(keyOf(step.point));
      setVisited(new Set(explored));
      setExploredCount(step.exploredCount);
      setCurrentStep(step);

      if (i % 5 === 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, animationSpeed)
        );
      }
    }

    if (runId.current !== thisRun) return;

    const finalPath = new Set<string>();
    for (const key of pathKeys) {
      if (runId.current !== thisRun) return;
      finalPath.add(key);
      setPath(new Set(finalPath));
      await new Promise((resolve) =>
        setTimeout(resolve, animationSpeed * 1.5)
      );
    }
    const foundPath = result.path.length > 0;

    setPathFound(foundPath);
    setPathLength(foundPath ? result.path.length - 1 : 0);
    setTotalCost(foundPath ? result.cost : 0);
    setElapsed(((performance.now() - began) / 1000).toFixed(2));
    setNotice(
      result.path.length
        ? "Shortest path found"
        : "No path found — try removing some walls",
    );
    setSearchCompleted(true);
    setIsRunning(false);
  }
    
  function compareAlgorithms() {
    if (isRunning) return;

    const algorithms = ["BFS", "DFS", "DIJKSTRA", "ASTAR"];

    const results: ComparisonResult[] = algorithms.map((name) => {
      const began = performance.now();

      const result = findPath(
        start,
        finish,
        walls,
        name,
        terrain
      );

      const timeMs = performance.now() - began;
      const pathFound = result.path.length > 0;

      return {
        algorithm: name,
        exploredCount: result.explored.length,
        pathLength: pathFound ? result.path.length - 1 : null,
        totalCost: pathFound
        ? result.path.slice(1).reduce(
            (cost, point) => cost + (terrain.get(keyOf(point)) ?? 1),
            0
          )
        : null,
        timeMs,
        pathFound,
      };
    });

    setComparisonResults(results);
    setNotice("Algorithm comparison complete");
  }


  function clearWalls() {
    stopRun();
    setWalls(new Set());
    setTerrain(new Map());
    clearSearch();
    setNotice("Walls cleared");
  }

  function resetGrid() {
    stopRun();
    setWalls(new Set());
    setTerrain(new Map());
    setStart(START);
    setFinish(FINISH);
    clearSearch();
    setNotice("Grid reset");
  }

    
  function randomMaze(mode: "walls" | "terrain" | "mixed" = "walls") {
    stopRun();

    const nextWalls = new Set<string>();
    const nextTerrain = new Map<string, number>();

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const point = { row, col };

        // Never place obstacles or terrain on Start or Target
        if (samePoint(point, start) || samePoint(point, finish)) {
          continue;
        }

        const roll = Math.random();
        const key = keyOf(point);

        if (mode === "walls") {
          // Preserve your original random wall behavior
          if (roll < 0.24) {
            nextWalls.add(key);
          }
        } else if (mode === "terrain") {
          // Keep the grid open, but add weighted terrain
          if (roll < 0.12) {
            nextTerrain.set(key, 5); // Mud
          } else if (roll < 0.20) {
            nextTerrain.set(key, 10); // Water
          }
        } else {
          // Mixed challenge: walls, mud, and water
          if (roll < 0.18) {
            nextWalls.add(key);
          } else if (roll < 0.26) {
            nextTerrain.set(key, 5); // Mud
          } else if (roll < 0.31) {
            nextTerrain.set(key, 10); // Water
          }
        }
      }
    }

    setWalls(nextWalls);
    setTerrain(nextTerrain);
    clearSearch();

    const messages = {
      walls: "Random walls generated",
      terrain: "Random weighted terrain generated",
      mixed: "Mixed challenge generated",
    };

    setNotice(messages[mode]);
  }

    
  function generateStructuredMaze() {
    stopRun();

    const nextWalls = new Set<string>();

    // Begin with an open grid.
    // Recursive division adds walls while leaving passages.
    function divide(
      top: number,
      bottom: number,
      left: number,
      right: number
    ) {
      const height = bottom - top;
      const width = right - left;

      // Stop when the region is too small to divide.
      if (height < 2 || width < 2) return;

      const horizontal = height > width
        ? true
        : width > height
          ? false
          : Math.random() < 0.5;

      if (horizontal) {
        // Choose a row for the wall and a gap in that wall.
        const possibleRows = Array.from(
          { length: height - 1 },
          (_, i) => top + 1 + i
        );

        const wallRow =
          possibleRows[Math.floor(Math.random() * possibleRows.length)];

        const gapCol =
          left + Math.floor(Math.random() * (width + 1));

        for (let col = left; col <= right; col++) {
          if (col !== gapCol) {
            const point = { row: wallRow, col };

            if (!samePoint(point, start) && !samePoint(point, finish)) {
              nextWalls.add(keyOf(point));
            }
          }
        }

        divide(top, wallRow - 1, left, right);
        divide(wallRow + 1, bottom, left, right);
      } else {
        // Choose a column for the wall and a gap in that wall.
        const possibleCols = Array.from(
          { length: width - 1 },
          (_, i) => left + 1 + i
        );

        const wallCol =
          possibleCols[Math.floor(Math.random() * possibleCols.length)];

        const gapRow =
          top + Math.floor(Math.random() * (height + 1));

        for (let row = top; row <= bottom; row++) {
          if (row !== gapRow) {
            const point = { row, col: wallCol };

            if (!samePoint(point, start) && !samePoint(point, finish)) {
              nextWalls.add(keyOf(point));
            }
          }
        }

        divide(top, bottom, left, wallCol - 1);
        divide(top, bottom, wallCol + 1, right);
      }
    }
        
    divide(0, ROWS - 1, 0, COLS - 1);

      
    // Find a winding route through the grid using randomized DFS.
    const safePath = new Set<string>();
    const visited = new Set<string>();
    const parents = new Map<string, string>();

    const startKey = keyOf(start);
    const finishKey = keyOf(finish);
    const stack: Point[] = [start];

    visited.add(startKey);

    while (stack.length > 0) {
      const current = stack.pop()!;
      const currentKey = keyOf(current);

      if (currentKey === finishKey) break;

      const neighbors: Point[] = [
        { row: current.row - 1, col: current.col },
        { row: current.row + 1, col: current.col },
        { row: current.row, col: current.col - 1 },
        { row: current.row, col: current.col + 1 },
      ].filter(
        (point) =>
          point.row >= 0 &&
          point.row < ROWS &&
          point.col >= 0 &&
          point.col < COLS &&
          !visited.has(keyOf(point))
      );

      // Shuffle neighbors to create a different route each time.
      for (let i = neighbors.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [neighbors[i], neighbors[j]] = [neighbors[j], neighbors[i]];
      }

      for (const neighbor of neighbors) {
        const neighborKey = keyOf(neighbor);

        visited.add(neighborKey);
        parents.set(neighborKey, currentKey);
        stack.push(neighbor);
      }
    }

    // Reconstruct the route from Target back to Start.
    let currentKey = finishKey;

    while (currentKey !== startKey) {
      safePath.add(currentKey);

      const parent = parents.get(currentKey);
      if (!parent) break;

      currentKey = parent;
    }

    safePath.add(startKey);

    // Keep the guaranteed route open through the maze walls.
    for (const key of safePath) {
      nextWalls.delete(key);
    }

    // Update the grid and clear previous results.
    setWalls(nextWalls);
    setTerrain(new Map());
    clearSearch();
    setNotice("Solvable structured maze generated");

  }


  const wallCount = walls.size;

  return (
    <main className="app-shell" onMouseUp={endDrawing} onMouseLeave={endDrawing}>
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="Pathfinder home">
          <span className="brand-mark"><Waves size={24} /></span>
          <span>
            <strong>pathfinder<span>.</span></strong>
            <small>ALGORITHM LAB</small>
          </span>
        </a>

        <div className="sidebar-label">WORKSPACE</div>
        <button className="nav-item active">
          <Grid2X2 size={18} /> Pathfinding visualizer
        </button>
        <button className="nav-item" onClick={() => setShowHelp(!showHelp)}>
          <CircleHelp size={18} /> How it works
          <ArrowDown className="nav-chevron" size={15} />
        </button>

        {showHelp && (
          <div className="help-card">
            {algorithm === "BFS" && (
              <>
                <strong>Breadth-first search (BFS)</strong>
                <p>
                  BFS explores neighboring cells layer by layer.
                  On an unweighted grid, it finds a path with the
                  fewest number of steps.
                </p>
              </>
            )}

            {algorithm === "DFS" && (
              <>
                <strong>Depth-first search (DFS)</strong>
                <p>
                  DFS explores one direction as far as possible
                  before backtracking. It finds a valid path, but
                  does not guarantee the shortest path.
                </p>
              </>
            )}

            {algorithm === "DIJKSTRA" && (
              <>
                <strong>Dijkstra's algorithm</strong>
                <p>
                  Dijkstra explores paths based on their accumulated
                  movement cost. It finds the lowest-cost path while
                  accounting for Mud and Water terrain.
                </p>
              </>
            )}

            {algorithm === "ASTAR" && (
              <>
                <strong>A* search</strong>
                <p>
                  A* combines the movement cost with a heuristic
                  estimate of the distance to the target. This guides
                  the search towards the destination while finding
                  an optimal-cost path.
                </p>
              </>
            )}

            <p>Drag the mint start node or blue target node to move them.</p>
          </div>
        )}

        <div className="sidebar-bottom">
          <div className="sidebar-label">YOUR LAB</div>
          <div className="profile-card">
            <div className="profile-avatar"><Sparkles size={18} /></div>
            <div><strong>Explorer mode</strong><small>Curiosity in motion</small></div>
            <span className="online-dot" />
          </div>
          <div className="sidebar-footnote">BUILT TO UNDERSTAND, NOT JUST RUN.</div>
        </div>
      </aside>

      <section className="main-panel">
        <header className="topbar">
          <div className="breadcrumbs">
            <span>Workspace</span><span className="slash">/</span>
            <strong>Pathfinding</strong>
          </div>
          <div className="topbar-right">
            <span className="status-pill">
              <span className="status-dot" /> SYSTEM READY
            </span>
          </div>
        </header>

        <div className="content">
          <section className="page-heading">
            <div>
              <div className="eyebrow"><span /> INTERACTIVE ALGORITHM STUDIO</div>
              <h1>Find your <span>way.</span></h1>
              <p>Explore how algorithms navigate complexity, one node at a time.</p>
            </div>
          </section>

          <section className="stats-grid">
            <article className="stat-card">
              <div className="stat-top"><span>Nodes explored</span><span className="stat-icon cyan"><Activity size={17}/></span></div>
              <div className="stat-number">{exploredCount.toLocaleString()}<small> nodes</small></div>
              <div className="stat-note">Cells visited during search</div>
            </article>
            <article className="stat-card">
              <div className="stat-top"><span>Shortest path</span><span className="stat-icon mint"><Target size={17}/></span></div>
              <div className="stat-number">
                {pathFound ? pathLength : "—"}
                {pathFound && <small> steps</small>}
              </div>
              <div className="stat-note">Edges from start to target</div>
            </article>
            <article className="stat-card">
              <div className="stat-top"><span>Search time</span><span className="stat-icon blue"><Clock3 size={17}/></span></div>
              <div className="stat-number">{elapsed}<small> sec</small></div>
              <div className="stat-note">Approx. visualized runtime</div>
            </article>         
            <article className="stat-card">
              <div className="stat-top">
                <span>Total cost</span>
                <span className="stat-icon cyan"><Activity size={17}/></span>
              </div>
              <div className="stat-number">
                {pathFound ? totalCost : "—"}
                {pathFound && <small> cost</small>}
              </div>
              <div className="stat-note">Movement cost of the path</div>
            </article>
            <article className="stat-card">
              <div className="stat-top"><span>Wall density</span><span className="stat-icon violet"><Zap size={17}/></span></div>
              <div className="stat-number">{((wallCount / (ROWS * COLS)) * 100).toFixed(1)}<small>%</small></div>
              <div className="stat-note">{wallCount} blocked cells</div>
            </article>
          </section>

          {comparisonResults.length > 0 && (
            <section className="comparison-panel">
              <div className="comparison-heading">
                <div>
                  <h2>Algorithm comparison</h2>
                  <p>All four algorithms tested on the same grid.</p>
                </div>
                <button
                  className="clear-comparison"
                  onClick={() => setComparisonResults([])}
                >
                  Clear results
                </button>
              </div>

              <div className="comparison-grid">
                {comparisonResults.map((result) => (
                  <article className="comparison-card" key={result.algorithm}>
                    <h3>
                      {{
                        BFS: "Breadth-first search",
                        DFS: "Depth-first search",
                        DIJKSTRA: "Dijkstra's algorithm",
                        ASTAR: "A* search",
                      }[result.algorithm] ?? result.algorithm}
                    </h3>

                    {result.pathFound &&
                      (result.algorithm === "DIJKSTRA" ||
                        result.algorithm === "ASTAR") &&
                      result.totalCost ===
                        Math.min(
                          ...comparisonResults
                            .filter((item) => item.pathFound)
                            .map((item) => item.totalCost ?? Infinity)
                        ) && (
                        <span className="optimal-badge">
                          <Zap size={12} />
                          Optimal cost
                        </span>
                      )}

                    <p>
                      {result.pathFound ? "Path found" : "No path found"}
                    </p>

                    <div className="comparison-metric">
                      <span>Nodes explored</span>
                      <strong>{result.exploredCount}</strong>
                    </div>

                    <div className="comparison-metric">
                      <span>Path length</span>
                      <strong>{result.pathLength ?? "—"}{result.pathLength !== null ? " steps" : ""}</strong>
                    </div>

                    <div className="comparison-metric">
                      <span>Total cost</span>
                      <strong>{result.totalCost ?? "—"}</strong>
                    </div>

                    <div className="comparison-metric">
                      <span>Computation time</span>
                      <strong>{result.timeMs.toFixed(3)} ms</strong>
                    </div>
                  </article>
                ))}
              </div>

              <div className="comparison-insights">
                <h3>
                  <Zap size={17} />
                  Quick insights
                </h3>

                <div className="insight-items">                  
                  <div className="insight-item">
                    <span>Fewest nodes explored</span>
                    <strong>
                      {{
                        BFS: "Breadth-first search",
                        DFS: "Depth-first search",
                        DIJKSTRA: "Dijkstra's algorithm",
                        ASTAR: "A* search",
                      }[
                        comparisonResults
                          .filter((result) => result.pathFound)
                          .reduce(
                            (best, result) =>
                              !best || result.exploredCount < best.exploredCount
                                ? result
                                : best,
                            null as ComparisonResult | null
                          )?.algorithm ?? ""
                      ] ?? "—"}
                    </strong>
                    <p>Fewest cells explored among successful searches.</p>
                  </div>


                  <div className="insight-item">
                    <span>Lowest path cost</span>
                    <strong>
                      {comparisonResults
                        .filter((result) => result.pathFound)
                        .reduce(
                          (best, result) =>
                            !best || (result.totalCost ?? Infinity) < (best.totalCost ?? Infinity)
                              ? result
                              : best,
                          null as ComparisonResult | null
                        )?.totalCost ?? "—"}
                    </strong>
                    <p>Lowest movement cost found in this comparison.</p>
                  </div>
                  
                  <div className="insight-item">
                    <span>Fastest computation</span>
                    <strong>
                      {{
                        BFS: "Breadth-first search",
                        DFS: "Depth-first search",
                        DIJKSTRA: "Dijkstra's algorithm",
                        ASTAR: "A* search",
                      }[
                        comparisonResults
                          .filter((result) => result.pathFound)
                          .reduce(
                            (best, result) =>
                              !best || result.timeMs < best.timeMs ? result : best,
                            null as ComparisonResult | null
                          )?.algorithm ?? ""
                      ] ?? "—"}
                    </strong>
                    <p>Fastest measured run; timing varies between trials.</p>
                  </div>
                </div>
              </div>

            </section>
          )}


          <section className="workspace-card">
            <div className="workspace-heading">
              <div>
                <div className="section-kicker"><span className="pulse-dot" /> LIVE CANVAS</div>
                <h2>Grid workspace</h2>
                <p>Draw obstacles, position your nodes, then run the search.</p>
              </div>
              <div className="grid-size"><span className="size-indicator" /> {ROWS} × {COLS} <small>GRID</small></div>
            </div>

            
            <div className="toolbar">
              <div className="algorithm-select">
                <span className="algorithm-icon">
                  <Waves size={17} />
                </span>

                <div>
                  <small>ALGORITHM</small>
                  <select
                    className="algorithm-dropdown"
                    value={algorithm}
                    onChange={(event) => setAlgorithm(event.target.value)}
                    disabled={isRunning}
                  >
                    <option value="BFS">Breadth-first search</option>
                    <option value="DFS">Depth-first search</option>
                    <option value="DIJKSTRA">Dijkstra's algorithm</option>
                    <option value="ASTAR">A* search</option>
                  </select>
                </div>

                                
                <div className="speed-control">
                  <label htmlFor="speed-slider">
                    <span>ANIMATION SPEED</span>
                    <strong>
                      {animationSpeed <= 5
                        ? "Fast"
                        : animationSpeed <= 15
                        ? "Normal"
                        : "Slow"}
                    </strong>
                  </label>

                  <input
                    id="speed-slider"
                    type="range"
                    min="1"
                    max="40"
                    step="1"
                    value={animationSpeed}
                    onChange={(event) =>
                      setAnimationSpeed(Number(event.target.value))
                    }
                    disabled={isRunning}
                  />
                 
                  <div className="terrain-tools">
                    <button
                      className={paintMode === "wall" ? "terrain-tool active" : "terrain-tool"}
                      onClick={() => setPaintMode("wall")}
                      disabled={isRunning}
                    >
                      ⬛ Wall
                    </button>

                    <button
                      className={paintMode === "mud" ? "terrain-tool active" : "terrain-tool"}
                      onClick={() => setPaintMode("mud")}
                      disabled={isRunning}
                    >
                      🟫 Mud · 5
                    </button>

                    <button
                      className={paintMode === "water" ? "terrain-tool active" : "terrain-tool"}
                      onClick={() => setPaintMode("water")}
                      disabled={isRunning}
                    >
                      🟦 Water · 10
                    </button>
                  </div>


                  <div className="speed-labels">
                    <span>Fast</span>
                    <span>Slow</span>
                  </div>
                </div>


                <span className="algorithm-tag">
                  {algorithm === "BFS"
                    ? "BFS"
                    : algorithm === "DFS"
                    ? "DFS"
                    : algorithm === "DIJKSTRA"
                    ? "Dijkstra"
                    : "A*"}
                </span>
              </div>

              <div className="toolbar-actions">
                <button
                  className="button-secondary"
                  onClick={clearWalls}
                  disabled={isRunning}
                >
                  <Eraser size={15} /> Clear walls
                </button>
                                
                <div className="randomize-controls">
                  <select
                    className="random-mode-select"
                    value={randomMode}
                    onChange={(event) =>
                      setRandomMode(
                        event.target.value as "walls" | "terrain" | "mixed"
                      )
                    }
                    disabled={isRunning}
                  >
                    <option value="walls">Random Walls</option>
                    <option value="terrain">Random Terrain</option>
                    <option value="mixed">Mixed Challenge</option>
                  </select>

                  <button
                    className="button-secondary"
                    onClick={() => randomMaze(randomMode)}
                    disabled={isRunning}
                  >
                    <Shuffle size={15} /> Generate
                  </button>
                                    
                  <button
                    className="button-secondary"
                    onClick={generateStructuredMaze}
                    disabled={isRunning}
                  >
                    <Shuffle size={15} />
                    Generate Maze
                  </button>
                </div>


                <button
                  className="button-secondary reset-button"
                  onClick={resetGrid}
                  disabled={isRunning}
                >
                  <RotateCcw size={15} /> Reset
                </button>
              </div>
            </div>

            <div className="grid-experience">
              <div className="grid-column">
                <div className="grid-frame">
                  <div className="grid-topline">
                    <span><MousePointer2 size={13}/> CLICK + DRAG TO EDIT</span>
                    <span>ORTHOGONAL MOVEMENT</span>
                  </div>
                  <div
                    className="path-grid"
                    style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
                    onMouseLeave={endDrawing}
                  >
                    {Array.from({ length: ROWS * COLS }, (_, index) => {
                      const point = { row: Math.floor(index / COLS), col: index % COLS };
                      const key = keyOf(point);
                      const isStart = samePoint(point, start);
                      const isFinish = samePoint(point, finish);
                      const isWall = walls.has(key);
                      const isPath = path.has(key);
                      const isVisited = visited.has(key);
                      
                      const terrainCost = terrain.get(key);

                      const classes = [
                        "grid-cell",
                        isWall ? "wall" : "",
                        terrainCost === 5 ? "mud-cell" : "",
                        terrainCost === 10 ? "water-cell" : "",
                        isVisited ? "visited" : "",
                        isPath ? "path" : "",
                        isStart ? "start-node" : "",
                        isFinish ? "finish-node" : "",
                      ]
                        .filter(Boolean)
                        .join(" ");

                      return (
                        <div
                          key={key}
                          className={classes}
                          onMouseDown={(event) => {
                            event.preventDefault();
                            handleCellDown(point);
                          }}
                          onMouseEnter={() => handleCellEnter(point)}
                          title={
                            isStart ? "Start node — drag to move" :
                            isFinish ? "Target node — drag to move" :
                            isWall ? "Wall" : `Row ${point.row + 1}, column ${point.col + 1}`
                          }
                        >
                          {isStart && <span className="node-glyph"><Play size={11} fill="currentColor"/></span>}
                          {isFinish && <span className="node-glyph"><Target size={14}/></span>}
                        </div>
                      );
                    })}
                  </div>
                  <div className="grid-legend">
                    <span><i className="legend-start"/> Start</span>
                    <span><i className="legend-finish"/> Target</span>
                    <span><i className="legend-wall"/> Wall</span>
                    <span><i className="legend-visited"/> Explored</span>
                    <span><i className="legend-path"/> Shortest path</span>
                  </div>
                </div>
              </div>

              <aside className="explanation-panel">
                <div className="explanation-header">
                  <span className="explanation-eyebrow">ALGORITHM GUIDE</span>
                  <h3>{currentExplanation.name}</h3>
                </div>

                <div className="explanation-section">
                  <h4>How it works</h4>
                  <p>{currentExplanation.principle}</p>
                </div>

                <div className="explanation-section">
                  <h4>Search strategy</h4>
                  <p>{currentExplanation.strategy}</p>
                </div>

                <div className="explanation-section live-step">
                  <h4>Live search activity</h4>

                  {!currentStep && !searchCompleted && (
                    <p>Run the algorithm to see how it explores the grid.</p>
                  )}

                  {currentStep && (
                    <>
                      <p>
                        Exploring cell ({currentStep.point.row + 1},{" "}
                        {currentStep.point.col + 1})
                      </p>

                      <div className="step-metrics">
                        <div>
                          <strong>{currentStep.exploredCount}</strong>
                          <span>Explored</span>
                        </div>

                        <div>
                          <strong>{currentStep.frontierSize}</strong>
                          <span>Waiting</span>
                        </div>
                      </div>

                      <p>
                        Accumulated cost: {currentStep.costSoFar}
                      </p>

                      <div className="step-reason">
                        {algorithm === "BFS" && (
                          <p>
                            This cell was selected next because BFS explores
                            discovered cells in first-in, first-out order.
                          </p>
                        )}

                        {algorithm === "DFS" && (
                          <p>
                            This cell was selected next because DFS explores
                            the most recently discovered cell first.
                          </p>
                        )}

                        {algorithm === "DIJKSTRA" && (
                          <p>
                            This cell was selected because it has the lowest
                            accumulated movement cost among the available cells.
                          </p>
                        )}

                        {algorithm === "ASTAR" && (
                          <p>
                            This cell was selected using its combined score:
                            movement cost so far plus estimated distance to the target.
                            Its current priority score is {currentStep.priority}.
                          </p>
                        )}
                      </div>

                      {algorithm === "ASTAR" && (
                        <>
                          <p>Estimated remaining distance: {currentStep.heuristic}</p>
                          <p>Priority score: {currentStep.priority}</p>
                        </>
                      )}
                    </>
                  )}

                  {!currentStep && searchCompleted && (
                    <p>The search has finished.</p>
                  )}
                </div>

                <div className="explanation-section">
                  <h4>Does it find the best path?</h4>
                  <p>{currentExplanation.optimality}</p>
                </div>

                <div className="explanation-section">
                  <h4>Terrain costs</h4>
                  <p>{currentExplanation.costBehaviour}</p>
                </div>

                <div className="explanation-status">
                  {!isRunning && !searchCompleted && (
                    <>
                      <span className="status-dot" />
                      <p>Select Run to see the algorithm in action.</p>
                    </>
                  )}

                  {isRunning && (
                    <>
                      <span className="status-dot status-running" />
                      <p>
                        Searching the grid... The explored cells show the progress
                        of the search.
                      </p>
                    </>
                  )}

                  {searchCompleted && pathFound && (
                    <>
                      <span className="status-dot status-complete" />
                      <h4>Search complete</h4>
                      <p>
                        The algorithm explored {exploredCount} cells and found a
                        route of {pathLength} steps, with a total movement cost
                        of {totalCost}.
                      </p>
                    </>
                  )}

                  {searchCompleted && !pathFound && (
                    <>
                      <span className="status-dot status-running" />
                      <h4>No path found</h4>
                      <p>
                        The algorithm explored {exploredCount} cells but could not
                        reach the target. Try removing some walls.
                      </p>
                    </>
                  )}
                </div>
              </aside>
            </div>

            <div className="run-row">
              <div className="run-status">
                <span className={`run-status-dot ${isRunning ? "running" : ""}`} />
                <div><strong>{notice}</strong><small>{isRunning ? "Visualizing search in progress" : "Ready when you are"}</small></div>
              </div>
              <button
                className="run-button"
                onClick={runSearch}
                disabled={isRunning}
              >
                {isRunning ? (
                  <>
                    <Activity size={17} className="spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Play size={16} fill="currentColor" />
                    Visualize path
                    <ArrowDown size={15} />
                  </>
                )}
              </button>
              <button
                className="compare-button"
                onClick={compareAlgorithms}
                disabled={isRunning}
              >
                <Activity size={17} />
                Compare algorithms
              </button>
            </div>
          </section>

          <footer className="page-footer">
            <span><Waves size={15}/> PATHFINDER LAB <span className="footer-divider">/</span> A STUDY IN ALGORITHMS</span>
            <span>Made for the curious <span className="footer-heart">✳</span></span>
          </footer>
        </div>
      </section>
    </main>
  );
}
