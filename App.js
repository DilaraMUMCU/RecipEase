import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RecipeProvider } from './src/context/RecipeContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <RecipeProvider>
        <AppNavigator />
      </RecipeProvider>
    </SafeAreaProvider>
  );
}
