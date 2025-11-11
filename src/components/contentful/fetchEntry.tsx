// fetchEntry.ts
// import { contentfulClient } from './contentfulClient';

import AsyncStorage from "@react-native-async-storage/async-storage";
import { contentfulClient } from "./contentfulClient";
import { syncContent } from "./syncService";

const CACHED_ENTRIES_KEY = 'cachedSDKEntries';

// TypeScript interface for Contentful entry structure
export interface ContentfulEntry {
  sys: {
    id: string;
    contentType: {
      sys: {
        id: string;
      };
    };
    [key: string]: any;
  };
  fields: Record<string, any>;
}

export const fetchEntry = async (entryId: string): Promise<ContentfulEntry | null> => {
  try {
    // Run sync and get updated cache
    const syncResult = await syncContent();
    const syncedEntries = syncResult.entries;

    if (syncedEntries && syncedEntries[entryId]) {
      const cachedEntry = syncedEntries[entryId];
      
      // Verify content type ID is accessible
      if (cachedEntry.sys?.contentType?.sys?.id) {
        console.log(`[fetchEntry] Content type ID for entry ${entryId}: ${cachedEntry.sys.contentType.sys.id}`);
      } else {
        console.warn(`[fetchEntry] Content type ID missing for entry ${entryId}`);
      }
      
      return cachedEntry;
    }

    // Fallback: fetch directly if not in sync results
    const entry = await contentfulClient.getEntry(entryId);

    // Load existing cache safely
    const existingCache = await AsyncStorage.getItem(CACHED_ENTRIES_KEY);
    let cache: Record<string, ContentfulEntry> = {};

    if (existingCache) {
      try {
        const parsed = JSON.parse(existingCache);
        if (typeof parsed === "object" && parsed !== null) {
          cache = parsed;
        }
      } catch (e) {
        console.warn("Corrupted cache, resetting:", e);
      }
    }

    // Preserve sys metadata including content type reference
    const cachedEntry: ContentfulEntry = {
      ...entry,
      sys: {
        ...entry.sys,
        contentType: entry.sys.contentType,
      },
      fields: entry.fields,
    };

    cache[entryId] = cachedEntry;

    await AsyncStorage.setItem(CACHED_ENTRIES_KEY, JSON.stringify(cache));

    // Verify content type ID is accessible after caching
    if (cachedEntry.sys?.contentType?.sys?.id) {
      console.log(`[fetchEntry] Content type ID for entry ${entryId} (direct fetch): ${cachedEntry.sys.contentType.sys.id}`);
    } else {
      console.warn(`[fetchEntry] Content type ID missing for entry ${entryId} (direct fetch)`);
    }

    return cachedEntry;
  } catch (error) {
    console.error("Error fetching entry:", error);
    return null;
  }
};


/**
 * Verify that content type ID is accessible from cached entries
 * This function reads from cache and validates the structure
 */
export const verifyContentTypeInCache = async (entryId: string): Promise<boolean> => {
  try {
    const cachedData = await AsyncStorage.getItem(CACHED_ENTRIES_KEY);
    
    if (!cachedData) {
      console.warn(`[verifyContentTypeInCache] No cached data found`);
      return false;
    }

    const cache = JSON.parse(cachedData);
    const entry = cache[entryId];

    if (!entry) {
      console.warn(`[verifyContentTypeInCache] Entry ${entryId} not found in cache`);
      return false;
    }

    // Verify the structure
    const hasContentTypeId = entry.sys?.contentType?.sys?.id;
    
    if (hasContentTypeId) {
      console.log(`[verifyContentTypeInCache] ✓ Content type ID accessible: ${entry.sys.contentType.sys.id}`);
      return true;
    } else {
      console.error(`[verifyContentTypeInCache] ✗ Content type ID NOT accessible for entry ${entryId}`);
      console.error(`[verifyContentTypeInCache] Entry structure:`, JSON.stringify(entry.sys, null, 2));
      return false;
    }
  } catch (error) {
    console.error(`[verifyContentTypeInCache] Error:`, error);
    return false;
  }
};

export const fetchAPI = async (entryId: string) => {
  const SPACE_ID = 'ibxmnczwhjyl';
  const ACCESS_TOKEN = '2xacpYlMfz58Vks7_pFrd496mDQflbaOVaPDD7UlzXo';

  const url = `https://cdn.contentful.com/spaces/${SPACE_ID}/environments/master/entries/${entryId}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching entry:', error);
    return null;
  }
};

