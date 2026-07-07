import { useCallback, useEffect, useState } from 'react';
import {
  loadAllReadingStates,
  type ReadingState,
} from '../services/readingProgress';

export function useReadingProgress() {
  const [states, setStates] = useState<Record<string, ReadingState>>({});
  const [ready, setReady] = useState(false);

  const reload = useCallback(async () => {
    const map = await loadAllReadingStates();
    setStates(map);
    setReady(true);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { states, ready, reload };
}
