
import React from "react";
import { Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from "../screens/HomeScreen";
import ContentFullSdkScreen from "../screens/ContentFullSdkScreen";
import RestApiScreen from "../screens/RestApiScreen";
import SdkLiveScreen from "../screens/SdkLiveScreen";
import RestLiveScreen from "../screens/RestLiveScreen";
import SdkLocalScreen from "../screens/SdkLocalScreen";
import RestLocalScreen from "../screens/RestLocalScreen";
import ActivityDetailScreen from "../screens/ActivityDetailScreen";
import ModuleScreen from "../screens/ModuleScreenTwo";

const Stack = createStackNavigator();
const RootNavigation = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="HomeScreen" screenOptions={{ animation: Platform.OS === "ios" ? "default" : "fade_from_bottom", headerShown: true }} >
        <Stack.Screen name='HomeScreen' component={HomeScreen} options={{ title: 'Home' }} />
        <Stack.Screen name='ContentFullSdkScreen' component={ContentFullSdkScreen} options={{ headerTitle: 'SDK' }} />
        <Stack.Screen name='RestApiScreen' component={RestApiScreen} options={{ title: 'Rest API' }} />
        <Stack.Screen name="SdkLiveScreen" component={SdkLiveScreen} options={{ headerTitle: "Activity List" }} />
        <Stack.Screen name="SdkLocalScreen" component={SdkLocalScreen} />
        <Stack.Screen name="RestLiveScreen" component={RestLiveScreen} />
        <Stack.Screen name="RestLocalScreen" component={RestLocalScreen} />
        <Stack.Screen name="ActivityDetailScreen" component={ActivityDetailScreen} options={{ headerTitle: "Activity detail" }} />
        <Stack.Screen name="ModuleScreen" component={ModuleScreen} options={{ headerTitle: "Module" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigation;
