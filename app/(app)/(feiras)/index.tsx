import { FlatList, Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Stack } from 'expo-router'
import { FeiraCard } from '@/components/feiras/feira-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Loading } from '@/components/ui/loading'
import { useColors, PRIMARY } from '@/constants/colors'
import { useFeiras } from '@/hooks/use-feiras'

export default function FeirasScreen() {
  const c = useColors()
  const { data: feiras, isLoading } = useFeiras()

  if (isLoading) return <Loading />

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={() => router.push('/(app)/(feiras)/new')}>
              <Text style={{ fontSize: 15, color: PRIMARY, fontWeight: '600' }}>+ Nova</Text>
            </Pressable>
          ),
        }}
      />
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        data={feiras}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
        renderItem={({ item, index }) => (
          <FeiraCard
            id={item.id}
            name={item.name}
            store={item.store}
            date={item.date}
            itemCount={item.item_count}
            total={item.total}
            index={index}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="🛒"
            title="Nenhuma feira ainda"
            description="Toque em '+ Nova' para registrar sua primeira feira."
          />
        }
      />
    </>
  )
}
