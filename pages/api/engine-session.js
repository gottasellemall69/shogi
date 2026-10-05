import { EngineError } from '../../lib/engine-policy.js';
import { accessPassword, accessSecret, assertSameOrigin, clearSessionCookie, sameSecret, sessionCookie, throttle } from '../../lib/engine-access.js';
export const config = { api: { bodyParser: { sizeLimit: '2kb' } } };
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (!['POST', 'DELETE'].includes(req.method)) { res.setHeader('Allow', 'POST, DELETE'); return res.status(405).json({ error: 'Method not allowed.' }); }
    assertSameOrigin(req);
    if (req.method === 'DELETE') {
      res.setHeader('Set-Cookie', clearSessionCookie());
      return res.status(200).json({ ok: true });
    }
    if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) throw new EngineError('Send application/json.', 415);
    throttle('login', 10);
    const secret = accessSecret();
    if (secret && !sameSecret(req.body?.secret, accessPassword())) throw new EngineError('Incorrect password.', 401);
    if (secret) res.setHeader('Set-Cookie', sessionCookie(secret));
    return res.status(200).json({ ok: true });
  } catch (error) {
    if (error.status === 429) res.setHeader('Retry-After', '60');
    return res.status(error instanceof EngineError ? error.status : 500).json({ error: error instanceof EngineError ? error.message : 'Sign-in failed.' });
  }
}
