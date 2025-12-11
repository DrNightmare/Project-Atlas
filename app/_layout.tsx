import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { LockScreen } from '@/components/LockScreen';
import { ThemeProvider, useThemeSettings } from '@/src/context/ThemeContext';
import { AuthProvider, useAuth } from '@/src/context/auth-context';
import { useShareIntent } from '@/src/hooks/use-share-intent';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const { isDark } = useThemeSettings();
  const { isAuthenticated } = useAuth();
  useShareIntent();

  if (!isAuthenticated) {
    return (
      <NavigationThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        <LockScreen />
        <StatusBar style={isDark ? "light" : "dark"} />
      </NavigationThemeProvider>
    );
  }

  return (
    <NavigationThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style={isDark ? "light" : "dark"} />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ThemeProvider>
  );
}
