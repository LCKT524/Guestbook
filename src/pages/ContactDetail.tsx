import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { User, Phone, MapPin, StickyNote, Trash2, Check, X } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import toast from 'react-hot-toast'
import { validatePhone } from '../lib/utils'

export default function ContactDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { contacts, updateContact, deleteContact } = useApp()

  const contact = useMemo(() => contacts.find(c => c.id === id), [contacts, id])
  const [name, setName] = useState(contact?.name || '')
  const [phone, setPhone] = useState(contact?.phone || '')
  const [address, setAddress] = useState(contact?.address || '')
  const [notes, setNotes] = useState(contact?.notes || '')
  const [editing, setEditing] = useState(true)

  if (!contact) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 mb-2">未找到该联系人</div>
          <button className="px-4 py-2 bg-orange-500 text-white rounded-lg" onClick={() => navigate(-1)}>返回</button>
        </div>
      </div>
    )
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('请填写姓名')
      return
    }
    if (phone.trim()) {
      const v = validatePhone(phone)
      if (!v.ok) {
        toast.error(v.error || '手机号格式不正确')
        return
      }
      try {
        await updateContact(contact.id, { name: name.trim(), phone: String(v.value), address: address || undefined, notes: notes || undefined })
        toast.success('已保存联系人')
        setEditing(false)
      } catch (e: any) {
        toast.error(e?.message || '保存失败')
      }
      return
    }
    try {
      await updateContact(contact.id, { name: name.trim(), phone: undefined, address: address || undefined, notes: notes || undefined })
      toast.success('已保存联系人')
      setEditing(false)
    } catch (e: any) {
      toast.error(e?.message || '保存失败')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteContact(contact.id)
      toast.success('已删除联系人')
      navigate('/contacts')
    } catch (e: any) {
      toast.error(e?.message || '删除失败')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900">返回</button>
          <h1 className="text-lg font-semibold text-gray-900">联系人详情</h1>
          <button className="p-2 text-gray-500 hover:text-red-600" onClick={handleDelete}>
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">姓名</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full pl-10 p-3 border border-gray-300 rounded-lg" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">电话</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full pl-10 p-3 border border-gray-300 rounded-lg" placeholder="可选" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">地址</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-gray-400" />
              </div>
              <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full pl-10 p-3 border border-gray-300 rounded-lg" placeholder="可选" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">备注</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <StickyNote className="h-5 w-5 text-gray-400" />
              </div>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full pl-10 p-3 border border-gray-300 rounded-lg" />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg" onClick={handleSave}>
              <Check className="w-4 h-4 mr-1" />保存
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}