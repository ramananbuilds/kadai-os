/** Small shared primitives so screens stay lean and tokenized. */

import type { ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native'

import { radii, type Theme } from '@kadai-os/ui'

export function Card({ t, style, children }: { t: Theme; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  return (
    <View
      style={[
        {
          backgroundColor: t.surface,
          borderColor: t.border,
          borderWidth: StyleSheet.hairlineWidth,
          borderRadius: radii.md,
          padding: 14,
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}

export function T({ t, size = 14, weight, color, style, children }: {
  t: Theme
  size?: number
  weight?: '400' | '500' | '600' | '700' | '800'
  color?: string
  style?: StyleProp<TextStyle>
  children: ReactNode
}) {
  return (
    <Text style={[{ fontSize: size, fontWeight: weight ?? '500', color: color ?? t.text }, style]}>
      {children}
    </Text>
  )
}

export function Pill({ t, color, bg, children }: { t: Theme; color: string; bg: string; children: ReactNode }) {
  return (
    <View style={{ backgroundColor: bg, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}>
      <T t={t} size={10} weight="700" color={color}>
        {children}
      </T>
    </View>
  )
}

export function Button({ t, primary, onPress, style, children }: {
  t: Theme
  primary?: boolean
  onPress: () => void
  style?: StyleProp<ViewStyle>
  children: ReactNode
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: primary ? t.primary : t.surface,
          borderColor: primary ? 'transparent' : t.borderMid,
          borderWidth: primary ? 0 : StyleSheet.hairlineWidth,
          borderRadius: radii.sm,
          paddingVertical: 12,
          paddingHorizontal: 16,
          alignItems: 'center',
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      <T t={t} size={14} weight="700" color={primary ? '#fff' : t.text}>
        {children}
      </T>
    </Pressable>
  )
}

export function StatCell({ t, label, value, valueColor }: { t: Theme; label: string; value: string; valueColor?: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: radii.sm, padding: 10 }}>
      <T t={t} size={11} color="rgba(255,255,255,0.6)">
        {label}
      </T>
      <T t={t} size={16} weight="800" color={valueColor ?? '#fff'}>
        {value}
      </T>
    </View>
  )
}
