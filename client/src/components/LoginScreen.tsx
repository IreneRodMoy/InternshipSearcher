import { useState, type FormEvent } from 'react';
import { api } from '../api';
import { BackgroundBlobs, Flower, Sparkle, Squiggle } from './Doodles';

export function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.login(password);
      onSuccess();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <main className="login">
      <BackgroundBlobs />
      <form className="login__card" onSubmit={submit}>
        <Flower size={64} className="login__flower" />
        <Sparkle size={18} className="login__sparkle" />
        <h1>
          Internship<em>Searcher</em>
        </h1>
        <Squiggle width={150} />
        <p>Welcome back! Let's find your summer.</p>
        <input
          type="password"
          autoFocus
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-label="Password"
        />
        {error && <p className="form-error">{error}</p>}
        <button className="button button--pink button--block" disabled={busy || !password}>
          {busy ? 'Opening…' : 'Come on in'}
        </button>
      </form>
    </main>
  );
}
