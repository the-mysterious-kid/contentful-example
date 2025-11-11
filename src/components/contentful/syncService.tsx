import AsyncStorage from '@react-native-async-storage/async-storage';
import { contentfulClient } from './contentfulClient';
import { syncContentTypes, shouldSyncContentTypes } from './contentTypeService';

const SYNC_TOKEN_KEY = 'contentful_sdk_sync_token';
const CACHED_ENTRIES_KEY = 'cachedSDKEntries';
const DEFAULT_LOCALE = 'en-US'; // Change if needed

// Return type for syncContent function
export interface SyncContentResult {
    entries: Record<string, any> | null;
    contentTypesUpdated: boolean;
}

export const syncContent = async (forceContentTypeSync: boolean = false): Promise<SyncContentResult> => {
    let contentTypesUpdated = false;

    try {
        // Check if content types need to be synced (24-hour TTL) or force sync
        console.log('[syncService] Checking if content types need sync...');
        const needsContentTypeSync = forceContentTypeSync || await shouldSyncContentTypes();
        
        if (needsContentTypeSync) {
            if (forceContentTypeSync) {
                console.log('[syncService] Force syncing content types (user requested)...');
            } else {
                console.log('[syncService] Content types need sync, fetching...');
            }
            const contentTypesResult = await syncContentTypes();
            contentTypesUpdated = contentTypesResult !== null;
            
            if (contentTypesUpdated) {
                console.log('[syncService] Content types successfully synced and cached');
            } else {
                console.warn('[syncService] Content type sync failed, app will use cached data if available');
            }
        } else {
            console.log('[syncService] Content types are up to date, skipping sync');
        }

        // Continue with existing entry sync logic
        console.log('[syncService] Starting entry sync...');
        const savedToken = await AsyncStorage.getItem(SYNC_TOKEN_KEY);

        if (savedToken) {
            console.log('[syncService] Using existing sync token for incremental sync');
        } else {
            console.log('[syncService] No sync token found, performing initial sync');
        }

        const response = savedToken
            ? await contentfulClient.sync({ nextSyncToken: savedToken })
            : await contentfulClient.sync({ initial: true });

        const { entries = [], nextSyncToken } = response;
        console.log(`[syncService] Received ${entries.length} entries from Contentful`);

        // Load existing cache
        const existingCache = await AsyncStorage.getItem(CACHED_ENTRIES_KEY);
        let cachedEntries = existingCache ? JSON.parse(existingCache) : {};

        // Merge or update entries in cache
        for (const entry of entries) {
            const flattenedFields: Record<string, any> = {};

            for (const key in entry.fields) {
                const fieldValue = (entry.fields as any)[key];
                if (fieldValue && typeof fieldValue === 'object' && fieldValue[DEFAULT_LOCALE] !== undefined) {
                    flattenedFields[key] = fieldValue[DEFAULT_LOCALE];
                } else {
                    flattenedFields[key] = fieldValue; // Fallback
                }
            }

            // Preserve sys metadata including content type reference
            const cachedEntry = {
                ...entry,
                fields: flattenedFields,
                sys: {
                    ...entry.sys,
                    contentType: entry.sys.contentType,
                },
            };

            // Verify content type ID is preserved
            if (cachedEntry.sys?.contentType?.sys?.id) {
                console.log(`[syncService] Cached entry ${entry.sys.id} with content type: ${cachedEntry.sys.contentType.sys.id}`);
            } else {
                console.warn(`[syncService] Content type ID missing for entry ${entry.sys.id}`);
            }

            cachedEntries[entry.sys.id] = cachedEntry;
        }

        // Save merged entries and new sync token
        await AsyncStorage.setItem(CACHED_ENTRIES_KEY, JSON.stringify(cachedEntries));
        if (nextSyncToken) {
            await AsyncStorage.setItem(SYNC_TOKEN_KEY, nextSyncToken);
            console.log('[syncService] Saved new sync token');
        }

        console.log(`[syncService] Successfully synced ${Object.keys(cachedEntries).length} total entries`);

        return {
            entries: cachedEntries,
            contentTypesUpdated,
        };
    } catch (error) {
        console.error('[syncService] Sync API Error:', error);
        
        // Check if it's a network error
        if (error instanceof Error) {
            if (error.message.includes('Network') || error.message.includes('timeout')) {
                console.log('[syncService] Network error detected - app is offline');
            }
        }
        
        // Return cached entries on error to ensure app continues functioning
        console.log('[syncService] Attempting to load cached entries for offline support...');
        try {
            const existingCache = await AsyncStorage.getItem(CACHED_ENTRIES_KEY);
            const cachedEntries = existingCache ? JSON.parse(existingCache) : null;
            
            if (cachedEntries) {
                console.log(`[syncService] Successfully loaded ${Object.keys(cachedEntries).length} cached entries - app continues functioning offline`);
            } else {
                console.warn('[syncService] No cached entries available - app may have limited functionality');
            }
            
            return {
                entries: cachedEntries,
                contentTypesUpdated,
            };
        } catch (cacheError) {
            console.error('[syncService] Error reading cache:', cacheError);
            console.error('[syncService] App cannot function without cached data');
            return {
                entries: null,
                contentTypesUpdated,
            };
        }
    }
};
