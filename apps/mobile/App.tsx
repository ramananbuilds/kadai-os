import { StatusBar } from 'expo-status-bar'
import { StyleSheet, Text, View } from 'react-native'

import { formatINR, rupeesToPaise } from '@kadai-os/core'
import { darkTheme, radii } from '@kadai-os/ui'

/**
 * Phase 0 scaffold: proves the monorepo links — tokens from @kadai-os/ui,
 * money math from @kadai-os/core. The real screen stack (splash, onboarding,
 * login, tab bar) arrives in Phase 3, ported from apps/web/src/screens.
 */
export default function App() {
  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Phase 0</Text>
      </View>
      <Text style={styles.title}>Kadai OS</Text>
      <Text style={styles.subtitle}>Billing · Stock · Loyalty — mobile scaffold</Text>
      <Text style={styles.proof}>{formatINR(rupeesToPaise(48230))} wired through @kadai-os/core</Text>
      <StatusBar style="light" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  badge: {
    backgroundColor: darkTheme.primarySoft,
    borderRadius: radii.xs,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  badgeText: {
    color: darkTheme.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    color: darkTheme.text,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: darkTheme.text2,
    fontSize: 14,
    fontWeight: '500',
  },
  proof: {
    color: darkTheme.text3,
    fontSize: 12,
    marginTop: 16,
  },
})
