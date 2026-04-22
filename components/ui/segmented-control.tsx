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
        borderRadius: 10,
        padding: 3,
        gap: 2,
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 7,
              borderRadius: 8,
              alignItems: 'center' as const,
              backgroundColor: active ? c.card : pressed ? c.border : 'transparent',
              shadowColor: active ? '#000' : 'transparent',
              shadowOpacity: active ? 0.08 : 0,
              shadowRadius: 2,
              shadowOffset: { width: 0, height: 1 },
            })}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: active ? '600' : '500',
                color: active ? c.text : c.subtext,
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
