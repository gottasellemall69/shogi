import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { createGame, gameReducer } from '../lib/game.js';
import { gameResult, legalMoves, otherPlayer, toSFEN } from '../lib/shogi.js';

export default function useShogiGame() {
  const [game, dispatch] = useReducer(gameReducer, undefined, createGame);
  const [vsAI, setVsAI] = useState(true);
  const [human, setHuman] = useState('sente');
  const [movetime, setMovetime] = useState(1000);
  const [engine, setEngine] = useState({ ready: false, checking: true, error: null, name: null });
  const [retry, setRetry] = useState(0);
  const [aiError, setAiError] = useState(null);
  const [thinking, setThinking] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const request = useRef(null);
  const position = game.positions[game.cursor];
  const result = useMemo(() => game.ending?.cursor === game.cursor ? game.ending.result
    : gameResult(game.positions.slice(0, game.cursor + 1)), [game.positions, game.cursor, game.ending]);
  const moves = useMemo(() => result ? [] : legalMoves(position), [position, result]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timer = setTimeout(async () => {
      setEngine((previous) => ({ ...previous, checking: true, error: null }));
      try {
        const response = await fetch('/api/engine', { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Engine could not start.');
        if (active) setEngine({ ...data, checking: false, error: null });
      } catch (error) {
        if (active && error.name !== 'AbortError') setEngine({ ready: false, checking: false, error: error.message, name: null });
      }
    }, 150);
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [retry]);

  useEffect(() => {
    if (engine.maxMovetime) setMovetime((value) => Math.min(value, engine.maxMovetime));
  }, [engine.maxMovetime]);

  useEffect(() => {
    setAiError(null);
    if (!vsAI || !engine.ready || engine.checking || game.reviewing || game.aiPaused || result || position.turn === human) return;
    const controller = new AbortController();
    request.current = controller;
    let active = true;
    const timer = setTimeout(async () => {
      setThinking(true);
      try {
        const response = await fetch('/api/engine', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
          body: JSON.stringify({ moves: game.moves.slice(0, game.cursor), movetime }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Engine move failed.');
        if (!active || controller.signal.aborted) return;
        if (data.sfen !== toSFEN(position)) throw new Error('Engine responded for a different position. Please retry.');
        if (data.bestmove === 'resign' || data.bestmove === 'win') {
          dispatch({ type: 'end', revision: game.revision, result: {
            winner: data.bestmove === 'resign' ? otherPlayer(position.turn) : position.turn,
            reason: data.bestmove === 'resign' ? 'engine resignation' : 'entering-king declaration',
          } });
        } else dispatch({ type: 'move', move: data.bestmove, revision: game.revision });
      } catch (error) {
        if (active && error.name !== 'AbortError') setAiError(error.message);
      } finally {
        if (active) setThinking(false);
      }
    }, 150);
    return () => { active = false; clearTimeout(timer); controller.abort(); request.current = null; setThinking(false); };
  }, [game, position, result, vsAI, human, movetime, engine.ready, engine.checking, retry]);

  useEffect(() => {
    if (!playing || !game.reviewing) return;
    if (game.cursor >= game.moves.length) { setPlaying(false); return; }
    const timer = setTimeout(() => dispatch({ type: 'seek', cursor: game.cursor + 1 }), speed);
    return () => clearTimeout(timer);
  }, [playing, game.reviewing, game.cursor, game.moves.length, speed]);

  const act = useCallback((action) => {
    request.current?.abort();
    setAiError(null);
    setPlaying(false);
    dispatch(action);
  }, []);
  const canPlay = !result && !game.reviewing && (!vsAI || position.turn === human);
  return {
    game, position, result, moves, canPlay, vsAI, human, movetime, engine, thinking, aiError, playing, speed,
    play: (move) => { if (canPlay) act({ type: 'move', move }); },
    end: (reason, winner) => { if (canPlay) act({ type: 'end', result: { reason, winner } }); },
    reset: () => act({ type: 'reset' }),
    seek: (cursor, reviewing) => act({ type: 'seek', cursor, reviewing }),
    resume: () => act({ type: 'resume' }),
    toggleAI: () => { act({ type: 'invalidate' }); setVsAI((value) => !value); },
    changeHuman: (value) => { act({ type: 'reset' }); setHuman(value); },
    changeMovetime: (value) => { act({ type: 'invalidate' }); setMovetime(value); },
    retryEngine: () => { request.current?.abort(); setEngine((value) => ({ ...value, ready: false, checking: true })); setRetry((value) => value + 1); },
    setPlaying, setSpeed,
  };
}

