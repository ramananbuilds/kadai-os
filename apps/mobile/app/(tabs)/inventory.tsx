import { useTheme } from '../../src/lib/theme'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { darkTheme, lightTheme, radii, statusColors } from '@kadai-os/ui'
import { formatINR, formatINRCompact, type Product } from '@kadai-os/core'

import { api } from '../../src/lib/api'
import { useSession } from '../../src/lib/session'

export default function Inventory() {
  const dark = useTheme().dark
  const t = dark ? darkTheme : lightTheme
  const { top } = useSafeAreaInsets()
  const { shop, version } = useSession()

  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [lowOnly, setLowOnly] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!shop) return
    setProducts(await api.listProducts(shop.id, { search: search || undefined }).catch(() => []))
  }, [shop, search])

  useEffect(() => {
    void load()
  }, [load, version])

  const filtered = useMemo(
    () => (lowOnly ? products.filter((p) => p.stockQty <= p.reorderLevel) : products),
    [products, lowOnly],
  )
  const stockValue = products.reduce((s, p) => s + p.stockQty * p.costPaise, 0)
  const totalUnits = products.reduce((s, p) => s + p.stockQty, 0)
  const lowCount = products.filter((p) => p.stockQty <= p.reorderLevel).length

  async function adjust(p: Product, delta: number) {
    if (!shop) return
    setBusyId(p.id)
    try {
      await api.adjustStock(p.id, delta, delta > 0 ? 'restock' : 'adjustment', 'counter adjust')
      await load()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingTop: top + 12, paddingHorizontal: 18, gap: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: t.text, letterSpacing: -0.5 }}>Stock</Text>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[
            { label: 'Value', value: formatINRCompact(stockValue) },
            { label: 'Units', value: String(totalUnits) },
            { label: 'Low', value: String(lowCount), warn: lowCount > 0 },
          ].map((s) => (
            <View key={s.label} style={{ flex: 1, backgroundColor: t.surface, borderColor: s.warn ? '#FDE68A' : t.border, borderWidth: 1, borderRadius: radii.sm, padding: 10 }}>
              <Text style={{ fontSize: 11, color: t.text2 }}>{s.label}</Text>
              <Text style={{ fontSize: 17, fontWeight: '800', color: s.warn ? statusColors.warn : t.text }}>{s.value}</Text>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search products or SKU…"
            placeholderTextColor={t.text3}
            style={{
              flex: 1,
              backgroundColor: t.surface,
              borderColor: t.borderMid,
              borderWidth: 1.5,
              borderRadius: radii.md,
              color: t.text,
              fontSize: 14,
              paddingVertical: 9,
              paddingHorizontal: 14,
            }}
          />
          <Pressable
            onPress={() => setLowOnly(!lowOnly)}
            style={{ backgroundColor: lowOnly ? t.primary : t.surface, borderWidth: 1, borderColor: lowOnly ? 'transparent' : t.borderMid, borderRadius: radii.md, paddingHorizontal: 14, justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: lowOnly ? '#fff' : t.text2 }}>Low</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, gap: 8, paddingBottom: 100 }}>
        {filtered.map((p) => {
          const out = p.stockQty === 0
          const low = !out && p.stockQty <= p.reorderLevel
          const status = out ? { label: 'Out', color: statusColors.danger, bg: statusColors.dangerBg } : low ? { label: 'Low', color: statusColors.warn, bg: statusColors.warnBg } : { label: 'OK', color: statusColors.ok, bg: statusColors.okBg }
          const margin = Math.round(((p.pricePaise - p.costPaise) / p.pricePaise) * 100)
          return (
            <View key={p.id} style={{ backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: radii.md, padding: 12, gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: t.text, flex: 1 }}>{p.name}</Text>
                <View style={{ backgroundColor: status.bg, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2 }}>
                  <Text style={{ color: status.color, fontSize: 10, fontWeight: '700' }}>{status.label}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 11, color: t.text3, fontFamily: 'monospace' }}>{p.sku}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ flex: 1, fontSize: 13, color: t.text }}>
                  {formatINR(p.pricePaise)} · <Text style={{ color: statusColors.positive, fontWeight: '700' }}>{margin}% margin</Text>
                </Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: status.color }}>{p.stockQty} units</Text>
                <View style={{ flexDirection: 'row', gap: 6, marginLeft: 10 }}>
                  <Pressable
                    disabled={busyId === p.id}
                    onPress={() => adjust(p, -1)}
                    style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: t.surface2, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ color: t.text2, fontSize: 15 }}>−</Text>
                  </Pressable>
                  <Pressable
                    disabled={busyId === p.id}
                    onPress={() => adjust(p, 1)}
                    style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: t.primary, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ color: '#fff', fontSize: 15 }}>+</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )
        })}
      </ScrollView>
    </View>
  )
}
