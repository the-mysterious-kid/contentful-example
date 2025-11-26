/* eslint-disable react/no-unstable-nested-components */
import { View, Text, Image, ActivityIndicator } from 'react-native'
import React, { useEffect, useState, useCallback, useRef } from 'react'
import { networkApi } from '../https/api'
import { url, urlEndPoints } from '../https/apiConfig'
import { useRoute, RouteProp, useFocusEffect } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { fetchEntry, verifyContentTypeInCache, ContentfulEntry as ImportedContentfulEntry } from '../components/contentful/fetchEntry'
import { HEIGHT, WIDTH } from '../constants/dimensions'
import moment from 'moment'
import { getContentTypeMetadata, ContentTypeMetadata } from '../components/contentful/contentTypeService'
import { syncContent } from '../components/contentful/syncService'

// Define types
interface RouteParams {
    id: string;
    entry_id: string;
}

// Use the imported type from fetchEntry
type ContentfulEntry = ImportedContentfulEntry;

interface ApiData {
    timings?: {
        date?: string;
        start_time?: string;
        end_date?: string;
        end_time?: string;
    };
    location?: {
        address?: string;
    };
    contact_details?: {
        email?: string;
    };
    ticket_type?: Array<{ title: string }>;
}

interface DynamicContentRendererProps {
    contentfulEntry: ContentfulEntry | null;
    apiData: ApiData | null;
}

const ActivityDetailScreen = () => {
    const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
    // Remove unused destructuring since id and entry_id are not used
    const [entry, setEntry] = useState<ContentfulEntry | null>(null);
    const [activitiesDetail, setActivityDetail] = useState<ApiData | null>(null);
    const [contentTypeMetadata, setContentTypeMetadata] = useState<ContentTypeMetadata | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    
    // Use refs to store values that shouldn't trigger re-renders
    const contentTypeIdRef = useRef<string | null>(null);
    const syncInProgress = useRef(false);

    // const { entry_id, id } = route?.params

    /**
     * Load content type metadata for a given content type ID
     */
    const loadContentTypeMetadata = async (ctId: string) => {
        try {
            const metadata = await getContentTypeMetadata(ctId);
            if (metadata) {
                console.log(`[ActivityDetailScreen] Loaded content type metadata with ${metadata.fieldOrder.length} fields`);
                setContentTypeMetadata(metadata);
            } else {
                console.warn('[ActivityDetailScreen] Content type metadata not found, will use fallback ordering');
                setContentTypeMetadata(null);
            }
        } catch (error) {
            console.error('[ActivityDetailScreen] Error fetching content type metadata:', error);
            setContentTypeMetadata(null);
        }
    };

    /**
     * Load initial entry data
     */
    const loadInitialData = async () => {
        try {
            const response = await fetchEntry("3ewjIbs59TA5rmXTZ2ImCT");
            setEntry(response);

            // Extract content type ID from entry and store in ref
            if (response?.sys?.contentType?.sys?.id) {
                const ctId = response.sys.contentType.sys.id;
                contentTypeIdRef.current = ctId;
                console.log(`[ActivityDetailScreen] Content type ID: ${ctId}`);
                
                // Load content type metadata
                await loadContentTypeMetadata(ctId);
                
                // Verify it's also accessible from cache
                await verifyContentTypeInCache("3ewjIbs59TA5rmXTZ2ImCT");
            } else {
                console.error('[ActivityDetailScreen] Content type ID not accessible in response');
            }

            await AsyncStorage.setItem('cachedSDKEntries', JSON.stringify(response));
        } catch (error) {
            console.error('[ActivityDetailScreen] Error loading initial data:', error);
        }
    };

    /**
     * Sync content - force refresh content types and entries
     */
    const performSync = async () => {
        // Check ref to prevent concurrent syncs
        if (syncInProgress.current) {
            console.log('[ActivityDetailScreen] Sync already in progress, skipping');
            return;
        }

        syncInProgress.current = true;
        setIsSyncing(true);
        console.log('[ActivityDetailScreen] Starting sync...');

        try {
            // Force sync content types to pick up field order changes
            const result = await syncContent(true);
            
            if (result.contentTypesUpdated) {
                console.log('[ActivityDetailScreen] Content types updated, reloading metadata...');
                
                // Reload content type metadata using ref (doesn't cause re-render)
                if (contentTypeIdRef.current) {
                    await loadContentTypeMetadata(contentTypeIdRef.current);
                    console.log('[ActivityDetailScreen] Content type metadata reloaded successfully');
                }
            }

            // Reload entry data
            const response = await fetchEntry("3ewjIbs59TA5rmXTZ2ImCT");
            setEntry(response);
            
            console.log('[ActivityDetailScreen] Sync completed successfully');
        } catch (error) {
            console.error('[ActivityDetailScreen] Error during sync:', error);
        } finally {
            syncInProgress.current = false;
            setIsSyncing(false);
        }
    };

    // Initial load on mount
    useEffect(() => {
        getDetailAPI();
        loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty deps - only run once on mount

    /**
     * Auto-sync when screen comes into focus
     * Uses stable callback with no dependencies to prevent infinite loops
     */
    useFocusEffect(
        useCallback(() => {
            console.log('[ActivityDetailScreen] Screen focused, syncing content...');
            performSync();
            
            // Cleanup function (optional)
            return () => {
                console.log('[ActivityDetailScreen] Screen unfocused');
            };
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []) // Empty deps - stable callback that never changes
    );



    const getDetailAPI = async () => {
        try {
            const apiUrl = `${url.laravelApi()}${urlEndPoints.activitiesDetail('1196')}`
            // const apiUrl = `${url.laravelApi()}${urlEndPoints.activitiesDetail(id)}`
            console.log("apiUrl=>", apiUrl);
            const response = await networkApi(apiUrl, 'GET')
            
            if (response?.data?.response?.result) {
                setActivityDetail(response?.data?.response?.result)
                console.log("response?.data?.response?.result=>", response?.data?.response?.result);
                
                // setLoader(false)
            } else {
                // setLoader(false)
                // setActivityList([])
            }
        } catch (error) {
            console.log("Error1=>", error)
        }
    }

    const fieldMapping: Record<string, (apiData: any) => string> = {
        dateAndTime: (api) => {
            const { date, start_time, end_date, end_time } = api?.timings || {};
            return `Start: ${moment(date).format('DD MMMM YYYY')} ${start_time} \nEnd: ${moment(end_date).format('DD MMMM YYYY')} ${end_time}`;
        },
        locationTitle: (api) => api?.location?.address || "N/A",
        enterContactHeader: (api) => api?.contact_details?.email || "N/A",
        enterTicketInformationHeader: (api) => api?.ticket_type || "N/A",
        enterImageTitle: (api) => api?.cover_image || "",
    };

    /**
     * Get ordered field entries based on content type metadata
     * Falls back to Object.entries() if metadata is unavailable
     */
    const getOrderedFields = (
        fields: Record<string, any>,
        metadata: ContentTypeMetadata | null
    ): Array<[string, any]> => {
        // Fallback to Object.entries() when metadata is unavailable
        if (!metadata || !metadata.fieldOrder) {
            console.log('[ActivityDetailScreen] Using fallback field ordering (Object.entries)');
            return Object.entries(fields);
        }

        const { fieldOrder } = metadata;
        const orderedEntries: Array<[string, any]> = [];

        // First, add fields in the order specified by content type
        for (const fieldId of fieldOrder) {
            if (fields.hasOwnProperty(fieldId)) {
                orderedEntries.push([fieldId, fields[fieldId]]);
            }
        }

        // Then, add any fields present in entry but not in content type definition
        // This handles cases where entry has fields not in content type
        for (const [key, value] of Object.entries(fields)) {
            if (!fieldOrder.includes(key)) {
                console.log(`[ActivityDetailScreen] Field "${key}" not in content type definition, appending to end`);
                orderedEntries.push([key, value]);
            }
        }

        console.log(`[ActivityDetailScreen] Ordered ${orderedEntries.length} fields based on content type metadata`);
        return orderedEntries;
    };

    const DynamicContentRenderer: React.FC<DynamicContentRendererProps> = ({ contentfulEntry, apiData }) => {
        // Show loading if either data is missing
        if (!contentfulEntry || !apiData) {
            return (
                <View style={{ padding: 20 }}>
                    <Text>Loading...</Text>
                </View>
            );
        }

        // Check if contentful entry has fields
        if (!contentfulEntry.fields) {
            return (
                <View style={{ padding: 20 }}>
                    <Text>No content available</Text>
                </View>
            );
        }
        const { fields } = contentfulEntry;

        // Get the hideContactSection value from the entry
        const hideContactSection = fields.hideContactSection ?? false;

        // Get ordered fields based on content type metadata
        const orderedFields = getOrderedFields(fields, contentTypeMetadata);

        return (
            <View>
                {/* Display hideContactSection value */}
                <View style={{ backgroundColor: '#F5F5F5', borderRadius: 8, paddingBottom: 20 }}>
                    <Text style={{ fontWeight: "bold", fontSize: 14, color: '#333' }}>
                        Hide Contact Section: {String(hideContactSection)}
                    </Text>
                </View>

                {orderedFields.map(([key, value], index) => {
                    // Skip rendering enterContactHeader if hideContactSection is true
                    if (key === 'enterContactHeader' && hideContactSection) {
                        return null;
                    }

                    if (!fieldMapping[key]) return null;
                    const apiValue = fieldMapping[key](apiData);
                    console.log("index=>", key, apiValue);
                    
                    return (
                        <View key={key} style={{}}>
                            {key === 'enterImageTitle' ? (
                                <View>
                                    <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                                        {String(value || 'No title')}
                                    </Text>
                                    <Image source={{uri: `${url.laravelApi()}${apiValue}`}} style={{width: WIDTH * 0.5, height: HEIGHT * 0.2, resizeMode: 'contain'}} />
                                </View>
                            ) : (
                                <View>
                                    <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                                        {String(value || 'No title')}
                                    </Text>
                                    <Text style={{ fontSize: 14 }}>{apiValue}</Text>
                                </View>
                            )}

                            {index < orderedFields.length - 1 && <View style={{width: '100%', borderTopWidth: 1, borderColor: 'grey', marginVertical: 10}} />}
                        </View>
                    );
                })}
            </View>
        );
    };

    console.log("activitiesDetail=>", activitiesDetail);
    console.log("entry=>", entry);

    return (
        <View style={{ padding: 20 }}>
            {/* Show syncing indicator when loading */}
            {isSyncing && (
                <View style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    paddingVertical: 10,
                    marginBottom: 10,
                    backgroundColor: '#F0F0F0',
                    borderRadius: 8
                }}>
                    <ActivityIndicator size="small" color="#4A90E2" style={{ marginRight: 10 }} />
                    <Text style={{ color: '#4A90E2', fontSize: 14 }}>
                        Syncing content...
                    </Text>
                </View>
            )}

            <DynamicContentRenderer
                contentfulEntry={entry}
                apiData={activitiesDetail}
            />
        </View>
    )
}

export default ActivityDetailScreen