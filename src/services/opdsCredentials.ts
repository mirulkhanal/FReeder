import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules } from 'react-native';
import * as Keychain from 'react-native-keychain';

const SERVICE_PREFIX = 'freeder.opds.catalog.';
const FALLBACK_PREFIX = '@freeder/opdsPassword.';

function serviceForCatalog(catalogId: string): string {
  return `${SERVICE_PREFIX}${catalogId}`;
}

function fallbackKey(catalogId: string): string {
  return `${FALLBACK_PREFIX}${catalogId}`;
}

function isKeychainAvailable(): boolean {
  return NativeModules.RNKeychainManager != null;
}

async function loadFallbackPassword(
  catalogId: string,
): Promise<string | undefined> {
  const raw = await AsyncStorage.getItem(fallbackKey(catalogId));
  return raw ?? undefined;
}

async function saveFallbackPassword(
  catalogId: string,
  password: string,
): Promise<void> {
  await AsyncStorage.setItem(fallbackKey(catalogId), password);
}

async function clearFallbackPassword(catalogId: string): Promise<void> {
  await AsyncStorage.removeItem(fallbackKey(catalogId));
}

export async function saveCatalogPassword(
  catalogId: string,
  password: string,
): Promise<void> {
  if (!password) {
    await clearCatalogPassword(catalogId);
    return;
  }

  if (isKeychainAvailable()) {
    try {
      await Keychain.setGenericPassword(catalogId, password, {
        service: serviceForCatalog(catalogId),
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
      });
      await clearFallbackPassword(catalogId);
      return;
    } catch {
      // Fall through to AsyncStorage when Keychain fails at runtime.
    }
  }

  await saveFallbackPassword(catalogId, password);
}

export async function loadCatalogPassword(
  catalogId: string,
): Promise<string | undefined> {
  if (isKeychainAvailable()) {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: serviceForCatalog(catalogId),
      });
      if (credentials) {
        return credentials.password;
      }
    } catch {
      // Fall through to AsyncStorage fallback.
    }
  }

  return loadFallbackPassword(catalogId);
}

export async function clearCatalogPassword(catalogId: string): Promise<void> {
  if (isKeychainAvailable()) {
    try {
      await Keychain.resetGenericPassword({
        service: serviceForCatalog(catalogId),
      });
    } catch {
      // Best-effort Keychain clear.
    }
  }
  await clearFallbackPassword(catalogId);
}

export async function migrateCatalogPassword(
  catalogId: string,
  legacyPassword?: string,
): Promise<string | undefined> {
  const stored = await loadCatalogPassword(catalogId);
  if (stored) {
    return stored;
  }
  if (legacyPassword) {
    await saveCatalogPassword(catalogId, legacyPassword);
    return legacyPassword;
  }
  return undefined;
}
