import { Stack } from 'expo-router/stack'

export default function ProdutosLayout() {
  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
        headerTransparent: true,
        headerBlurEffect: 'prominent',
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Produtos' }} />
    </Stack>
  )
}
