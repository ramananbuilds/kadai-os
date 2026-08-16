import { Pressable, Text, View, useColorScheme } from 'react-native'
import { Tabs, usePathname } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { darkTheme, lightTheme } from '@kadai-os/ui'

import { useSession } from '../../src/lib/session'

const tabs = [
  { name: 'index', label: 'Home', icon: '🏠' },
  { name: 'bill', label: 'Bill', icon: '🧾' },
  { name: 'customers', label: 'Members', icon: '👥' },
  { name: 'inventory', label: 'Stock', icon: '📦' },
  { name: 'more', label: 'More', icon: '⋯' },
] as const

/** Prototype's tab bar: standard tabs with an elevated center Bill pill. */
export default function TabLayout() {
  const dark = useColorScheme() === 'dark'
  const t = dark ? darkTheme : lightTheme
  const pathname = usePathname()
  const { bottom } = useSafeAreaInsets()
  const { pending } = useSession()

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ navigation }) => (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: t.surface,
            borderTopColor: t.border,
            borderTopWidth: 1,
            paddingTop: 8,
            paddingBottom: bottom + 8,
            paddingHorizontal: 6,
          }}
        >
          {tabs.map(({ name, label, icon }) => {
            const active = pathname === '/' + name || (name === 'index' && pathname === '/')
            const isBill = name === 'bill'
            return (
              <Pressable
                key={name}
                onPress={() => navigation.navigate(name)}
                style={{ flex: 1, alignItems: 'center', gap: 4 }}
              >
                {isBill ? (
                  <View style={{ alignItems: 'center', marginTop: -22 }}>
                    <View
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 17,
                        backgroundColor: active ? t.primary : t.surface2,
                        borderWidth: active ? 0 : 1,
                        borderColor: t.borderMid,
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: '#000',
                        shadowOpacity: 0.18,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 3 },
                        elevation: 5,
                      }}
                    >
                      <Text style={{ fontSize: 22 }}>{icon}</Text>
                    </View>
                    <Text style={{ fontSize: 10, fontWeight: active ? '700' : '500', color: active ? t.primary : t.text2 }}>
                      {label}
                    </Text>
                  </View>
                ) : (
                  <>
                    <View
                      style={{
                        width: 44,
                        height: 34,
                        borderRadius: 11,
                        backgroundColor: active ? (dark ? 'rgba(129,140,248,0.15)' : 'rgba(79,70,229,0.1)') : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 18, opacity: active ? 1 : 0.55 }}>{icon}</Text>
                    </View>
                    <Text style={{ fontSize: 10, fontWeight: active ? '700' : '500', color: active ? t.primary : t.text2 }}>
                      {label}
                      {name === 'more' && pending > 0 ? ` (${pending})` : ''}
                    </Text>
                  </>
                )}
              </Pressable>
            )
          })}
        </View>
      )}
    />
  )
}
