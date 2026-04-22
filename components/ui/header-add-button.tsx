import { Pressable, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { PRIMARY } from '@/constants/colors'

type Props = {
  label: string
  onPress: () => void
}

export function HeaderAddButton({ label, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => ({
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 18,
        backgroundColor: PRIMARY,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Ionicons name="add" size={16} color="#fff" />
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>{label}</Text>
    </Pressable>
  )
}
