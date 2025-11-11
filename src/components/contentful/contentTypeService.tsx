import AsyncStorage from '@react-native-async-storage/async-storage';
import { contentfulClient } from './contentfulClient';

// Storage keys
const CACHED_CONTENT_TYPES_KEY = 'cachedContentTypes';
const CONTENT_TYPES_LAST_SYNC_KEY = 'contentTypesLastSync';

// TypeScript interfaces
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
  fieldOrder: string[]; // Array of field IDs in display order
}

export interface ContentTypeCache {
  [contentTypeId: string]: ContentTypeMetadata;
}

/**
 * Validate content type response structure
 * @param response - Response from Contentful API
 * @returns true if valid, false otherwise
 */
const isValidContentTypeResponse = (response: any): boolean => {
  if (!response) {
    console.error('[contentTypeService] Response is null or undefined');
    return false;
  }

  if (!response.items || !Array.isArray(response.items)) {
    console.error('[contentTypeService] Response.items is missing or not an array');
    return false;
  }

  // Validate each content type has required structure
  for (const contentType of response.items) {
    if (!contentType.sys || !contentType.sys.id) {
      console.error('[contentTypeService] Content type missing sys.id');
      return false;
    }

    if (!contentType.name) {
      console.error('[contentTypeService] Content type missing name');
      return false;
    }

    if (!contentType.fields || !Array.isArray(contentType.fields)) {
      console.error('[contentTypeService] Content type missing fields array');
      return false;
    }

    // Validate each field has required properties
    for (const field of contentType.fields) {
      if (!field.id || !field.name || !field.type) {
        console.error('[contentTypeService] Field missing required properties (id, name, or type)');
        return false;
      }
    }
  }

  return true;
};

/**
 * Fetch all content types from Contentful and cache them locally
 * @returns ContentTypeCache object or null on error
 */
export const syncContentTypes = async (): Promise<ContentTypeCache | null> => {
  try {
    console.log('[contentTypeService] Fetching content types from Contentful...');
    
    // Fetch all content types from Contentful
    const response = await contentfulClient.getContentTypes();
    
    // Validate response structure
    if (!isValidContentTypeResponse(response)) {
      console.error('[contentTypeService] Invalid or malformed response from getContentTypes API');
      // Fallback to cached data
      const cachedData = await getCachedContentTypes();
      if (cachedData) {
        console.log('[contentTypeService] Using cached content types due to malformed API response');
      } else {
        console.error('[contentTypeService] No cached content types available, app may not function correctly');
      }
      return cachedData;
    }

    const contentTypeCache: ContentTypeCache = {};

    // Process each content type with error handling
    for (const contentType of response.items) {
      try {
        const fields: ContentTypeField[] = contentType.fields.map((field: any) => ({
          id: field.id,
          name: field.name,
          type: field.type,
          required: field.required || false,
        }));

        // Extract field order from the fields array
        const fieldOrder: string[] = contentType.fields.map((field: any) => field.id);

        contentTypeCache[contentType.sys.id] = {
          id: contentType.sys.id,
          name: contentType.name,
          fields,
          fieldOrder,
        };

        console.log(`[contentTypeService] Processed content type: ${contentType.sys.id} with ${fieldOrder.length} fields`);
      } catch (fieldError) {
        console.error(`[contentTypeService] Error processing content type ${contentType.sys.id}:`, fieldError);
        // Continue processing other content types
        continue;
      }
    }

    // Validate we have at least some content types
    if (Object.keys(contentTypeCache).length === 0) {
      console.error('[contentTypeService] No content types were successfully processed');
      const cachedData = await getCachedContentTypes();
      if (cachedData) {
        console.log('[contentTypeService] Using cached content types as no new types were processed');
      }
      return cachedData;
    }

    // Cache the content types with error handling
    try {
      await AsyncStorage.setItem(
        CACHED_CONTENT_TYPES_KEY,
        JSON.stringify(contentTypeCache)
      );

      // Update last sync timestamp
      await AsyncStorage.setItem(
        CONTENT_TYPES_LAST_SYNC_KEY,
        new Date().toISOString()
      );

      console.log(`[contentTypeService] Successfully synced and cached ${Object.keys(contentTypeCache).length} content types`);
    } catch (storageError) {
      console.error('[contentTypeService] Error saving content types to cache:', storageError);
      // Return the data even if caching failed - app can still function
      console.log('[contentTypeService] Returning content types despite cache failure');
    }
    
    return contentTypeCache;
  } catch (error) {
    console.error('[contentTypeService] Error syncing content types:', error);
    
    // Check if it's a network error
    if (error instanceof Error) {
      if (error.message.includes('Network') || error.message.includes('timeout')) {
        console.log('[contentTypeService] Network error detected, app is likely offline');
      }
    }
    
    // Fallback to cached data on any error
    const cachedData = await getCachedContentTypes();
    if (cachedData) {
      console.log('[contentTypeService] Using cached content types due to sync error - app continues functioning offline');
    } else {
      console.error('[contentTypeService] No cached content types available - app may have limited functionality');
    }
    return cachedData;
  }
};

/**
 * Validate cached content type structure
 * @param cache - Cached content type data
 * @returns true if valid, false otherwise
 */
const isValidContentTypeCache = (cache: any): cache is ContentTypeCache => {
  if (typeof cache !== 'object' || cache === null) {
    console.error('[contentTypeService] Cache is not an object');
    return false;
  }

  // Check if cache has at least one content type
  const keys = Object.keys(cache);
  if (keys.length === 0) {
    console.warn('[contentTypeService] Cache is empty');
    return false;
  }

  // Validate structure of each content type in cache
  for (const key of keys) {
    const contentType = cache[key];
    
    if (!contentType || typeof contentType !== 'object') {
      console.error(`[contentTypeService] Content type ${key} is invalid`);
      return false;
    }

    // Check required properties
    if (!contentType.id || !contentType.name) {
      console.error(`[contentTypeService] Content type ${key} missing id or name`);
      return false;
    }

    if (!Array.isArray(contentType.fields)) {
      console.error(`[contentTypeService] Content type ${key} fields is not an array`);
      return false;
    }

    if (!Array.isArray(contentType.fieldOrder)) {
      console.error(`[contentTypeService] Content type ${key} fieldOrder is not an array`);
      return false;
    }

    // Validate each field
    for (const field of contentType.fields) {
      if (!field.id || !field.name || !field.type) {
        console.error(`[contentTypeService] Field in content type ${key} is missing required properties`);
        return false;
      }
    }
  }

  return true;
};

/**
 * Get cached content types from AsyncStorage
 * @returns ContentTypeCache object or null if not found
 */
const getCachedContentTypes = async (): Promise<ContentTypeCache | null> => {
  try {
    const cachedData = await AsyncStorage.getItem(CACHED_CONTENT_TYPES_KEY);
    
    if (!cachedData) {
      console.log('[contentTypeService] No cached content types found');
      return null;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(cachedData);
    } catch (parseError) {
      console.error('[contentTypeService] Failed to parse cached content types JSON:', parseError);
      console.log('[contentTypeService] Clearing corrupted cache');
      await AsyncStorage.removeItem(CACHED_CONTENT_TYPES_KEY);
      await AsyncStorage.removeItem(CONTENT_TYPES_LAST_SYNC_KEY);
      return null;
    }
    
    // Validate cache structure
    if (!isValidContentTypeCache(parsed)) {
      console.warn('[contentTypeService] Cached content types data is invalid or corrupted, clearing cache');
      await AsyncStorage.removeItem(CACHED_CONTENT_TYPES_KEY);
      await AsyncStorage.removeItem(CONTENT_TYPES_LAST_SYNC_KEY);
      return null;
    }

    console.log(`[contentTypeService] Successfully loaded ${Object.keys(parsed).length} content types from cache`);
    return parsed as ContentTypeCache;
  } catch (error) {
    console.error('[contentTypeService] Error reading cached content types:', error);
    
    // Attempt to clear corrupted cache
    try {
      await AsyncStorage.removeItem(CACHED_CONTENT_TYPES_KEY);
      await AsyncStorage.removeItem(CONTENT_TYPES_LAST_SYNC_KEY);
      console.log('[contentTypeService] Cleared corrupted cache');
    } catch (clearError) {
      console.error('[contentTypeService] Failed to clear corrupted cache:', clearError);
    }
    
    return null;
  }
};

/**
 * Get field order for a specific content type
 * @param contentTypeId - The ID of the content type
 * @returns Array of field IDs in display order, or null if not found
 */
export const getContentTypeFieldOrder = async (
  contentTypeId: string
): Promise<string[] | null> => {
  try {
    if (!contentTypeId) {
      console.error('[contentTypeService] getContentTypeFieldOrder called with empty contentTypeId');
      return null;
    }

    console.log(`[contentTypeService] Fetching field order for content type: ${contentTypeId}`);
    
    const contentTypeCache = await getCachedContentTypes();
    
    if (!contentTypeCache) {
      console.warn(`[contentTypeService] No content type cache available - app may be offline or cache is corrupted`);
      return null;
    }

    if (!contentTypeCache[contentTypeId]) {
      console.warn(`[contentTypeService] Content type ${contentTypeId} not found in cache`);
      console.log(`[contentTypeService] Available content types: ${Object.keys(contentTypeCache).join(', ')}`);
      return null;
    }

    const fieldOrder = contentTypeCache[contentTypeId].fieldOrder;
    console.log(`[contentTypeService] Retrieved field order with ${fieldOrder.length} fields for ${contentTypeId}`);
    return fieldOrder;
  } catch (error) {
    console.error(`[contentTypeService] Error getting field order for ${contentTypeId}:`, error);
    return null;
  }
};

/**
 * Get full metadata for a specific content type
 * @param contentTypeId - The ID of the content type
 * @returns ContentTypeMetadata object or null if not found
 */
export const getContentTypeMetadata = async (
  contentTypeId: string
): Promise<ContentTypeMetadata | null> => {
  try {
    if (!contentTypeId) {
      console.error('[contentTypeService] getContentTypeMetadata called with empty contentTypeId');
      return null;
    }

    console.log(`[contentTypeService] Fetching metadata for content type: ${contentTypeId}`);
    
    const contentTypeCache = await getCachedContentTypes();
    
    if (!contentTypeCache) {
      console.warn(`[contentTypeService] No content type cache available - app may be offline or cache is corrupted`);
      console.log('[contentTypeService] App will use fallback field ordering');
      return null;
    }

    if (!contentTypeCache[contentTypeId]) {
      console.warn(`[contentTypeService] Content type ${contentTypeId} not found in cache`);
      console.log(`[contentTypeService] Available content types: ${Object.keys(contentTypeCache).join(', ')}`);
      console.log('[contentTypeService] App will use fallback field ordering for this entry');
      return null;
    }

    const metadata = contentTypeCache[contentTypeId];
    console.log(`[contentTypeService] Retrieved metadata for ${contentTypeId}: ${metadata.name} with ${metadata.fields.length} fields`);
    return metadata;
  } catch (error) {
    console.error(`[contentTypeService] Error getting metadata for ${contentTypeId}:`, error);
    console.log('[contentTypeService] App will use fallback field ordering');
    return null;
  }
};

/**
 * Get the last sync timestamp for content types
 * @returns ISO timestamp string or null if never synced
 */
export const getContentTypesLastSync = async (): Promise<string | null> => {
  try {
    const timestamp = await AsyncStorage.getItem(CONTENT_TYPES_LAST_SYNC_KEY);
    if (timestamp) {
      console.log(`[contentTypeService] Last content type sync: ${timestamp}`);
    } else {
      console.log('[contentTypeService] Content types have never been synced');
    }
    return timestamp;
  } catch (error) {
    console.error('[contentTypeService] Error getting last sync timestamp:', error);
    return null;
  }
};

/**
 * Check if content types need to be synced (24-hour TTL)
 * @returns true if sync is needed, false otherwise
 */
export const shouldSyncContentTypes = async (): Promise<boolean> => {
  try {
    const lastSync = await getContentTypesLastSync();
    
    if (!lastSync) {
      console.log('[contentTypeService] Content types need sync: never synced before');
      return true;
    }

    const lastSyncDate = new Date(lastSync);
    const now = new Date();
    const hoursSinceLastSync = (now.getTime() - lastSyncDate.getTime()) / (1000 * 60 * 60);

    // Sync if more than 24 hours have passed
    const needsSync = hoursSinceLastSync >= 24;
    
    if (needsSync) {
      console.log(`[contentTypeService] Content types need sync: ${hoursSinceLastSync.toFixed(1)} hours since last sync (TTL: 24 hours)`);
    } else {
      console.log(`[contentTypeService] Content types are up to date: ${hoursSinceLastSync.toFixed(1)} hours since last sync`);
    }
    
    return needsSync;
  } catch (error) {
    console.error('[contentTypeService] Error checking if sync is needed:', error);
    // Default to syncing on error to ensure fresh data
    console.log('[contentTypeService] Defaulting to sync due to error');
    return true;
  }
};

/**
 * Force sync content types regardless of TTL
 * Useful when you know content types have changed in Contentful
 * @returns ContentTypeCache object or null on error
 */
export const forceSyncContentTypes = async (): Promise<ContentTypeCache | null> => {
  console.log('[contentTypeService] Force syncing content types (ignoring TTL)...');
  return await syncContentTypes();
};
