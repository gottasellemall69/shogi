export const pieceNames = {
  P: 'Pawn', 'P+': 'Tokin', L: 'Lance', 'L+': 'Promoted lance', N: 'Knight', 'N+': 'Promoted knight',
  S: 'Silver general', 'S+': 'Promoted silver', G: 'Gold general', B: 'Bishop', 'B+': 'Horse',
  R: 'Rook', 'R+': 'Dragon', K: 'King',
};
const files = { P: 'Pawn', L: 'Lance', N: 'Knight', S: 'SilverGeneral', G: 'GoldGeneral', B: 'Bishop', R: 'Rook', K: 'King' };
export const pieceImage = (piece) => `/images/pieces/${files[piece[0].toUpperCase()]}${piece.endsWith('+') ? '+' : ''}.svg`;
