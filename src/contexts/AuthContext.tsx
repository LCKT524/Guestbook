import { createContext, useContext, useEffect, useState } from 'react'
import { auth, User, categories } from '../lib/supabase-client'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (phone: string, password: string) => Promise<void>
  signUp: (phone: string, password: string, nickname: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const s = localStorage.getItem('basicUser')
      if (s) setUser(JSON.parse(s))
    } finally {
      setLoading(false)
    }
  }, [])

  const signIn = async (phone: string, password: string) => {
    const res = await auth.signInWithPhone(phone, password)
    const u = res.user
    const mapped: User = {
      id: u.id,
      email: undefined,
      phone: u.phone,
      nickname: u.nickname || '用户',
      created_at: u.created_at,
      updated_at: u.updated_at,
    }
    setUser(mapped)
    localStorage.setItem('basicUser', JSON.stringify(mapped))
  }

  const signUp = async (phone: string, password: string, nickname: string) => {
    const res = await auth.signUpWithPhone(phone, password, nickname)
    const u = res.user
    const mapped: User = {
      id: u.id,
      email: undefined,
      phone: u.phone,
      nickname: u.nickname || nickname,
      created_at: u.created_at,
      updated_at: u.updated_at,
    }
    setUser(mapped)
    localStorage.setItem('basicUser', JSON.stringify(mapped))

    // 默认分类由数据库触发器自动创建
  }

  const signOut = async () => {
    localStorage.removeItem('basicUser')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth必须在AuthProvider内使用')
  }
  return context
}
