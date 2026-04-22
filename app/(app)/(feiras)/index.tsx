import { useMemo, useState } from 'react'
import { FlatList, TextInput as RNTextInput, Text, View } from 'react-native'
import { router, Stack } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { FeiraCard } from '@/components/feiras/feira-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Loading } from '@/components/ui/loading'
import { HeaderAddButton } from '@/components/ui/header-add-button'
import { useColors } from '@/constants/colors'
import { useFeiras } from '@/hooks/use-feiras'
import { formatCurrency } from '@/lib/format'

export default function FeirasScreen() {
  const c = useColors()
  const { data: feiras, isLoading } = useFeiras()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!feiras) return []
    const q = search.trim().toLowerCase()
    if (!q) return feiras
    return feiras.filter(
      (f) => f.name.toLowerCase().includes(q) || f.store.toLowerCase().includes(q)
    )
  }, [feiras, search])

  const stats = useMemo(() => {
    if (!feiras || feiras.length === 0) return { total: 0, sum: 0, avg: 0 }
    const sum = feiras.reduce((acc, f) => acc + f.total, 0)
    return { total: feiras.length, sum, avg: sum / feiras.length }
  }, [feiras])

  if (isLoading) return <Loading />

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <HeaderAddButton label="Feira" onPress={() => router.push('/(app)/(feiras)/new')} />
          ),
        }}
      />
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
        ListHeaderComponent={
          feiras && feiras.length > 0 ? (
            <View style={{ gap: 12, marginBottom: 4 }}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <StatBox label="Total" value={String(stats.total)} c={c} />
                <StatBox label="Gasto" value={formatCurrency(stats.sum)} c={c} />
                <StatBox label="Média" value={formatCurrency(stats.avg)} c={c} />
              </View>
              <SearchInput value={search} onChange={setSearch} c={c} />
            </View>
          ) : null
        }
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
          search.trim() ? (
            <EmptyState
              icon="🔍"
              title="Nenhuma feira encontrada"
              description={`Não há feiras que correspondam a "${search}".`}
            />
          ) : (
            <EmptyState
              icon="🛒"
              title="Nenhuma feira ainda"
              description="Toque em '+ Feira' para registrar sua primeira feira."
            />
          )
        }
      />
    </>
  )
}

function StatBox({
  label,
  value,
  c,
}: {
  label: string
  value: string
  c: ReturnType<typeof useColors>
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: c.card,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: c.border,
        gap: 2,
      }}
    >
      <Text style={{ fontSize: 11, color: c.subtext, fontWeight: '500' }}>{label}</Text>
      <Text
        style={{ fontSize: 14, fontWeight: '700', color: c.text, fontVariant: ['tabular-nums'] }}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  )
}

function SearchInput({
  value,
  onChange,
  c,
}: {
  value: string
  onChange: (v: string) => void
  c: ReturnType<typeof useColors>
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: c.inputBg,
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 40,
      }}
    >
      <Ionicons name="search" size={16} color={c.subtext} />
      <RNTextInput
        placeholder="Buscar feira ou loja"
        placeholderTextColor={c.subtext}
        value={value}
        onChangeText={onChange}
        style={{ flex: 1, fontSize: 15, color: c.text }}
        autoCapitalize="none"
        clearButtonMode="while-editing"
      />
    </View>
  )
}
