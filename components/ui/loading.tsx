import { ActivityIndicator, View } from 'react-native'
import { PRIMARY } from '@/constants/colors'

export function Loading() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={PRIMARY} />
    </View>
  )
}
