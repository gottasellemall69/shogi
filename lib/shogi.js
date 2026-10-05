// Coordinates are [row, column]. Sente (uppercase) starts at the bottom.
export const INITIAL_SFEN = 'lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1';
export const otherPlayer = (player) => player === 'sente' ? 'gote' : 'sente';
export const ownerOf = (piece) => piece === ' ' ? null : piece === piece.toUpperCase() ? 'sente' : 'gote';
const inside = (r, c) => r >= 0 && r < 9 && c >= 0 && c < 9;
const orthogonal = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const diagonal = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const ownedPiece = (piece, player) => player === 'sente' ? piece.toUpperCase() : piece.toLowerCase();

export function createInitialPosition() {
  return {
    board: ['lnsgkgsnl', ' r     b ', 'ppppppppp', '         ', '         ', '         ', 'PPPPPPPPP', ' B     R ', 'LNSGKGSNL'].map((rank) => [...rank]),
    hands: { sente: [], gote: [] }, turn: 'sente', ply: 1, lastMove: null,
  };
}

export function toSFEN(position) {
  const ranks = position.board.map((rank) => {
    let output = '', empty = 0;
    for (const piece of rank) {
      if (piece === ' ') { empty++; continue; }
      if (empty) { output += empty; empty = 0; }
      output += piece.endsWith('+') ? `+${piece[0]}` : piece;
    }
    return output + (empty || '');
  });
  let hand = '';
  for (const player of ['sente', 'gote']) {
    for (const piece of 'RBGSNLP') {
      const count = position.hands[player].filter((p) => p === piece).length;
      if (count) hand += `${count > 1 ? count : ''}${ownedPiece(piece, player)}`;
    }
  }
  return `${ranks.join('/')} ${position.turn === 'sente' ? 'b' : 'w'} ${hand || '-'} ${position.ply}`;
}

export const positionKey = (position) => toSFEN(position).split(' ').slice(0, 3).join(' ');
export const squareToUSI = ([row, col]) => `${9 - col}${String.fromCharCode(97 + row)}`;
const squareFromUSI = (file, rank) => [rank.charCodeAt(0) - 97, 9 - Number(file)];
export function parseUSIMove(value) {
  if (typeof value !== 'string') throw new Error('Move must be a USI string.');
  let match = /^([1-9])([a-i])([1-9])([a-i])(\+?)$/.exec(value);
  if (match) return { from: squareFromUSI(match[1], match[2]), to: squareFromUSI(match[3], match[4]), promote: match[5] === '+' };
  match = /^([PLNSGBR])\*([1-9])([a-i])$/.exec(value);
  if (match) return { drop: match[1], to: squareFromUSI(match[2], match[3]) };
  throw new Error(`Invalid USI move: ${value.slice(0, 16)}`);
}
export const moveToUSI = (move) => move.drop
  ? `${move.drop}*${squareToUSI(move.to)}`
  : `${squareToUSI(move.from)}${squareToUSI(move.to)}${move.promote ? '+' : ''}`;

// Attack generation does not test pins, avoiding recursive king checks.
export function attacksFrom(board, row, col) {
  const piece = board[row][col];
  if (piece === ' ') return [];
  const player = ownerOf(piece), forward = player === 'sente' ? -1 : 1;
  const base = piece[0].toUpperCase(), promoted = piece.endsWith('+');
  const gold = [[forward, -1], [forward, 0], [forward, 1], [0, -1], [0, 1], [-forward, 0]];
  let steps = [], rays = [];
  if (base === 'K') steps = [...orthogonal, ...diagonal];
  else if (base === 'G' || (promoted && 'PLNS'.includes(base))) steps = gold;
  else if (base === 'P') steps = [[forward, 0]];
  else if (base === 'N') steps = [[forward * 2, -1], [forward * 2, 1]];
  else if (base === 'S') steps = [[forward, 0], ...diagonal];
  else if (base === 'L') rays = [[forward, 0]];
  else if (base === 'B') { rays = diagonal; if (promoted) steps = orthogonal; }
  else if (base === 'R') { rays = orthogonal; if (promoted) steps = diagonal; }
  const targets = steps.map(([dr, dc]) => [row + dr, col + dc]).filter(([r, c]) => inside(r, c));
  for (const [dr, dc] of rays) {
    for (let r = row + dr, c = col + dc; inside(r, c); r += dr, c += dc) {
      targets.push([r, c]);
      if (board[r][c] !== ' ') break;
    }
  }
  return targets;
}

export function isInCheck(position, player = position.turn) {
  const king = ownedPiece('K', player);
  let square;
  position.board.forEach((rank, r) => rank.forEach((piece, c) => { if (piece === king) square = [r, c]; }));
  if (!square) return true;
  return position.board.some((rank, r) => rank.some((piece, c) => ownerOf(piece) === otherPlayer(player)
    && attacksFrom(position.board, r, c).some(([tr, tc]) => tr === square[0] && tc === square[1])));
}

function applyUnchecked(position, move) {
  const board = position.board.map((rank) => [...rank]);
  const hands = { sente: [...position.hands.sente], gote: [...position.hands.gote] };
  const [r, c] = move.to;
  if (move.drop) {
    hands[position.turn].splice(hands[position.turn].indexOf(move.drop), 1);
    board[r][c] = ownedPiece(move.drop, position.turn);
  } else {
    const piece = board[move.from[0]][move.from[1]];
    if (board[r][c] !== ' ') hands[position.turn].push(board[r][c][0].toUpperCase());
    board[move.from[0]][move.from[1]] = ' ';
    board[r][c] = piece + (move.promote ? '+' : '');
  }
  return { board, hands, turn: otherPlayer(position.turn), ply: position.ply + 1, lastMove: move };
}

function deadRank(piece, row, player) {
  const distance = player === 'sente' ? row : 8 - row;
  return ('PL'.includes(piece) && distance === 0) || (piece === 'N' && distance < 2);
}

export function legalMoves(position, { boardOnly = false, firstOnly = false } = {}) {
  const moves = [], { board, turn } = position;
  const add = (move) => {
    if (isInCheck(applyUnchecked(position, move), turn)) return false;
    moves.push(move);
    return firstOnly;
  };
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
    const piece = board[r][c];
    if (ownerOf(piece) !== turn) continue;
    for (const [tr, tc] of attacksFrom(board, r, c)) {
      if (ownerOf(board[tr][tc]) === turn || board[tr][tc].toUpperCase() === 'K') continue;
      const base = piece[0].toUpperCase();
      const zone = (row) => turn === 'sente' ? row <= 2 : row >= 6;
      const canPromote = !piece.endsWith('+') && 'PLNSBR'.includes(base) && (zone(r) || zone(tr));
      const forced = !piece.endsWith('+') && deadRank(base, tr, turn);
      const move = { from: [r, c], to: [tr, tc], promote: false };
      if (!forced && add(move)) return moves;
      if (canPromote && add({ ...move, promote: true })) return moves;
    }
  }
  if (boardOnly) return moves;
  for (const drop of new Set(position.hands[turn])) {
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
      if (board[r][c] !== ' ' || deadRank(drop, r, turn)) continue;
      if (drop === 'P' && board.some((rank) => rank[c] === ownedPiece('P', turn))) continue;
      const move = { drop, to: [r, c] }, next = applyUnchecked(position, move);
      if (isInCheck(next, turn)) continue;
      // A checking pawn is adjacent to the king: a drop cannot block or capture it.
      const forward = turn === 'sente' ? -1 : 1;
      if (drop === 'P' && board[r + forward]?.[c] === ownedPiece('K', next.turn)
          && legalMoves(next, { boardOnly: true, firstOnly: true }).length === 0) continue;
      moves.push(move);
      if (firstOnly) return moves;
    }
  }
  return moves;
}

export function applyMove(position, value) {
  const usi = typeof value === 'string' ? value : moveToUSI(value);
  parseUSIMove(usi);
  const move = legalMoves(position).find((candidate) => moveToUSI(candidate) === usi);
  if (!move) throw new Error(`Illegal move: ${usi}`);
  return applyUnchecked(position, move);
}

export function canDeclareWin(position) {
  const { turn, board } = position;
  if (isInCheck(position)) return false;
  const camp = (r) => turn === 'sente' ? r <= 2 : r >= 6;
  let kingInCamp = false, count = 0, points = 0;
  board.forEach((rank, r) => rank.forEach((piece) => {
    if (ownerOf(piece) !== turn || !camp(r)) return;
    if (piece.toUpperCase() === 'K') kingInCamp = true;
    else { count++; points += 'BR'.includes(piece[0].toUpperCase()) ? 5 : 1; }
  }));
  for (const piece of position.hands[turn]) points += 'BR'.includes(piece) ? 5 : 1;
  return kingInCamp && count >= 10 && points >= (turn === 'sente' ? 28 : 27);
}

export function gameResult(positions) {
  const current = positions.at(-1), key = positionKey(current);
  const occurrences = positions.flatMap((position, i) => positionKey(position) === key ? [i] : []);
  if (occurrences.length >= 4) {
    const cycle = positions.slice(occurrences.at(-4) + 1);
    for (const player of ['sente', 'gote']) {
      const checks = cycle.filter((position) => position.turn === otherPlayer(player));
      if (checks.length && checks.every((position) => isInCheck(position))) {
        return { winner: otherPlayer(player), reason: 'perpetual check' };
      }
    }
    return { winner: null, reason: 'fourfold repetition' };
  }
  if (!legalMoves(current, { firstOnly: true }).length) {
    return { winner: otherPlayer(current.turn), reason: isInCheck(current) ? 'checkmate' : 'no legal moves' };
  }
  return null;
}

export function replayMoves(moves) {
  if (!Array.isArray(moves) || moves.length > 1024) throw new Error('Expected at most 1024 moves.');
  const positions = [createInitialPosition()];
  for (const move of moves) {
    if (gameResult(positions)) throw new Error('Moves continue after the game ended.');
    positions.push(applyMove(positions.at(-1), move));
  }
  return positions;
}
