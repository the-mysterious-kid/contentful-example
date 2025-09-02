import { View, Text, Image, ScrollView, StyleSheet } from 'react-native'
import React, { useEffect, useState } from 'react'
import { renderRichText } from '../components/contentful/RichTextRenderer';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RestLocalScreen = () => {
    const [entry, setEntry] = useState<any>(null);

    useEffect(() => {
        const loadLocalData = async () => {
            const cached = await AsyncStorage.getItem('cachedRestData');
            if (cached) {
                setEntry(JSON.parse(cached));
            }
        };
        loadLocalData();
    }, []);

    const fields = entry?.fields || {};

    if (!entry) {
        return (
            <View style={styles.centered}>
                <Text style={styles.noDataText}>No data available</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
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
                        JSON: {JSON.stringify(fields.jsonField)}
                    </Text>
                )}
            </ScrollView>
        </View>
    );
};

export default RestLocalScreen;

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 15,
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
    noDataText: {
        fontSize: 18,
        color: '#888',
    },
});
