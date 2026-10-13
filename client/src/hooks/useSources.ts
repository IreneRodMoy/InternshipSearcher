import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import type { SourceStatus } from '../types';

export function useSources() {
  const [sources, setSources] = useState<SourceStatus[]>([]);

  const refresh = useCallback(async () => {
    try {
      setSources(await api.sources());
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = setInterval(refresh, 20_000);
    const events = new EventSource('/api/events');
    events.addEventListener('scan', () => void refresh());
    return () => {
      clearInterval(timer);
      events.close();
    };
  }, [refresh]);

  const enabled = sources.filter((s) => s.enabled);
  const lastScan = Math.max(0, ...enabled.map((s) => s.lastSuccessAt ?? 0)) || null;
  const scanning = enabled.some((s) => s.running);

  const scan = useCallback(async () => {
    setSources((current) => current.map((s) => (s.enabled ? { ...s, running: true } : s)));
    await api.scan();
  }, []);

  return { sources, enabled, lastScan, scanning, scan, refresh };
}
