import { useTheme } from '../../src/lib/theme'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CameraView, useCameraPermissions } from 'expo-camera'

import { Feather } from '@expo/vector-icons'
import { darkTheme, lightTheme, radii, statusColors } from '@kadai-os/ui'
import {
  discountPaise,
  formatINR,
  lineTotalPaise,
  newId,
  subtotalPaise,
  type Bill,
  type BillDraft,
  type Customer,
  type Product,
  type Tender,
} from '@kadai-os/core'

import { api } from '../../src/lib/api'
import { enqueueBill } from '../../src/lib/outbox'
import { printReceipt } from '../../src/lib/print'
import { renderReceipt } from '@kadai-os/core'
import { useSession } from '../../src/lib/session'

interface CartLine {
  product: Product
  qty: number
}

/** The counter: catalog → cart → checkout → outbox → receipt. */
export default function BillScreen() {
  const dark = useTheme().dark
  const t = dark ? darkTheme : lightTheme
  const { top } = useSafeAreaInsets()
  const { shop, version } = useSession()

  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [cart, setCart] = useState<CartLine[]>([])
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [discount, setDiscount] = useState(0)
  const [tender, setTender] = useState<Tender>('upi')
  const [showCart, setShowCart] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [receipt, setReceipt] = useState<Bill | null>(null)
  const [error, setError] = useState('')
  const [permission, requestPermission] = useCameraPermissions()

  const load = useCallback(async () => {
    if (!shop) return
    const [prods, custs] = await Promise.all([
      api.listProducts(shop.id).catch(() => []),
      api.listCustomers(shop.id).catch(() => []),
    ])
    setProducts(prods)
    setCustomers(custs)
  }, [shop])

  useEffect(() => {
    void load()
  }, [load, version])

  const filtered = useMemo(() => {
    if (!search) return products
    const q = search.toLowerCase()
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.barcode ?? '').includes(search),
    )
  }, [products, search])

  const subtotal = subtotalPaise(cart.map((l) => ({ lineTotalPaise: lineTotalPaise(l.product.pricePaise, l.qty) })))
  const discountAmt = discountPaise(subtotal, discount)
  const total = subtotal - discountAmt
  const itemCount = cart.reduce((s, l) => s + l.qty, 0)

  function add(p: Product) {
    setCart((prev) => {
      const found = prev.find((l) => l.product.id === p.id)
      if (found) return prev.map((l) => (l.product.id === p.id ? { ...l, qty: l.qty + 1 } : l))
      return [...prev, { product: p, qty: 1 }]
    })
  }

  function bump(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) => (l.product.id === productId ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0),
    )
  }

  function onScan(data: string) {
    const hit = products.find((p) => p.barcode === data)
    if (hit) {
      add(hit)
      setScanning(false)
    } else {
      setError(`No product with barcode ${data}`)
      setScanning(false)
    }
  }

  /** Checkout: draft → outbox (offline-first), receipt preview regardless. */
  async function checkout() {
    if (!shop || cart.length === 0) return
    setError('')
    try {
      const draft: BillDraft = {
        id: newId(),
        customerId,
        items: cart.map((l) => ({ productId: l.product.id, qty: l.qty })),
        discountPercent: discount,
        redeemedPoints: 0,
        redeemedRewardId: null,
        tender,
        createdAt: new Date().toISOString(),
      }

      // Optimistic local bill for the receipt; the outbox carries the
      // authoritative draft to create_bill.
      enqueueBill(draft)
      const preview: Bill = {
        id: draft.id,
        shopId: shop.id,
        number: -1, // assigned by the backend on sync
        customerId,
        items: cart.map((l) => ({
          productId: l.product.id,
          nameSnapshot: l.product.name,
          skuSnapshot: l.product.sku,
          unitPricePaise: l.product.pricePaise,
          qty: l.qty,
          lineTotalPaise: lineTotalPaise(l.product.pricePaise, l.qty),
        })),
        subtotalPaise: subtotal,
        discountPercent: discount,
        discountPaise: discountAmt,
        totalPaise: total,
        earnedPoints: customerId
          ? Math.floor((total / 10_000) * (shop.loyalty.earnRule.pointsPerHundredRupees))
          : 0,
        redeemedPoints: 0,
        redeemedRewardId: null,
        tender,
        status: 'completed',
        createdAt: draft.createdAt,
      }
      setReceipt(preview)
      setCart([])
      setDiscount(0)
      setCustomerId(null)
      setShowCart(false)
      void load() // refresh stock view
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Checkout failed')
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      {/* Header + search */}
      <View style={{ paddingTop: top + 12, paddingHorizontal: 18, gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: 22, fontWeight: '800', color: t.text, letterSpacing: -0.5 }}>New bill</Text>
            <Text style={{ fontSize: 13, color: t.text2 }}>{itemCount} items in cart</Text>
          </View>
          <Pressable
            onPress={async () => {
              if (!permission?.granted) await requestPermission()
              setScanning(true)
            }}
            style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}
          >
            <Feather name="search" size={18} color={t.text2} />
          </Pressable>
        </View>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search products or scan…"
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

      {/* Catalog */}
      <ScrollView contentContainerStyle={{ padding: 18, gap: 8, paddingBottom: 140 }}>
        {filtered.map((p) => {
          const line = cart.find((l) => l.product.id === p.id)
          return (
            <View
              key={p.id}
              style={{
                backgroundColor: t.surface,
                borderColor: line ? t.primary : t.border,
                borderWidth: line ? 1.5 : 1,
                borderRadius: radii.md,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: t.text }}>{p.name}</Text>
                <Text style={{ fontSize: 11, color: t.text3, fontFamily: 'monospace' }}>
                  {p.sku}
                  {p.stockQty <= p.reorderLevel ? '  ·  LOW' : ''}
                </Text>
              </View>
              <Text style={{ fontSize: 15, fontWeight: '700', color: t.text }}>{formatINR(p.pricePaise)}</Text>
              {line ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Pressable onPress={() => bump(p.id, -1)} style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: t.surface2, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 16, color: t.text2 }}>−</Text>
                  </Pressable>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: t.primary, minWidth: 16, textAlign: 'center' }}>{line.qty}</Text>
                  <Pressable onPress={() => bump(p.id, 1)} style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: t.primary, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 16, color: '#fff' }}>+</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable onPress={() => add(p)} style={{ backgroundColor: t.primary, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 14 }}>
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Add</Text>
                </Pressable>
              )}
            </View>
          )
        })}
      </ScrollView>

      {/* Cart bar */}
      {cart.length > 0 && !showCart && (
        <Pressable
          onPress={() => setShowCart(true)}
          style={{ position: 'absolute', left: 16, right: 16, bottom: 90, backgroundColor: t.primary, borderRadius: radii.md, paddingVertical: 14, paddingHorizontal: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 }}
        >
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>View cart · {itemCount}</Text>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>{formatINR(subtotal)}</Text>
        </Pressable>
      )}

      {/* Cart sheet */}
      <Modal visible={showCart} animationType="slide" onRequestClose={() => setShowCart(false)}>
        <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: top + 12 }}>
          <ScrollView contentContainerStyle={{ padding: 18, gap: 8 }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: t.text, marginBottom: 4 }}>Cart · {itemCount} items</Text>
            {cart.map((l) => (
              <View key={l.product.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: t.surface, borderRadius: radii.sm, padding: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: t.text }}>{l.product.name}</Text>
                  <Text style={{ fontSize: 11, color: t.text2 }}>{formatINR(l.product.pricePaise)} × {l.qty}</Text>
                </View>
                <Pressable onPress={() => bump(l.product.id, -1)} style={{ width: 26, height: 26, borderRadius: 7, backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: t.text2, fontSize: 15 }}>−</Text>
                </Pressable>
                <Text style={{ minWidth: 16, textAlign: 'center', fontWeight: '700', color: t.primary, fontSize: 13 }}>{l.qty}</Text>
                <Pressable onPress={() => bump(l.product.id, 1)} style={{ width: 26, height: 26, borderRadius: 7, backgroundColor: t.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 15 }}>+</Text>
                </Pressable>
                <Text style={{ fontSize: 13, fontWeight: '700', color: t.text, minWidth: 70, textAlign: 'right' }}>
                  {formatINR(lineTotalPaise(l.product.pricePaise, l.qty))}
                </Text>
              </View>
            ))}

            {/* Customer + discount + tender */}
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              <Pressable
                onPress={() => setCustomerId(null)}
                style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: customerId === null ? t.primary : t.surface, borderWidth: 1, borderColor: customerId === null ? 'transparent' : t.border }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: customerId === null ? '#fff' : t.text2 }}>Walk-in</Text>
              </Pressable>
              {customers.slice(0, 6).map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => setCustomerId(c.id)}
                  style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: customerId === c.id ? t.primary : t.surface, borderWidth: 1, borderColor: customerId === c.id ? 'transparent' : t.border }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: customerId === c.id ? '#fff' : t.text2 }}>{c.name.split(' ')[0]}</Text>
                </Pressable>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
              {[0, 5, 10, 15].map((d) => (
                <Pressable
                  key={d}
                  onPress={() => setDiscount(d)}
                  style={{ paddingVertical: 5, paddingHorizontal: 12, borderRadius: 8, backgroundColor: discount === d ? t.primary : t.surface2 }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: discount === d ? '#fff' : t.text2 }}>{d === 0 ? 'No discount' : `${d}%`}</Text>
                </Pressable>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
              {(['cash', 'upi', 'card'] as Tender[]).map((td) => (
                <Pressable
                  key={td}
                  onPress={() => setTender(td)}
                  style={{ paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8, backgroundColor: tender === td ? t.primary : t.surface2 }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: tender === td ? '#fff' : t.text2 }}>{td.toUpperCase()}</Text>
                </Pressable>
              ))}
            </View>

            {discountAmt > 0 && (
              <Text style={{ color: statusColors.positive, fontSize: 13, marginTop: 8 }}>
                Discount {discount}% · −{formatINR(discountAmt)}
              </Text>
            )}
            {error ? <Text style={{ color: statusColors.danger, fontSize: 13 }}>{error}</Text> : null}
          </ScrollView>

          <View style={{ padding: 18, gap: 10 }}>
            <Pressable onPress={checkout} style={{ backgroundColor: t.primary, borderRadius: radii.md, paddingVertical: 15, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Checkout · {formatINR(total)}</Text>
            </Pressable>
            <Pressable onPress={() => setShowCart(false)} style={{ alignItems: 'center', padding: 6 }}>
              <Text style={{ color: t.text2, fontSize: 14 }}>Keep shopping</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Scanner */}
      <Modal visible={scanning} animationType="fade" onRequestClose={() => setScanning(false)}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          {permission?.granted ? (
            <CameraView
              style={{ flex: 1 }}
              barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr', 'code128'] }}
              onBarcodeScanned={({ data }) => onScan(data)}
            />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <Text style={{ color: '#fff', fontSize: 15 }}>Camera permission needed to scan barcodes.</Text>
              <Pressable onPress={requestPermission} style={{ backgroundColor: t.primary, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20 }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Grant</Text>
              </Pressable>
            </View>
          )}
          <Pressable onPress={() => setScanning(false)} style={{ position: 'absolute', top: top + 10, right: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 20 }}>✕</Text>
          </Pressable>
        </View>
      </Modal>

      {/* Receipt preview */}
      <Modal visible={receipt !== null} animationType="fade" onRequestClose={() => setReceipt(null)}>
        <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: top + 12 }}>
          <ScrollView contentContainerStyle={{ padding: 18 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: t.text, marginBottom: 10 }}>
              Bill saved{receipt?.number === -1 ? ' — syncing' : ` #${receipt?.number}`}
            </Text>
            <View style={{ backgroundColor: '#fff', borderRadius: radii.sm, padding: 12, alignSelf: 'stretch' }}>
              {(receipt && shop ? renderReceipt(receipt, shop, customers.find((c) => c.id === receipt.customerId)?.name) : []).map((line, i) => (
                <Text key={i} style={{ fontFamily: 'monospace', fontSize: line.tall ? 15 : 11, fontWeight: line.bold || line.tall ? '700' : '400', color: '#000', textAlign: line.align as 'left' | 'center' | 'right' }}>
                  {line.text || ' '}
                </Text>
              ))}
            </View>
          </ScrollView>
          <View style={{ padding: 18, gap: 10 }}>
            <Pressable
              onPress={() => receipt && shop && void printReceipt(receipt, shop, customers.find((c) => c.id === receipt.customerId)?.name)}
              style={{ backgroundColor: t.primary, borderRadius: radii.md, paddingVertical: 14, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Print receipt</Text>
            </Pressable>
            <Pressable onPress={() => setReceipt(null)} style={{ alignItems: 'center', padding: 6 }}>
              <Text style={{ color: t.text2, fontSize: 14 }}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  )
}
