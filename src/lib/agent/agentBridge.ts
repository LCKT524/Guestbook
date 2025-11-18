import { parseMessage } from './gift-sprite'

export type AnalyzedIntent = {
  op: 'create' | 'update' | 'delete' | 'list'
  type?: 'gift_given' | 'gift_received' | 'expense' | 'income'
  contact_name?: string
  event_name?: string
  amount?: number
  record_date?: string
  payment_method?: string
  notes?: string
  note?: string
  category_name?: string
  record_id?: string
  startDate?: string
  endDate?: string
}

function formatDisplay(intent: AnalyzedIntent) {
  const t = intent.type === 'gift_received' ? '新收入记录' : '新支出记录'
  const name = intent.contact_name || '未知'
  return [
    `📌 ${t}`,
    `联系人：${name}`,
    `事由：${String(intent.event_name || '')}`,
    `金额：¥${intent.amount ?? ''}`,
    `日期：${String(intent.record_date || '')}`,
    `支付：${intent.payment_method || '—'}`
  ].join('\n')
}

export async function analyze(text: string, hints?: { contacts?: string[], categories?: string[] }): Promise<{ ok: boolean, data?: AnalyzedIntent, display?: string, error?: string }> {
  const msg = text.trim()
  if (!msg) return { ok: false, error: '未识别到金额，请补充说明（示例：随礼 800 元或收到回礼 800 元）' }
  try {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deepseek-agent`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ text: msg, hints: { contacts: hints?.contacts || [], categories: hints?.categories || [] } }),
    })
    const json = await res.json()
    if (json?.ok && json?.data) {
      const data = json.data as AnalyzedIntent
      const display = json.display || (data.op === 'create' && data.type ? formatDisplay(data) : undefined)
      return { ok: true, data, display }
    }
    if (json?.error) {
      return { ok: false, error: json.error }
    }
  } catch {}
  const intent = parseMessage(msg)
  if (!intent || !intent.amount || isNaN(intent.amount)) {
    return { ok: false, error: '未识别到金额，请补充说明（示例：随礼 800 元或收到回礼 800 元）' }
  }
  const data: AnalyzedIntent = {
    op: 'create',
    type: intent.type,
    contact_name: intent.contact_name,
    event_name: intent.event_name,
    amount: intent.amount,
    record_date: intent.record_date,
    payment_method: intent.payment_method,
    notes: intent.notes,
  }
  const display = formatDisplay(data)
  return { ok: true, data, display }
}