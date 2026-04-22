import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { TextInput } from '@/components/ui/text-input'
import { useColors, PRIMARY } from '@/constants/colors'
import { supabase } from '@/lib/supabase'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
})

type FormData = z.infer<typeof schema>

export default function ForgotPassword() {
  const c = useColors()
  const [loading, setLoading] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit({ email }: FormData) {
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    setLoading(false)
    if (error) {
      Alert.alert('Erro', error.message)
    } else {
      Alert.alert(
        'E-mail enviado',
        'Enviamos um link de redefinição de senha para seu e-mail.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/sign-in') }]
      )
    }
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, gap: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ gap: 8, alignItems: 'center' }}>
          <Text style={{ fontSize: 36 }}>🔐</Text>
          <Text style={{ fontSize: 26, fontWeight: '700', color: c.text }}>Esqueci a senha</Text>
          <Text style={{ fontSize: 15, color: c.subtext, textAlign: 'center' }}>
            Digite seu e-mail para receber um link de redefinição
          </Text>
        </View>

        <View style={{ gap: 16 }}>
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <TextInput
                label="E-mail"
                placeholder="seu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={field.value}
                onChangeText={field.onChange}
                error={errors.email?.message}
              />
            )}
          />
          <Button
            title="Enviar link de redefinição"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            fullWidth
          />
        </View>

        <View style={{ alignItems: 'center' }}>
          <Pressable onPress={() => router.back()}>
            <Text style={{ fontSize: 14, color: PRIMARY, fontWeight: '600' }}>
              Voltar para o login
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
