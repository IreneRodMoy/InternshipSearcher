import { useEffect, useState } from 'react';
import { api } from './api';
import { Dashboard } from './components/Dashboard';
import { Flower } from './components/Doodles';
import { LoginScreen } from './components/LoginScreen';

export function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    api.me().then(
      ({ authenticated }) => setAuthenticated(authenticated),
      () => setAuthenticated(false),
    );
  }, []);

  if (authenticated === null) {
    return (
      <div className="splash">
        <Flower size={56} className="spin" />
      </div>
    );
  }
  if (!authenticated) return <LoginScreen onSuccess={() => setAuthenticated(true)} />;
  return <Dashboard onLogout={() => setAuthenticated(false)} />;
}
