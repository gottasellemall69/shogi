import { EngineError } from '../../lib/engine.js';
import { accessSecret, assertSameOrigin, sameSecret, sessionCookie, throttle } from '../../lib/engine-access.js';
export const config = { api: { bodyParser: { sizeLimit: '2kb' } } };
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed.' }); }
    assertSameOrigin(req);
    if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) throw new EngineError('Send application/json.', 415);
    throttle('login', 10);
    const secret = accessSecret();
    if (secret && !sameSecret(req.body?.secret, secret)) throw new EngineError('Incorrect engine access key.', 401);
    if (secret) res.setHeader('Set-Cookie', sessionCookie(secret));
    return res.status(200).json({ ok: true });
  } catch (error) {
    if (error.status === 429) res.setHeader('Retry-After', '60');
    return res.status(error instanceof EngineError ? error.status : 500).json({ error: error instanceof EngineError ? error.message : 'Engine sign-in failed.' });
  }
}
