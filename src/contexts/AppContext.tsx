import { createContext, useContext, useState, useEffect } from 'react'
import { records as recordsAPI, contacts as contactsAPI, categories as categoriesAPI, isDemo } from '../lib/supabase-client'
import type { Record as GiftRecord, Contact, Category } from '../lib/supabase-client'
import { useAuth } from './AuthContext'

interface AppContextType {
  records: GiftRecord[]
  contacts: Contact[]
  categories: Category[]
  loading: boolean
  refreshData: () => Promise<void>
  addRecord: (record: Omit<GiftRecord, 'id' | 'created_at' | 'updated_at'>) => Promise<GiftRecord | void>
  updateRecord: (id: string, record: Partial<GiftRecord>) => Promise<void>
  deleteRecord: (id: string) => Promise<void>
  addContact: (contact: Omit<Contact, 'id' | 'created_at' | 'updated_at'>) => Promise<Contact>
  updateContact: (id: string, contact: Partial<Contact>) => Promise<void>
  deleteContact: (id: string) => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<GiftRecord[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const { user } = useAuth()

  const refreshData = async () => {
    if (!user) return

    setLoading(true)
    try {
      if (isDemo) {
        const rs = localStorage.getItem('demoRecords')
        const cs = localStorage.getItem('demoContacts')
        setRecords(rs ? JSON.parse(rs) : [])
        setContacts(cs ? JSON.parse(cs) : [])
      } else {
        const { data: recordsData, error: recordsError } = await recordsAPI.list(user.id)
        if (recordsError) throw recordsError
        setRecords(recordsData || [])
        const { data: contactsData, error: contactsError } = await contactsAPI.list(user.id)
        if (contactsError) throw contactsError
        setContacts(contactsData || [])
        const { data: categoriesData, error: categoriesError } = await categoriesAPI.list(user.id)
        if (categoriesError) throw categoriesError
        setCategories(categoriesData || [])
      }
    } catch (error) {
      console.error('获取数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const addRecord = async (record: Omit<GiftRecord, 'id' | 'created_at' | 'updated_at'>) => {
    if (isDemo) {
      const newRec: GiftRecord = { ...record, id: String(Date.now()), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      setRecords(prev => {
        const next = [newRec, ...prev]
        localStorage.setItem('demoRecords', JSON.stringify(next))
        return next
      })
      return newRec
    }
    const { data, error } = await recordsAPI.create(record)
    if (error) throw error
    if (data) {
      setRecords(prev => [data, ...prev])
      return data as GiftRecord
    }
  }

  const updateRecord = async (id: string, record: Partial<GiftRecord>) => {
    if (isDemo) {
      setRecords(prev => {
        const next = prev.map(r => r.id === id ? { ...r, ...record, updated_at: new Date().toISOString() } as GiftRecord : r)
        localStorage.setItem('demoRecords', JSON.stringify(next))
        return next
      })
      return
    }
    const { data, error } = await recordsAPI.update(id, record)
    if (error) throw error
    if (data) {
      setRecords(prev => prev.map(r => r.id === id ? data : r))
    }
  }

  const deleteRecord = async (id: string) => {
    if (isDemo) {
      setRecords(prev => {
        const next = prev.filter(r => r.id !== id)
        localStorage.setItem('demoRecords', JSON.stringify(next))
        return next
      })
      return
    }
    const { error } = await recordsAPI.delete(id)
    if (error) throw error
    setRecords(prev => prev.filter(r => r.id !== id))
  }

  const addContact = async (contact: Omit<Contact, 'id' | 'created_at' | 'updated_at'>) => {
    if (isDemo) {
      const newC: Contact = { ...contact, id: String(Date.now()), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      setContacts(prev => {
        const next = [...prev, newC].sort((a, b) => a.name.localeCompare(b.name))
        localStorage.setItem('demoContacts', JSON.stringify(next))
        return next
      })
      return newC
    }
    const { data, error } = await contactsAPI.create(contact)
    if (error) throw error
    if (data) {
      setContacts(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      return data as Contact
    }
    throw new Error('创建联系人失败')
  }

  const updateContact = async (id: string, contact: Partial<Contact>) => {
    if (isDemo) {
      setContacts(prev => {
        const next = prev.map(c => c.id === id ? { ...c, ...contact, updated_at: new Date().toISOString() } as Contact : c)
        localStorage.setItem('demoContacts', JSON.stringify(next))
        return next
      })
      return
    }
    const { data, error } = await contactsAPI.update(id, contact)
    if (error) throw error
    if (data) {
      setContacts(prev => prev.map(c => c.id === id ? data : c))
    }
  }

  const deleteContact = async (id: string) => {
    if (isDemo) {
      setContacts(prev => {
        const next = prev.filter(c => c.id !== id)
        localStorage.setItem('demoContacts', JSON.stringify(next))
        return next
      })
      return
    }
    const { error } = await contactsAPI.delete(id)
    if (error) throw error
    setContacts(prev => prev.filter(c => c.id !== id))
  }

  useEffect(() => {
    if (user) {
      refreshData()
    } else {
      setRecords([])
      setContacts([])
      setCategories([])
      setLoading(false)
    }
  }, [user])

  return (
    <AppContext.Provider value={{
      records,
      contacts,
      categories,
      loading,
      refreshData,
      addRecord,
      updateRecord,
      deleteRecord,
      addContact,
      updateContact,
      deleteContact,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp必须在AppProvider内使用')
  }
  return context
}
