import { EngineError } from './engine-policy.js';

export const DEFAULT_DIFFICULTY = 'medium';

// Relative playing strengths, not calibrated ratings. Time is an upper bound;
// lower levels also sample weaker ranked moves from the engine's MultiPV output.
export const DIFFICULTIES = Object.freeze({
  novice: { label: 'Novice', description: 'Our gentlest opponent, with quick searches and frequent mistakes.', maxMovetime: 100, weights: Array(16).fill(1) },
  easy: { label: 'Easy', description: 'Short searches and varied moves, with more mistakes.', maxMovetime: 250, weights: [2, 2, 2, 2, 1, 1, 1, 1] },
  medium: { label: 'Medium', description: 'A balanced opponent that sometimes overlooks stronger moves.', maxMovetime: 500, weights: [6, 3, 2, 1] },
  hard: { label: 'Hard', description: 'Usually plays its strongest move, with occasional mistakes.', maxMovetime: 1000, weights: [9, 1] },
  expert: { label: 'Expert', description: "Always plays the engine's strongest move within the thinking time limit.", maxMovetime: 10000, weights: [1] },
});

export const MAX_CANDIDATES = Math.max(...Object.values(DIFFICULTIES).map(({ weights }) => weights.length));

export function difficultyProfile(difficulty) {
  if (typeof difficulty !== 'string' || !Object.hasOwn(DIFFICULTIES, difficulty)) {
    throw new EngineError('Difficulty must be novice, easy, medium, hard, or expert.', 400);
  }
  return DIFFICULTIES[difficulty];
}

export function chooseEngineMove(bestmove, candidates, difficulty, random = Math.random) {
  const { weights } = difficultyProfile(difficulty);
  const strongest = { move: bestmove, info: candidates.find((candidate) => candidate.move === bestmove)?.info ?? null };
  if (difficulty === 'expert' || bestmove === 'resign' || bestmove === 'win') return strongest;

  // The final bestmove is authoritative. A mate shortcut can replace the last PV;
  // in that case do not choose from an outdated set of alternatives.
  if (!candidates.some((candidate) => candidate.rank === 1 && candidate.move === bestmove)) return strongest;
  const seen = new Set([bestmove]);
  const choices = [{ ...strongest, weight: weights[0] }];
  for (const candidate of [...candidates].sort((a, b) => a.rank - b.rank)) {
    if (candidate.rank < 2 || candidate.rank > weights.length || seen.has(candidate.move)) continue;
    seen.add(candidate.move);
    choices.push({ ...candidate, weight: weights[candidate.rank - 1] });
  }
  let remaining = random() * choices.reduce((sum, candidate) => sum + candidate.weight, 0);
  return choices.find((candidate) => (remaining -= candidate.weight) < 0) ?? strongest;
}
