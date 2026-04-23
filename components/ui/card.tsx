import { View, type ViewProps } from 'react-native'
import { useColors, CARD_SHADOW } from '@/constants/colors'

type Props = ViewProps & {
  children: React.ReactNode
  padding?: number
}

export function Card({ children, style, padding = 16, ...props }: Props) {
  const c = useColors()

  return (
    <View
      style={[
        {
          backgroundColor: c.card,
          borderRadius: 20,
          padding,
          ...(c.isDark ? {} : CARD_SHADOW),
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  )
}
