import { ActivityIndicator, View } from 'react-native'
import { Redirect } from 'expo-router'
import { useAuth } from '@/hooks/use-auth'
import { PRIMARY } from '@/constants/colors'

export default function Index() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    )
  }

  return session ? (
    <Redirect href="/(app)/(dashboard)" />
  ) : (
    <Redirect href="/(auth)/sign-in" />
  )
}
