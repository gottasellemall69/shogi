import { applyMove, createInitialPosition, gameResult } from './shogi.js';

export function createGame(revision = 0) {
  return { positions: [createInitialPosition()], moves: [], cursor: 0, reviewing: false, aiPaused: false, ending: null, revision };
}

export function gameReducer(state, action) {
  switch (action.type) {
    case 'move': {
      if (action.revision !== undefined && action.revision !== state.revision) return state;
      if (state.reviewing || (state.ending?.cursor === state.cursor) || gameResult(state.positions.slice(0, state.cursor + 1))) return state;
      const next = applyMove(state.positions[state.cursor], action.move);
      return { ...state, positions: [...state.positions.slice(0, state.cursor + 1), next],
        moves: [...state.moves.slice(0, state.cursor), action.move], cursor: state.cursor + 1,
        ending: null, aiPaused: false, revision: state.revision + 1 };
    }
    case 'end':
      if (action.revision !== undefined && action.revision !== state.revision) return state;
      return { ...state, positions: state.positions.slice(0, state.cursor + 1), moves: state.moves.slice(0, state.cursor), ending: { cursor: state.cursor, result: action.result }, revision: state.revision + 1 };
    case 'seek':
      return { ...state, cursor: Math.min(state.moves.length, Math.max(0, action.cursor)),
        reviewing: action.reviewing ?? state.reviewing, aiPaused: true, revision: state.revision + 1 };
    case 'resume':
      return { ...state, reviewing: false, aiPaused: false, revision: state.revision + 1 };
    case 'invalidate':
      return { ...state, revision: state.revision + 1 };
    case 'reset': return createGame(state.revision + 1);
    default: return state;
  }
}
