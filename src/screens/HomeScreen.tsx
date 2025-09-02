import { View, Text, Pressable } from 'react-native';
import React from 'react';
import { useNavigation } from '@react-navigation/native';

const HomeScreen = () => {
  const navigation = useNavigation()
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Pressable onPress={() => navigation.navigate('ContentFullSdkScreen')} style={{ backgroundColor: '#B0B0B0', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, marginBottom: 10 }}   >
        <Text style={{ color: 'black', fontWeight: 'bold' }}>Content Full SDK</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate('RestApiScreen')} style={{ backgroundColor: '#B0B0B0', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 }}  >
        <Text style={{ color: 'black', fontWeight: 'bold' }}>REST API</Text>
      </Pressable>
    </View>
  );
};

export default HomeScreen;
