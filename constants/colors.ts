import { useColorScheme } from 'react-native'

export const PRIMARY = '#26A96C'
export const DANGER  = '#FF6B6B'
export const SUCCESS = '#26A96C'
export const WARNING = '#FFB020'

// Consistent shadow helper for iOS + Android
export const CARD_SHADOW = {
  shadowColor: '#101828',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 4,
}

export const SHADOW_SM = {
  shadowColor: '#101828',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 6,
  elevation: 2,
}

const light = {
  background: '#F8F9FA',
  card:       '#FFFFFF',
  text:       '#1C2127',
  subtext:    '#9098B1',
  border:     '#EFF0F6',
  input:      '#FFFFFF',
  inputBg:    '#F4F5F7',
}

const dark = {
  background: '#0D0D0D',
  card:       '#1A1A1E',
  text:       '#F2F2F7',
  subtext:    '#8E8E93',
  border:     '#2C2C2E',
  input:      '#2C2C2E',
  inputBg:    '#1A1A1E',
}

export function useColors() {
  const scheme = useColorScheme()
  const isDark = scheme === 'dark'
  const theme = isDark ? dark : light
  return { ...theme, primary: PRIMARY, danger: DANGER, success: SUCCESS, isDark }
}
