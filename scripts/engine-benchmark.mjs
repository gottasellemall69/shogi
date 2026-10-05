import { readFile } from 'node:fs/promises';
import ShogiEngine from '../lib/engine.js';
import { applyMove, createInitialPosition } from '../lib/shogi.js';

if (process.platform !== 'linux') throw new Error('Run this resource check on Linux.');
const engine = new ShogiEngine(undefined, true);
let peakEngineKiB = 0, peakThreads = 0;
const timer = setInterval(async () => {
  const pid = engine.process?.pid;
  if (!pid) return;
  try {
    const status = await readFile(`/proc/${pid}/status`, 'utf8');
    peakEngineKiB = Math.max(peakEngineKiB, Number(/^VmRSS:\s+(\d+)/m.exec(status)?.[1] || 0));
    peakThreads = Math.max(peakThreads, Number(/^Threads:\s+(\d+)/m.exec(status)?.[1] || 0));
  } catch { /* The child may have exited between sampling and reading. */ }
}, 25);
const started = performance.now();
try {
  const result = await engine.bestMove([], 1000);
  applyMove(createInitialPosition(), result.bestmove);
  console.log(JSON.stringify({ name: result.name, bestmove: result.bestmove,
    wallTimeMs: Math.round(performance.now() - started), peakEngineMiB: +(peakEngineKiB / 1024).toFixed(1),
    parentMiB: +(process.memoryUsage().rss / 1024 / 1024).toFixed(1), peakThreads,
    childReaped: engine.process === null }, null, 2));
} finally { clearInterval(timer); await engine.shutdown(); }
