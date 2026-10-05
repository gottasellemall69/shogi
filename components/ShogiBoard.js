import Image from 'next/image';
import { ownerOf, squareToUSI } from '../lib/shogi.js';
import { pieceImage, pieceNames } from '../lib/pieces.js';

export default function ShogiBoard({ position, targets, selected, onSquare, disabled }) {
  return <div className="grid aspect-square w-full grid-cols-9 overflow-hidden rounded border-2 border-amber-950 bg-amber-100" aria-label="Shogi board">
    {position.board.flatMap((rank, row) => rank.map((piece, col) => {
      const square = squareToUSI([row, col]);
      const highlighted = targets.some((move) => move.to[0] === row && move.to[1] === col);
      const chosen = selected?.from?.[0] === row && selected?.from?.[1] === col;
      const last = position.lastMove?.to[0] === row && position.lastMove?.to[1] === col;
      const occupied = piece !== ' ';
      return <button key={square} type="button" data-square={square} disabled={disabled}
        aria-label={`${square}${occupied ? ` ${ownerOf(piece)} ${pieceNames[piece.toUpperCase()]}` : ' empty'}${highlighted ? ' legal destination' : ''}`}
        aria-pressed={chosen} onClick={() => onSquare(row, col)}
        className={`relative flex aspect-square min-w-0 items-center justify-center border border-amber-900/40 p-0 focus:z-10 focus:outline focus:outline-2 focus:outline-blue-700 ${chosen ? 'bg-blue-200' : highlighted ? 'bg-lime-200' : last ? 'bg-amber-300' : 'hover:bg-amber-200'}`}>
        {occupied && <Image unoptimized src={pieceImage(piece)} alt={pieceNames[piece.toUpperCase()]} width={56} height={56}
          className={`h-[85%] w-[85%] object-contain ${ownerOf(piece) === 'gote' ? 'rotate-180' : ''}`} />}
        {highlighted && !occupied && <span className="h-2 w-2 rounded-full bg-green-700" />}
      </button>;
    }))}
  </div>;
}
