import { Button } from '@/components/ui/button'
import { TextInput } from '@/components/ui/text-input'
import { PRIMARY, useColors } from '@/constants/colors'
import { supabase } from '@/lib/supabase'
import { zodResolver } from '@hookform/resolvers/zod'
import * as Linking from 'expo-linking'
import { router } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Alert, KeyboardAvoidingView, Pressable, ScrollView, Text, View } from 'react-native'
import { z } from 'zod'

WebBrowser.maybeCompleteAuthSession()

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

type FormData = z.infer<typeof schema>

export default function Index() {
  const c = useColors()
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit({ email, password }: FormData) {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) Alert.alert('Erro ao entrar', error.message)
  }

  async function signInWithGoogle() {
    setGoogleLoading(true)
    try {
      const redirectTo = Linking.createURL('/')
      console.log('[OAuth] redirectTo =', redirectTo)

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: { prompt: 'select_account' },
        },
      })

      console.log('[OAuth] supabase.error =', error?.message ?? 'none')
      console.log('[OAuth] data.url =', data?.url ?? 'none')

      if (error || !data.url) {
        Alert.alert('Erro', error?.message ?? 'Não foi possível iniciar o login com Google')
        return
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)
      console.log('[OAuth] result =', result.type, 'url' in result ? result.url : '')

      if (result.type === 'success' && result.url) {
        const url = result.url
        const codeMatch = url.match(/[?&]code=([^&]+)/)
        if (codeMatch) {
          const code = decodeURIComponent(codeMatch[1])
          const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
          if (sessionError) Alert.alert('Erro', sessionError.message)
          return
        }
        const hashIdx = url.indexOf('#')
        if (hashIdx >= 0) {
          const hashParams = url.slice(hashIdx + 1).split('&').reduce((acc, part) => {
            const [k, v] = part.split('=')
            if (k && v) acc[k] = decodeURIComponent(v)
            return acc
          }, {} as Record<string, string>)
          const accessToken = hashParams.access_token
          const refreshToken = hashParams.refresh_token
          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })
            if (sessionError) Alert.alert('Erro', sessionError.message)
            return
          }
        }
        Alert.alert('Erro', 'Tokens não encontrados na resposta do OAuth')
      } else if (result.type !== 'cancel' && result.type !== 'dismiss') {
        Alert.alert(
          'Login Google não concluído',
          `Adicione esta URL ao painel do Supabase (Authentication → URL Configuration → Redirect URLs):\n\n${redirectTo}`
        )
      }
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, gap: 28 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ gap: 8, alignItems: 'center' }}>
          <Text style={{ fontSize: 40 }}>🛒</Text>
          <Text style={{ fontSize: 26, fontWeight: '700', color: c.text }}>Home Market</Text>
          <Text style={{ fontSize: 15, color: c.subtext }}>Controle seus gastos na feira</Text>
        </View>

        <Pressable
          onPress={signInWithGoogle}
          disabled={googleLoading || loading}
          style={({ pressed }) => ({
            flexDirection: 'row' as const,
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
            gap: 10,
            height: 50,
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: c.border,
            backgroundColor: pressed ? c.inputBg : c.card,
            opacity: googleLoading ? 0.6 : 1,
          })}
        >
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#4285F4' }}>G</Text>
          <Text style={{ fontSize: 15, fontWeight: '600', color: c.text }}>
            {googleLoading ? 'Conectando...' : 'Continuar com Google'}
          </Text>
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: c.border }} />
          <Text style={{ fontSize: 13, color: c.subtext }}>ou entre com e-mail</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: c.border }} />
        </View>

        <View style={{ gap: 14 }}>
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
                autoComplete="password"
                value={field.value}
                onChangeText={field.onChange}
                error={errors.password?.message}
              />
            )}
          />
          <Button
            title="Entrar"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            disabled={googleLoading}
            fullWidth
          />
          <Pressable
            onPress={() => router.push('/(auth)/forgot-password')}
            style={{ alignSelf: 'center', paddingVertical: 4 }}
          >
            <Text style={{ fontSize: 14, color: PRIMARY, fontWeight: '600' }}>
              Esqueci minha senha
            </Text>
          </Pressable>
        </View>

        <View style={{ alignItems: 'center', gap: 4 }}>
          <Text style={{ fontSize: 14, color: c.subtext }}>Não tem uma conta?</Text>
          <Pressable onPress={() => router.push('/(auth)/sign-up')}>
            <Text style={{ fontSize: 14, color: PRIMARY, fontWeight: '600' }}>Criar conta</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
