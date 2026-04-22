import { useColorScheme } from 'react-native'

export const PRIMARY = '#4A7C59'
export const DANGER = '#DC2626'
export const SUCCESS = '#16A34A'
export const WARNING = '#F59E0B'

const light = {
  background: '#F2F2F7',
  card: '#FFFFFF',
  text: '#1A1A1A',
  subtext: '#8E8E93',
  border: '#E5E5EA',
  input: '#FFFFFF',
  inputBg: '#F2F2F7',
}

const dark = {
  background: '#000000',
  card: '#1C1C1E',
  text: '#FFFFFF',
  subtext: '#8E8E93',
  border: '#38383A',
  input: '#2C2C2E',
  inputBg: '#1C1C1E',
}

export function useColors() {
  const scheme = useColorScheme()
  const isDark = scheme === 'dark'
  const theme = isDark ? dark : light
  return { ...theme, primary: PRIMARY, danger: DANGER, success: SUCCESS, isDark }
}
