import { View, Text, ScrollView, StyleSheet } from 'react-native'
import React, { useEffect, useState } from 'react'
import { fetchEntry } from '../components/contentful/fetchEntry';
import { renderRichText } from '../components/contentful/RichTextRenderer';
import { useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';


const SdkLiveScreen = () => {
    const [entry, setEntry] = useState<any>(null);
    const route = useRoute()
    const { entry_id } = route?.params || {}

    useEffect(() => {
        fetchEntry(entry_id).then(async (response) => {
            setEntry(response)
            await AsyncStorage.setItem('cachedSDKEntries', JSON.stringify(response));
        });
    }, []);

    const fields = entry?.fields || {};


    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', }}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.header}>{fields.headerText}</Text>
                {fields.description && renderRichText(fields.description)}
                {fields.dateField && (
                    <Text style={styles.dateText}>
                        Date: {new Date(fields.dateField).toLocaleDateString()}
                    </Text>
                )}
                {fields.jsonField && (
                    <Text style={styles.jsonText}>
                        JSON: {JSON.stringify(fields.jsonField?.['en-US'])}
                    </Text>
                )}
            </ScrollView>
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