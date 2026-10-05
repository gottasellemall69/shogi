import { useState } from 'react';

export default function EngineAccess({ onUnlocked }) {
  const [secret, setSecret] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  async function unlock(event) {
    event.preventDefault();
    setBusy(true); setError(null);
    try {
      const response = await fetch('/api/engine-session', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not unlock the engine.');
      setSecret(''); onUnlocked();
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }
  return <form className="space-y-2" onSubmit={unlock}>
    <p className="text-sm">Enter the owner&apos;s access key to play against AI. Two-player mode is available without a key.</p>
    <label className="block text-sm">Engine access key<input type="password" autoComplete="current-password" required maxLength={512}
      value={secret} onChange={(event) => setSecret(event.target.value)} className="mt-1 w-full rounded border border-stone-300 p-2" /></label>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <button disabled={busy} className="rounded bg-stone-800 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">{busy ? 'Unlocking...' : 'Unlock engine'}</button>
  </form>;
}
