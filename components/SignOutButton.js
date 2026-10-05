import { useState } from 'react';

export default function SignOutButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  async function signOut() {
    setBusy(true); setError(null);
    try {
      const response = await fetch('/api/engine-session', { method: 'DELETE' });
      if (!response.ok) throw new Error('Could not sign out. Please retry.');
      window.location.replace('/login');
    } catch (failure) { setError(failure.message); setBusy(false); }
  }
  return <div>
    <button type="button" disabled={busy} onClick={signOut}
      className="rounded border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-100 disabled:opacity-40">{busy ? 'Signing out...' : 'Sign out'}</button>
    {error && <p role="alert" className="mt-1 text-sm text-red-700">{error}</p>}
  </div>;
}
