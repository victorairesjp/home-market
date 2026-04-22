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
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function SignUp() {
  const c = useColors()
  const [loading, setLoading] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit({ email, password }: FormData) {
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) {
      Alert.alert('Erro ao criar conta', error.message)
    } else if (data.session) {
      // Email confirmation disabled — session already active, AuthContext will redirect
    } else {
      Alert.alert(
        'Confirme seu e-mail',
        'Enviamos um link de confirmação para seu e-mail.',
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
          <Text style={{ fontSize: 36 }}>🛒</Text>
          <Text style={{ fontSize: 26, fontWeight: '700', color: c.text }}>Criar Conta</Text>
          <Text style={{ fontSize: 15, color: c.subtext }}>Comece a controlar seus gastos</Text>
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
          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <TextInput
                label="Senha"
                placeholder="••••••••"
                secureTextEntry
                value={field.value}
                onChangeText={field.onChange}
                error={errors.password?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field }) => (
              <TextInput
                label="Confirmar Senha"
                placeholder="••••••••"
                secureTextEntry
                value={field.value}
                onChangeText={field.onChange}
                error={errors.confirmPassword?.message}
              />
            )}
          />
          <Button title="Criar Conta" onPress={handleSubmit(onSubmit)} loading={loading} fullWidth />
        </View>

        <View style={{ alignItems: 'center', gap: 4 }}>
          <Text style={{ fontSize: 14, color: c.subtext }}>Já tem uma conta?</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={{ fontSize: 14, color: PRIMARY, fontWeight: '600' }}>Entrar</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
