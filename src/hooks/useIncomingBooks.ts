import { useEffect } from 'react';
import { Linking, Platform } from 'react-native';
import { useLibrary } from '../context/LibraryContext';
import { bookFromPickedFile } from '../services/libraryMerge';
import { isSupportedBookFileName } from '../services/libraryScanner';

function fileNameFromUri(uri: string): string {
  try {
    const decoded = decodeURIComponent(uri);
    const segment = decoded.split('/').pop() ?? 'book.epub';
    return segment.includes('/') ? segment.split('/').pop()! : segment;
  } catch {
    return 'book.epub';
  }
}

export function useIncomingBooks() {
  const { importIncomingBook } = useLibrary();

  useEffect(() => {
    const handleUrl = (url: string | null) => {
      if (!url) {
        return;
      }
      const lower = url.toLowerCase();
      if (!lower.includes('.epub') && !lower.startsWith('content://')) {
        return;
      }
      const fileName = fileNameFromUri(url);
      if (!isSupportedBookFileName(fileName) && !lower.startsWith('content://')) {
        return;
      }
      void importIncomingBook(bookFromPickedFile(url, fileName));
    };

    void Linking.getInitialURL().then(handleUrl);
    const subscription = Linking.addEventListener('url', event => {
      handleUrl(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, [importIncomingBook]);
}
