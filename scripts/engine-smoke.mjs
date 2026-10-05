import ShogiEngine from '../lib/engine.js';
import { applyMove, createInitialPosition, gameResult, toSFEN } from '../lib/shogi.js';

try { process.loadEnvFile('.env.local'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const engine = new ShogiEngine();
try {
  const status = await engine.status();
  console.log(`Connected: ${status.name}`);
  let position = createInitialPosition();
  const moves = [], positions = [position];
  const plies = Number(process.env.SMOKE_PLIES || 6);
  for (let ply = 0; ply < plies && !gameResult(positions); ply++) {
    const result = await engine.bestMove(moves, 250);
    if (['win', 'resign'].includes(result.bestmove)) { console.log(result.bestmove); break; }
    position = applyMove(position, result.bestmove);
    positions.push(position); moves.push(result.bestmove);
    console.log(`${ply + 1}. ${result.bestmove} | ${result.info}`);
  }
  console.log(`Validated ${moves.length} real engine moves. ${toSFEN(position)}`);
} finally { engine.dispose(); }
