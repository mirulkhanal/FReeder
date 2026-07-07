export type DialogButtonStyle = 'default' | 'cancel' | 'destructive';

export type DialogButton = {
  text: string;
  style?: DialogButtonStyle;
  onPress?: () => void;
};

export type ThemedDialogRequest = {
  title: string;
  message?: string;
  buttons: DialogButton[];
};

type DialogHost = (request: ThemedDialogRequest) => void;

let host: DialogHost | null = null;

export function registerThemedDialogHost(next: DialogHost | null): void {
  host = next;
}

export function showThemedDialog(request: ThemedDialogRequest): void {
  if (!host) {
    if (__DEV__) {
      console.warn('ThemedDialogHost not mounted:', request.title);
    }
    request.buttons[request.buttons.length - 1]?.onPress?.();
    return;
  }
  host(request);
}

export function showThemedAlert(title: string, message?: string): void {
  showThemedDialog({
    title,
    message,
    buttons: [{ text: 'OK' }],
  });
}

export function showThemedConfirm(
  title: string,
  message: string | undefined,
  options: {
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
  } = {},
): Promise<boolean> {
  return new Promise(resolve => {
    showThemedDialog({
      title,
      message,
      buttons: [
        {
          text: options.cancelText ?? 'Cancel',
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: options.confirmText ?? 'Confirm',
          style: options.destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ],
    });
  });
}
