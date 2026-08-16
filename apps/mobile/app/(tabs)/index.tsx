import { useTheme } from '../../src/lib/theme'
import { useCallback, useEffect, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { darkTheme, lightTheme, radii, statusColors } from '@kadai-os/ui'
import { Feather } from '@expo/vector-icons'
import { formatINR, type Bill, type Product } from '@kadai-os/core'

import { api } from '../../src/lib/api'
import { useSession } from '../../src/lib/session'

export default function Home() {
  const dark = useTheme().dark
  const t = dark ? darkTheme : lightTheme
  const router = useRouter()
  const { top } = useSafeAreaInsets()
  const { shop, pending, version } = useSession()

  const [revenue, setRevenue] = useState(0)
  const [billCount, setBillCount] = useState(0)
  const [lowStock, setLowStock] = useState<Product[]>([])
  const [recent, setRecent] = useState<Bill[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const shopId = shop?.id
    if (!shopId) return
    const today = new Date().toISOString().slice(0, 10)
    const [summary, low, bills] = await Promise.all([
      api.dailySummary(shopId, today).catch(() => null),
      api.listProducts(shopId, { lowStockOnly: true }).catch(() => []),
      api.listRecentBills(shopId, 5).catch(() => []),
    ])
    setRevenue(summary?.revenuePaise ?? 0)
    setBillCount(summary?.billCount ?? 0)
    setLowStock(low)
    setRecent(bills)
  }, [shop?.id])

  useEffect(() => {
    void load()
  }, [load, version])

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={{ paddingTop: top + 16, paddingBottom: 100, gap: 14, paddingHorizontal: 18 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false) }} tintColor={t.primary} />}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ fontSize: 13, color: t.text2 }}>Today</Text>
          <Text style={{ fontSize: 24, fontWeight: '800', color: t.text, letterSpacing: -0.5 }}>
            {shop?.name ?? 'Kadai OS'}
          </Text>
        </View>
        {pending > 0 && (
          <View style={{ backgroundColor: statusColors.warnBg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ color: statusColors.warn, fontSize: 11, fontWeight: '700' }}>{pending} to sync</Text>
          </View>
        )}
      </View>

      {/* Revenue card */}
      <View style={{ backgroundColor: t.primary, borderRadius: radii.lg, padding: 20, gap: 12 }}>
        <Text style={{ fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Today's revenue
        </Text>
        <Text style={{ fontSize: 38, fontWeight: '800', color: '#fff', letterSpacing: -1.5 }}>{formatINR(revenue)}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: radii.sm, padding: 10 }}>
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Bills</Text>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff' }}>{billCount}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: radii.sm, padding: 10 }}>
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Pending sync</Text>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff' }}>{pending}</Text>
          </View>
        </View>
      </View>

      {/* Quick actions */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {[
          { icon: 'zap', label: 'New bill', to: '/(tabs)/bill' as const, primary: true },
          { icon: 'box', label: 'Stock', to: '/(tabs)/inventory' as const, primary: false },
          { icon: 'users', label: 'Members', to: '/(tabs)/customers' as const, primary: false },
        ].map((q) => (
          <Pressable
            key={q.label}
            onPress={() => router.navigate(q.to)}
            style={{
              flex: 1,
              backgroundColor: q.primary ? t.primary : t.surface,
              borderColor: q.primary ? 'transparent' : t.border,
              borderWidth: q.primary ? 0 : 1,
              borderRadius: radii.md,
              padding: 14,
              gap: 4,
            }}
          >
            <Text style={{ fontSize: 20 }}>{q.icon}</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: q.primary ? '#fff' : t.text }}>{q.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Low stock */}
      {lowStock.length > 0 && (
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: t.text }}>Low stock · reorder</Text>
          <View style={{ backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: radii.md, overflow: 'hidden' }}>
            {lowStock.slice(0, 4).map((p, i) => (
              <View
                key={p.id}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: t.border }}
              >
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: p.stockQty === 0 ? statusColors.danger : statusColors.warn }} />
                <Text style={{ flex: 1, fontSize: 14, color: t.text }}>{p.name}</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: p.stockQty === 0 ? statusColors.danger : statusColors.warn }}>
                  {p.stockQty} left
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Recent bills */}
      {recent.length > 0 && (
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: t.text }}>Recent bills</Text>
          <View style={{ backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: radii.md, overflow: 'hidden' }}>
            {recent.map((b, i) => (
              <View
                key={b.id}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: t.border }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: t.text }}>Bill #{b.number}</Text>
                  <Text style={{ fontSize: 12, color: t.text2 }}>
                    {b.items.reduce((s, it) => s + it.qty, 0)} items · {b.tender.toUpperCase()} · {b.createdAt.slice(11, 16)}
                  </Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: t.text }}>{formatINR(b.totalPaise)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  )
}
