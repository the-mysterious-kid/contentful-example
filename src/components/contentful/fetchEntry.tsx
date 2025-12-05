import AsyncStorage from "@react-native-async-storage/async-storage";
import { contentfulClient } from "./contentfulClient";
import { syncContent } from "./syncService";

const CACHED_ENTRIES_KEY = 'cachedSDKEntries';

export interface ContentfulEntry {
  sys: {
    id: string;
    contentType: { sys: { id: string } };
    [key: string]: any;
  };
  fields: Record<string, any>;
}

const logContentTypeId = (entryId: string, entry: ContentfulEntry, source: string) => {
  const ctId = entry.sys?.contentType?.sys?.id;
  if (ctId) {
    console.log(`[fetchEntry] Entry ${entryId} (${source}): content type ${ctId}`);
  } else {
    console.warn(`[fetchEntry] Entry ${entryId} (${source}): missing content type ID`);
  }
};

const loadCache = async (): Promise<Record<string, ContentfulEntry>> => {
  try {
    const cached = await AsyncStorage.getItem(CACHED_ENTRIES_KEY);
    if (!cached) return {};

    const parsed = JSON.parse(cached);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch (error) {
    console.warn("[fetchEntry] Corrupted cache, resetting:", error);
    return {};
  }
};

export const fetchEntry = async (entryId: string): Promise<ContentfulEntry | null> => {
  try {
    // Try to get from sync first
    const { entries } = await syncContent();
    if (entries?.[entryId]) {
      logContentTypeId(entryId, entries[entryId], 'sync');
      return entries[entryId];
    }

    // Fallback: direct fetch
    const entry = await contentfulClient.getEntry(entryId, {
      include: 10, // loads nested linked entries
    });
    const cache = await loadCache();

    const cachedEntry: ContentfulEntry = {
      ...entry,
      sys: { ...entry.sys, contentType: entry.sys.contentType },
      fields: entry.fields,
    };

    cache[entryId] = cachedEntry;
    await AsyncStorage.setItem(CACHED_ENTRIES_KEY, JSON.stringify(cache));

    logContentTypeId(entryId, cachedEntry, 'direct');
    return cachedEntry;
  } catch (error) {
    console.error("[fetchEntry] Error:", error);
    return null;
  }
};

export const verifyContentTypeInCache = async (entryId: string): Promise<boolean> => {
  try {
    const cache = await loadCache();
    const entry = cache[entryId];

    if (!entry) {
      console.warn(`[verifyContentTypeInCache] Entry ${entryId} not in cache`);
      return false;
    }

    const ctId = entry.sys?.contentType?.sys?.id;
    if (ctId) {
      console.log(`[verifyContentTypeInCache] ✓ Entry ${entryId}: content type ${ctId}`);
      return true;
    }

    console.error(`[verifyContentTypeInCache] ✗ Entry ${entryId}: missing content type ID`);
    return false;
  } catch (error) {
    console.error(`[verifyContentTypeInCache] Error:`, error);
    return false;
  }
};

