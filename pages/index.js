import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
import ShogiBoard from '../components/ShogiBoard';
import CapturedHand from '../components/CapturedHand';
import SignOutButton from '../components/SignOutButton';
import GameViewport from '../components/GameViewport';
import { PieceTooltip, PieceTooltipProvider } from '../components/PieceTooltip';
import { pageAccess } from '../lib/engine-access.js';
import useShogiGame from '../hooks/useShogiGame';
import { canDeclareWin, gameResult, isInCheck, moveToUSI, otherPlayer, ownerOf, toSFEN } from '../lib/shogi';

const button = 'game-button';
const historyPageSize = 6;

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

export default function ShogiPage({ passwordProtected }) {
  const session = useShogiGame();
  const { game, position, result, canPlay, engine } = session;
  const [selection, setSelection] = useState(null);
  const [promotion, setPromotion] = useState(null);
  const [historyPage, setHistoryPage] = useState(0);
  useEffect(() => { setHistoryPage(Math.floor(Math.max(0, game.cursor - 1) / historyPageSize)); }, [game.cursor, game.moves.length]);
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
    <PieceTooltipProvider><GameViewport>
      <header className="game-header">
        <div><h1 className="text-2xl font-bold">Shogi</h1><p className="game-subtitle text-stone-600">YaneuraOu v9.40 · Sente moves first</p></div>
        <div className="flex flex-wrap gap-2"><button className={button} onClick={session.toggleAI}>{session.vsAI ? 'Switch to Player vs Player' : 'Switch to Play vs AI'}</button>
          {passwordProtected && <SignOutButton />}
        </div>
      </header>
      <div className="game-columns">
        <div className="play-column">
          <CapturedHand player="gote" pieces={position.hands.gote} disabled={!canPlay || position.turn !== 'gote' || !!promotion}
            selected={position.turn === 'gote' ? selection?.drop : null} onSelect={(drop) => setSelection({ drop })} />
          <div className="turn-status" aria-live="polite">
            <p className="font-semibold capitalize">{result ? `${result.winner || 'Draw'}${result.winner ? ' wins' : ''} — ${result.reason}`
              : `${position.turn} to move${isInCheck(position) ? ' · in check' : ''}`}</p>
            <p className="text-sm text-stone-600">Move {game.cursor}{position.lastMove ? ` · ${moveToUSI(position.lastMove)}` : ''}</p>
          </div>
          <PieceTooltip />
          <ShogiBoard position={position} targets={targets} selected={selection} onSquare={onSquare} disabled={!canPlay || !!promotion} />
          <div className="promotion-slot">
            {promotion ? <section className="promotion-choice" role="group" aria-label="Promotion choice">
              <p className="font-semibold">Promote this piece?</p>
              <div className="button-row">{[true, false].map((promote) => <button key={String(promote)} className={button}
                onClick={() => session.play(moveToUSI(promotion.find((move) => move.promote === promote)))}>{promote ? 'Promote' : 'Keep unpromoted'}</button>)}
                <button className={button} onClick={() => setPromotion(null)}>Cancel</button></div>
            </section> : <p className="play-instructions">Select a piece, then a green square. Select a captured piece to drop it.<br />Sente is at the bottom; Gote is at the top.</p>}
          </div>
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
        <aside className="game-sidebar">
          <section className="game-panel">
            <h2 className="font-bold">Engine</h2>
            <p className="engine-status break-words text-sm" role="status">{engine.checking ? 'Starting YaneuraOu…' : engine.ready ? engine.name : 'Engine unavailable'}</p>
            {(engine.error || session.aiError) && <div role="alert" className="space-y-2 text-sm text-red-700">
              <p>{engine.error || session.aiError}</p><button className={button} onClick={session.retryEngine}>Retry engine</button>
            </div>}
            {session.thinking && <p role="status" className="text-sm font-semibold text-blue-700">YaneuraOu is thinking…</p>}
            <div className="engine-settings"><label className="block text-sm">Play as (starts a new game)
              <select value={session.human} onChange={(event) => session.changeHuman(event.target.value)} className="mt-1 w-full rounded border p-1">
                <option value="sente">Sente · first</option><option value="gote">Gote · second</option>
              </select>
            </label>
            <label className="block text-sm">Thinking time
              <select value={session.movetime} onChange={(event) => session.changeMovetime(Number(event.target.value))} className="mt-1 w-full rounded border p-1">
                {[250, 1000, 3000, 10000].filter((time) => time <= (engine.maxMovetime || 10000)).map((time) => <option key={time} value={time}>{time / 1000} {time === 1000 ? 'second' : 'seconds'}</option>)}
              </select>
            </label>
            </div>
            {game.aiPaused && !game.reviewing && !result && session.vsAI && <div className="space-y-2 text-sm"><p>AI paused while navigating history.</p><button className={button} onClick={session.resume}>Resume game</button></div>}
          </section>
          <section className="game-panel">
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
            <ol className="move-history" aria-label="Move history">{game.moves.slice(historyPage * historyPageSize, (historyPage + 1) * historyPageSize).map((move, index) => {
              const i = historyPage * historyPageSize + index;
              return <li key={i}>
                <button onClick={() => session.seek(i + 1, true)} aria-current={game.cursor === i + 1 ? 'step' : undefined}
                  aria-label={`Move ${i + 1}: ${game.positions[i].turn} ${move}`}
                  className={`history-move ${game.cursor === i + 1 ? 'bg-amber-100 font-bold' : 'hover:bg-stone-100'}`}>{i + 1}. {move}</button>
              </li>; })}</ol>
            <nav className="history-pages" aria-label="History pages">
              <button className={button} disabled={historyPage === 0} onClick={() => setHistoryPage((value) => value - 1)}>Earlier</button>
              <span>{historyPage + 1} / {Math.max(1, Math.ceil(game.moves.length / historyPageSize))}</span>
              <button className={button} disabled={(historyPage + 1) * historyPageSize >= game.moves.length} onClick={() => setHistoryPage((value) => value + 1)}>Later</button>
            </nav>
          </section>
        </aside>
      </div>
    </GameViewport></PieceTooltipProvider>
  </>;
}


// A fresh CSP nonce is generated by _document for every HTML request.
export function getServerSideProps(context) { return pageAccess(context); }
