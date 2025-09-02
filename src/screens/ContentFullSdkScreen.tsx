import { View, Text, Pressable } from 'react-native'
import React from 'react'
import { useNavigation } from '@react-navigation/native';


const ContentFullSdkScreen = () => {
    const navigation = useNavigation()
    const ENTRY_ID = '3ewjIbs59TA5rmXTZ2ImCT';

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Pressable onPress={() => navigation.navigate('SdkLiveScreen', { entry_id: ENTRY_ID })} style={{ backgroundColor: '#B0B0B0', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, marginBottom: 10 }}   >
                <Text style={{ color: 'black', fontWeight: 'bold' }}>SDK Live</Text>
            </Pressable>
            <Pressable onPress={() => navigation.navigate('SdkLocalScreen')} style={{ backgroundColor: '#B0B0B0', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 }}  >
                <Text style={{ color: 'black', fontWeight: 'bold' }}>SDK Local</Text>
            </Pressable>
        </View>
    )
}

export default ContentFullSdkScreen
