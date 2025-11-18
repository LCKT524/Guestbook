import { useState } from 'react'
import { SendHorizonal, Sparkles, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import { analyze } from '../lib/agent/agentBridge'
import type { AnalyzedIntent } from '../lib/agent/agentBridge'

type ChatMsg = { role: 'user' | 'assistant', text: string, kind?: 'text' | 'confirm' | 'card' }

export default function Assistant() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: 'assistant', text: '你好，我是人情小精灵。试试说：“刚给同事张伟随礼800元结婚红包”。' }
  ])
  const { user } = useAuth()
  const { contacts, records, categories, addContact, addRecord, updateRecord, deleteRecord } = useApp()
  const [pending, setPending] = useState<{
    intent: AnalyzedIntent | null,
    contactId?: string,
    targetRecordId?: string
  }>({ intent: null })
  const [confirmDisabled, setConfirmDisabled] = useState(false)

  const confirmPending = async () => {
    setConfirmDisabled(true)
    if (!pending.intent) {
      setMessages(prev => [...prev, { role: 'assistant', text: '暂无待确认记录，请先输入要记录的内容。', kind: 'text' }])
      return
    }
    try {
      if (pending.intent.op === 'create') {
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
          type: pending.intent!.type as any,
          event_name: String(pending.intent!.event_name || ''),
          record_date: String(pending.intent!.record_date || ''),
          amount: Number(pending.intent!.amount || 0),
          payment_method: pending.intent!.payment_method,
        })
        setMessages(prev => [...prev, { role: 'assistant', text: '✔️ 已保存', kind: 'text' }])
        setPending({ intent: null, contactId: undefined, targetRecordId: undefined })
        return
      }
      if (pending.intent.op === 'update') {
        let targetId = pending.targetRecordId || pending.intent.record_id
        if (!targetId) {
          const cand = records
            .filter(r => (!pending.intent.contact_name || contacts.find(c => c.id === r.contact_id)?.name === pending.intent.contact_name))
            .filter(r => (!pending.intent.event_name || r.event_name === pending.intent.event_name))
            .sort((a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime())[0]
          targetId = cand?.id
        }
        if (!targetId) {
          setMessages(prev => [...prev, { role: 'assistant', text: '未找到需要更新的记录，请提供更明确的线索。', kind: 'text' }])
          return
        }
        const patch: any = {}
        if (pending.intent.event_name) patch.event_name = pending.intent.event_name
        if (pending.intent.record_date) patch.record_date = pending.intent.record_date
        if (typeof pending.intent.amount === 'number') patch.amount = pending.intent.amount
        if (pending.intent.payment_method) patch.payment_method = pending.intent.payment_method
        
        if (pending.intent.category_name) {
          const cat = categories.find(c => c.name === pending.intent.category_name)
          if (cat) patch.category_id = cat.id
        }
        await updateRecord(targetId, patch)
        setMessages(prev => [...prev, { role: 'assistant', text: '✔️ 已更新', kind: 'text' }])
        setPending({ intent: null, contactId: undefined, targetRecordId: undefined })
        return
      }
      if (pending.intent.op === 'delete') {
        let targetId = pending.targetRecordId || pending.intent.record_id
        if (!targetId) {
          const cand = records
            .filter(r => (!pending.intent.contact_name || contacts.find(c => c.id === r.contact_id)?.name === pending.intent.contact_name))
            .filter(r => (!pending.intent.event_name || r.event_name === pending.intent.event_name))
            .sort((a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime())[0]
          targetId = cand?.id
        }
        if (!targetId) {
          setMessages(prev => [...prev, { role: 'assistant', text: '未找到需要删除的记录，请提供更明确的线索。', kind: 'text' }])
          return
        }
        await deleteRecord(targetId)
        setMessages(prev => [...prev, { role: 'assistant', text: '✔️ 已删除', kind: 'text' }])
        setPending({ intent: null, contactId: undefined, targetRecordId: undefined })
        return
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', text: e?.message || '保存失败', kind: 'text' }])
    }
  }

  const rejectPending = () => {
    setConfirmDisabled(true)
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

    const analyzed = await analyze(text, { contacts: contacts.map(c => c.name), categories: categories.map(c => c.name) })
    if (!analyzed.ok || !analyzed.data) {
      const reply = analyzed.error || '我没理解你的意思。你可以这样描述：“给李雷随礼500元婚礼，微信”。'
      setMessages(prev => [...prev, { role: 'assistant', text: reply }])
      return
    }
    if (analyzed.data.op === 'list') {
      const f = analyzed.data
      const list = records
        .filter(r => (!f.type || r.type === f.type))
        .filter(r => (!f.startDate || new Date(r.record_date).getTime() >= new Date(f.startDate).getTime()))
        .filter(r => (!f.endDate || new Date(r.record_date).getTime() <= new Date(f.endDate).getTime()))
        .filter(r => (!f.contact_name || contacts.find(c => c.id === r.contact_id)?.name === f.contact_name))
        .filter(r => (!f.category_name || categories.find(c => c.id === r.category_id)?.name === f.category_name))
      const lines = list.slice(0, 5).map(r => {
        const name = contacts.find(c => c.id === r.contact_id)?.name || '—'
        return `${r.record_date} ${name} ¥${r.amount} ${r.event_name}`
      })
      const summary = `共${list.length}条\n` + lines.join('\n')
      setMessages(prev => [...prev, { role: 'assistant', text: summary, kind: 'card' }])
      return
    }
    setConfirmDisabled(false)
    setMessages(prev => [...prev, { role: 'assistant', text: analyzed.display || '请确认操作', kind: 'card' }])
    setMessages(prev => [...prev, { role: 'assistant', text: 'confirm', kind: 'confirm' }])
    const found = analyzed.data.contact_name ? contacts.find(c => c.name === analyzed.data.contact_name) : undefined
    setPending({ intent: analyzed.data, contactId: found?.id, targetRecordId: analyzed.data.record_id })
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
                      <button onClick={confirmPending} disabled={confirmDisabled} className={`inline-flex items-center px-3 py-1.5 rounded ${confirmDisabled ? 'bg-green-600/60 cursor-not-allowed' : 'bg-green-600 text-white'}`}>
                        <Check className="w-4 h-4 mr-1" /> 确认
                      </button>
                      <button onClick={rejectPending} disabled={confirmDisabled} className={`inline-flex items-center px-3 py-1.5 rounded ${confirmDisabled ? 'bg-gray-300/60 text-gray-800 cursor-not-allowed' : 'bg-gray-300 text-gray-800'}`}>
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

