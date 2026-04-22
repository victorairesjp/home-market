import { Text, TextInput as RNTextInput, View, type TextInputProps } from 'react-native'
import { useColors } from '@/constants/colors'

type Props = TextInputProps & {
  label?: string
  error?: string
}

export function TextInput({ label, error, style, ...props }: Props) {
  const c = useColors()

  return (
    <View style={{ gap: 6 }}>
      {label && (
        <Text style={{ fontSize: 13, fontWeight: '500', color: c.subtext }}>{label}</Text>
      )}
      <RNTextInput
        style={[
          {
            backgroundColor: c.input,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 16,
            color: c.text,
            minHeight: 46,
            borderWidth: 1,
            borderColor: error ? c.danger : c.border,
          },
          style,
        ]}
        placeholderTextColor={c.subtext}
        {...props}
      />
      {error && <Text style={{ fontSize: 12, color: c.danger }}>{error}</Text>}
    </View>
  )
}
