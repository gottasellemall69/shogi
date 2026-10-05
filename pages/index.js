import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
import ShogiBoard from '../components/ShogiBoard';
import CapturedHand from '../components/CapturedHand';
import EngineAccess from '../components/EngineAccess';
import useShogiGame from '../hooks/useShogiGame';
import { canDeclareWin, gameResult, isInCheck, moveToUSI, otherPlayer, ownerOf, toSFEN } from '../lib/shogi';

const button = 'rounded bg-stone-800 px-3 py-2 text-sm font-semibold text-white hover:bg-stone-600 disabled:cursor-not-allowed disabled:opacity-40';

function download(content, type, filename) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ShogiPage() {
  const session = useShogiGame();
  const { game, position, result, canPlay, engine } = session;
  const [selection, setSelection] = useState(null);
  const [promotion, setPromotion] = useState(null);
  useEffect(() => { setSelection(null); setPromotion(null); }, [game.revision]);
  const targets = useMemo(() => session.moves.filter((move) => selection?.drop ? move.drop === selection.drop
    : selection?.from && move.from?.[0] === selection.from[0] && move.from?.[1] === selection.from[1]), [session.moves, selection]);

  function onSquare(row, col) {
    if (!canPlay || promotion) return;
    const options = targets.filter((move) => move.to[0] === row && move.to[1] === col);
    if (options.length > 1) { setPromotion(options); return; }
    if (options.length === 1) { session.play(moveToUSI(options[0])); return; }
    if (ownerOf(position.board[row][col]) === position.turn) {
      setSelection(selection?.from?.[0] === row && selection?.from?.[1] === col ? null : { from: [row, col] });
    } else setSelection(null);
  }

  function exportGame(format) {
    if (format === 'json') download(JSON.stringify({ version: 1, initialPosition: 'startpos', moves: game.moves,
      positions: game.positions.map(toSFEN), result: game.ending?.result || gameResult(game.positions) }, null, 2), 'application/json', 'shogi-replay.json');
    else download(['Move,Player,USI,SFEN', ...game.moves.map((move, i) =>
      `${i + 1},${game.positions[i].turn},${move},${toSFEN(game.positions[i + 1])}`)].join('\r\n'), 'text/csv;charset=utf-8', 'shogi-replay.csv');
  }

  return <>
    <Head><title>Shogi · YaneuraOu</title><meta name="description" content="Play Shogi against YaneuraOu or another player, and review your games." /></Head>
    <div className="mx-auto max-w-5xl px-3 py-5 text-stone-900 sm:px-6">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-3xl font-bold">Shogi</h1><p className="text-sm text-stone-600">YaneuraOu v9.40 · Sente moves first</p></div>
        <button className={button} onClick={session.toggleAI}>{session.vsAI ? 'Switch to Player vs Player' : 'Switch to Play vs AI'}</button>
      </header>
      <div className="grid gap-5 md:grid-cols-[minmax(0,620px)_minmax(220px,1fr)]">
        <div className="space-y-3">
          <CapturedHand player="gote" pieces={position.hands.gote} disabled={!canPlay || position.turn !== 'gote' || !!promotion}
            selected={position.turn === 'gote' ? selection?.drop : null} onSelect={(drop) => setSelection({ drop })} />
          <div className="flex flex-wrap items-center justify-between gap-2" aria-live="polite">
            <p className="font-semibold capitalize">{result ? `${result.winner || 'Draw'}${result.winner ? ' wins' : ''} — ${result.reason}`
              : `${position.turn} to move${isInCheck(position) ? ' · in check' : ''}`}</p>
            <p className="text-sm text-stone-600">Move {game.cursor}{position.lastMove ? ` · ${moveToUSI(position.lastMove)}` : ''}</p>
          </div>
          <ShogiBoard position={position} targets={targets} selected={selection} onSquare={onSquare} disabled={!canPlay || !!promotion} />
          {promotion && <section className="rounded border border-blue-300 bg-blue-50 p-3" role="group" aria-label="Promotion choice">
            <p className="mb-2 font-semibold">Promote this piece?</p>
            <div className="flex gap-2">{[true, false].map((promote) => <button key={String(promote)} className={button}
              onClick={() => session.play(moveToUSI(promotion.find((move) => move.promote === promote)))}>{promote ? 'Promote' : 'Keep unpromoted'}</button>)}
              <button className={button} onClick={() => setPromotion(null)}>Cancel</button></div>
          </section>}
          <CapturedHand player="sente" pieces={position.hands.sente} disabled={!canPlay || position.turn !== 'sente' || !!promotion}
            selected={position.turn === 'sente' ? selection?.drop : null} onSelect={(drop) => setSelection({ drop })} />
          <div className="flex flex-wrap gap-2">
            <button className={button} disabled={!game.cursor} onClick={() => session.seek(game.cursor - 1)}>Undo</button>
            <button className={button} disabled={game.cursor === game.moves.length} onClick={() => session.seek(game.cursor + 1)}>Redo</button>
            <button className={button} onClick={session.reset}>Reset</button>
            <button className={button} disabled={!canPlay} onClick={() => session.end('resignation', otherPlayer(position.turn))}>Resign</button>
            {canPlay && canDeclareWin(position) && <button className={button} onClick={() => session.end('entering-king declaration', position.turn)}>Declare win</button>}
          </div>
        </div>
        <aside className="space-y-4">
          <section className="space-y-3 rounded-lg border border-stone-200 bg-white p-4">
            <h2 className="font-bold">Engine</h2>
            <p className="break-words text-sm" role="status">{engine.checking ? 'Starting YaneuraOu…' : engine.ready ? engine.name : engine.authRequired ? 'Engine locked' : 'Engine unavailable'}</p>
            {engine.authRequired && <EngineAccess onUnlocked={session.retryEngine} />}
            {(engine.error || session.aiError) && <div role="alert" className="space-y-2 text-sm text-red-700">
              <p>{engine.error || session.aiError}</p><button className={button} onClick={session.retryEngine}>Retry engine</button>
            </div>}
            {session.thinking && <p role="status" className="text-sm font-semibold text-blue-700">YaneuraOu is thinking…</p>}
            <label className="block text-sm">Play as (starts a new game)
              <select value={session.human} onChange={(event) => session.changeHuman(event.target.value)} className="mt-1 w-full rounded border p-2">
                <option value="sente">Sente · first</option><option value="gote">Gote · second</option>
              </select>
            </label>
            <label className="block text-sm">Thinking time
              <select value={session.movetime} onChange={(event) => session.changeMovetime(Number(event.target.value))} className="mt-1 w-full rounded border p-2">
                {[250, 1000, 3000, 10000].filter((time) => time <= (engine.maxMovetime || 10000)).map((time) => <option key={time} value={time}>{time / 1000} {time === 1000 ? 'second' : 'seconds'}</option>)}
              </select>
            </label>
            {game.aiPaused && !game.reviewing && !result && session.vsAI && <div className="space-y-2 text-sm"><p>AI paused while navigating history.</p><button className={button} onClick={session.resume}>Resume game</button></div>}
          </section>
          <section className="space-y-3 rounded-lg border border-stone-200 bg-white p-4">
            <h2 className="font-bold">Game review</h2>
            <button className={button} disabled={!game.moves.length} onClick={() => game.reviewing ? session.resume() : session.seek(0, true)}>{game.reviewing ? 'Resume from here' : 'Review game'}</button>
            {game.reviewing && <>
              <label className="block text-sm">Move {game.cursor} / {game.moves.length}<input aria-label="Review move" type="range" min={0} max={game.moves.length} value={game.cursor}
                onChange={(event) => session.seek(Number(event.target.value), true)} className="mt-2 w-full" /></label>
              <div className="flex gap-2"><button className={button} disabled={!game.cursor} onClick={() => session.seek(game.cursor - 1, true)}>Back</button>
                <button className={button} disabled={game.cursor >= game.moves.length} onClick={() => session.setPlaying(!session.playing)}>{session.playing ? 'Pause' : 'Play'}</button>
                <button className={button} disabled={game.cursor >= game.moves.length} onClick={() => session.seek(game.cursor + 1, true)}>Next</button></div>
              <label className="block text-sm">Replay speed<select className="ml-2 rounded border p-1" value={session.speed} onChange={(event) => session.setSpeed(Number(event.target.value))}>
                <option value={500}>Fast</option><option value={1000}>Normal</option><option value={2000}>Slow</option></select></label>
            </>}
            <div className="flex gap-2"><button className={button} onClick={() => exportGame('json')}>Export JSON</button><button className={button} onClick={() => exportGame('csv')}>Export CSV</button></div>
            <ol className="max-h-56 overflow-auto text-sm" aria-label="Move history">{game.moves.map((move, i) => <li key={`${i}-${move}`}>
              <button onClick={() => session.seek(i + 1, true)} aria-current={game.cursor === i + 1 ? 'step' : undefined}
                className={`w-full rounded px-2 py-1 text-left ${game.cursor === i + 1 ? 'bg-amber-100 font-bold' : 'hover:bg-stone-100'}`}>{i + 1}. {game.positions[i].turn} {move}</button>
            </li>)}</ol>
          </section>
          <p className="text-xs leading-relaxed text-stone-600">Select a piece, then a green square. Select a captured piece to drop it. Sente is at the bottom; Gote is at the top. Undo and redo move one turn at a time.</p>
        </aside>
      </div>
    </div>
  </>;
}


// A fresh CSP nonce is generated by _document for every HTML request.
export function getServerSideProps() { return { props: {} }; }
