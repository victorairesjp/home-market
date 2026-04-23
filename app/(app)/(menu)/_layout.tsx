import { Stack } from 'expo-router/stack'

export default function MenuLayout() {
  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  )
}
