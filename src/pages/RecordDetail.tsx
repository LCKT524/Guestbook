import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Calendar, User, DollarSign, Tag, Trash2, Pencil, Check, X } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import toast from 'react-hot-toast'

export default function RecordDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { records, contacts, categories, deleteRecord, updateRecord } = useApp()

  const record = useMemo(() => records.find(r => r.id === id), [records, id])
  const contact = useMemo(() => contacts.find(c => c.id === record?.contact_id), [contacts, record])
  const category = useMemo(() => categories.find(c => c.id === record?.category_id), [categories, record])

  if (!record) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 mb-2">未找到该记录</div>
          <button className="px-4 py-2 bg-orange-500 text-white rounded-lg" onClick={() => navigate(-1)}>返回</button>
        </div>
      </div>
    )
  }

  const isGiven = record.type === 'gift_given'

  const [editing, setEditing] = useState(false)
  const [eventName, setEventName] = useState(record.event_name)
  const [recordDate, setRecordDate] = useState(record.record_date)
  const [amount, setAmount] = useState(String(record.amount))
  const [paymentMethod, setPaymentMethod] = useState(record.payment_method || '现金')
  const [note, setNote] = useState(record.note || '')
  const [categoryId, setCategoryId] = useState(record.category_id || '')
  const paymentMethods = ['现金','微信','支付宝','银行卡','其他']

  const handleDelete = async () => {
    try {
      await deleteRecord(record.id)
      toast.success('已删除记录')
      navigate('/records')
    } catch (e: any) {
      toast.error(e?.message || '删除失败')
    }
  }

  const handleSave = async () => {
    try {
      const amt = parseFloat(amount)
      if (!eventName || !recordDate || isNaN(amt)) {
        toast.error('请填写有效的事件、日期和金额')
        return
      }
      await updateRecord(record.id, {
        event_name: eventName,
        record_date: recordDate,
        amount: amt,
        payment_method: paymentMethod,
        note: note || undefined,
        category_id: categoryId || undefined,
      })
      toast.success('已保存修改')
      setEditing(false)
    } catch (e: any) {
      toast.error(e?.message || '保存失败')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900">返回</button>
          <h1 className="text-lg font-semibold text-gray-900">记录详情</h1>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-500 hover:text-gray-900">
              <Pencil className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-500 hover:text-red-600" onClick={handleDelete}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isGiven ? 'bg-red-500' : 'bg-green-500'}`} />
              <div className="text-sm text-gray-600">{isGiven ? '送礼' : '收礼'}</div>
            </div>
            {category && !editing && (
              <span className="inline-flex items-center text-xs px-2 py-1 rounded-full border" style={{ borderColor: category.color, color: category.color }}>
                <Tag className="w-3 h-3 mr-1" />{category.name}
              </span>
            )}
          </div>

          {!editing ? (
            <>
              <div className="text-xl font-semibold text-gray-900 mb-1">{record.event_name}</div>
              <div className="text-gray-700 flex items-center space-x-3">
                <div className="flex items-center text-sm">
                  <User className="w-4 h-4 mr-1" />
                  {contact?.name || '未知联系人'}
                </div>
                <div className="flex items-center text-sm">
                  <Calendar className="w-4 h-4 mr-1" />
                  {record.record_date}
                </div>
                <div className={`font-semibold ${isGiven ? 'text-red-600' : 'text-green-600'} flex items-center`}>
                  <DollarSign className="w-4 h-4 mr-1" />
                  {isGiven ? '-' : '+'}¥{record.amount.toLocaleString()}
                </div>
              </div>
              {record.payment_method && (
                <div className="mt-3 text-sm text-gray-600">支付：{record.payment_method}</div>
              )}
              {record.note && (
                <div className="mt-3 text-sm text-gray-600">备注：{record.note}</div>
              )}
              <div className="mt-4">
                <button className="inline-flex items-center px-3 py-2 bg-orange-500 text-white rounded-lg" onClick={() => setEditing(true)}>
                  <Pencil className="w-4 h-4 mr-1" />
                  编辑
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <label className="block text-sm text-gray-700">事件名称</label>
              <input value={eventName} onChange={(e) => setEventName(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg" />

              <label className="block text-sm text-gray-700">日期</label>
              <input type="date" value={recordDate} onChange={(e) => setRecordDate(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg" />

              <label className="block text-sm text-gray-700">金额</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg" />

              <label className="block text-sm text-gray-700">支付方式</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg">
                {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
              </select>

              <label className="block text-sm text-gray-700">分类</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg">
                <option value="">未分类</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              <label className="block text-sm text-gray-700">备注</label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="w-full p-3 border border-gray-300 rounded-lg" />

              <div className="flex items-center space-x-2 mt-2">
                <button className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg" onClick={handleSave}>
                  <Check className="w-4 h-4 mr-1" />保存
                </button>
                <button className="inline-flex items-center px-3 py-2 bg-gray-200 text-gray-800 rounded-lg" onClick={() => setEditing(false)}>
                  <X className="w-4 h-4 mr-1" />取消
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}