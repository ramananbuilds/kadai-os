import { useTheme } from '../src/lib/theme'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native'

import { darkTheme, lightTheme, radii } from '@kadai-os/ui'

import { api } from '../src/lib/api'
import { useSession } from '../src/lib/session'

/** First-run shop creation → create_shop_for_owner RPC (one transaction). */
export default function NewShop() {
  const router = useRouter()
  const dark = useTheme().dark
  const t = dark ? darkTheme : lightTheme
  const { refresh } = useSession()

  const [name, setName] = useState('')
  const [upiId, setUpiId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function create() {
    setError('')
    try {
      setBusy(true)
      await api.createShopForOwner({ name: name.trim(), upiId: upiId.trim() })
      await refresh()
      router.replace('/(tabs)')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the shop')
    } finally {
      setBusy(false)
    }
  }

  const inputStyle = {
    backgroundColor: t.surface,
    borderColor: t.borderMid,
    borderWidth: 1.5,
    borderRadius: radii.sm,
    color: t.text,
    fontSize: 16,
    paddingVertical: 13,
    paddingHorizontal: 14,
  } as const

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 28, gap: 14 }}>
        <Text style={{ fontSize: 24, fontWeight: '800', color: t.text }}>Set up your shop</Text>
        <Text style={{ fontSize: 14, color: t.text2, marginTop: -6 }}>
          Your UPI id goes on every bill's QR — customers pay you directly.
        </Text>

        <Text style={{ fontSize: 13, fontWeight: '600', color: t.text2 }}>Shop name</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Ravi's Boutique" placeholderTextColor={t.text3} style={inputStyle} />

        <Text style={{ fontSize: 13, fontWeight: '600', color: t.text2 }}>UPI id</Text>
        <TextInput
          value={upiId}
          onChangeText={setUpiId}
          placeholder="yourname@okhdfcbank"
          placeholderTextColor={t.text3}
          autoCapitalize="none"
          style={inputStyle}
        />

        <Pressable
          onPress={create}
          disabled={busy || name.trim().length < 1 || upiId.trim().length < 3}
          style={{ backgroundColor: t.primary, borderRadius: radii.sm, paddingVertical: 15, alignItems: 'center', opacity: busy ? 0.6 : 1, marginTop: 8 }}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{busy ? 'Creating…' : 'Open my shop'}</Text>
        </Pressable>

        {error ? <Text style={{ color: '#EF4444', fontSize: 13, textAlign: 'center' }}>{error}</Text> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
