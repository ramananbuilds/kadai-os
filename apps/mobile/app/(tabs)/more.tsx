import { Pressable, ScrollView, Text, View, useColorScheme } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'

import { darkTheme, lightTheme, radii } from '@kadai-os/ui'

import { backend } from '../../src/lib/api'
import { kvGet } from '../../src/lib/outbox'
import { useSession } from '../../src/lib/session'

export default function More() {
  const dark = useColorScheme() === 'dark'
  const t = dark ? darkTheme : lightTheme
  const { top } = useSafeAreaInsets()
  const router = useRouter()
  const { shop, session, signOut, pending } = useSession()

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ paddingTop: top + 12, padding: 18, gap: 12, paddingBottom: 100 }}>
      <Text style={{ fontSize: 22, fontWeight: '800', color: t.text, letterSpacing: -0.5 }}>More</Text>

      <View style={{ backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: radii.md, padding: 16, gap: 6 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: t.text }}>{shop?.name ?? 'No shop'}</Text>
        <Text style={{ fontSize: 13, color: t.text2 }}>UPI: {shop?.upiId ?? '—'}</Text>
        <Text style={{ fontSize: 13, color: t.text2 }}>Signed in as {session?.role ?? '—'}</Text>
        <Text style={{ fontSize: 12, color: t.text3, marginTop: 4 }}>
          Backend: {backend} · pending sync: {pending} · last sync: {kvGet('lastSyncAt') ?? 'never'}
        </Text>
      </View>

      <View style={{ backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: radii.md, overflow: 'hidden' }}>
        {[
          { label: 'Reward rules', hint: 'Phase 6 — loyalty engine editor' },
          { label: 'Staff & PINs', hint: `${shop ? 'manage via addStaffMember' : '—'}` },
          { label: 'Receipts & printers', hint: 'ESC/POS ready — Bluetooth pairing in native build' },
        ].map((row, i) => (
          <View key={row.label} style={{ padding: 14, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: t.border, gap: 2 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: t.text }}>{row.label}</Text>
            <Text style={{ fontSize: 12, color: t.text3 }}>{row.hint}</Text>
          </View>
        ))}
      </View>

      <Pressable
        onPress={async () => {
          await signOut()
          router.replace('/login')
        }}
        style={{ backgroundColor: t.surface, borderColor: '#FCA5A5', borderWidth: 1, borderRadius: radii.md, padding: 15, alignItems: 'center' }}
      >
        <Text style={{ color: statusDanger, fontSize: 14, fontWeight: '700' }}>Sign out</Text>
      </Pressable>

      <Text style={{ fontSize: 11, color: t.text3, textAlign: 'center', marginTop: 8 }}>
        Kadai OS v0.1.0 · Phase 3 build
      </Text>
    </ScrollView>
  )
}

const statusDanger = '#DC2626'
