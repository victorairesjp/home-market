import { Pressable, Text, View } from 'react-native'
import { useColors } from '@/constants/colors'

type Props<T extends string> = {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}

export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  const c = useColors()

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: c.inputBg,
        borderRadius: 14,
        padding: 4,
        gap: 2,
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={{
              flex: 1,
              paddingVertical: 9,
              borderRadius: 11,
              alignItems: 'center' as const,
              backgroundColor: active ? c.card : 'transparent',
              shadowColor: active ? '#101828' : 'transparent',
              shadowOpacity: active ? 0.08 : 0,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: 1 },
              elevation: active ? 2 : 0,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: active ? '700' : '500',
                color: active ? c.primary : c.subtext,
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
