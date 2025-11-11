import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import RootNavigation from './src/navigation/RootNavigation';
import { AppProvider } from './src/context/AppProvider';
import WebView from 'react-native-webview';

function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <StatusBar
          barStyle={"dark-content"}
          translucent={true}
          backgroundColor='transparent'
          animated={true}
        />
        <SafeAreaView style={{ flex: 1 }}>
          <RootNavigation />
        </SafeAreaView>
      </AppProvider>
    </GestureHandlerRootView>
  );
}

export default App;
