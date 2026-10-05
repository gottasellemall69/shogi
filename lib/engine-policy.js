export class EngineError extends Error {
  constructor(message, status = 503) { super(message); this.status = status; }
}
export const requestScoped = () => process.env.VERCEL === '1' || process.env.YANEURAOU_REQUEST_SCOPED === '1';
export const maxThinkingTime = () => requestScoped() ? 1000 : 10000;
