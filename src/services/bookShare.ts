import { NativeModules, Platform, Share } from 'react-native';
import ShareModule from 'react-native-share';

import { getBookFileName } from '../types/book';

import { resolveReadableBookUri } from './bookFile';

import type { Book } from '../types/book';

type FreederFileShareModule = {
  shareFile: (path: string, mimeType: string, title: string) => Promise<void>;
};

function freederFileShare(): FreederFileShareModule | null {
  const module = NativeModules.FreederFileShare as
    | FreederFileShareModule
    | undefined;
  return module?.shareFile ? module : null;
}

function isRnShareLinked(): boolean {
  return NativeModules.RNShare != null;
}

function isUserCancel(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.toLowerCase().includes('cancel') ||
    message.toLowerCase().includes('dismiss')
  );
}

async function shareWithRnShare(
  title: string,
  fileName: string,
  fileUri: string,
): Promise<boolean> {
  if (!isRnShareLinked()) {
    return false;
  }

  try {
    await ShareModule.open({
      title,
      subject: title,
      message: title,
      url: fileUri,
      type: 'application/epub+zip',
      failOnCancel: false,
      ...(Platform.OS === 'android' ? { filename: fileName } : {}),
    });
    return true;
  } catch (error) {
    if (isUserCancel(error)) {
      return true;
    }
    return false;
  }
}

async function shareWithFreederModule(
  title: string,
  fileUri: string,
): Promise<boolean> {
  const shareModule = freederFileShare();
  if (!shareModule) {
    return false;
  }

  try {
    await shareModule.shareFile(fileUri, 'application/epub+zip', title);
    return true;
  } catch (error) {
    if (isUserCancel(error)) {
      return true;
    }
    return false;
  }
}

export async function shareEpub(book: Book): Promise<void> {
  const fileName = getBookFileName(book);
  const fileUri = await resolveReadableBookUri(book.fileUrl, fileName);
  const title = book.title.trim() || fileName;

  if (Platform.OS === 'android') {
    const sharedNative =
      (await shareWithFreederModule(title, fileUri)) ||
      (await shareWithRnShare(title, fileName, fileUri));
    if (sharedNative) {
      return;
    }

    throw new Error(
      'Could not share this EPUB. Rebuild and reinstall FReeder, then try again.',
    );
  }

  if (await shareWithRnShare(title, fileName, fileUri)) {
    return;
  }

  await Share.share({ title, url: fileUri });
}
