import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { ReaderChromePrefs } from '../../services/readerChromePrefs';

type ReaderComfortOverlayProps = {
  chromePrefs: ReaderChromePrefs;
};

/** Non-interactive brightness and blue-light layers above the reader. */
export function ReaderComfortOverlay({ chromePrefs }: ReaderComfortOverlayProps) {
  const { brightnessOverlay, blueLightFilter } = chromePrefs;

  if (brightnessOverlay <= 0 && !blueLightFilter) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.root}>
      {brightnessOverlay > 0 ? (
        <View
          style={[styles.layer, { backgroundColor: `rgba(0, 0, 0, ${brightnessOverlay})` }]}
        />
      ) : null}
      {blueLightFilter ? (
        <View style={[styles.layer, styles.blueLightFilter]} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 3,
  },
  layer: {
    ...StyleSheet.absoluteFill,
  },
  blueLightFilter: {
    backgroundColor: 'rgba(255, 160, 60, 0.22)',
  },
});
