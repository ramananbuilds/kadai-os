import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useColorScheme } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { darkTheme, lightTheme } from '@kadai-os/ui'

import { SessionProvider } from '../src/lib/session'

export default function RootLayout() {
  const dark = useColorScheme() === 'dark'
  const t = dark ? darkTheme : lightTheme

  return (
    <SafeAreaProvider>
      <SessionProvider>
        <StatusBar style={dark ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: t.bg },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="login" />
          <Stack.Screen name="new-shop" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </SessionProvider>
    </SafeAreaProvider>
  )
}
