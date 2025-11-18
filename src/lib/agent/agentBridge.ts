import { parseMessage } from './gift-sprite'

export type AnalyzedIntent = {
  type: 'gift_given' | 'gift_received'
  contact_name?: string
  event_name: string
  amount: number
  record_date: string
  payment_method?: string
  notes?: string
}

function formatDisplay(intent: AnalyzedIntent) {
  const title = intent.type === 'gift_received' ? '新收入记录' : '新支出记录'
  const name = intent.contact_name || '未知'
  return [
    `📌 ${title}`,
    `联系人：${name}`,
    `事由：${intent.event_name}`,
    `金额：¥${intent.amount}`,
    `日期：${intent.record_date}`,
    `支付：${intent.payment_method || '—'}`,
    `备注：${intent.notes || ''}`
  ].join('\n')
}

export async function analyze(text: string): Promise<{ ok: boolean, data?: AnalyzedIntent, display?: string, error?: string }> {
  const msg = text.trim()
  if (!msg) return { ok: false, error: '未识别到金额，请补充说明（示例：随礼 800 元或收到回礼 800 元）' }
  try {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gift-sprite`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ text: msg }),
    })
    const json = await res.json()
    if (json?.ok && json?.data) {
      return { ok: true, data: json.data as AnalyzedIntent, display: json.display }
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