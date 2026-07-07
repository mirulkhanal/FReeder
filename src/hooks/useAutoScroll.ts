import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type { ReadiumViewRef } from 'react-native-readium';
import type { ReadingMode } from '../services/readerPreferences';

export function useAutoScroll(
  readerRef: RefObject<ReadiumViewRef | null>,
  autoScrollWpm: number,
  readingMode: ReadingMode,
  enabled: boolean,
) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!enabled || autoScrollWpm <= 0 || readingMode !== 'scroll') {
      return;
    }

    const intervalMs = Math.max(250, Math.round(60_000 / autoScrollWpm));

    intervalRef.current = setInterval(() => {
      readerRef.current?.goForward();
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoScrollWpm, enabled, readerRef, readingMode]);
}
