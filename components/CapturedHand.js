import Image from 'next/image';
import { pieceImage, pieceNames } from '../lib/pieces.js';

export default function CapturedHand({ player, pieces, disabled, selected, onSelect }) {
  return <section className="rounded-lg border border-amber-200 bg-white p-3" aria-label={`${player} hand`}>
    <h2 className="mb-2 text-sm font-semibold capitalize">{player} · pieces in hand</h2>
    <div className="flex min-h-12 flex-wrap gap-2">
      {'RBGSNLP'.split('').map((piece) => {
        const count = pieces.filter((value) => value === piece).length;
        return count ? <button key={piece} type="button" disabled={disabled} aria-pressed={selected === piece}
          aria-label={`Drop ${pieceNames[piece]} (${count} available)`} onClick={() => onSelect(piece)}
          className={`flex items-center rounded border px-2 py-1 disabled:opacity-50 ${selected === piece ? 'border-blue-600 bg-blue-100' : 'border-amber-200'}`}>
          <Image unoptimized src={pieceImage(piece)} alt={pieceNames[piece]} width={30} height={36} className="h-9 w-8 object-contain" />
          <span className="text-sm">×{count}</span>
        </button> : null;
      })}
      {!pieces.length && <p className="self-center text-sm text-stone-500">No captured pieces</p>}
    </div>
  </section>;
}
