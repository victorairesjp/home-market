import { Stack } from 'expo-router/stack'
import { MenuButton } from '@/components/navigation/menu-button'

export default function FeirasLayout() {
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
        options={{ title: 'Feiras', headerLeft: () => <MenuButton /> }}
      />
      <Stack.Screen
        name="new"
        options={{
          title: 'Nova Feira',
          presentation: 'formSheet',
          headerLargeTitle: false,
          headerTransparent: false,
          sheetGrabberVisible: true,
          sheetAllowedDetents: [0.75, 1.0],
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{ title: 'Detalhes', headerLargeTitle: false }}
      />
    </Stack>
  )
}
