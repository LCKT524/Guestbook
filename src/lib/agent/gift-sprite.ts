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
const RELATION_WORDS = ['同事','朋友','同学','领导','老师','师兄','师姐','亲戚','邻居','哥哥','姐姐','叔叔','阿姨','伯伯','婶婶','舅舅','舅妈','姑姑','姑父','堂哥','堂姐','堂妹','表哥','表姐']
const BOUNDARY_WORDS = ['随礼','回礼','婚礼','满月','酒','宴','红包','微信','支付宝','银行卡','元','￥']

export function parseMessage(msg: string): ParsedIntent | null {
  const text = msg.trim()
  if (!text) return null

  const isReceived = /回礼|收礼/.test(text)
  const type: ParsedIntent['type'] = isReceived ? 'gift_received' : 'gift_given'

  const amountMatch = text.match(/([￥¥]?)(\d+(?:\.\d{1,2})?)(?:\s*元|块)?/)
  const amount = amountMatch ? parseFloat(amountMatch[2]) : NaN
  if (!amount || isNaN(amount)) return null

  const dateMatch = text.match(/(\d{4}[\/-]\d{1,2}[\/-]\d{1,2})/)
  const record_date = dateMatch ? normalizeDate(dateMatch[1]) : new Date().toISOString().slice(0, 10)

  let event_name = '人情往来'
  for (const k of EVENT_KEYWORDS) {
    if (text.includes(k)) { event_name = k; break }
  }
  if (/婚礼|结婚|婚宴|喜酒|办喜事/.test(text)) event_name = '婚礼'
  else if (/满月|满月酒/.test(text)) event_name = '满月宴'
  else if (/寿宴|生日|生辰/.test(text)) event_name = '寿宴'
  else if (/乔迁/.test(text)) event_name = '乔迁宴'
  else if (/升学/.test(text)) event_name = '升学宴'
  else if (/开业/.test(text)) event_name = '开业庆典'

  const payment_method = PAYMENT_KEYWORDS.find(k => text.includes(k))

  // 简易联系人抽取：给/收到 + 可选角色词 + 中文姓名
  let contact_name: string | undefined
  function extractAfter(prefix: RegExp): string | undefined {
    const m = text.match(prefix)
    if (!m) return undefined
    const start = m.index! + m[0].length
    let end = text.length
    for (const w of BOUNDARY_WORDS) {
      const idx = text.indexOf(w, start)
      if (idx !== -1) end = Math.min(end, idx)
    }
    const numIdx = text.slice(start).search(/[0-9￥¥]/)
    if (numIdx !== -1) end = Math.min(end, start + numIdx)
    const seg = text.slice(start, end)
    let cleaned = seg
    for (const r of RELATION_WORDS) cleaned = cleaned.replace(new RegExp(r, 'g'), '')
    const nameMatch = cleaned.match(/[\u4e00-\u9fa5]{2,3}/)
    return nameMatch ? nameMatch[0] : undefined
  }
  const giveName = extractAfter(/给/)
  const recvName = extractAfter(/收到/)
  if (isReceived) {
    contact_name = recvName || giveName
  } else {
    contact_name = giveName || recvName
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

