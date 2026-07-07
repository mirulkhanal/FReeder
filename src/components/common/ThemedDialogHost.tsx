import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  registerThemedDialogHost,
  type DialogButton,
  type ThemedDialogRequest,
} from '../../services/themedDialog';
import { useTheme } from '../../theme';

export function ThemedDialogHost() {
  const { colors, typography } = useTheme();
  const [request, setRequest] = useState<ThemedDialogRequest | null>(null);

  const dismiss = useCallback(() => {
    setRequest(null);
  }, []);

  const present = useCallback((next: ThemedDialogRequest) => {
    setRequest(next);
  }, []);

  useEffect(() => {
    registerThemedDialogHost(present);
    return () => registerThemedDialogHost(null);
  }, [present]);

  const handlePress = (button: DialogButton) => {
    dismiss();
    button.onPress?.();
  };

  const buttons = request?.buttons ?? [{ text: 'OK' }];
  const stacked = buttons.length > 2;

  return (
    <Modal
      animationType="fade"
      transparent
      visible={request !== null}
      onRequestClose={() => {
        const cancel = buttons.find(button => button.style === 'cancel');
        if (cancel) {
          handlePress(cancel);
        } else {
          dismiss();
        }
      }}>
      <Pressable accessibilityRole="button" onPress={dismiss} style={styles.backdrop}>
        <Pressable
          accessibilityRole="none"
          onPress={event => event.stopPropagation()}
          style={[styles.card, { backgroundColor: colors.surfaceContainerLowest }]}>
          <Text style={[typography.titleMd, styles.title, { color: colors.onSurface }]}>
            {request?.title}
          </Text>
          {request?.message ? (
            <Text style={[typography.body, styles.message, { color: colors.onSurfaceVariant }]}>
              {request.message}
            </Text>
          ) : null}

          <View style={[styles.actions, stacked ? styles.actionsStacked : styles.actionsRow]}>
            {buttons.map(button => {
              const destructive = button.style === 'destructive';
              const cancel = button.style === 'cancel';
              const filled = !cancel && !destructive && !stacked && buttons.length === 2;

              return (
                <Pressable
                  key={button.text}
                  accessibilityRole="button"
                  onPress={() => handlePress(button)}
                  style={({ pressed }) => [
                    stacked ? styles.actionStacked : styles.actionInline,
                    filled
                      ? { backgroundColor: pressed ? colors.primaryContainer : colors.primary }
                      : {
                          backgroundColor: pressed
                            ? colors.surfaceContainerHigh
                            : destructive
                              ? 'rgba(255, 218, 214, 0.12)'
                              : colors.surfaceContainerLow,
                          borderColor: destructive ? colors.error : colors.outlineVariant,
                          borderWidth: destructive || cancel ? 1 : 0,
                        },
                  ]}>
                  <Text
                    style={[
                      typography.button,
                      {
                        color: filled
                          ? colors.onPrimary
                          : destructive
                            ? colors.error
                            : cancel
                              ? colors.onSurfaceVariant
                              : colors.primary,
                        textAlign: stacked ? 'left' : 'center',
                      },
                    ]}>
                    {button.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    borderRadius: 20,
    gap: 12,
    maxWidth: 400,
    padding: 20,
    width: '100%',
  },
  title: {
    fontWeight: '600',
  },
  message: {
    lineHeight: 22,
  },
  actions: {
    gap: 8,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionsStacked: {
    flexDirection: 'column',
  },
  actionInline: {
    borderRadius: 12,
    minWidth: 96,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionStacked: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});
