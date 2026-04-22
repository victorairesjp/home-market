import { View, type ViewProps } from 'react-native'
import { useColors } from '@/constants/colors'

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
          borderRadius: 16,
          padding,
          boxShadow: c.isDark ? undefined : '0 1px 3px rgba(0,0,0,0.07)',
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  )
}
