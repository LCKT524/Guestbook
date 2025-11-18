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
  '婚礼','结婚','婚宴','喜酒','办喜事','摆酒',
  '满月','满月酒','百日','百天',
  '寿宴','生日','生辰','过寿',
  '乔迁','搬家宴','入宅',
  '升学','升学宴','考上','录取通知',
  '开业','开张','开业庆典',
  '春节','清明','端午','中秋','国庆'
]

const PAYMENT_KEYWORDS = ['现金','微信','微信红包','微信转账','支付宝','支付宝转账','银行卡','银行卡转账','银行转账','红包','转账']
const RELATION_WORDS = ['同事','朋友','同学','领导','老师','师兄','师姐','亲戚','邻居','哥哥','姐姐','叔叔','阿姨','伯伯','婶婶','舅舅','舅妈','姑姑','姑父','堂哥','堂姐','堂妹','表哥','表姐','表弟','表妹','老','小','大','哥','姐','孩子','家','参加']
const BOUNDARY_WORDS = ['随礼','回礼','婚礼','满月','酒','宴','红包','微信','支付宝','银行卡','元','￥','礼金','份子','份子钱','随份子','开业','乔迁','升学']

export function parseMessage(msg: string): ParsedIntent | null {
  const text = msg.trim()
  if (!text) return null

  const isReceived = /回礼|收礼/.test(text)
  const type: ParsedIntent['type'] = isReceived ? 'gift_received' : 'gift_given'

  const amount = extractAmount(text)
  if (!amount || isNaN(amount)) return null

  let record_date = extractDate(text)

  let event_name = extractEvent(text)

  const payment_method = extractPayment(text)

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
    cleaned = cleaned.replace(/国庆|中秋|春节|端午|清明/g, '')
    const nameMatch = cleaned.match(/[\u4e00-\u9fa5]{1,4}/)
    return nameMatch ? nameMatch[0] : undefined
  }
  const giveName = extractAfter(/给/)
  const recvName = extractAfter(/收到/)
  const inlineMatch = text.match(/([\u4e00-\u9fa5]{1,4})的?(?=婚礼|结婚|满月|满月酒|寿宴|生日|乔迁|升学|开业)/)
  const inlineName = inlineMatch && !/国庆|中秋|春节|端午|清明/.test(inlineMatch[1]) ? inlineMatch[1] : undefined
  if (isReceived) {
    contact_name = recvName || giveName || inlineName
  } else {
    contact_name = giveName || recvName || inlineName
  }

  const notes = extractNotes(text, { amount, record_date, event_name, payment_method, contact_name })

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
  const t = s.replace(/\//g,'-').replace(/年/g,'-').replace(/月/g,'-').replace(/日/g,'')
  const parts = t.split('-').filter(Boolean)
  let y: number, m: number, d: number
  if (parts.length === 3) {
    y = parseInt(parts[0])
    m = parseInt(parts[1])
    d = parseInt(parts[2])
  } else if (parts.length === 2) {
    y = new Date().getFullYear()
    m = parseInt(parts[0])
    d = parseInt(parts[1])
  } else {
    y = new Date().getFullYear()
    m = new Date().getMonth() + 1
    d = new Date().getDate()
  }
  const mm = String(m).padStart(2,'0')
  const dd = String(d).padStart(2,'0')
  return `${y}-${mm}-${dd}`
}

function toHalfWidthDigits(s: string): string {
  return s.replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFF10 + 0x30))
}

function chineseToNumber(s: string): number {
  const map: Record<string, number> = { '零':0,'一':1,'二':2,'两':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':10,'百':100,'千':1000,'万':10000,'亿':100000000 }
  let total = 0
  let section = 0
  let number = 0
  for (const ch of s) {
    const v = map[ch]
    if (v === undefined) continue
    if (v >= 10) {
      if (number === 0) number = 1
      section += number * v
      number = 0
    } else {
      number = v
    }
  }
  const base = section
  if (/千[一二两三四五六七八九]$/.test(s)) {
    const d = map[s.slice(-1)]
    total = base + d * 100
  } else if (/万[一二两三四五六七八九]$/.test(s)) {
    const d = map[s.slice(-1)]
    total = base + d * 1000
  } else if (/百[一二两三四五六七八九]$/.test(s)) {
    const d = map[s.slice(-1)]
    total = base + d * 10
  } else {
    total = base + number
  }
  return total
}

function extractAmount(text: string): number {
  const t = toHalfWidthDigits(text)
  const triggers = ['随礼','回礼','礼金','红包','份子','随份子']
  let idx = -1
  for (const w of triggers) { const i = t.lastIndexOf(w); if (i !== -1) { idx = i; break } }
  let scope = t
  if (idx !== -1) {
    const start = Math.max(0, idx - 20)
    const end = Math.min(t.length, idx + 30)
    scope = t.slice(start, end)
  }
  const numMatch = scope.match(/([￥¥]?)(\d+(?:\.\d{1,2})?)\s*(?:元|块)?\s*(k|K|w|W|千|万|百)?/)
  if (numMatch) {
    let n = parseFloat(numMatch[2])
    const unit = numMatch[3]
    if (unit) {
      if (/[kK]/.test(unit)) n *= 1000
      else if (/[wW]|万/.test(unit)) n *= 10000
      else if (/千/.test(unit)) n *= 1000
      else if (/百/.test(unit)) n *= 100
    }
    return Math.round(n)
  }
  const cnAll = [...scope.matchAll(/([一二两三四五六七八九十百千万亿]+)/g)]
  if (cnAll.length) {
    let pick: string | null = null
    for (const m of cnAll) {
      const s = m[1]
      if (/[百千万亿]/.test(s) || s.length > 1) { pick = s; break }
    }
    if (!pick) pick = cnAll[0][1]
    return chineseToNumber(pick)
  }
  const fallbackNum = t.match(/([￥¥]?)(\d+(?:\.\d{1,2})?)/)
  if (fallbackNum) return parseFloat(fallbackNum[2])
  const fallbackCn = t.match(/([一二两三四五六七八九十百千万亿]+)/)
  if (fallbackCn) return chineseToNumber(fallbackCn[1])
  return NaN
}

function extractDate(text: string): string {
  const abs1 = text.match(/(\d{4}[\/-]\d{1,2}[\/-]\d{1,2})/)
  const abs2 = text.match(/(\d{4}年\d{1,2}月\d{1,2}日)/)
  const md = text.match(/(\d{1,2}[\/-]\d{1,2})/)
  if (abs1) return normalizeDate(abs1[1])
  if (abs2) return normalizeDate(abs2[1])
  if (md) return normalizeDate(md[1])
  const now = new Date()
  const y = now.getFullYear()
  if (/今天/.test(text)) return normalizeDate(`${y}-${now.getMonth()+1}-${now.getDate()}`)
  if (/昨天|昨日/.test(text)) {
    const d = new Date(now)
    d.setDate(d.getDate()-1)
    return normalizeDate(`${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`)
  }
  if (/前天/.test(text)) {
    const d = new Date(now)
    d.setDate(d.getDate()-2)
    return normalizeDate(`${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`)
  }
  const wkMap: Record<string, number> = { '一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'日':7,'天':7 }
  const lastWeek = text.match(/上周([一二三四五六日天])/)
  const thisWeek = text.match(/本周([一二三四五六日天])/)
  const weekend = /周末/.test(text)
  if (lastWeek) {
    const target = wkMap[lastWeek[1]]
    const d = new Date(now)
    const cur = d.getDay() === 0 ? 7 : d.getDay()
    const diff = cur + (7 - target)
    d.setDate(d.getDate() - diff)
    return normalizeDate(`${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`)
  }
  if (thisWeek) {
    const target = wkMap[thisWeek[1]]
    const d = new Date(now)
    const cur = d.getDay() === 0 ? 7 : d.getDay()
    const diff = target - cur
    d.setDate(d.getDate() + diff)
    return normalizeDate(`${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`)
  }
  if (weekend) {
    const d = new Date(now)
    const cur = d.getDay() === 0 ? 7 : d.getDay()
    const diff = 6 - cur
    d.setDate(d.getDate() + diff)
    return normalizeDate(`${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`)
  }
  if (/今年国庆|国庆/.test(text)) return `${y}-10-01`
  return now.toISOString().slice(0,10)
}

function extractEvent(text: string): string {
  if (/婚礼|结婚|婚宴|喜酒|办喜事|摆酒/.test(text)) return '婚礼'
  if (/满月|满月酒|百日|百天/.test(text)) return '满月宴'
  if (/寿宴|生日|生辰|过寿/.test(text)) return '寿宴'
  if (/乔迁|搬家宴|入宅/.test(text)) return '乔迁宴'
  if (/升学|升学宴|考上|录取通知/.test(text)) return '升学宴'
  if (/开业|开张|开业庆典/.test(text)) return '开业庆典'
  if (/春节|清明|端午|中秋|国庆/.test(text)) return '节日红包'
  for (const k of EVENT_KEYWORDS) { if (text.includes(k)) return k }
  return '人情往来'
}

function extractPayment(text: string): string {
  if (/微信红包/.test(text)) return '微信红包'
  if (/微信转账/.test(text)) return '微信转账'
  if (/支付宝转账/.test(text)) return '支付宝转账'
  if (/银行卡转账|银行转账/.test(text)) return '银行卡'
  if (/现金/.test(text)) return '现金'
  if (/红包/.test(text)) return '红包'
  if (/支付宝/.test(text)) return '支付宝'
  if (/微信/.test(text)) return '微信'
  return '微信'
}

function extractNotes(text: string, picked: { amount: number, record_date: string, event_name: string, payment_method?: string, contact_name?: string }): string {
  let s = text
  s = s.replace(/([￥¥]?)(\d+(?:\.\d{1,2})?)\s*(?:元|块)?\s*(k|K|w|W|千|万|百)?/, '')
  s = s.replace(/([一二两三四五六七八九十百千万亿]+)(?:\s*元|块)?/, '')
  s = s.replace(/(\d{4}[\/-]\d{1,2}[\/-]\d{1,2})/, '')
  s = s.replace(/(\d{4}年\d{1,2}月\d{1,2}日)/, '')
  s = s.replace(/(\d{1,2}[\/-]\d{1,2})/, '')
  if (picked.event_name) s = s.replace(new RegExp(picked.event_name,'g'),'')
  if (picked.payment_method) s = s.replace(new RegExp(picked.payment_method,'g'),'')
  if (picked.contact_name) s = s.replace(new RegExp(picked.contact_name,'g'),'')
  s = s.replace(/\s+/g,' ').trim()
  return s
}

