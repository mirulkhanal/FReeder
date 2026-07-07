import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  NativeViewGestureHandler,
  State,
  TapGestureHandler,
  type TapGestureHandlerStateChangeEvent,
} from 'react-native-gesture-handler';

import type { TapZoneAction, TapZones } from '../../services/readerChromePrefs';

type ReaderTapGestureWrapperProps = {
  enabled: boolean;
  tapZones: TapZones;
  onZoneAction: (action: TapZoneAction) => void;
  children: React.ReactNode;
};

function zoneForX(x: number, width: number): keyof TapZones {
  if (width <= 0) {
    return 'center';
  }
  const ratio = x / width;
  if (ratio < 0.33) {
    return 'left';
  }
  if (ratio > 0.66) {
    return 'right';
  }
  return 'center';
}

export function ReaderTapGestureWrapper({
  enabled,
  tapZones,
  onZoneAction,
  children,
}: ReaderTapGestureWrapperProps) {
  const layoutWidth = useRef(0);
  const nativeRef = useRef<NativeViewGestureHandler>(null);

  const handleTap = (event: TapGestureHandlerStateChangeEvent) => {
    if (!enabled || event.nativeEvent.state !== State.END) {
      return;
    }

    const action = tapZones[zoneForX(event.nativeEvent.x, layoutWidth.current)];
    if (action !== 'none') {
      onZoneAction(action);
    }
  };

  if (!enabled) {
    return <View style={styles.flex}>{children}</View>;
  }

  return (
    <TapGestureHandler
      enabled={enabled}
      maxDeltaX={14}
      maxDeltaY={14}
      simultaneousHandlers={nativeRef}
      onHandlerStateChange={handleTap}
    >
      <View
        style={styles.flex}
        onLayout={event => {
          layoutWidth.current = event.nativeEvent.layout.width;
        }}
      >
        <NativeViewGestureHandler ref={nativeRef} disallowInterruption>
          <View collapsable={false} style={styles.flex}>
            {children}
          </View>
        </NativeViewGestureHandler>
      </View>
    </TapGestureHandler>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
