import assert from 'node:assert/strict';
import ShogiEngine from '../lib/engine.js';
import { applyMove, createInitialPosition, legalMoves, moveToUSI, toSFEN } from '../lib/shogi.js';

const engine = new ShogiEngine();
let seed = 940;
const random = (max) => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % max; };
const pattern = /^(?:(?:[1-9][a-i][1-9][a-i]\+?|[PLNSGBR]\*[1-9][a-i])\s*)*$/;
let checked = 0, drops = 0, promotions = 0;
try {
  await engine.start();
  for (let game = 0; game < 5; game++) {
    let position = createInitialPosition();
    for (let ply = 0; ply < 180; ply++) {
      engine.send(`position sfen ${toSFEN(position)}`);
      const line = await engine.exchange('moves', (value) => pattern.test(value), 5000);
      const native = line.trim() ? line.trim().split(/\s+/).sort() : [];
      const local = legalMoves(position).map(moveToUSI).sort();
      assert.deepEqual(local, native, `Move set mismatch at ${toSFEN(position)}`);
      checked++;
      if (!local.length) break;
      // Prefer captures and promotion occasionally to exercise hands and drop rules.
      const tactical = legalMoves(position).filter((move) => move.promote || (!move.drop && position.board[move.to[0]][move.to[1]] !== ' ')).map(moveToUSI);
      const candidates = tactical.length && random(3) === 0 ? tactical : local;
      const move = candidates[random(candidates.length)];
      if (move.includes('*')) drops++;
      if (move.endsWith('+')) promotions++;
      position = applyMove(position, move);
    }
  }
  console.log(`Compared all legal moves in ${checked} positions with YaneuraOu v9.40; played ${drops} drops and ${promotions} promotions.`);
} finally { engine.dispose(); }
