import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { EngineError, requestScoped } from './engine-policy.js';

const cookieName = 'shogi_session';
const lifetime = 8 * 60 * 60;
export function accessSecret() {
  const secret = process.env.ENGINE_ACCESS_SECRET;
  const password = process.env.SITE_PASSWORD;
  if (password !== undefined && (password.length < 12 || password.length > 512)) {
    throw new EngineError('Site password is not configured. Set SITE_PASSWORD to 12-512 characters.');
  }
  if (secret && secret.length >= 32 && secret.length <= 512) {
    // Bind sessions to both credentials so changing either revokes old cookies.
    return password === undefined ? secret : createHmac('sha256', secret).update('shogi-site-password:').update(password).digest('base64url');
  }
  if (process.env.NODE_ENV === 'production' || requestScoped() || secret || password !== undefined) {
    throw new EngineError('Site sessions are not configured. Set ENGINE_ACCESS_SECRET to 32-512 random characters.');
  }
  return null;
}
export function accessPassword() {
  accessSecret(); // Validate both the password and the independent signing key.
  return process.env.SITE_PASSWORD ?? process.env.ENGINE_ACCESS_SECRET ?? null;
}

const digest = (text) => createHash('sha256').update(text).digest();
export function sameSecret(input, secret) {
  return typeof input === 'string' && input.length <= 512 && timingSafeEqual(digest(input), digest(secret));
}
const signature = (payload, secret) => createHmac('sha256', secret).update(`shogi-site-session:${payload}`).digest('base64url');
export function sessionCookie(secret, now = Date.now()) {
  const payload = String(Math.floor(now / 1000) + lifetime);
  return `${cookieName}=${payload}.${signature(payload, secret)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${lifetime}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}
export function clearSessionCookie() {
  return `${cookieName}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}
export function pageAccess({ req, res }, login = false) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
  let secret;
  try { secret = accessSecret(); }
  catch (error) {
    if (!(error instanceof EngineError)) throw error;
    if (login) { res.statusCode = 503; return { props: { configured: false } }; }
    return { redirect: { destination: '/login', permanent: false } };
  }
  const authenticated = hasAccess(req, secret);
  if (login) return authenticated ? { redirect: { destination: '/', permanent: false } } : { props: { configured: true } };
  return authenticated ? { props: { passwordProtected: Boolean(secret) } }
    : { redirect: { destination: '/login', permanent: false } };
}
export function hasAccess(req, secret, now = Date.now()) {
  if (!secret) return true;
  const cookie = (req.headers.cookie || '').split(';').map((value) => value.trim()).find((value) => value.startsWith(`${cookieName}=`));
  const value = cookie?.slice(cookieName.length + 1) || '';
  if (!/^\d{10}\.[A-Za-z0-9_-]{43}$/.test(value)) return false;
  const [expires, provided] = value.split('.');
  const seconds = Math.floor(now / 1000);
  return Number(expires) > seconds && Number(expires) <= seconds + lifetime
    && timingSafeEqual(Buffer.from(provided), Buffer.from(signature(expires, secret)));
}
export function assertSameOrigin(req) {
  if (req.headers['sec-fetch-site'] === 'cross-site') throw new EngineError('Cross-site requests are not allowed.', 403);
  if (req.headers.origin) {
    let origin;
    try { origin = new URL(req.headers.origin); } catch { throw new EngineError('Invalid origin.', 403); }
    if (!['http:', 'https:'].includes(origin.protocol) || origin.host !== req.headers.host) throw new EngineError('Cross-origin requests are not allowed.', 403);
  }
}
// This is an additional per-instance throttle, not a distributed billing quota.
// Configure the Vercel WAF rule documented in docs/vercel.md for edge enforcement.
const windows = new Map();
export function throttle(name, limit, now = Date.now()) {
  let window = windows.get(name);
  if (!window || now >= window.until) { window = { count: 0, until: now + 60000 }; windows.set(name, window); }
  if (++window.count > limit) throw new EngineError('Too many engine requests. Please wait a minute and retry.', 429);
}
