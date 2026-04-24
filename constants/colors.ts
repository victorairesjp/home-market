import { useColorScheme } from 'react-native'

export const PRIMARY = '#26A96C'
export const DANGER  = '#FF6B6B'
export const SUCCESS = '#26A96C'
export const WARNING = '#FFB020'

export const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 6,
  elevation: 2,
}

export const SHADOW_SM = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.03,
  shadowRadius: 3,
  elevation: 1,
}

export const CARD_BORDER = {
  borderWidth: 1,
  borderColor: '#EEEEEE',
}

const light = {
  background: '#FAFAFA',
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
