import { EngineError, engineConfig, getEngine, maxThinkingTime, requestScoped } from '../../lib/engine.js';
import { accessSecret, assertSameOrigin, hasAccess, throttle } from '../../lib/engine-access.js';
import { applyMove, canDeclareWin, gameResult, parseUSIMove, replayMoves, toSFEN } from '../../lib/shogi.js';

export const config = { api: { bodyParser: { sizeLimit: '16kb' } } };

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  const controller = new AbortController();
  const disconnect = () => { if (!res.writableEnded) controller.abort(); };
  res.on('close', disconnect);
  const deadline = setTimeout(() => controller.abort(), requestScoped() ? 30000 : 95000);
  let status = 200, response;
  try {
    assertSameOrigin(req);
    const secret = accessSecret();
    if (!hasAccess(req, secret)) {
      status = req.method === 'GET' ? 200 : 401;
      response = { ready: false, authRequired: true, maxMovetime: maxThinkingTime(), error: req.method === 'POST' ? 'Unlock the engine to play against AI.' : null };
    } else if (req.method === 'GET') {
      // Hosted health checks must not load a neural model on every page visit.
      // The build smoke test verifies the binary/model; each POST handshakes again.
      if (requestScoped()) {
        engineConfig();
        response = { ready: true, name: 'FukauraOu ORT_CPU-DL 9.40 (CPU)', maxMovetime: maxThinkingTime() };
      } else response = { ...await getEngine().status(controller.signal), maxMovetime: maxThinkingTime() };
    } else {
      if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) throw new EngineError('Send application/json.', 415);
      if (secret || requestScoped()) throttle('search', 20);
      const { moves, movetime = 1000 } = req.body || {};
      if (!Number.isInteger(movetime) || movetime < 100 || movetime > maxThinkingTime()) throw new EngineError(`Thinking time must be between 100 and ${maxThinkingTime()} milliseconds.`, 400);
      let positions;
      try {
        if (!Array.isArray(moves) || moves.length > 1024) throw new Error('Expected at most 1024 moves.');
        moves.forEach(parseUSIMove);
        positions = replayMoves(moves);
        if (gameResult(positions)) throw new Error('The game is already over.');
      } catch (error) { throw new EngineError(error.message, 400); }
      const position = positions.at(-1);
      const result = await getEngine().bestMove(moves, movetime, controller.signal);
      try {
        if (result.bestmove === 'win') {
          if (!canDeclareWin(position)) throw new Error('Invalid declaration.');
        } else if (result.bestmove !== 'resign') applyMove(position, result.bestmove);
      } catch { throw new EngineError('The engine returned an illegal move. Check the engine/model configuration.', 502); }
      response = { ...result, sfen: toSFEN(position) };
    }
  } catch (error) {
    status = error instanceof EngineError ? error.status : 500;
    response = { error: error instanceof EngineError ? error.message : 'Unexpected engine service error.' };
  } finally {
    clearTimeout(deadline);
    res.off('close', disconnect);
  }
  if (!res.destroyed && !res.writableEnded) {
    if (status === 429) res.setHeader('Retry-After', '60');
    // A deadline cancellation still needs a response when the browser is connected.
    res.status(status === 499 ? 504 : status).json(response);
  }
}
