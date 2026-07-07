import { useCallback, useEffect, useRef, useState } from 'react';

const HIDE_DELAY_MS = 5000;

export function useReaderChrome(modalsOpen: boolean, readerReady = false) {
  const [chromeVisible, setChromeVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialRevealRef = useRef(false);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      setChromeVisible(false);
    }, HIDE_DELAY_MS);
  }, [clearHideTimer]);

  const showChrome = useCallback(() => {
    setChromeVisible(true);
    if (!modalsOpen) {
      scheduleHide();
    }
  }, [modalsOpen, scheduleHide]);

  const handleCenterTap = useCallback(() => {
    setChromeVisible(prev => {
      const next = !prev;
      if (next) {
        scheduleHide();
      } else {
        clearHideTimer();
      }
      return next;
    });
  }, [clearHideTimer, scheduleHide]);

  const notifyChromeInteraction = useCallback(() => {
    if (chromeVisible && !modalsOpen) {
      scheduleHide();
    }
  }, [chromeVisible, modalsOpen, scheduleHide]);

  useEffect(() => {
    if (readerReady && !initialRevealRef.current) {
      initialRevealRef.current = true;
      showChrome();
    }
  }, [readerReady, showChrome]);

  useEffect(() => {
    if (modalsOpen) {
      clearHideTimer();
      return;
    }
    if (chromeVisible) {
      scheduleHide();
    }
    return clearHideTimer;
  }, [chromeVisible, modalsOpen, clearHideTimer, scheduleHide]);

  useEffect(() => () => clearHideTimer(), [clearHideTimer]);

  return {
    chromeVisible,
    handleCenterTap,
    notifyChromeInteraction,
    showChrome,
  };
}
