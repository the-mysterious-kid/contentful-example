import AsyncStorage from '@react-native-async-storage/async-storage';
import { contentfulClient } from './contentfulClient';

const SYNC_TOKEN_KEY = 'contentful_sdk_sync_token';
const CACHED_ENTRIES_KEY = 'cachedSDKEntries';
const DEFAULT_LOCALE = 'en-US'; // Change if needed

export const syncContent = async () => {
    try {
        const savedToken = await AsyncStorage.getItem(SYNC_TOKEN_KEY);

        const response = savedToken
            ? await contentfulClient.sync({ nextSyncToken: savedToken })
            : await contentfulClient.sync({ initial: true });

        const { entries = [], nextSyncToken } = response;

        // Load existing cache
        const existingCache = await AsyncStorage.getItem(CACHED_ENTRIES_KEY);
        let cachedEntries = existingCache ? JSON.parse(existingCache) : {};

        // Merge or update entries in cache
        for (const entry of entries) {
            const flattenedFields = {};

            for (const key in entry.fields) {
                if (entry.fields[key] && typeof entry.fields[key] === 'object' && entry.fields[key][DEFAULT_LOCALE] !== undefined) {
                    flattenedFields[key] = entry.fields[key][DEFAULT_LOCALE];
                } else {
                    flattenedFields[key] = entry.fields[key]; // Fallback
                }
            }

            cachedEntries[entry.sys.id] = {
                ...entry,
                fields: flattenedFields,
            };
        }

        // Save merged entries and new sync token
        await AsyncStorage.setItem(CACHED_ENTRIES_KEY, JSON.stringify(cachedEntries));
        await AsyncStorage.setItem(SYNC_TOKEN_KEY, nextSyncToken);

        return cachedEntries;
    } catch (error) {
        console.error('Sync API Error:', error);
        return null;
    }
};
