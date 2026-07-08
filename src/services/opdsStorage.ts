import AsyncStorage from '@react-native-async-storage/async-storage';

import { generateBookId } from '../types/book';

import {
  clearCatalogPassword,
  migrateCatalogPassword,
  saveCatalogPassword,
} from './opdsCredentials';

import type { OpdsCatalog } from '../types/opds';

const CATALOGS_KEY = '@freeder/opdsCatalogs';

export const SUGGESTED_CATALOGS: Array<{ title: string; url: string }> = [
  {
    title: 'Standard Ebooks',
    url: 'https://standardebooks.org/feeds/opds',
  },
  {
    title: 'Project Gutenberg',
    url: 'https://www.gutenberg.org/ebooks.opds/?format=opds',
  },
  {
    title: 'Calibre Web (example)',
    url: 'http://127.0.0.1:8083/opds',
  },
];

export async function loadOpdsCatalogs(): Promise<OpdsCatalog[]> {
  const raw = await AsyncStorage.getItem(CATALOGS_KEY);
  if (!raw) {
    return [];
  }
  try {
    const catalogs = JSON.parse(raw) as OpdsCatalog[];
    return Promise.all(
      catalogs.map(async catalog => {
        const password = await migrateCatalogPassword(
          catalog.id,
          catalog.password,
        );
        return {
          ...catalog,
          opdsVersion: catalog.opdsVersion ?? 'auto',
          password,
        };
      }),
    );
  } catch {
    return [];
  }
}

async function stripPasswordForStorage(
  catalog: OpdsCatalog,
): Promise<OpdsCatalog> {
  if (catalog.password) {
    await saveCatalogPassword(catalog.id, catalog.password);
  }
  const sanitized = { ...catalog };
  delete sanitized.password;
  return sanitized;
}

export async function saveOpdsCatalogs(catalogs: OpdsCatalog[]): Promise<void> {
  const sanitized = await Promise.all(catalogs.map(stripPasswordForStorage));
  await AsyncStorage.setItem(CATALOGS_KEY, JSON.stringify(sanitized));
}

export async function addOpdsCatalog(
  input: Omit<OpdsCatalog, 'id'> & { id?: string },
): Promise<OpdsCatalog[]> {
  const catalogs = await loadOpdsCatalogs();
  const catalog: OpdsCatalog = {
    id: input.id ?? generateBookId(),
    title: input.title.trim() || catalogTitleFromUrl(input.url),
    url: input.url.trim(),
    opdsVersion: input.opdsVersion ?? 'auto',
    username: input.username?.trim() || undefined,
    password: input.password || undefined,
  };
  const next = [catalog, ...catalogs.filter(item => item.url !== catalog.url)];
  await saveOpdsCatalogs(next);
  return next;
}

export async function removeOpdsCatalog(
  catalogId: string,
): Promise<OpdsCatalog[]> {
  const catalogs = await loadOpdsCatalogs();
  const next = catalogs.filter(catalog => catalog.id !== catalogId);
  await clearCatalogPassword(catalogId);
  await saveOpdsCatalogs(next);
  return next;
}

export async function updateOpdsCatalog(
  catalogId: string,
  input: {
    url: string;
    title: string;
    opdsVersion: 'auto' | '1' | '2';
    username?: string;
    password?: string;
    keepExistingPassword?: boolean;
  },
): Promise<OpdsCatalog[]> {
  const catalogs = await loadOpdsCatalogs();
  const existing = catalogs.find(catalog => catalog.id === catalogId);
  if (!existing) {
    throw new Error('Catalog not found.');
  }

  const url = input.url.trim();
  if (!url) {
    throw new Error('Catalog URL is required.');
  }

  if (
    catalogs.some(catalog => catalog.id !== catalogId && catalog.url === url)
  ) {
    throw new Error('Another catalog already uses this URL.');
  }

  const updated: OpdsCatalog = {
    ...existing,
    url,
    title: input.title.trim() || catalogTitleFromUrl(url),
    opdsVersion: input.opdsVersion,
    username: input.username?.trim() || undefined,
    password: input.keepExistingPassword
      ? existing.password
      : input.password || undefined,
  };

  const next = catalogs.map(catalog =>
    catalog.id === catalogId ? updated : catalog,
  );
  await saveOpdsCatalogs(next);
  return next;
}

export function catalogTitleFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return host;
  } catch {
    return 'OPDS Catalog';
  }
}
