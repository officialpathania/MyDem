import React from 'react';
import { Platform, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { colors } from './constants/theme';
import { AppNavigator } from './navigation/AppNavigator';
import { store } from './store';

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar
          barStyle="light-content"
          backgroundColor={Platform.OS === 'android' ? colors.bg : undefined}
        />
        <AppNavigator />
      </SafeAreaProvider>
    </Provider>
  );
}
