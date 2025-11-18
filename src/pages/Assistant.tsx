import { useState } from 'react'
import { SendHorizonal, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import { analyze } from '../lib/agent/agentBridge'

type ChatMsg = { role: 'user' | 'assistant', text: string }

export default function Assistant() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: 'assistant', text: '你好，我是人情小精灵。试试说：“刚给同事张伟随礼800元结婚红包”。' }
  ])
  const { user } = useAuth()
  const { contacts, addContact, addRecord } = useApp()
  const [pending, setPending] = useState<{
    intent: {
      type: 'gift_given' | 'gift_received'
      contact_name?: string
      event_name: string
      amount: number
      record_date: string
      payment_method?: string
      notes?: string
    } | null,
    contactId?: string
  }>({ intent: null })

  const handleSend = async () => {
    const text = input.trim()
    if (!text) return
    setMessages(prev => [...prev, { role: 'user', text }])
    setInput('')

    if (!user) {
      toast.error('请先登录')
      return
    }

    // 确认保存
    if (/^确认(?:保存)?$/.test(text)) {
      if (!pending.intent) {
        setMessages(prev => [...prev, { role: 'assistant', text: '暂无待确认记录，请先输入要记录的内容。' }])
        return
      }
      try {
        let contactId = pending.contactId
        if (!contactId && pending.intent?.contact_name) {
          const found = contacts.find(c => c.name === pending.intent?.contact_name)
          if (found) {
            contactId = found.id
          } else if (user) {
            const created = await addContact({ user_id: user.id, name: pending.intent?.contact_name })
            contactId = created.id
          }
        }
        await addRecord({
          user_id: user!.id,
          contact_id: contactId,
          type: pending.intent!.type,
          event_name: pending.intent!.event_name,
          record_date: pending.intent!.record_date,
          amount: pending.intent!.amount,
          payment_method: pending.intent!.payment_method,
          note: pending.intent!.notes,
        })
        setMessages(prev => [...prev, { role: 'assistant', text: '✔️ 已保存' }])
        setPending({ intent: null, contactId: undefined })
        return
      } catch (e: any) {
        toast.error(e?.message || '保存失败')
        return
      }
    }

    const analyzed = await analyze(text)
    if (!analyzed.ok || !analyzed.data) {
      const reply = analyzed.error || '我没理解你的意思。你可以这样描述：“给李雷随礼500元婚礼，微信”。'
      setMessages(prev => [...prev, { role: 'assistant', text: reply }])
      return
    }

    // 仅播报，不保存，等待确认
    setMessages(prev => [...prev, { role: 'assistant', text: analyzed.display! }])
    setMessages(prev => [...prev, { role: 'assistant', text: '请回复【确认】保存｜或继续补充：联系人/事由/日期/金额/备注' }])
    const found = analyzed.data.contact_name ? contacts.find(c => c.name === analyzed.data.contact_name) : undefined
    setPending({ intent: analyzed.data, contactId: found?.id })
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="px-4 py-4">
        <div className="flex items-center space-x-2 mb-4">
          <Sparkles className="w-5 h-5 text-orange-500" />
          <h1 className="text-lg font-semibold text-gray-900">人情小精灵</h1>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="space-y-3">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${m.role === 'user' ? 'bg-orange-100 text-gray-900' : 'bg-gray-100 text-gray-800'}`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-20 left-0 right-0 px-4">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-2 flex items-center space-x-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="例如：给李雷随礼500元婚礼，微信"
            className="flex-1 px-3 py-2 rounded-lg border border-transparent focus:outline-none"
          />
          <button onClick={handleSend} className="inline-flex items-center px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
            <SendHorizonal className="w-4 h-4 mr-1" />
            发送
          </button>
        </div>
      </div>
    </div>
  )
}

