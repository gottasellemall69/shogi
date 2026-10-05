import Image from 'next/image';
import { pieceImage, pieceNames } from '../lib/pieces.js';
import { PieceButton } from './PieceTooltip';

export default function CapturedHand({ player, pieces, disabled, selected, onSelect }) {
  return <section className="captured-hand" aria-label={`${player} hand`}>
    <h2 className="font-semibold capitalize">{player} · pieces in hand</h2>
    <div className="hand-slots">
      {'RBGSNLP'.split('').map((piece) => {
        const count = pieces.filter((value) => value === piece).length;
        return count ? <PieceButton key={piece} name={pieceNames[piece]} wrapperClassName="hand-slot" type="button" disabled={disabled} aria-pressed={selected === piece}
          aria-label={`Drop ${pieceNames[piece]} (${count} available)`} onClick={() => onSelect(piece)}
          className={`hand-piece ${selected === piece ? 'border-blue-600 bg-blue-100' : 'border-amber-200 bg-white'}`}>
          <Image unoptimized src={pieceImage(piece)} alt={pieceNames[piece]} width={56} height={56} className="hand-piece-image" />
          <span className="hand-count" aria-hidden="true">{count}</span>
        </PieceButton> : <div key={piece} className="hand-slot hand-slot-empty" aria-hidden="true" />;
      })}
      {!pieces.length && <p className="empty-hand">No captured pieces</p>}
    </div>
  </section>;
}
