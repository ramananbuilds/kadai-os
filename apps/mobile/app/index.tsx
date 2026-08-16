import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { Animated, Easing, Text, View } from 'react-native'

import { Feather } from '@expo/vector-icons'
import { darkTheme } from '@kadai-os/ui'

import { kvGet } from '../src/lib/outbox'
import { useSession } from '../src/lib/session'

/** Splash → routing: signed in with shop → tabs; signed in, no shop →
 *  shop creation; else onboarding (first run) or login. */
export default function SplashGate() {
  const router = useRouter()
  const { session, loading } = useSession()
  const pulse = new Animated.Value(1)

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    ).start()
  }, [pulse])

  useEffect(() => {
    if (loading) return
    const timer = setTimeout(() => {
      if (session?.shopId) router.replace('/(tabs)')
      else if (session) router.replace('/new-shop')
      else if (!kvGet('onboardingSeen')) router.replace('/onboarding')
      else router.replace('/login')
    }, 550)
    return () => clearTimeout(timer)
  }, [loading, session, router])

  return (
    <View style={{ flex: 1, backgroundColor: darkTheme.bg, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
      <Animated.View
        style={{
          width: 72,
          height: 72,
          borderRadius: 20,
          backgroundColor: darkTheme.primary,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale: pulse }],
        }}
      >
        <Feather name="shopping-bag" size={30} color="#fff" />
      </Animated.View>
      <Text style={{ fontSize: 26, fontWeight: '800', color: darkTheme.text, letterSpacing: -0.5 }}>Kadai OS</Text>
      <Text style={{ fontSize: 13, color: darkTheme.text2 }}>Billing · Stock · Loyalty</Text>
    </View>
  )
}
