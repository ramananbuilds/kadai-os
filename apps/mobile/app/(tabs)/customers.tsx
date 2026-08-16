import { useCallback, useEffect, useState } from 'react'
import { Modal, Pressable, ScrollView, Text, TextInput, View, useColorScheme } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { darkTheme, lightTheme, radii, tierColors } from '@kadai-os/ui'
import { formatINRCompact, resolveTier, tierProgress, type Customer } from '@kadai-os/core'

import { api } from '../../src/lib/api'
import { useSession } from '../../src/lib/session'

export default function Customers() {
  const dark = useColorScheme() === 'dark'
  const t = dark ? darkTheme : lightTheme
  const { top } = useSafeAreaInsets()
  const { shop, version } = useSession()

  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Customer | null>(null)

  const load = useCallback(async () => {
    if (!shop) return
    setCustomers(await api.listCustomers(shop.id, search ? { search } : undefined).catch(() => []))
  }, [shop, search])

  useEffect(() => {
    void load()
  }, [load, version])

  const progress = selected ? tierProgress(selected.pointsBalance) : null

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingTop: top + 12, paddingHorizontal: 18, gap: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: t.text, letterSpacing: -0.5 }}>Members</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or phone…"
          placeholderTextColor={t.text3}
          style={{
            backgroundColor: t.surface,
            borderColor: t.borderMid,
            borderWidth: 1.5,
            borderRadius: radii.md,
            color: t.text,
            fontSize: 15,
            paddingVertical: 11,
            paddingHorizontal: 14,
          }}
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, gap: 10, paddingBottom: 100 }}>
        {customers.map((c) => {
          const tier = resolveTier(c.pointsBalance)
          const color = tierColors[tier]
          return (
            <Pressable
              key={c.id}
              onPress={() => setSelected(c)}
              style={{ backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: radii.md, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.surface2, borderWidth: 2, borderColor: color + '66', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color, fontWeight: '700', fontSize: 13 }}>
                  {c.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: t.text }}>{c.name}</Text>
                <Text style={{ fontSize: 12, color: t.text2 }}>{c.pointsBalance.toLocaleString('en-IN')} pts · {c.phone}</Text>
              </View>
              <View style={{ backgroundColor: color + '22', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Text style={{ color, fontSize: 10, fontWeight: '700', textTransform: 'capitalize' }}>{tier}</Text>
              </View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: t.text }}>{formatINRCompact(c.lifetimeSpendPaise)}</Text>
            </Pressable>
          )
        })}
      </ScrollView>

      {/* Profile */}
      <Modal visible={selected !== null} animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: top + 12 }}>
          <ScrollView contentContainerStyle={{ padding: 18, gap: 14 }}>
            <Pressable onPress={() => setSelected(null)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: t.text, fontSize: 18 }}>‹</Text>
              </View>
              <Text style={{ fontSize: 16, fontWeight: '600', color: t.text }}>Member profile</Text>
            </Pressable>

            {selected && progress && (
              <>
                <View style={{ backgroundColor: tierColors[progress.current], borderRadius: radii.lg, padding: 20, gap: 12 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Shop OS · {progress.current}
                  </Text>
                  <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff' }}>{selected.name}</Text>
                  <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>{selected.phone}</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {[
                      { label: 'Points', value: selected.pointsBalance.toLocaleString('en-IN') },
                      { label: 'Visits', value: String(selected.visitCount) },
                      { label: 'Lifetime', value: formatINRCompact(selected.lifetimeSpendPaise) },
                    ].map((m) => (
                      <View key={m.label} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: radii.sm, padding: 10 }}>
                        <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{m.label}</Text>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff' }}>{m.value}</Text>
                      </View>
                    ))}
                  </View>
                  {progress.next && (
                    <View style={{ gap: 4 }}>
                      <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>
                        {progress.remaining.toLocaleString('en-IN')} pts to {progress.next}
                      </Text>
                      <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
                        <View style={{ height: 4, width: `${progress.fraction * 100}%`, backgroundColor: '#fff', borderRadius: 2 }} />
                      </View>
                    </View>
                  )}
                </View>

                <View style={{ backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: radii.md, padding: 14, gap: 8 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: t.text }}>Loyalty ledger</Text>
                  <Text style={{ fontSize: 12, color: t.text2 }}>
                    Balance {selected.pointsBalance.toLocaleString('en-IN')} pts · full history lands with realtime sync (Phase 5).
                  </Text>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  )
}
