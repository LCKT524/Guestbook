import { createClient } from '@supabase/supabase-js'

const rawUrl = import.meta.env.VITE_SUPABASE_URL
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const isValidUrl = (u: any) => {
  try {
    return typeof u === 'string' && u.trim() !== '' && !!new URL(u)
  } catch {
    return false
  }
}
export const isDemo = !isValidUrl(rawUrl)
const supabaseUrl = isValidUrl(rawUrl) ? (rawUrl as string) : 'https://localhost'
const supabaseAnonKey = rawKey && rawKey !== 'undefined' && rawKey !== 'null' && (rawKey as string).trim() !== ''
  ? (rawKey as string)
  : 'example-anon-key'

if (import.meta.env.VITE_SUPABASE_URL === undefined || import.meta.env.VITE_SUPABASE_ANON_KEY === undefined) {
  console.warn('Supabase配置未设置，使用演示占位符以避免崩溃')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 数据库表类型定义
export interface User {
  id: string
  email?: string
  phone?: string
  nickname: string
  avatar_url?: string
  preferences?: { [key: string]: any }
  created_at: string
  updated_at: string
}

export interface Contact {
  id: string
  user_id: string
  name: string
  phone?: string
  relationship?: string
  notes?: string
  metadata?: { [key: string]: any }
  created_at: string
  updated_at: string
}

export interface Record {
  id: string
  user_id: string
  contact_id?: string
  type: 'gift_given' | 'gift_received'
  event_name: string
  event_date: string
  amount: number
  payment_method?: string
  notes?: string
  attachments?: Array<{
    url: string
    name: string
    type: string
  }>
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  type: 'event' | 'relationship'
  color: string
  sort_order: number
  created_at: string
}

// 认证相关函数
export const auth = {
  async signInWithPhone(phone: string, password: string) {
    return supabase.auth.signInWithPassword({
      phone,
      password,
    })
  },

  async signUpWithPhone(phone: string, password: string, nickname: string) {
    return supabase.auth.signUp({
      phone,
      password,
      options: {
        data: {
          nickname,
        },
      },
    })
  },

  async signOut() {
    return supabase.auth.signOut()
  },

  getCurrentUser() {
    return supabase.auth.getUser()
  },

  onAuthStateChange(callback: (event: any, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  },
}

// 联系人管理
export const contacts = {
  async list(userId: string) {
    return supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true })
  },

  async create(contact: Omit<Contact, 'id' | 'created_at' | 'updated_at'>) {
    return supabase
      .from('contacts')
      .insert([contact])
      .select()
      .single()
  },

  async update(id: string, contact: Partial<Contact>) {
    return supabase
      .from('contacts')
      .update(contact)
      .eq('id', id)
      .select()
      .single()
  },

  async delete(id: string) {
    return supabase
      .from('contacts')
      .delete()
      .eq('id', id)
  },
}

// 记录管理
export const records = {
  async list(userId: string, filters?: {
    type?: 'gift_given' | 'gift_received'
    startDate?: string
    endDate?: string
    contactId?: string
  }) {
    let query = supabase
      .from('records')
      .select(`
        *,
        contacts!inner(name, relationship)
      `)
      .eq('user_id', userId)
      .order('event_date', { ascending: false })

    if (filters?.type) {
      query = query.eq('type', filters.type)
    }
    if (filters?.startDate) {
      query = query.gte('event_date', filters.startDate)
    }
    if (filters?.endDate) {
      query = query.lte('event_date', filters.endDate)
    }
    if (filters?.contactId) {
      query = query.eq('contact_id', filters.contactId)
    }

    return query
  },

  async create(record: Omit<Record, 'id' | 'created_at' | 'updated_at'>) {
    return supabase
      .from('records')
      .insert([record])
      .select()
      .single()
  },

  async update(id: string, record: Partial<Record>) {
    return supabase
      .from('records')
      .update(record)
      .eq('id', id)
      .select()
      .single()
  },

  async delete(id: string) {
    return supabase
      .from('records')
      .delete()
      .eq('id', id)
  },

  async getStats(userId: string, startDate?: string, endDate?: string) {
    let query = supabase
      .from('records')
      .select('type, amount')
      .eq('user_id', userId)

    if (startDate) {
      query = query.gte('event_date', startDate)
    }
    if (endDate) {
      query = query.lte('event_date', endDate)
    }

    return query
  },
}

// 分类管理
export const categories = {
  async list(userId: string, type?: 'event' | 'relationship') {
    let query = supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })

    if (type) {
      query = query.eq('type', type)
    }

    return query
  },

  async create(category: Omit<Category, 'id' | 'created_at'>) {
    return supabase
      .from('categories')
      .insert([category])
      .select()
      .single()
  },
}

export default supabase
