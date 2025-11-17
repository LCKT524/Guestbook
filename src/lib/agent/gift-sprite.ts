export type ParsedIntent = {
  type: 'gift_given' | 'gift_received'
  contact_name?: string
  event_name: string
  amount: number
  record_date: string
  payment_method?: string
  notes?: string
}

const EVENT_KEYWORDS = [
  '婚礼','结婚','满月','满月酒','寿宴','乔迁','升学','升学宴','开业','开业庆典'
]

const PAYMENT_KEYWORDS = ['现金','微信','支付宝','银行卡']

export function parseMessage(msg: string): ParsedIntent | null {
  const text = msg.trim()
  if (!text) return null

  const isReceived = /回礼|收礼/.test(text)
  const type: ParsedIntent['type'] = isReceived ? 'gift_received' : 'gift_given'

  const amountMatch = text.match(/([￥¥]?)(\d+(?:\.\d{1,2})?)(?:\s*元)?/)
  const amount = amountMatch ? parseFloat(amountMatch[2]) : NaN
  if (!amount || isNaN(amount)) return null

  const dateMatch = text.match(/(\d{4}[\/-]\d{1,2}[\/-]\d{1,2})/)
  const record_date = dateMatch ? normalizeDate(dateMatch[1]) : new Date().toISOString().slice(0, 10)

  let event_name = '人情往来'
  for (const k of EVENT_KEYWORDS) {
    if (text.includes(k)) { event_name = k; break }
  }

  const payment_method = PAYMENT_KEYWORDS.find(k => text.includes(k))

  // 简易联系人抽取：给/收到 + 可选角色词 + 中文姓名
  let contact_name: string | undefined
  const giveMatch = text.match(/给(?:[\u4e00-\u9fa5]{1,6})?([\u4e00-\u9fa5]{2,3})(?=随礼|回礼|婚礼|满月|酒|宴|红包|微信|支付宝|银行卡|\d|元|￥|\s|$)/)
  const recvMatch = text.match(/收到([\u4e00-\u9fa5]{2,3})(?=随礼|回礼|婚礼|满月|酒|宴|红包|微信|支付宝|银行卡|\d|元|￥|\s|$)/)
  if (isReceived) {
    contact_name = recvMatch?.[1] || giveMatch?.[1]
  } else {
    contact_name = giveMatch?.[1] || recvMatch?.[1]
  }

  const notes = text

  return {
    type,
    contact_name,
    event_name,
    amount,
    record_date,
    payment_method,
    notes,
  }
}

function normalizeDate(s: string): string {
  const t = s.replace(/\//g,'-')
  const [y,m,d] = t.split('-').map(x => parseInt(x))
  const mm = String(m).padStart(2,'0')
  const dd = String(d).padStart(2,'0')
  return `${y}-${mm}-${dd}`
}

