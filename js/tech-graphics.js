"use strict";

/*
 * Lightweight, dependency-free animated backgrounds for the dark-theme
 * "tech" accents (network graphs, neural diagrams, matrix rain).
 * No libraries, no build step — plain canvas 2D, safe for static
 * GitHub Pages hosting.
 *
 * Each <canvas class="tech-canvas" data-mode="network|neural|matrix">
 * on the page is picked up automatically. Animation only runs when:
 *   - the dark theme is active (body does not carry .light-theme), and
 *   - the canvas is on/near screen (IntersectionObserver), and
 *   - the visitor has not requested reduced motion (a single static
 *     frame is drawn instead).
 */
(() => {
  const body = document.body;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const isLight = () => body.classList.contains("light-theme");

  const GREEN = (a) => `rgba(52, 211, 153, ${a})`;
  const GREEN_BRIGHT = (a) => `rgba(134, 239, 172, ${a})`;
  const GLYPHS = "01{}<>/=+-;:.ABCDEFGHIJKLMNOPQRSTUVWXYZλΣ01".split("");

  function debounce(fn, wait) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  class TechCanvas {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.mode = canvas.dataset.mode || "network";
      this.density = parseFloat(canvas.dataset.density || "1");
      this.speed = parseFloat(canvas.dataset.speed || "1");
      this.expand = canvas.dataset.expand === "true";
      this.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      this.running = false;
      this.inView = false;
      this.raf = null;
      this.t = 0;

      this.resize();
      this.seed();

      this.handleResize = debounce(() => {
        this.resize();
        this.seed();
        this.drawFrame();
      }, 200);
      window.addEventListener("resize", this.handleResize);

      if ("IntersectionObserver" in window) {
        this.observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              this.inView = entry.isIntersecting;
              this.syncRunning();
            });
          },
          { rootMargin: "220px 0px 220px 0px", threshold: 0 }
        );
        this.observer.observe(canvas);
      } else {
        this.inView = true;
        this.syncRunning();
      }

      document.addEventListener("themechange", () => {
        // The canvas's container is display:none in whichever theme
        // isn't active, so getBoundingClientRect() reads a zero size the
        // whole time that theme is showing — including at construction,
        // if the page loaded in that theme to begin with. That leaves
        // the backing store stuck at resize()'s 1x1 fallback, which the
        // browser then stretches to fill the CSS box as one solid smear
        // of color the instant the container becomes visible again.
        // Re-measure and reseed now that we're actually on-screen.
        this.resize();
        this.seed();
        this.syncRunning();
      });
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      this.width = Math.max(1, Math.round(rect.width));
      this.height = Math.max(1, Math.round(rect.height));
      this.canvas.width = this.width * this.dpr;
      this.canvas.height = this.height * this.dpr;
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }

    seed() {
      if (this.mode === "matrix") {
        this.seedMatrix();
      } else if (this.mode === "neural") {
        this.seedNeural();
      } else if (this.mode === "pathfind") {
        this.seedPathfind();
      } else {
        this.seedNetwork();
      }
    }

    // ---- network: drifting nodes, connecting lines between near pairs ----
    seedNetwork() {
      const area = this.width * this.height;
      const count = Math.max(
        8,
        Math.round((area / 16000) * this.density)
      );
      const cx = this.width / 2;
      const cy = this.height / 2;
      this.nodes = Array.from({ length: count }, () => {
        if (this.expand) {
          const angle = Math.random() * Math.PI * 2;
          const r = Math.random() * Math.min(this.width, this.height) * 0.12;
          return {
            x: cx + Math.cos(angle) * r,
            y: cy + Math.sin(angle) * r,
            vx: Math.cos(angle) * (0.12 + Math.random() * 0.16) * this.speed,
            vy: Math.sin(angle) * (0.12 + Math.random() * 0.16) * this.speed,
            angle,
            r
          };
        }
        return {
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          vx: (Math.random() - 0.5) * 0.35 * this.speed,
          vy: (Math.random() - 0.5) * 0.35 * this.speed
        };
      });
      this.linkDist = Math.max(this.width, this.height) * 0.16 + 60;
    }

    stepNetwork() {
      const cx = this.width / 2;
      const cy = this.height / 2;
      const maxR = Math.min(this.width, this.height) * 0.62;
      this.nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        if (this.expand) {
          const dx = n.x - cx;
          const dy = n.y - cy;
          if (Math.sqrt(dx * dx + dy * dy) > maxR) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * Math.min(this.width, this.height) * 0.08;
            n.x = cx + Math.cos(angle) * r;
            n.y = cy + Math.sin(angle) * r;
            n.vx = Math.cos(angle) * (0.12 + Math.random() * 0.16) * this.speed;
            n.vy = Math.sin(angle) * (0.12 + Math.random() * 0.16) * this.speed;
          }
        } else {
          if (n.x < 0 || n.x > this.width) n.vx *= -1;
          if (n.y < 0 || n.y > this.height) n.vy *= -1;
          n.x = Math.min(Math.max(n.x, 0), this.width);
          n.y = Math.min(Math.max(n.y, 0), this.height);
        }
      });
    }

    drawNetwork() {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.width, this.height);
      const nodes = this.nodes;

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < this.linkDist) {
            const alpha = (1 - dist / this.linkDist) * 0.5;
            ctx.strokeStyle = GREEN(alpha);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      nodes.forEach((n) => {
        ctx.fillStyle = GREEN_BRIGHT(0.75);
        ctx.beginPath();
        ctx.arc(n.x, n.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = GREEN(0.35);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 5, 0, Math.PI * 2);
        ctx.stroke();
      });
    }

    // ---- neural: fixed layered diagram with a traveling pulse ----
    seedNeural() {
      const layerCounts = this.width < 420 ? [3, 4, 4, 2] : [4, 6, 6, 3];
      const layers = layerCounts.length;
      const layerGapX = this.width / (layers + 1);
      this.neuralNodes = layerCounts.map((count, li) =>
        Array.from({ length: count }, (_, ni) => ({
          x: layerGapX * (li + 1),
          y: (this.height / (count + 1)) * (ni + 1)
        }))
      );
      this.neuralEdges = [];
      for (let li = 0; li < layers - 1; li++) {
        this.neuralNodes[li].forEach((a) => {
          this.neuralNodes[li + 1].forEach((b) => {
            if (Math.random() < 0.62) {
              this.neuralEdges.push({ a, b, phase: Math.random() * Math.PI * 2 });
            }
          });
        });
      }
    }

    drawNeural() {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.width, this.height);

      this.neuralEdges.forEach((e) => {
        const pulse = (Math.sin(this.t * 0.03 + e.phase) + 1) / 2;
        ctx.strokeStyle = GREEN(0.14 + pulse * 0.26);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(e.a.x, e.a.y);
        ctx.lineTo(e.b.x, e.b.y);
        ctx.stroke();
      });

      this.neuralNodes.flat().forEach((n) => {
        ctx.fillStyle = GREEN_BRIGHT(0.7);
        ctx.beginPath();
        ctx.arc(n.x, n.y, 2.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = GREEN(0.3);
        ctx.beginPath();
        ctx.arc(n.x, n.y, 5.5, 0, Math.PI * 2);
        ctx.stroke();
      });
    }

    // ---- matrix: falling glyph columns ----
    seedMatrix() {
      const colWidth = 16;
      const cols = Math.max(4, Math.round((this.width / colWidth) * this.density));
      // Spread the initial y across the whole visible band (not just
      // above it) so a column is already streaming down on first paint,
      // and so the single still frame drawn for reduced-motion visitors
      // actually shows rain instead of an empty canvas.
      this.matrixCols = Array.from({ length: cols }, (_, i) => ({
        x: (this.width / cols) * i + colWidth / 2,
        y: Math.random() * (this.height + 160) - 80,
        speed: (0.7 + Math.random() * 1.3) * this.speed,
        len: 4 + Math.floor(Math.random() * 8),
        glyphs: null
      }));
    }

    drawMatrix() {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.width, this.height);
      ctx.font = "12px 'Courier New', monospace";
      ctx.textAlign = "center";

      this.matrixCols.forEach((col) => {
        col.y += col.speed;
        if (col.y - col.len * 16 > this.height) {
          col.y = -Math.random() * 200;
          col.speed = (0.7 + Math.random() * 1.3) * this.speed;
          col.len = 4 + Math.floor(Math.random() * 8);
        }
        for (let k = 0; k < col.len; k++) {
          const gy = col.y - k * 16;
          if (gy < -16 || gy > this.height + 16) continue;
          const glyph = GLYPHS[Math.floor((gy + col.x * 7 + k) * 0.13) % GLYPHS.length];
          const alpha = k === 0 ? 0.75 : Math.max(0, 0.4 - k * 0.045);
          ctx.fillStyle = k === 0 ? GREEN_BRIGHT(alpha) : GREEN(alpha);
          ctx.fillText(glyph, col.x, gy);
        }
      });
    }

    // ---- pathfind: a BFS/Dijkstra-style route search across a grid ----
    // Explores outward from a start node on the left edge, threading
    // around obstacle blocks, then traces and highlights the shortest
    // route it finds through to an end node on the right edge — a small,
    // sparse, professional "solving a map" animation instead of a dense
    // fully-connected mesh (kept intentionally light on ink so it never
    // washes the section green).
    seedPathfind() {
      // A coarser grid than the old mesh network — fewer, larger cells
      // read as a calm route map instead of a busy tiled texture, and it
      // echoes the hero's own 46px background grid for visual harmony.
      const cell = Math.max(30, Math.round(46 / this.density));
      const cols = Math.max(8, Math.min(48, Math.floor(this.width / cell)));
      const rows = Math.max(5, Math.min(28, Math.floor(this.height / cell)));
      this.pfCols = cols;
      this.pfRows = rows;
      this.pfCell = { w: this.width / cols, h: this.height / rows };

      const midR = Math.floor(rows / 2);
      const jitter = () => Math.floor(Math.random() * 3) - 1;
      this.pfStart = { c: 0, r: Math.max(1, Math.min(rows - 2, midR + jitter())) };
      this.pfEnd = {
        c: cols - 1,
        r: Math.max(1, Math.min(rows - 2, midR + jitter()))
      };

      let grid = null;
      for (let attempt = 0; attempt < 6; attempt++) {
        grid = this.buildPathfindGrid(cols, rows, 0.11 - attempt * 0.015);
        if (this.pathfindReachable(grid, cols, rows)) break;
      }
      this.pfGrid = grid;
      this.resetPathfindRun();
    }

    buildPathfindGrid(cols, rows, density) {
      const grid = new Array(cols * rows);
      const minDensity = Math.max(0.035, density);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          const nearStart = c <= 1 && Math.abs(r - this.pfStart.r) <= 1;
          const nearEnd = c >= cols - 2 && Math.abs(r - this.pfEnd.r) <= 1;
          const wall = !nearStart && !nearEnd && Math.random() < minDensity;
          grid[idx] = { wall, visited: false, order: -1, parent: -1 };
        }
      }
      return grid;
    }

    pathfindReachable(grid, cols, rows) {
      const startIdx = this.pfStart.r * cols + this.pfStart.c;
      const endIdx = this.pfEnd.r * cols + this.pfEnd.c;
      if (grid[startIdx].wall || grid[endIdx].wall) return false;
      const seen = new Uint8Array(cols * rows);
      const queue = [startIdx];
      seen[startIdx] = 1;
      let qi = 0;
      while (qi < queue.length) {
        const idx = queue[qi++];
        if (idx === endIdx) return true;
        const c = idx % cols;
        const r = (idx / cols) | 0;
        const neighbors = [[c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]];
        for (let k = 0; k < neighbors.length; k++) {
          const nc = neighbors[k][0];
          const nr = neighbors[k][1];
          if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
          const nidx = nr * cols + nc;
          if (seen[nidx] || grid[nidx].wall) continue;
          seen[nidx] = 1;
          queue.push(nidx);
        }
      }
      return false;
    }

    resetPathfindRun() {
      const cols = this.pfCols;
      this.pfGrid.forEach((cell) => {
        cell.visited = false;
        cell.order = -1;
        cell.parent = -1;
      });
      const startIdx = this.pfStart.r * cols + this.pfStart.c;
      this.pfGrid[startIdx].visited = true;
      this.pfGrid[startIdx].order = 0;
      this.pfQueue = [startIdx];
      this.pfQueueHead = 0;
      this.pfVisitCounter = 1;
      this.pfPhase = "explore";
      this.pfPath = [];
      this.pfPathProgress = 0;
      this.pfHold = 0;
      this.pfTick = 0;
    }

    beginPathfindPath(endIdx) {
      const path = [];
      let cur = endIdx;
      let guard = 0;
      while (cur !== -1 && guard++ < this.pfCols * this.pfRows + 5) {
        path.push(cur);
        cur = this.pfGrid[cur].parent;
      }
      path.reverse();
      this.pfPath = path;
      this.pfPathProgress = 0;
      this.pfPhase = "path";
    }

    stepPathfind() {
      this.pfTick += 1;
      const cols = this.pfCols;
      const rows = this.pfRows;
      const endIdx = this.pfEnd.r * cols + this.pfEnd.c;

      if (this.pfPhase === "explore") {
        const steps = Math.max(1, Math.round(1.5 * this.speed));
        for (let s = 0; s < steps; s++) {
          if (this.pfQueueHead >= this.pfQueue.length) {
            this.beginPathfindPath(endIdx);
            break;
          }
          const idx = this.pfQueue[this.pfQueueHead++];
          const c = idx % cols;
          const r = (idx / cols) | 0;
          const neighbors = [[c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]];
          for (let k = 0; k < neighbors.length; k++) {
            const nc = neighbors[k][0];
            const nr = neighbors[k][1];
            if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
            const nidx = nr * cols + nc;
            const ncell = this.pfGrid[nidx];
            if (ncell.wall || ncell.visited) continue;
            ncell.visited = true;
            ncell.order = this.pfVisitCounter++;
            ncell.parent = idx;
            this.pfQueue.push(nidx);
            if (nidx === endIdx) {
              this.beginPathfindPath(endIdx);
              break;
            }
          }
          if (this.pfPhase !== "explore") break;
        }
      } else if (this.pfPhase === "path") {
        const steps = Math.max(1, Math.round(1.4 * this.speed));
        this.pfPathProgress = Math.min(this.pfPath.length, this.pfPathProgress + steps);
        if (this.pfPathProgress >= this.pfPath.length) {
          this.pfPhase = "hold";
          this.pfHold = Math.round(150 / this.speed);
        }
      } else if (this.pfPhase === "hold") {
        this.pfHold -= 1;
        if (this.pfHold <= 0) {
          this.seedPathfind();
        }
      }
    }

    // Runs the whole search synchronously against the current grid, for
    // the single still frame shown to reduced-motion visitors (and as a
    // safe first paint) — a calm, already-solved route rather than a mid
    // -search snapshot.
    solvePathfindInstant() {
      this.resetPathfindRun();
      const total = this.pfCols * this.pfRows + 5;
      let guard = 0;
      while (this.pfPhase === "explore" && guard++ < total) {
        this.stepPathfind();
      }
      this.pfPhase = "hold";
      this.pfPathProgress = this.pfPath.length;
      this.pfTick = this.pfVisitCounter + 36;
    }

    drawPathfind() {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.width, this.height);
      const cols = this.pfCols;
      const cw = this.pfCell.w;
      const ch = this.pfCell.h;
      const dotR = Math.max(1.1, Math.min(cw, ch) * 0.09);

      // Obstacle markers: small, sparse, rounded squares — a light touch
      // of "map" texture rather than a dense tiled mosaic.
      ctx.fillStyle = GREEN(0.1);
      const wallPad = Math.min(cw, ch) * 0.33;
      const wallSize = Math.max(2, Math.min(cw, ch) - wallPad * 2);
      const wallRadius = wallSize * 0.28;
      for (let i = 0; i < this.pfGrid.length; i++) {
        if (!this.pfGrid[i].wall) continue;
        const c = i % cols;
        const r = (i / cols) | 0;
        const x = c * cw + wallPad;
        const y = r * ch + wallPad;
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(x, y, wallSize, wallSize, wallRadius);
        } else {
          ctx.rect(x, y, wallSize, wallSize);
        }
        ctx.fill();
      }

      for (let i = 0; i < this.pfGrid.length; i++) {
        const cell = this.pfGrid[i];
        if (!cell.visited) continue;
        const age = this.pfTick - cell.order;
        const alpha = Math.max(0.04, 0.3 - age * 0.004);
        const c = i % cols;
        const r = (i / cols) | 0;
        ctx.fillStyle = GREEN(alpha);
        ctx.beginPath();
        ctx.arc(c * cw + cw / 2, r * ch + ch / 2, dotR, 0, Math.PI * 2);
        ctx.fill();
      }

      if (this.pfPhase === "explore") {
        ctx.fillStyle = GREEN_BRIGHT(0.4);
        const upto = Math.min(this.pfQueue.length, this.pfQueueHead + 24);
        for (let q = this.pfQueueHead; q < upto; q++) {
          const idx = this.pfQueue[q];
          const c = idx % cols;
          const r = (idx / cols) | 0;
          ctx.beginPath();
          ctx.arc(c * cw + cw / 2, r * ch + ch / 2, dotR * 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (this.pfPath.length > 1) {
        const upto = this.pfPhase === "explore" ? 0 : Math.max(1, this.pfPathProgress);
        if (upto > 1) {
          ctx.strokeStyle = GREEN_BRIGHT(0.4);
          ctx.lineWidth = Math.max(1.6, Math.min(cw, ch) * 0.16);
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.beginPath();
          for (let p = 0; p < upto; p++) {
            const idx = this.pfPath[p];
            const c = idx % cols;
            const r = (idx / cols) | 0;
            const x = c * cw + cw / 2;
            const y = r * ch + ch / 2;
            if (p === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();

          if (this.pfPhase === "path" && upto < this.pfPath.length) {
            const idx = this.pfPath[upto - 1];
            const c = idx % cols;
            const r = (idx / cols) | 0;
            ctx.fillStyle = GREEN_BRIGHT(0.5);
            ctx.beginPath();
            ctx.arc(c * cw + cw / 2, r * ch + ch / 2, dotR * 1.8, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      const drawMarker = (pos) => {
        const x = pos.c * cw + cw / 2;
        const y = pos.r * ch + ch / 2;
        ctx.fillStyle = GREEN_BRIGHT(0.65);
        ctx.beginPath();
        ctx.arc(x, y, dotR * 2.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = GREEN(0.4);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(x, y, dotR * 3.4, 0, Math.PI * 2);
        ctx.stroke();
      };
      drawMarker(this.pfStart);
      drawMarker(this.pfEnd);
    }

    drawFrame() {
      if (this.mode === "matrix") this.drawMatrix();
      else if (this.mode === "neural") this.drawNeural();
      else if (this.mode === "pathfind") {
        this.solvePathfindInstant();
        this.drawPathfind();
      } else this.drawNetwork();
    }

    tick() {
      if (!this.running) return;
      this.t += 1;
      if (this.mode === "matrix") {
        this.drawMatrix();
      } else if (this.mode === "neural") {
        this.drawNeural();
      } else if (this.mode === "pathfind") {
        this.stepPathfind();
        this.drawPathfind();
      } else {
        this.stepNetwork();
        this.drawNetwork();
      }
      this.raf = requestAnimationFrame(() => this.tick());
    }

    syncRunning() {
      const shouldRun = this.inView && !isLight() && !reduceMotion.matches;

      if (shouldRun && !this.running) {
        this.running = true;
        this.raf = requestAnimationFrame(() => this.tick());
      } else if (!shouldRun && this.running) {
        this.running = false;
        if (this.raf) cancelAnimationFrame(this.raf);
        this.raf = null;
      }

      if (!isLight() && reduceMotion.matches) {
        // Respect reduced motion: paint one still frame, never animate.
        this.drawFrame();
      }
    }
  }

  const canvases = Array.from(document.querySelectorAll("canvas.tech-canvas"));
  if (canvases.length === 0) return;

  if (!("requestAnimationFrame" in window)) return;

  canvases.forEach((canvas) => new TechCanvas(canvas));
})();
