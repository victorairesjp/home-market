import { Stack } from 'expo-router/stack'
import { MenuButton } from '@/components/navigation/menu-button'

export default function CompararLayout() {
  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
        headerTransparent: true,
        headerBlurEffect: 'prominent',
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: 'Comparar', headerLeft: () => <MenuButton /> }}
      />
    </Stack>
  )
}
