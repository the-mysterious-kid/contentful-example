/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-native/no-inline-styles */
import { View, Text, StyleSheet, ActivityIndicator, FlatList, Pressable } from 'react-native'
import React, { useEffect, useState } from 'react'
import { fetchEntry } from '../components/contentful/fetchEntry';
import { renderRichText } from '../components/contentful/RichTextRenderer';
import { useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { networkApi } from '../https/api';
import { url, urlEndPoints } from '../https/apiConfig';
import { HEIGHT, WIDTH } from '../constants/dimensions';


const SdkLiveScreen = () => {
    const [entry, setEntry] = useState<any>(null);
    const route = useRoute()
    const { entry_id } = route?.params || {}
    const [activityList, setActivityList] = useState()
    const [page, setPage] = useState('1')
    const [loader, setLoader] = useState(false)
    const [contentLoader, setContentLoader] = useState(false)

    useEffect(() => {
        setLoader(true)
        setContentLoader(true)
        getListAPI()
        fetchEntry(entry_id).then(async (response) => {
            setEntry(response)
            setContentLoader(false)
            await AsyncStorage.setItem('cachedSDKEntries', JSON.stringify(response));
        }).catch((e) => {
            setContentLoader(false)
        });
    }, []);

    const fields = entry?.fields || {};

    const getListAPI = async () => {
        try {
            const apiUrl = `${url.laravelApi()}${urlEndPoints.activitiesList(page)}`
            const response = await networkApi(apiUrl, 'GET')
            if (response?.data?.response?.result) {
                setActivityList(response?.data?.response?.result)
                setLoader(false)
            } else {
                setLoader(false)
                setActivityList([])
            }
        } catch (error) {
            console.log("Error=>", error)
        }
    }

    return (
        <View style={{ flex: 1 }}>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: WIDTH }}>
                {contentLoader ? (
                    <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1, paddingVertical: HEIGHT * 0.08, width: '100%' }}>
                        <ActivityIndicator size={'large'} />
                    </View>
                ) : (
                    <View style={{alignItems: 'center'}}>
                        <Text style={styles.header}>Contentful</Text>
                        {fields.description && renderRichText(fields.description)}
                    </View>
                )}
                {/* {fields.dateField && (
                    <Text style={styles.dateText}>
                        Date: {new Date(fields.dateField).toLocaleDateString()}
                    </Text>
                )}
                {fields.jsonField && (
                    <Text style={styles.jsonText}>
                        JSON: {JSON.stringify(fields.jsonField?.['en-US'])}
                    </Text>
                )} */}

                <View style={{ borderWidth: 1, width: WIDTH, marginVertical: HEIGHT * 0.04 }} />
                <Text style={[styles.header]}>
                    TMS
                </Text>
                <FlatList
                    data={activityList?.activities}
                    contentContainerStyle={{ gap: HEIGHT * 0.02, width: WIDTH * 0.75 }}
                    renderItem={({ item }) => (
                        <Pressable style={{ borderWidth: 0.3, borderRadius: 8, paddingVertical: HEIGHT * 0.01, paddingHorizontal: WIDTH * 0.03 }}>
                            <Text style={{ color: 'black', fontSize: 18 }}>{item?.title}</Text>
                            <Text style={{ color: '#A1670D', fontSize: 12, paddingVertical: HEIGHT * 0.01 }}>{item?.date_time}</Text>
                            <Text style={{ color: 'black', fontSize: 14 }} numberOfLines={2}>{item?.description}</Text>
                        </Pressable>
                    )}
                    ListEmptyComponent={() => loader ? (
                        <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1, paddingVertical: HEIGHT * 0.08 }}>
                            <ActivityIndicator size={'large'} />
                        </View>
                    ) : (!activityList?.activities && (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Text>No data</Text>
                        </View>
                    ))}
                />
            </View>
        </View>
    )
}

export default SdkLiveScreen

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    header: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    image: {
        width: '100%',
        height: 300,
        marginBottom: 15,
        borderRadius: 10,
    },
    dateText: {
        marginTop: 20,
        fontStyle: 'italic',
        color: '#555',
    },
    jsonText: {
        marginTop: 10,
        fontFamily: 'Courier',
        color: '#444',
    },
});