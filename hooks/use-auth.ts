import { use } from 'react'
import { AuthContext } from '@/context/auth'

export function useAuth() {
  return use(AuthContext)
}
