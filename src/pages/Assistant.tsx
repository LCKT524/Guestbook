import { useState } from 'react'
import { SendHorizonal, Sparkles, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import { analyze } from '../lib/agent/agentBridge'

type ChatMsg = { role: 'user' | 'assistant', text: string, kind?: 'text' | 'confirm' | 'card' }

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

  const confirmPending = async () => {
    if (!pending.intent) {
      setMessages(prev => [...prev, { role: 'assistant', text: '暂无待确认记录，请先输入要记录的内容。', kind: 'text' }])
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
      setMessages(prev => [...prev, { role: 'assistant', text: '✔️ 已保存', kind: 'text' }])
      setPending({ intent: null, contactId: undefined })
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', text: e?.message || '保存失败', kind: 'text' }])
    }
  }

  const rejectPending = () => {
    setPending({ intent: null, contactId: undefined })
    setMessages(prev => [...prev, { role: 'assistant', text: '已取消该记录。您可以继续输入新的内容。', kind: 'text' }])
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text) return
    setMessages(prev => [...prev, { role: 'user', text }])
    setInput('')

    if (!user) {
      toast.error('请先登录')
      return
    }

    // 确认保存（文本命令兜底）
    if (/^确认(?:保存)?$/.test(text)) { await confirmPending(); return }
    if (/^拒绝|取消$/.test(text)) { rejectPending(); return }

    const analyzed = await analyze(text)
    if (!analyzed.ok || !analyzed.data) {
      const reply = analyzed.error || '我没理解你的意思。你可以这样描述：“给李雷随礼500元婚礼，微信”。'
      setMessages(prev => [...prev, { role: 'assistant', text: reply }])
      return
    }

    // 仅播报，不保存，等待确认
    setMessages(prev => [...prev, { role: 'assistant', text: analyzed.display!, kind: 'card' }])
    setMessages(prev => [...prev, { role: 'assistant', text: 'confirm', kind: 'confirm' }])
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
                {m.kind === 'confirm' ? (
                  <div className="max-w-[80%] px-3 py-2 rounded-lg text-sm bg-gray-100 text-gray-800">
                    <div className="flex items-center space-x-2">
                      <button onClick={confirmPending} className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white rounded">
                        <Check className="w-4 h-4 mr-1" /> 确认
                      </button>
                      <button onClick={rejectPending} className="inline-flex items-center px-3 py-1.5 bg-gray-300 text-gray-800 rounded">
                        <X className="w-4 h-4 mr-1" /> 拒绝
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">也可直接输入：确认 / 拒绝</div>
                  </div>
                ) : (
                  <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${m.role === 'user' ? 'bg-orange-100 text-gray-900' : 'bg-gray-100 text-gray-800'} ${m.kind === 'card' ? 'whitespace-pre-line border border-gray-200' : ''}`}>
                    {m.text}
                  </div>
                )}
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

