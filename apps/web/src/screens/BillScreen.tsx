import { useState } from 'react'

const catalog = [
  { id: 1, name: 'Blue Denim Jacket', sku: 'BDJ-001', price: 2499, category: 'Jackets', stock: 8 },
  { id: 2, name: 'White Linen Shirt', sku: 'WLS-001', price: 899, category: 'Shirts', stock: 2 },
  { id: 3, name: 'Nike Air Max 270', sku: 'NAM-270', price: 8999, category: 'Footwear', stock: 5 },
  { id: 4, name: 'Floral Summer Dress', sku: 'FSD-022', price: 1850, category: 'Dresses', stock: 11 },
  { id: 5, name: 'Black Slim Joggers', sku: 'BSJ-044', price: 1299, category: 'Bottoms', stock: 1 },
  { id: 6, name: 'Canvas Tote Bag', sku: 'CTB-012', price: 599, category: 'Accessories', stock: 3 },
  { id: 7, name: 'Oversized Hoodie', sku: 'OVH-009', price: 1999, category: 'Tops', stock: 14 },
  { id: 8, name: 'Leather Belt Brown', sku: 'LBB-003', price: 549, category: 'Accessories', stock: 7 },
]

interface CartItem {
  id: number
  name: string
  price: number
  qty: number
  sku: string
}

export default function BillScreen() {
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [scanMode, setScanMode] = useState(false)
  const [discount, setDiscount] = useState(0)

  const filtered = search.length > 0
    ? catalog.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
    : catalog

  const addToCart = (product: typeof catalog[0]) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { id: product.id, name: product.name, price: product.price, qty: 1, sku: product.sku }]
    })
  }

  const updateQty = (id: number, delta: number) => {
    setCart(prev => prev
      .map(i => i.id === id ? { ...i, qty: i.qty + delta } : i)
      .filter(i => i.qty > 0)
    )
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const discountAmount = Math.round(subtotal * discount / 100)
  const total = subtotal - discountAmount
  const itemCount = cart.reduce((s, i) => s + i.qty, 0)

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 12px', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0, letterSpacing: -0.5 }}>
              New Bill
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '2px 0 0', fontWeight: 500 }}>
              Bill #1088 · Today
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setScanMode(!scanMode)}
              className="press-effect"
              style={{
                width: 40, height: 40, borderRadius: 12,
                background: scanMode ? 'var(--primary)' : 'var(--surface)',
                border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: 18,
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              {scanMode ? '✕' : '⊡'}
            </button>
          </div>
        </div>

        {/* Search Bar — only visible when not scanning */}
        {!scanMode && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--surface)',
            border: '1.5px solid var(--border-mid)',
            borderRadius: 14, padding: '0 14px',
            boxShadow: 'var(--shadow-sm)',
            transition: 'border-color 0.15s'
          }}>
            <span style={{ fontSize: 16, color: 'var(--text-3)' }}>⌕</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products or scan barcode…"
              style={{
                flex: 1, border: 'none', outline: 'none',
                background: 'transparent',
                fontSize: 15, color: 'var(--text)',
                padding: '13px 0',
                fontFamily: 'Inter, sans-serif'
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 16 }}>✕</button>
            )}
          </div>
        )}
      </div>

      {/* Products */}
      <div style={{ flex: 1, padding: '0 20px', paddingBottom: showCart ? 280 : 100 }}>
        {!scanMode && (
          <>
            {/* Category pills */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, scrollbarWidth: 'none' }}>
              {['All', 'Tops', 'Bottoms', 'Footwear', 'Dresses', 'Accessories'].map(c => (
                <button
                  key={c}
                  style={{
                    whiteSpace: 'nowrap', padding: '6px 14px',
                    borderRadius: 20, fontSize: 13, fontWeight: 500,
                    background: c === 'All' ? 'var(--primary)' : 'var(--surface)',
                    color: c === 'All' ? '#fff' : 'var(--text-2)',
                    border: `1px solid ${c === 'All' ? 'transparent' : 'var(--border)'}`,
                    cursor: 'pointer', flexShrink: 0
                  }}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Product list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map(product => {
                const inCart = cart.find(i => i.id === product.id)
                return (
                  <div
                    key={product.id}
                    style={{
                      background: 'var(--surface)',
                      border: `1px solid ${inCart ? 'var(--primary)' : 'var(--border)'}`,
                      borderRadius: 14,
                      padding: '14px 14px',
                      display: 'flex', alignItems: 'center', gap: 12,
                      boxShadow: inCart ? '0 0 0 3px var(--primary-soft)' : 'var(--shadow-sm)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: 10,
                      background: 'var(--surface-2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20, flexShrink: 0
                    }}>
                      {product.category === 'Footwear' ? '👟' :
                        product.category === 'Accessories' ? '👜' :
                        product.category === 'Dresses' ? '👗' : '👕'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: '0 0 2px', lineHeight: 1.3 }}>
                        {product.name}
                      </p>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'monospace' }}>{product.sku}</span>
                        {product.stock <= 3 && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#92400E', background: '#FEF3C7', borderRadius: 4, padding: '1px 5px' }}>
                            LOW
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px' }}>
                        ₹{product.price.toLocaleString()}
                      </p>
                      {inCart ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button
                            onClick={() => updateQty(product.id, -1)}
                            className="press-effect"
                            style={{
                              width: 26, height: 26, borderRadius: 8,
                              background: 'var(--surface-2)',
                              border: '1px solid var(--border)',
                              cursor: 'pointer', fontSize: 16, fontWeight: 700,
                              color: 'var(--text-2)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                          >−</button>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)', minWidth: 16, textAlign: 'center' }}>
                            {inCart.qty}
                          </span>
                          <button
                            onClick={() => updateQty(product.id, 1)}
                            className="press-effect"
                            style={{
                              width: 26, height: 26, borderRadius: 8,
                              background: 'var(--primary)',
                              border: 'none',
                              cursor: 'pointer', fontSize: 16, fontWeight: 700,
                              color: '#fff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                          >+</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(product)}
                          className="press-effect"
                          style={{
                            padding: '5px 14px', borderRadius: 8,
                            background: 'var(--primary)',
                            border: 'none', cursor: 'pointer',
                            fontSize: 13, fontWeight: 600, color: '#fff'
                          }}
                        >
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Floating Cart */}
      {cart.length > 0 && !scanMode && (
        <div style={{
          position: 'absolute', bottom: 70, left: 16, right: 16,
          zIndex: 50
        }}>
          {showCart ? (
            <div className="animate-slide-up" style={{
              background: 'var(--surface)',
              borderRadius: 20,
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border)',
              overflow: 'hidden'
            }}>
              {/* Cart header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px',
                borderBottom: '1px solid var(--border)'
              }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                  Cart · {itemCount} items
                </p>
                <button
                  onClick={() => setShowCart(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--text-3)', lineHeight: 1 }}
                >×</button>
              </div>

              {/* Cart items */}
              <div style={{ maxHeight: 200, overflowY: 'auto', padding: '8px 0' }}>
                {cart.map(item => (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 16px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: '0 0 1px' }}>{item.name}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0 }}>₹{item.price.toLocaleString()} × {item.qty}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button onClick={() => updateQty(item.id, -1)} style={{
                        width: 22, height: 22, borderRadius: 6, background: 'var(--surface-2)',
                        border: '1px solid var(--border)', cursor: 'pointer', fontSize: 14, color: 'var(--text-2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>−</button>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', minWidth: 14, textAlign: 'center' }}>{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} style={{
                        width: 22, height: 22, borderRadius: 6, background: 'var(--primary)',
                        border: 'none', cursor: 'pointer', fontSize: 14, color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>+</button>
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', margin: 0, minWidth: 64, textAlign: 'right' }}>
                      ₹{(item.price * item.qty).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              {/* Discount */}
              <div style={{
                padding: '10px 16px',
                borderTop: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: 10
              }}>
                <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>Discount</span>
                <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                  {[0, 5, 10, 15, 20].map(d => (
                    <button
                      key={d}
                      onClick={() => setDiscount(d)}
                      style={{
                        padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                        background: discount === d ? 'var(--primary)' : 'var(--surface-2)',
                        color: discount === d ? '#fff' : 'var(--text-2)',
                        border: 'none', cursor: 'pointer'
                      }}
                    >
                      {d === 0 ? 'None' : `${d}%`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Checkout */}
              <div style={{ padding: '10px 14px 14px' }}>
                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Discount ({discount}%)</span>
                    <span style={{ fontSize: 13, color: '#22C55E', fontWeight: 600 }}>−₹{discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <button
                  className="press-effect"
                  style={{
                    width: '100%', padding: '15px',
                    background: 'var(--primary)',
                    border: 'none', borderRadius: 14,
                    fontSize: 16, fontWeight: 700, color: '#fff',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(79,70,229,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                  }}
                >
                  <span>Checkout</span>
                  <span style={{ opacity: 0.8 }}>·</span>
                  <span>₹{total.toLocaleString()}</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              className="press-effect"
              onClick={() => setShowCart(true)}
              style={{
                width: '100%', padding: '14px 20px',
                background: 'var(--primary)',
                border: 'none', borderRadius: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(79,70,229,0.4)',
                animation: 'scale-in 0.25s cubic-bezier(0.16,1,0.3,1)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 8,
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800, color: '#fff'
                }}>{itemCount}</div>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>View Cart</span>
              </div>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>₹{subtotal.toLocaleString()}</span>
            </button>
          )}
        </div>
      )}

      {/* Full-screen barcode scanner overlay */}
      {scanMode && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'var(--bg)', display: 'flex',
          flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Camera simulation background */}
          <div style={{
            position: 'relative', width: '100%', height: '100%',
            background: 'radial-gradient(ellipse at center, #1e293b 0%, #0f172a 70%, #000 100%)'
          }}>
            {/* Viewfinder frame */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 260, height: 260,
              border: '2px solid var(--primary)', borderRadius: 20,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center', margin: 0 }}>
                Align barcode within frame
              </p>
            </div>
            {/* Animated scan line */}
            <div style={{
              position: 'absolute', top: 0, left: '50%',
              transform: 'translateX(-50%)',
              width: 220, height: 2, borderRadius: 1,
              background: 'linear-gradient(90deg, transparent, var(--primary)',
              boxShadow: '0 0 12px var(--primary), 0 0 24px var(--primary)',
              animation: 'scan-line 2.5s linear infinite'
            }} />
          </div>

          {/* Close button */}
          <button
            id="btn-close-scanner"
            onClick={() => setScanMode(false)}
            className="press-effect"
            style={{
              position: 'absolute', top: 50, right: 16, zIndex: 10000,
              width: 48, height: 48, borderRadius: 24,
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 700, color: '#fff', cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
            }}
            aria-label="Close scanner"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
