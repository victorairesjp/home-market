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
    primary: c.primary,
    secondary: c.inputBg,
    danger: c.danger,
    ghost: 'transparent',
  }

  const fg: Record<Variant, string> = {
    primary: '#FFFFFF',
    secondary: c.text,
    danger: '#FFFFFF',
    ghost: c.primary,
  }

  const heights: Record<Size, number> = { sm: 36, md: 46, lg: 54 }
  const fontSizes: Record<Size, number> = { sm: 13, md: 15, lg: 17 }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => ({
        backgroundColor: bg[variant],
        height: heights[size],
        borderRadius: 14,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        paddingHorizontal: 20,
        opacity: disabled || loading ? 0.5 : pressed ? 0.8 : 1,
        width: fullWidth ? ('100%' as const) : undefined,
      })}
    >
      {loading ? (
        <ActivityIndicator color={fg[variant]} size="small" />
      ) : (
        <Text style={{ color: fg[variant], fontSize: fontSizes[size], fontWeight: '600' }}>
          {title}
        </Text>
      )}
    </Pressable>
  )
}
