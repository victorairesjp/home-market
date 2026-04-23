import { Stack } from 'expo-router/stack'

export default function FeirasLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackButtonDisplayMode: 'minimal',
        headerLargeTitle: false,
        headerTransparent: false,
        headerBlurEffect: 'prominent',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="new"
        options={{
          title: 'Nova Feira',
          presentation: 'formSheet',
          headerTransparent: false,
          sheetGrabberVisible: true,
          sheetAllowedDetents: [0.85, 1.0],
        }}
      />
      <Stack.Screen name="[id]" options={{ title: '', headerTransparent: true }} />
      <Stack.Screen
        name="scan"
        options={{
          title: 'Importar Cupom',
          presentation: 'modal',
          headerTransparent: false,
        }}
      />
    </Stack>
  )
}
