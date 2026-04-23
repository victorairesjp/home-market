import { ActivityIndicator, Pressable, Text } from 'react-native'
import { useColors } from '@/constants/colors'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

type Props = {
  title: string
  onPress: () => void
  variant?: Variant
  size?: Size
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
}: Props) {
  const c = useColors()

  const bg: Record<Variant, string> = {
    primary:   c.primary,
    secondary: c.inputBg,
    danger:    c.danger,
    ghost:     'transparent',
  }

  const fg: Record<Variant, string> = {
    primary:   '#FFFFFF',
    secondary: c.text,
    danger:    '#FFFFFF',
    ghost:     c.primary,
  }

  const heights: Record<Size, number>    = { sm: 40, md: 52, lg: 58 }
  const radii: Record<Size, number>      = { sm: 12, md: 16, lg: 18 }
  const fontSizes: Record<Size, number>  = { sm: 13, md: 15, lg: 17 }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => ({
        backgroundColor: bg[variant],
        height: heights[size],
        borderRadius: radii[size],
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        paddingHorizontal: 24,
        opacity: disabled || loading ? 0.5 : pressed ? 0.82 : 1,
        width: fullWidth ? ('100%' as const) : undefined,
        // Subtle shadow on primary only
        ...(variant === 'primary' && !disabled && !c.isDark
          ? {
              shadowColor: c.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }
          : {}),
      })}
    >
      {loading ? (
        <ActivityIndicator color={fg[variant]} size="small" />
      ) : (
        <Text style={{ color: fg[variant], fontSize: fontSizes[size], fontWeight: '700', letterSpacing: 0.2 }}>
          {title}
        </Text>
      )}
    </Pressable>
  )
}
