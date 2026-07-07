import { useCallback } from 'react';
import type { RefObject } from 'react';
import type { ReadiumViewRef } from 'react-native-readium';
import type { TapZones } from '../services/readerChromePrefs';

export function useReaderTapZones(
  readerRef: RefObject<ReadiumViewRef | null>,
  tapZones: TapZones,
  onToggleChrome: () => void,
) {
  const handleZonePress = useCallback(
    (zone: keyof TapZones) => {
      const action = tapZones[zone];
      switch (action) {
        case 'prev':
          readerRef.current?.goBackward();
          break;
        case 'next':
          readerRef.current?.goForward();
          break;
        case 'menu':
          onToggleChrome();
          break;
        case 'none':
          break;
      }
    },
    [readerRef, tapZones, onToggleChrome],
  );

  return { handleZonePress };
}
