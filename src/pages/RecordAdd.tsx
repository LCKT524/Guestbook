import { useState } from 'react'
import { Gift, Calendar, User, DollarSign, MessageSquare, Camera } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function RecordAdd() {
  const [type, setType] = useState<'gift_given' | 'gift_received'>('gift_given')
  const [contactId, setContactId] = useState('')
  const [eventName, setEventName] = useState('')
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 10))
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('现金')
  const [categoryId, setCategoryId] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { contacts, categories, addRecord } = useApp()
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!eventName || !amount || !eventDate) {
      toast.error('请填写必要信息')
      return
    }

    if (!user) {
      toast.error('请先登录')
      return
    }

    setLoading(true)
    try {
      await addRecord({
        user_id: user.id,
        contact_id: contactId || undefined,
        type,
        event_name: eventName,
        record_date: eventDate,
        amount: parseFloat(amount),
        category_id: categoryId || undefined,
        payment_method: paymentMethod,
        note: notes || undefined,
      })
      
      toast.success('记录添加成功！')
      navigate('/')
    } catch (error: any) {
      toast.error(error.message || '添加记录失败')
    } finally {
      setLoading(false)
    }
  }

  const paymentMethods = ['现金', '微信', '支付宝', '银行卡', '其他']
  const commonEvents = ['婚礼', '满月酒', '寿宴', '乔迁', '升学宴', '开业庆典']

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面标题 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate(-1)}
              className="text-gray-600 hover:text-gray-900"
            >
              取消
            </button>
            <h1 className="text-lg font-semibold text-gray-900">添加记录</h1>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="text-orange-500 hover:text-orange-600 font-medium disabled:opacity-50"
            >
              保存
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-6">
        {/* 记录类型 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-3">记录类型</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType('gift_given')}
              className={`p-3 rounded-lg border-2 transition-colors ${
                type === 'gift_given'
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-gray-200 bg-white text-gray-700'
              }`}
            >
              <Gift className="w-5 h-5 mx-auto mb-1" />
              <span className="text-sm font-medium">送礼</span>
            </button>
            <button
              type="button"
              onClick={() => setType('gift_received')}
              className={`p-3 rounded-lg border-2 transition-colors ${
                type === 'gift_received'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 bg-white text-gray-700'
              }`}
            >
              <Gift className="w-5 h-5 mx-auto mb-1" />
              <span className="text-sm font-medium">收礼</span>
            </button>
          </div>
        </div>

        {/* 联系人选择 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            联系人
          </label>
          <select
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="">选择联系人（可选）</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
              {contact.name}
              </option>
            ))}
          </select>
        </div>

        {/* 事件信息 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            事件名称
          </label>
          <input
            type="text"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 mb-3"
            placeholder="例如：张三婚礼"
          />

          <div className="grid grid-cols-3 gap-2 mb-3">
            {commonEvents.map((event) => (
              <button
                key={event}
                type="button"
                onClick={() => setEventName(event)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {event}
              </button>
            ))}
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-2">
            事件日期
          </label>
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        {/* 分类选择 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            分类
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="">选择分类（可选）</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* 金额信息 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            金额
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500">¥</span>
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-2 mt-4">
            支付方式
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
          >
            {paymentMethods.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>

        {/* 备注 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            备注
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
            placeholder="添加备注信息（可选）"
          />
        </div>

        {/* 提交按钮 */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '保存中...' : '保存记录'}
        </button>
      </form>
    </div>
  )
}