import { useEffect } from 'react'
import { Stack, router } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useAuth } from '@/hooks/use-auth'

// Needed to close the in-app browser after OAuth redirects back
WebBrowser.maybeCompleteAuthSession()

export default function AuthLayout() {
  const { session, loading } = useAuth()

  // Redirect as soon as a session appears (email/password or OAuth)
  useEffect(() => {
    if (!loading && session) {
      router.replace('/(app)/(dashboard)')
    }
  }, [session, loading])

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  )
}
