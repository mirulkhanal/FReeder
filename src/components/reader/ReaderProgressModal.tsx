import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';

import { useTheme } from '../../theme';

import type { Locator } from 'react-native-readium';

const PROGRESS_MARKS = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1];

function positionProgress(locator: Locator): number {
  return (
    locator.locations?.totalProgression ?? locator.locations?.progression ?? 0
  );
}

function nearestPositionIndex(positions: Locator[], progress: number): number {
  if (positions.length === 0) {
    return 0;
  }

  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  positions.forEach((position, index) => {
    const distance = Math.abs(positionProgress(position) - progress);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });

  return bestIndex;
}

type ReaderProgressModalProps = {
  visible: boolean;
  progress: number;
  positions: Locator[];
  onClose: () => void;
  onSelectProgress: (progress: number) => void;
  onSelectPosition: (locator: Locator) => void;
};

export function ReaderProgressModal({
  visible,
  progress,
  positions,
  onClose,
  onSelectProgress,
  onSelectPosition,
}: ReaderProgressModalProps) {
  const { colors, typography } = useTheme();
  const [sliderIndex, setSliderIndex] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);
  const trackWidthRef = useRef(0);

  const percent = Math.round(progress * 100);
  const maxIndex = Math.max(0, positions.length - 1);

  useEffect(() => {
    if (visible) {
      setSliderIndex(nearestPositionIndex(positions, progress));
    }
  }, [positions, progress, visible]);

  const sliderProgress = maxIndex > 0 ? sliderIndex / maxIndex : 0;

  const applySliderIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(maxIndex, index));
      setSliderIndex(clamped);
      const locator = positions[clamped];
      if (locator) {
        onSelectPosition(locator);
      }
    },
    [maxIndex, onSelectPosition, positions],
  );

  const indexFromX = useCallback(
    (x: number) => {
      if (trackWidthRef.current <= 0 || maxIndex === 0) {
        return 0;
      }
      const ratio = Math.min(1, Math.max(0, x / trackWidthRef.current));
      return Math.round(ratio * maxIndex);
    },
    [maxIndex],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => positions.length > 1,
        onMoveShouldSetPanResponder: () => positions.length > 1,
        onPanResponderGrant: event => {
          applySliderIndex(indexFromX(event.nativeEvent.locationX));
        },
        onPanResponderMove: event => {
          applySliderIndex(indexFromX(event.nativeEvent.locationX));
        },
      }),
    [applySliderIndex, indexFromX, positions.length],
  );

  const handleTrackLayout = useCallback((event: LayoutChangeEvent) => {
    trackWidthRef.current = event.nativeEvent.layout.width;
    setTrackWidth(event.nativeEvent.layout.width);
  }, []);

  const positionLabel =
    positions.length > 0
      ? `Position ${sliderIndex + 1} of ${positions.length}`
      : 'No positions available';

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.surfaceContainerLowest },
          ]}
        >
          <Text style={[typography.headline, { color: colors.onSurface }]}>
            Jump to position
          </Text>
          <Text
            style={[
              typography.body,
              styles.current,
              { color: colors.onSurfaceVariant },
            ]}
          >
            Currently at {percent}%
          </Text>

          {positions.length > 1 ? (
            <View style={styles.sliderSection}>
              <Text
                style={[typography.caption, { color: colors.onSurfaceVariant }]}
              >
                {positionLabel}
              </Text>
              <View
                {...panResponder.panHandlers}
                onLayout={handleTrackLayout}
                style={[
                  styles.track,
                  { backgroundColor: colors.surfaceContainerHighest },
                ]}
              >
                <View
                  style={[
                    styles.trackFill,
                    {
                      backgroundColor: colors.primary,
                      width: `${Math.round(sliderProgress * 100)}%`,
                    },
                  ]}
                />
                {trackWidth > 0 ? (
                  <View
                    style={[
                      styles.thumb,
                      {
                        backgroundColor: colors.primary,
                        left: Math.max(0, sliderProgress * trackWidth - 10),
                      },
                    ]}
                  />
                ) : null}
              </View>
            </View>
          ) : null}

          <View style={styles.marks}>
            {PROGRESS_MARKS.map(mark => {
              const label = `${Math.round(mark * 100)}%`;
              const selected = Math.abs(mark - progress) < 0.02;
              return (
                <Pressable
                  key={mark}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    onSelectProgress(mark);
                    onClose();
                  }}
                  style={[
                    styles.mark,
                    {
                      backgroundColor: selected
                        ? colors.primary
                        : colors.surfaceContainerLow,
                      borderColor: selected
                        ? colors.primary
                        : colors.outlineVariant,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: selected
                          ? colors.onPrimary
                          : colors.onSurfaceVariant,
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={styles.close}
          >
            <Text style={[typography.button, { color: colors.primary }]}>
              Close
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    borderRadius: 16,
    gap: 12,
    padding: 20,
    width: '100%',
  },
  current: {
    marginTop: 4,
  },
  sliderSection: {
    gap: 8,
    marginTop: 4,
  },
  track: {
    borderRadius: 999,
    height: 8,
    justifyContent: 'center',
    overflow: 'visible',
  },
  trackFill: {
    borderRadius: 999,
    height: 8,
  },
  thumb: {
    borderRadius: 999,
    height: 20,
    position: 'absolute',
    top: -6,
    width: 20,
  },
  marks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  mark: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  close: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
});
