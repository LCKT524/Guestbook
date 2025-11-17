import { createClient } from '@supabase/supabase-js'
import { normalizePhone, isValidCNMobile } from './utils'

const rawUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim()
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim()
const demoFlag = String(import.meta.env.VITE_DEMO_MODE || '').toLowerCase() === 'true'
export const isDemo = demoFlag

export const supabase = createClient(rawUrl as string, rawKey as string)

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
  address?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Record {
  id: string
  user_id: string
  contact_id?: string
  category_id?: string
  type: 'gift_given' | 'gift_received' | 'expense' | 'income'
  event_name: string
  record_date: string
  amount: number
  payment_method?: string
  note?: string
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
  type: 'gift' | 'expense' | 'income'
  color: string
  created_at: string
}

// 认证相关函数
async function sha256Hex(input: string) {
  const enc = new TextEncoder()
  const data = enc.encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  const bytes = new Uint8Array(digest)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

function genSaltHex(len = 16) {
  const arr = new Uint8Array(len)
  crypto.getRandomValues(arr)
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('')
}

export const auth = {
  async signInWithPhone(phone: string, password: string) {
    const p = normalizePhone(phone)
    if (!isValidCNMobile(p)) throw new Error('手机号格式不正确')
    const { data: rows, error } = await supabase
      .from('users')
      .select('id, phone, nickname, password_salt, password_hash, created_at, updated_at')
      .eq('phone', p)
      .limit(1)
    if (error) throw error
    if (!rows || rows.length === 0) throw new Error('用户不存在')
    const u = rows[0] as {
      id: string
      phone?: string
      nickname?: string
      password_salt: string
      password_hash: string
      created_at: string
      updated_at: string
    }
    const calc = await sha256Hex(password + String(u.password_salt))
    if (calc !== String(u.password_hash)) throw new Error('手机号或密码错误')
    try {
      await supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', u.id)
    } catch {}
    return { user: u }
  },

  async signUpWithPhone(phone: string, password: string, nickname: string) {
    const p = normalizePhone(phone)
    if (!isValidCNMobile(p)) throw new Error('手机号格式不正确')
    const { data: exists, error: e1 } = await supabase
      .from('users')
      .select('id')
      .eq('phone', p)
      .limit(1)
    if (e1) throw e1
    if ((exists as Array<{ id: string }> | null)?.length) throw new Error('手机号已注册')
    const salt = genSaltHex(16)
    const hash = await sha256Hex(password + salt)
    const { data, error } = await supabase
      .from('users')
      .insert([{ phone: p, nickname, password_salt: salt, password_hash: hash }])
      .select()
      .single()
    if (error) throw error
    return { user: data }
  },

  async signOut() {
    return { success: true }
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
    const phone = contact.phone ? normalizePhone(contact.phone) : undefined
    if (phone && !isValidCNMobile(phone)) throw new Error('联系人手机号格式不正确')
    const payload = { ...contact, phone }
    return supabase
      .from('contacts')
      .insert([payload])
      .select()
      .single()
  },

  async update(id: string, contact: Partial<Contact>) {
    const phone = typeof contact.phone === 'string' ? normalizePhone(contact.phone) : contact.phone
    if (typeof phone === 'string' && phone && !isValidCNMobile(phone)) throw new Error('联系人手机号格式不正确')
    const payload = { ...contact, phone }
    return supabase
      .from('contacts')
      .update(payload)
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
    type?: 'gift_given' | 'gift_received' | 'expense' | 'income'
    startDate?: string
    endDate?: string
    contactId?: string
  }) {
    let query = supabase
      .from('records')
      .select(`
        *,
        contacts(name)
      `)
      .eq('user_id', userId)
      .order('record_date', { ascending: false })

    if (filters?.type) {
      query = query.eq('type', filters.type)
    }
    if (filters?.startDate) {
      query = query.gte('record_date', filters.startDate)
    }
    if (filters?.endDate) {
      query = query.lte('record_date', filters.endDate)
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
      query = query.gte('record_date', startDate)
    }
    if (endDate) {
      query = query.lte('record_date', endDate)
    }

    return query
  },
}

// 分类管理
export const categories = {
  async list(userId: string, type?: 'gift' | 'expense' | 'income') {
    let query = supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true })

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
