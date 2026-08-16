import { useTheme } from '../src/lib/theme'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native'

import { Feather } from '@expo/vector-icons'
import { darkTheme, lightTheme, radii } from '@kadai-os/ui'
import { toE164 } from '@kadai-os/core'

import { api, backend } from '../src/lib/api'
import { kvSet } from '../src/lib/outbox'
import { useSession } from '../src/lib/session'

export default function Login() {
  const router = useRouter()
  const dark = useTheme().dark
  const t = dark ? darkTheme : lightTheme
  const { refresh } = useSession()

  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function sendOtp() {
    setError('')
    try {
      const e164 = toE164(phone)
      setBusy(true)
      await api.sendOtp(e164)
      setStep('otp')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send OTP')
    } finally {
      setBusy(false)
    }
  }

  async function verify() {
    setError('')
    try {
      setBusy(true)
      const session = await api.verifyOtp(toE164(phone), otp)
      kvSet('onboardingSeen', '1')
      await refresh()
      router.replace(session.shopId ? '/(tabs)' : '/new-shop')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid code')
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
    fontSize: 17,
    paddingVertical: 13,
    paddingHorizontal: 14,
  } as const

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 28, gap: 14 }}>
        <View style={{ alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: t.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="shopping-bag" size={28} color="#fff" />
          </View>
          <Text style={{ fontSize: 24, fontWeight: '800', color: t.text }}>Kadai OS</Text>
          <Text style={{ fontSize: 14, color: t.text2 }}>
            {step === 'phone' ? 'Sign in to your store' : `Code sent to ${phone}`}
          </Text>
        </View>

        {step === 'phone' ? (
          <>
            <Text style={{ fontSize: 13, fontWeight: '600', color: t.text2 }}>Mobile number</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="98765 43210"
              placeholderTextColor={t.text3}
              keyboardType="phone-pad"
              style={inputStyle}
            />
            <Pressable
              onPress={sendOtp}
              disabled={busy || phone.replace(/\D/g, '').length < 10}
              style={{ backgroundColor: t.primary, borderRadius: radii.sm, paddingVertical: 15, alignItems: 'center', opacity: busy ? 0.6 : 1 }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{busy ? 'Sending…' : 'Send code'}</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={{ fontSize: 13, fontWeight: '600', color: t.text2 }}>6-digit code</Text>
            <TextInput
              value={otp}
              onChangeText={setOtp}
              placeholder="••••••"
              placeholderTextColor={t.text3}
              keyboardType="number-pad"
              maxLength={6}
              style={[inputStyle, { textAlign: 'center', letterSpacing: 8, fontSize: 22 }]}
            />
            <Pressable
              onPress={verify}
              disabled={busy || otp.length < 4}
              style={{ backgroundColor: t.primary, borderRadius: radii.sm, paddingVertical: 15, alignItems: 'center', opacity: busy ? 0.6 : 1 }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{busy ? 'Verifying…' : 'Verify & continue'}</Text>
            </Pressable>
            <Pressable onPress={() => setStep('phone')} style={{ padding: 6, alignItems: 'center' }}>
              <Text style={{ color: t.primary, fontSize: 13, fontWeight: '600' }}>Change number</Text>
            </Pressable>
          </>
        )}

        {error ? <Text style={{ color: '#EF4444', fontSize: 13, textAlign: 'center' }}>{error}</Text> : null}
        {backend === 'memory' && (
          <Text style={{ color: t.text3, fontSize: 11, textAlign: 'center', marginTop: 10 }}>
            Demo backend: any number works, code is 123456
          </Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
