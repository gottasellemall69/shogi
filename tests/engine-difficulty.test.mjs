import test from 'node:test';
import assert from 'node:assert/strict';
import ShogiEngine from '../lib/engine.js';
import { chooseEngineMove, DIFFICULTIES, difficultyProfile } from '../lib/difficulty.js';

// A protocol fixture advertises MultiPV and returns legal opening candidates.
const fixture = String.raw`
  const readline = require('node:readline');
  let count = 1, searches = 0;
  readline.createInterface({ input: process.stdin }).on('line', (line) => {
    if (line === 'usi') {
      console.log('id name Difficulty fixture');
      if (process.argv[1] !== 'unsupported') console.log('option name MultiPV type spin default 1 min 1 max 600');
      console.log('usiok');
    }
    if (line === 'isready') console.log('readyok');
    if (line.startsWith('setoption name MultiPV value ')) count = Number(line.split(' ').at(-1));
    if (line.startsWith('go ')) {
      searches++;
      const moves = ['7g7f', '2g2f', '5g5f'];
      const available = process.argv[1] === 'stale' && searches > 1 ? 1 : count;
      moves.slice(0, available).forEach((move, index) => {
        console.log('info depth 2 multipv ' + (index + 1) + ' score cp ' + (12 - index) + ' pv ' + move);
      });
      console.log('bestmove 7g7f');
    }
  });
`;
const makeEngine = (mode = 'normal', scoped = false) => new ShogiEngine(() => ({
  executable: process.execPath, args: ['-e', fixture, mode], cwd: process.cwd(),
  evalDir: 'eval', model: 'model.onnx', architecture: 'dlshogi-WCSC28',
}), scoped);
const candidates = Array.from({ length: 16 }, (_, index) => ({
  rank: index + 1, move: 'move' + index, info: 'line ' + index,
}));

test('five difficulty levels progressively favor the strongest move', () => {
  const strongestCounts = [];
  for (const difficulty of Object.keys(DIFFICULTIES)) {
    const counts = new Map();
    for (let index = 0; index < 480; index++) {
      const choice = chooseEngineMove('move0', candidates, difficulty, () => (index + 0.5) / 480);
      counts.set(choice.move, (counts.get(choice.move) ?? 0) + 1);
      assert.equal(choice.info, 'line ' + choice.move.slice(4));
    }
    assert.equal(counts.size, difficultyProfile(difficulty).weights.length);
    strongestCounts.push(counts.get('move0'));
  }
  assert.deepEqual(strongestCounts, [30, 80, 240, 432, 480]);
});

test('expert, terminal replies, missing alternatives and a changed final bestmove remain authoritative', () => {
  const noRandom = () => { throw new Error('Unexpected random choice'); };
  assert.equal(chooseEngineMove('move0', candidates, 'expert', noRandom).move, 'move0');
  for (const move of ['resign', 'win', 'new-best']) {
    assert.equal(chooseEngineMove(move, candidates, 'novice', noRandom).move, move);
  }
  assert.equal(chooseEngineMove('7g7f', [], 'easy', noRandom).move, '7g7f');
  const duplicate = [{ rank: 1, move: '7g7f' }, { rank: 2, move: '7g7f' }, { rank: 3, move: '2g2f' }];
  assert.equal(chooseEngineMove('7g7f', duplicate, 'easy', () => 0.51).move, '2g2f');
});

test('untrusted difficulty values are rejected before starting an engine', () => {
  const engine = makeEngine();
  for (const difficulty of ['unknown', 'toString', '__proto__', 'novice\nquit', '', null, 1, [], {}]) {
    assert.throws(() => engine.bestMove([], 100, undefined, difficulty), (error) => error.status === 400);
  }
  assert.equal(engine.process, null);
});

test('MultiPV parsing accepts drops and promotion, ignores debug lines, and replaces stale batches', () => {
  const engine = makeEngine();
  engine.onLine('info depth 1 multipv 1 score cp 20 pv 8h2b+ 3a2b');
  engine.onLine('info depth 1 multipv 2 score cp 0 pv P*5e');
  engine.onLine('info string multipv 3 pv 7g7f');
  engine.onLine('info depth 1 multipv 17 pv 2g2f');
  engine.onLine('info depth 1 multipv 3 pv invalid');
  assert.deepEqual([...engine.candidates.values()].map(({ move }) => move), ['8h2b+', 'P*5e']);
  engine.onLine('info depth 2 multipv 1 score cp 10 pv 7g7f');
  assert.deepEqual([...engine.candidates.values()].map(({ move }) => move), ['7g7f']);
  engine.onLine('info depth 2 multipv 16 score cp 0 pv 2g2f');
  assert.equal(engine.candidates.get(16).move, '2g2f');
});

test('each search reapplies its strength and time limit, including a return to expert', async () => {
  const engine = makeEngine();
  const commands = [];
  const children = [];
  const send = engine.send.bind(engine);
  engine.send = (command) => { commands.push(command); send(command); };
  try {
    for (const difficulty of ['novice', 'easy', 'medium', 'hard', 'expert']) {
      const result = await engine.bestMove([], 3000, undefined, difficulty);
      children.push(engine.process);
      assert.equal(result.difficulty, difficulty);
      assert.ok(['7g7f', '2g2f', '5g5f'].includes(result.bestmove));
      assert.ok(result.info.endsWith(result.bestmove));
      if (difficulty === 'expert') assert.equal(result.bestmove, '7g7f');
    }
    assert.equal(new Set(children.map((child) => child.pid)).size, 5);
    assert.ok(children.slice(0, -1).every((child) => child.exitCode !== null || child.signalCode !== null));
    assert.deepEqual(commands.filter((line) => line.startsWith('go ')),
      ['go movetime 100', 'go movetime 250', 'go movetime 500', 'go movetime 1000', 'go movetime 3000']);
    assert.deepEqual(commands.filter((line) => line.startsWith('setoption name MultiPV ')),
      [16, 8, 4, 2, 1].map((count) => 'setoption name MultiPV value ' + count));
    await engine.bestMove([], 100, undefined, 'hard');
    assert.equal(commands.filter((line) => line.startsWith('go ')).at(-1), 'go movetime 100');
  } finally { await engine.shutdown(); }
});

test('a reused process never carries alternatives over from a previous game', async () => {
  const engine = makeEngine('stale');
  try {
    await engine.bestMove([], 100, undefined, 'novice');
    assert.equal(engine.candidates.size, 3);
    assert.equal((await engine.bestMove([], 100, undefined, 'novice')).bestmove, '7g7f');
    assert.equal(engine.candidates.size, 1);
  } finally { await engine.shutdown(); }
});

test('an unsupported engine fails clearly on lower levels and can still play expert', async () => {
  const engine = makeEngine('unsupported');
  try {
    await assert.rejects(engine.bestMove([], 100, undefined, 'medium'), /does not support difficulty/);
    assert.equal((await engine.bestMove([], 100, undefined, 'expert')).bestmove, '7g7f');
  } finally { await engine.shutdown(); }
});

test('hosted time validation is preserved for every difficulty', async () => {
  const engine = makeEngine('normal', true);
  try {
    for (const difficulty of Object.keys(DIFFICULTIES)) {
      assert.throws(() => engine.bestMove([], 3000, undefined, difficulty), (error) => error.status === 400);
    }
    const result = await engine.bestMove([], 1000, undefined, 'medium');
    assert.equal(result.difficulty, 'medium');
    assert.equal(engine.process, null);
    assert.equal(engine.busy, false);
  } finally { await engine.shutdown(); }
});
