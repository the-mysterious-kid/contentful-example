import AsyncStorage from '@react-native-async-storage/async-storage';
import { contentfulClient } from './contentfulClient';
import { syncContentTypes, shouldSyncContentTypes } from './contentTypeService';

const SYNC_TOKEN_KEY = 'contentful_sdk_sync_token';
const CACHED_ENTRIES_KEY = 'cachedSDKEntries';
const DEFAULT_LOCALE = 'en-US';

export interface SyncContentResult {
  entries: Record<string, any> | null;
  contentTypesUpdated: boolean;
}

const flattenFields = (fields: any): Record<string, any> => {
  const flattened: Record<string, any> = {};
  for (const key in fields) {
    const value = fields[key];
    flattened[key] = value?.[DEFAULT_LOCALE] ?? value;
  }
  return flattened;
};

const loadCache = async (): Promise<Record<string, any>> => {
  try {
    const cached = await AsyncStorage.getItem(CACHED_ENTRIES_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch {
    return {};
  }
};

const syncContentTypesIfNeeded = async (force: boolean): Promise<boolean> => {
  const needsSync = force || await shouldSyncContentTypes();
  
  if (!needsSync) {
    console.log('[syncService] Content types up to date');
    return false;
  }

  console.log(`[syncService] ${force ? 'Force' : 'Auto'} syncing content types...`);
  const result = await syncContentTypes();
  
  if (result) {
    console.log('[syncService] Content types synced successfully');
    return true;
  }
  
  console.warn('[syncService] Content type sync failed, using cache');
  return false;
};

export const syncContent = async (forceContentTypeSync = false): Promise<SyncContentResult> => {
  let contentTypesUpdated = false;

  try {
    // Sync content types if needed
    contentTypesUpdated = await syncContentTypesIfNeeded(forceContentTypeSync);

    // Sync entries
    const savedToken = await AsyncStorage.getItem(SYNC_TOKEN_KEY);
    console.log(`[syncService] ${savedToken ? 'Incremental' : 'Initial'} entry sync...`);

    const response = savedToken
      ? await contentfulClient.sync({ nextSyncToken: savedToken })
      : await contentfulClient.sync({ initial: true });

    const { entries = [], nextSyncToken } = response;
    console.log(`[syncService] Received ${entries.length} entries`);

    // Merge with cache
    const cachedEntries = await loadCache();
    
    for (const entry of entries) {
      const cachedEntry = {
        ...entry,
        fields: flattenFields(entry.fields),
        sys: { ...entry.sys, contentType: entry.sys.contentType },
      };

      const ctId = cachedEntry.sys?.contentType?.sys?.id;
      if (ctId) {
        console.log(`[syncService] Entry ${entry.sys.id}: content type ${ctId}`);
      } else {
        console.warn(`[syncService] Entry ${entry.sys.id}: missing content type ID`);
      }

      cachedEntries[entry.sys.id] = cachedEntry;
    }

    // Save cache and token
    await AsyncStorage.setItem(CACHED_ENTRIES_KEY, JSON.stringify(cachedEntries));
    if (nextSyncToken) {
      await AsyncStorage.setItem(SYNC_TOKEN_KEY, nextSyncToken);
    }

    console.log(`[syncService] Synced ${Object.keys(cachedEntries).length} total entries`);
    return { entries: cachedEntries, contentTypesUpdated };

  } catch (error) {
    console.error('[syncService] Sync error:', error);
    
    if (error instanceof Error && /Network|timeout/.test(error.message)) {
      console.log('[syncService] Network error - app offline');
    }

    // Fallback to cache
    const cachedEntries = await loadCache();
    if (Object.keys(cachedEntries).length > 0) {
      console.log(`[syncService] Using ${Object.keys(cachedEntries).length} cached entries (offline mode)`);
    } else {
      console.warn('[syncService] No cache available - limited functionality');
    }

    return { entries: Object.keys(cachedEntries).length > 0 ? cachedEntries : null, contentTypesUpdated };
  }
};
