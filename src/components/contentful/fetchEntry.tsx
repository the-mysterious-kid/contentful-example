// fetchEntry.ts
// import { contentfulClient } from './contentfulClient';

import AsyncStorage from "@react-native-async-storage/async-storage";
import { contentfulClient } from "./contentfulClient";
import { syncContent } from "./syncService";

const CACHED_ENTRIES_KEY = 'cachedSDKEntries';

export const fetchEntry = async (entryId: string) => {
  try {
    // Run sync and get updated cache
    const syncedEntries = await syncContent();

    if (syncedEntries && syncedEntries[entryId]) {
      return syncedEntries[entryId];
    }

    // Fallback: fetch directly if not in sync results
    const entry = await contentfulClient.getEntry(entryId);

    // Load existing cache and update with fetched entry
    const existingCache = await AsyncStorage.getItem(CACHED_ENTRIES_KEY);
    const cache = existingCache ? JSON.parse(existingCache) : {};
    cache[entryId] = entry;

    await AsyncStorage.setItem(CACHED_ENTRIES_KEY, JSON.stringify(cache));

    return entry;
  } catch (error) {
    console.error('Error fetching entry:', error);
    return null;
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

