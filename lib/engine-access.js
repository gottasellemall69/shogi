import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { EngineError, requestScoped } from './engine.js';

const cookieName = 'shogi_engine';
const lifetime = 8 * 60 * 60;
export function accessSecret() {
  const secret = process.env.ENGINE_ACCESS_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (requestScoped() || secret) throw new EngineError('Engine access is not configured. Set ENGINE_ACCESS_SECRET to at least 32 random characters.');
  return null;
}
const digest = (text) => createHash('sha256').update(text).digest();
export function sameSecret(input, secret) {
  return typeof input === 'string' && input.length <= 512 && timingSafeEqual(digest(input), digest(secret));
}
const signature = (payload, secret) => createHmac('sha256', secret).update(`shogi-engine-session:${payload}`).digest('base64url');
export function sessionCookie(secret, now = Date.now()) {
  const payload = String(Math.floor(now / 1000) + lifetime);
  return `${cookieName}=${payload}.${signature(payload, secret)}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=${lifetime}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
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
