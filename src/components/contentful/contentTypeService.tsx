import AsyncStorage from '@react-native-async-storage/async-storage';
import { contentfulClient } from './contentfulClient';

const CACHED_CONTENT_TYPES_KEY = 'cachedContentTypes';
const CONTENT_TYPES_LAST_SYNC_KEY = 'contentTypesLastSync';
const SYNC_TTL_HOURS = 24;

export interface ContentTypeField {
  id: string;
  name: string;
  type: string;
  required: boolean;
}

export interface ContentTypeMetadata {
  id: string;
  name: string;
  fields: ContentTypeField[];
  fieldOrder: string[];
}

export interface ContentTypeCache {
  [contentTypeId: string]: ContentTypeMetadata;
}

const isValidResponse = (response: any): boolean => {
  if (!response?.items || !Array.isArray(response.items)) {
    console.error('[contentTypeService] Invalid response structure');
    return false;
  }

  return response.items.every((ct: any) => {
    if (!ct.sys?.id || !ct.name || !Array.isArray(ct.fields)) {
      console.error('[contentTypeService] Invalid content type structure');
      return false;
    }
    return ct.fields.every((f: any) => f.id && f.name && f.type);
  });
};

const getCachedContentTypes = async (): Promise<ContentTypeCache | null> => {
  try {
    const cached = await AsyncStorage.getItem(CACHED_CONTENT_TYPES_KEY);
    if (!cached) return null;

    const parsed = JSON.parse(cached);
    
    // Validate cache structure
    if (typeof parsed !== 'object' || !parsed || Object.keys(parsed).length === 0) {
      console.warn('[contentTypeService] Invalid cache, clearing');
      await AsyncStorage.multiRemove([CACHED_CONTENT_TYPES_KEY, CONTENT_TYPES_LAST_SYNC_KEY]);
      return null;
    }

    console.log(`[contentTypeService] Loaded ${Object.keys(parsed).length} content types from cache`);
    return parsed;
  } catch (error) {
    console.error('[contentTypeService] Cache read error:', error);
    await AsyncStorage.multiRemove([CACHED_CONTENT_TYPES_KEY, CONTENT_TYPES_LAST_SYNC_KEY]);
    return null;
  }
};

export const syncContentTypes = async (): Promise<ContentTypeCache | null> => {
  try {
    console.log('[contentTypeService] Fetching content types...');
    const response = await contentfulClient.getContentTypes();
    
    if (!isValidResponse(response)) {
      console.error('[contentTypeService] Invalid response, using cache');
      return await getCachedContentTypes();
    }

    const cache: ContentTypeCache = {};

    for (const ct of response.items) {
      try {
        cache[ct.sys.id] = {
          id: ct.sys.id,
          name: ct.name,
          fields: ct.fields.map((f: any) => ({
            id: f.id,
            name: f.name,
            type: f.type,
            required: f.required || false,
          })),
          fieldOrder: ct.fields.map((f: any) => f.id),
        };
        console.log(`[contentTypeService] Processed ${ct.sys.id} (${ct.fields.length} fields)`);
      } catch (error) {
        console.error(`[contentTypeService] Error processing ${ct.sys.id}:`, error);
      }
    }

    if (Object.keys(cache).length === 0) {
      console.error('[contentTypeService] No content types processed, using cache');
      return await getCachedContentTypes();
    }

    // Save to cache
    await AsyncStorage.setItem(CACHED_CONTENT_TYPES_KEY, JSON.stringify(cache));
    await AsyncStorage.setItem(CONTENT_TYPES_LAST_SYNC_KEY, new Date().toISOString());
    
    console.log(`[contentTypeService] Synced ${Object.keys(cache).length} content types`);
    return cache;

  } catch (error) {
    console.error('[contentTypeService] Sync error:', error);
    
    if (error instanceof Error && /Network|timeout/.test(error.message)) {
      console.log('[contentTypeService] Network error - offline mode');
    }

    const cached = await getCachedContentTypes();
    if (cached) {
      console.log('[contentTypeService] Using cache (offline mode)');
    } else {
      console.error('[contentTypeService] No cache available');
    }
    return cached;
  }
};

export const getContentTypeMetadata = async (contentTypeId: string): Promise<ContentTypeMetadata | null> => {
  if (!contentTypeId) {
    console.error('[contentTypeService] Empty contentTypeId');
    return null;
  }

  console.log(`[contentTypeService] Getting metadata for ${contentTypeId}`);
  const cache = await getCachedContentTypes();
  
  if (!cache) {
    console.warn('[contentTypeService] No cache - using fallback ordering');
    return null;
  }

  const metadata = cache[contentTypeId];
  if (!metadata) {
    console.warn(`[contentTypeService] ${contentTypeId} not found. Available: ${Object.keys(cache).join(', ')}`);
    return null;
  }

  console.log(`[contentTypeService] Found ${metadata.name} (${metadata.fields.length} fields)`);
  return metadata;
};

export const shouldSyncContentTypes = async (): Promise<boolean> => {
  try {
    const lastSync = await AsyncStorage.getItem(CONTENT_TYPES_LAST_SYNC_KEY);
    
    if (!lastSync) {
      console.log('[contentTypeService] Never synced - sync needed');
      return true;
    }

    const hoursSince = (Date.now() - new Date(lastSync).getTime()) / (1000 * 60 * 60);
    const needsSync = hoursSince >= SYNC_TTL_HOURS;
    
    console.log(`[contentTypeService] ${hoursSince.toFixed(1)}h since sync - ${needsSync ? 'sync needed' : 'up to date'}`);
    return needsSync;
  } catch (error) {
    console.error('[contentTypeService] Error checking sync status:', error);
    return true;
  }
};
