/* eslint-disable react/no-unstable-nested-components */
import { View, Text, StyleSheet, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import { networkApi } from '../https/api'
import { url, urlEndPoints } from '../https/apiConfig'
import { useRoute, RouteProp } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { fetchEntry } from '../components/contentful/fetchEntry'
import { HEIGHT, WIDTH } from '../constants/dimensions'
import moment from 'moment'

// Define types
interface RouteParams {
    id: string;
    entry_id: string;
}

interface ContentfulEntry {
    fields: Record<string, string>;
}

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

    const { entry_id, id } = route?.params

    useEffect(() => {
        // setLoader(true)
        // setContentLoader(true)
        getDetailAPI()
        fetchEntry(entry_id).then(async (response) => {
            setEntry(response)

            await AsyncStorage.setItem('cachedSDKEntries', JSON.stringify(response));
        }).catch((e) => {
            // setContentLoader(false)
        });
    }, []);

    const getDetailAPI = async () => {
        try {
            const apiUrl = `${url.laravelApi()}${urlEndPoints.activitiesDetail(id)}`
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

    const DynamicContentRenderer = ({ contentfulEntry, apiData }) => {
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

        return (
            <View>
                {Object.entries(fields).map(([key, value], index) => {
                    if (!fieldMapping[key]) return null;
                    const apiValue = fieldMapping[key](apiData);
                    console.log("index=>", key, apiValue);
                    
                    return (
                        <View key={key} style={{}}>
                            {key === 'enterImageTitle' ? (
                                <View>
                                    <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                                        {value || 'No title'}
                                    </Text>
                                    <Image source={{uri: `${url.laravelApi()}${apiValue}`}} style={{width: WIDTH * 0.5, height: HEIGHT * 0.2, resizeMode: 'contain'}} />
                                </View>
                            ) : (
                                <View>
                                    <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                                        {value || 'No title'}
                                    </Text>
                                    <Text style={{ fontSize: 14 }}>{apiValue}</Text>
                                </View>
                            )}

                            {index < Object.keys(fieldMapping).length && <View style={{width: '100%', borderTopWidth: 1, borderColor: 'grey', marginVertical: 10}} />}
                        </View>
                    );
                })}
            </View>
        );
    };

    console.log("entry=>", entry);

    return (
        <View style={{ padding: 20 }}>
            <DynamicContentRenderer
                contentfulEntry={entry || {}}
                apiData={activitiesDetail}
            />
        </View>
    )
}

export default ActivityDetailScreen