import { Text, View } from 'react-native'
import { useColors } from '@/constants/colors'

type Props = {
  title: string
  action?: React.ReactNode
}

export function SectionHeader({ title, action }: Props) {
  const c = useColors()

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: c.text }}>{title}</Text>
      {action}
    </View>
  )
}
