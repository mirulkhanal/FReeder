import { showThemedConfirm, showThemedDialog } from '../services/themedDialog';
import { shareAnnotationsMarkdown } from '../services/annotationsExport';
import { shareEpub as shareEpubFile } from '../services/bookShare';
import type { Book } from '../types/book';

type DeleteHandlers = {
  onRemoveFromLibrary: () => void;
  onDeleteFromDevice: () => void;
};

export function promptDeleteBook(book: Book, handlers: DeleteHandlers): void {
  showThemedDialog({
    title: 'Remove book?',
    message: `"${book.title}" can be removed from your library only, or permanently deleted from your device storage. Deleting from device cannot be undone.`,
    buttons: [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove from library', onPress: handlers.onRemoveFromLibrary },
      { text: 'Delete from device', style: 'destructive', onPress: handlers.onDeleteFromDevice },
    ],
  });
}

export function promptRelocateBook(
  book: Book,
  onConfirm: () => void,
): void {
  showThemedDialog({
    title: 'Locate book file',
    message: `"${book.title}" is missing from your library folder. Pick the EPUB file again to reconnect it. Your reading progress will be kept.`,
    buttons: [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Locate file', onPress: onConfirm },
    ],
  });
}

export async function shareEpub(book: Book): Promise<void> {
  await shareEpubFile(book);
}

export async function exportBookNotes(book: Book): Promise<void> {
  await shareAnnotationsMarkdown(book);
}

export async function confirmRemoveDuplicate(book: Book): Promise<boolean> {
  return showThemedConfirm(
    'Remove duplicate?',
    `Remove "${book.title}" from your library? The file on disk is not deleted unless you choose delete from device afterward.`,
    { confirmText: 'Remove', destructive: true },
  );
}
