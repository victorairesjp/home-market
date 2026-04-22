import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/context/auth'
import { queryClient } from '@/lib/query-client'
import { useAuth } from '@/hooks/use-auth'

SplashScreen.preventAutoHideAsync().catch(() => {})

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {})
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style="auto" />
        <Routes />
      </AuthProvider>
    </QueryClientProvider>
  )
}

function Routes() {
  const { session, loading } = useAuth()

  if (loading) return null

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  )
}
