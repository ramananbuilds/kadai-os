import { useTheme } from '../src/lib/theme'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { Feather } from '@expo/vector-icons'

import { darkTheme, lightTheme, radii } from '@kadai-os/ui'

import { kvSet } from '../src/lib/outbox'

const pages = [
  { icon: 'zap', title: 'Bill in seconds', body: 'Scan barcodes, build the cart, print the receipt. Built for the counter, not the office.' },
  { icon: 'box', title: 'Stock that counts itself', body: 'Every bill updates stock. Reorder before you run out, not after.' },
  { icon: 'gift', title: 'Customers who come back', body: 'Every bill earns points. Points unlock tiers and rewards — the reason they return.' },
]

export default function Onboarding() {
  const router = useRouter()
  const dark = useTheme().dark
  const t = dark ? darkTheme : lightTheme
  const [page, setPage] = useState(0)
  const current = pages[page]

  const next = () => {
    if (page < pages.length - 1) setPage(page + 1)
    else {
      kvSet('onboardingSeen', '1')
      router.replace('/login')
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 28, justifyContent: 'center', gap: 18 }}>
        <View style={{ alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 56 }}>{current.icon}</Text>
          <Text style={{ fontSize: 26, fontWeight: '800', color: t.text, textAlign: 'center' }}>{current.title}</Text>
          <Text style={{ fontSize: 15, color: t.text2, textAlign: 'center', lineHeight: 22 }}>{current.body}</Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 8 }}>
          {pages.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === page ? 18 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === page ? t.primary : t.borderMid,
              }}
            />
          ))}
        </View>
      </ScrollView>

      <View style={{ padding: 20, gap: 10 }}>
        <Pressable
          onPress={next}
          style={{ backgroundColor: t.primary, borderRadius: radii.sm, paddingVertical: 15, alignItems: 'center' }}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
            {page < pages.length - 1 ? 'Next' : 'Get started'}
          </Text>
        </Pressable>
        {page < pages.length - 1 && (
          <Pressable onPress={() => { kvSet('onboardingSeen', '1'); router.replace('/login') }} style={{ padding: 8, alignItems: 'center' }}>
            <Text style={{ color: t.text2, fontSize: 14 }}>Skip</Text>
          </Pressable>
        )}
      </View>
    </View>
  )
}
