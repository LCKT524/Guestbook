import { createContext, useContext, useEffect, useState } from 'react'
import { auth, User, isDemo } from '../lib/supabase-client'

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
    const demoStored = localStorage.getItem('demoUser')
    if (isDemo) {
      if (demoStored) {
        try {
          const u = JSON.parse(demoStored)
          setUser(u)
        } catch {}
      }
      setLoading(false)
      return
    }

    const checkUser = async () => {
      try {
        const { data: { user: currentUser } } = await auth.getCurrentUser()
        if (currentUser) {
          setUser({
            id: currentUser.id,
            email: currentUser.email,
            phone: currentUser.phone,
            nickname: currentUser.user_metadata?.nickname || '用户',
            avatar_url: currentUser.user_metadata?.avatar_url,
            preferences: currentUser.user_metadata?.preferences,
            created_at: currentUser.created_at,
            updated_at: currentUser.updated_at,
          })
        }
      } catch (error) {
        console.error('检查用户失败:', error)
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          phone: session.user.phone,
          nickname: session.user.user_metadata?.nickname || '用户',
          avatar_url: session.user.user_metadata?.avatar_url,
          preferences: session.user.user_metadata?.preferences,
          created_at: session.user.created_at,
          updated_at: session.user.updated_at,
        })
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (phone: string, password: string) => {
    if (isDemo) {
      const demoUser: User = {
        id: 'demo-' + Date.now(),
        phone,
        nickname: '演示用户',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setUser(demoUser)
      localStorage.setItem('demoUser', JSON.stringify(demoUser))
      return
    }
    const { data, error } = await auth.signInWithPhone(phone, password)
    if (error) throw error
    if (data.user) {
      setUser({
        id: data.user.id,
        email: data.user.email,
        phone: data.user.phone,
        nickname: data.user.user_metadata?.nickname || '用户',
        avatar_url: data.user.user_metadata?.avatar_url,
        preferences: data.user.user_metadata?.preferences,
        created_at: data.user.created_at,
        updated_at: data.user.updated_at,
      })
    }
  }

  const signUp = async (phone: string, password: string, nickname: string) => {
    if (isDemo) {
      const demoUser: User = {
        id: 'demo-' + Date.now(),
        phone,
        nickname: nickname || '演示用户',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setUser(demoUser)
      localStorage.setItem('demoUser', JSON.stringify(demoUser))
      return
    }
    const { data, error } = await auth.signUpWithPhone(phone, password, nickname)
    if (error) throw error
    if (data.user) {
      setUser({
        id: data.user.id,
        email: data.user.email,
        phone: data.user.phone,
        nickname: data.user.user_metadata?.nickname || nickname,
        avatar_url: data.user.user_metadata?.avatar_url,
        preferences: data.user.user_metadata?.preferences,
        created_at: data.user.created_at,
        updated_at: data.user.updated_at,
      })
    }
  }

  const signOut = async () => {
    if (isDemo) {
      localStorage.removeItem('demoUser')
      setUser(null)
      return
    }
    const { error } = await auth.signOut()
    if (error) throw error
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
