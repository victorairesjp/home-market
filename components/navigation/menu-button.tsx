import { Pressable } from 'react-native'
import { DrawerActions, useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { useColors } from '@/constants/colors'

export function MenuButton() {
  const navigation = useNavigation()
  const c = useColors()

  return (
    <Pressable
      onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 4 })}
      hitSlop={8}
    >
      <Ionicons name="menu" size={26} color={c.text} />
    </Pressable>
  )
}
