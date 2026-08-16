import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { darkTheme, lightTheme } from '@kadai-os/ui'

import { SessionProvider } from '../src/lib/session'
import { ThemeProvider, useTheme } from '../src/lib/theme'

function ThemedStack() {
  const { dark } = useTheme()
  const t = dark ? darkTheme : lightTheme
  return (
    <>
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
    </>
  )
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <SessionProvider>
          <ThemedStack />
        </SessionProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}
