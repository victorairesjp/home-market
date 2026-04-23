import { Text, TextInput as RNTextInput, View, type TextInputProps } from 'react-native'
import { useColors } from '@/constants/colors'

type Props = TextInputProps & {
  label?: string
  error?: string
}

export function TextInput({ label, error, style, ...props }: Props) {
  const c = useColors()

  return (
    <View style={{ gap: 8 }}>
      {label && (
        <Text style={{ fontSize: 13, fontWeight: '600', color: c.subtext, letterSpacing: 0.3 }}>
          {label.toUpperCase()}
        </Text>
      )}
      <RNTextInput
        style={[
          {
            backgroundColor: error ? c.danger + '10' : c.inputBg,
            borderRadius: 14,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: 16,
            color: c.text,
            minHeight: 52,
            borderWidth: 1.5,
            borderColor: error ? c.danger : 'transparent',
          },
          style,
        ]}
        placeholderTextColor={c.subtext}
        {...props}
      />
      {error && (
        <Text style={{ fontSize: 12, color: c.danger, fontWeight: '500' }}>{error}</Text>
      )}
    </View>
  )
}
