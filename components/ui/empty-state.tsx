import { Text, View } from 'react-native'
import { useColors } from '@/constants/colors'

type Props = {
  icon?: string
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: Props) {
  const c = useColors()

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10 }}>
      {icon && <Text style={{ fontSize: 52 }}>{icon}</Text>}
      <Text style={{ fontSize: 17, fontWeight: '600', color: c.text, textAlign: 'center' }}>
        {title}
      </Text>
      {description && (
        <Text style={{ fontSize: 14, color: c.subtext, textAlign: 'center', lineHeight: 20 }}>
          {description}
        </Text>
      )}
      {action}
    </View>
  )
}
