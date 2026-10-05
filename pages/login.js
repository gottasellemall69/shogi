import Head from 'next/head';
import { useState } from 'react';
import { pageAccess } from '../lib/engine-access.js';

export default function LoginPage({ configured }) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  async function signIn(event) {
    event.preventDefault();
    setBusy(true); setError(null);
    try {
      const response = await fetch('/api/engine-session', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not sign in. Please retry.');
      setPassword('');
      window.location.replace('/');
    } catch (failure) { setError(failure.message); setBusy(false); }
  }
  return <>
    <Head><title>Sign in | Shogi</title><meta name="robots" content="noindex, nofollow" /></Head>
    <div className="mx-auto flex min-h-screen max-w-md items-center px-5 py-12 text-stone-900">
      <section className="w-full space-y-5 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <div><h1 className="text-2xl font-bold">Private Shogi</h1>
          <p className="mt-2 text-sm text-stone-600">Enter the shared password to play.</p></div>
        {configured ? <form className="space-y-4" onSubmit={signIn}>
          <label className="block text-sm font-semibold" htmlFor="site-password">Password</label>
          <input id="site-password" name="password" type="password" autoComplete="current-password" required maxLength={512}
            value={password} onChange={(event) => setPassword(event.target.value)} disabled={busy}
            className="w-full rounded border border-stone-300 px-3 py-2" />
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <button disabled={busy} className="w-full rounded bg-stone-800 px-3 py-2 font-semibold text-white hover:bg-stone-600 disabled:opacity-40">{busy ? 'Signing in...' : 'Sign in'}</button>
        </form> : <p role="alert" className="text-sm text-stone-700">This private game has not been configured yet. Please contact the owner.</p>}
      </section>
    </div>
  </>;
}
export function getServerSideProps(context) { return pageAccess(context, true); }
