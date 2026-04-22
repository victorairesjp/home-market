import { Drawer } from 'expo-router/drawer'
import { DrawerContent } from '@/components/navigation/drawer-content'

export default function AppLayout() {
  return (
    <Drawer
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
        drawerStyle: { width: 300 },
        overlayColor: 'rgba(0,0,0,0.4)',
        swipeEdgeWidth: 40,
      }}
    >
      <Drawer.Screen name="(dashboard)" />
      <Drawer.Screen name="(feiras)" />
      <Drawer.Screen name="(produtos)" />
      <Drawer.Screen name="(comparar)" />
    </Drawer>
  )
}
