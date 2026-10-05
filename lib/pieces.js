export const pieceNames = {
  P: 'Pawn', 'P+': 'Promoted pawn (tokin)', L: 'Lance', 'L+': 'Promoted lance', N: 'Knight', 'N+': 'Promoted knight',
  S: 'Silver general', 'S+': 'Promoted silver general', G: 'Gold general', B: 'Bishop', 'B+': 'Promoted bishop (horse)',
  R: 'Rook', 'R+': 'Promoted rook (dragon)', K: 'King',
};
const files = { P: 'Pawn', L: 'Lance', N: 'Knight', S: 'SilverGeneral', G: 'GoldGeneral', B: 'Bishop', R: 'Rook', K: 'King' };
export const pieceImage = (piece) => `/images/pieces/${files[piece[0].toUpperCase()]}${piece.endsWith('+') ? '+' : ''}.svg`;
