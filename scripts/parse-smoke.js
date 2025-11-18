function normalizeDate(s){
  const t=s.replace(/\//g,'-').replace(/年/g,'-').replace(/月/g,'-').replace(/日/g,'')
  const parts=t.split('-').filter(Boolean)
  let y,m,d
  if(parts.length===3){y=parseInt(parts[0]);m=parseInt(parts[1]);d=parseInt(parts[2]);}
  else if(parts.length===2){y=new Date().getFullYear();m=parseInt(parts[0]);d=parseInt(parts[1]);}
  else{y=new Date().getFullYear();m=new Date().getMonth()+1;d=new Date().getDate();}
  const mm=String(m).padStart(2,'0')
  const dd=String(d).padStart(2,'0')
  return `${y}-${mm}-${dd}`
}
function toHalfWidthDigits(s){
  return s.replace(/[０-９]/g,c=>String.fromCharCode(c.charCodeAt(0)-0xFF10+0x30))
}
function chineseToNumber(s){
  const map={ '零':0,'一':1,'二':2,'两':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':10,'百':100,'千':1000,'万':10000,'亿':100000000 }
  let total=0,section=0,number=0
  for(const ch of s){
    const v=map[ch]
    if(v===undefined) continue
    if(v>=10){ if(number===0) number=1; section+=number*v; number=0 }
    else { number=v }
  }
  const base=section
  if(/千[一二两三四五六七八九]$/.test(s)){ const d=map[s.slice(-1)]; return base+d*100 }
  else if(/万[一二两三四五六七八九]$/.test(s)){ const d=map[s.slice(-1)]; return base+d*1000 }
  else if(/百[一二两三四五六七八九]$/.test(s)){ const d=map[s.slice(-1)]; return base+d*10 }
  return base+number
}
function extractAmount(text){
  const t=toHalfWidthDigits(text)
  const triggers=['随礼','回礼','礼金','红包','份子','随份子']
  let idx=-1
  for(const w of triggers){ const i=t.lastIndexOf(w); if(i!==-1){ idx=i; break } }
  let scope=t
  if(idx!==-1){ const start=Math.max(0,idx-20); const end=Math.min(t.length,idx+30); scope=t.slice(start,end) }
  const numMatch=scope.match(/([￥¥]?)(\d+(?:\.\d{1,2})?)\s*(?:元|块)?\s*(k|K|w|W|千|万|百)?/)
  if(numMatch){ let n=parseFloat(numMatch[2]); const unit=numMatch[3]; if(unit){ if(/[kK]/.test(unit)) n*=1000; else if(/[wW]|万/.test(unit)) n*=10000; else if(/千/.test(unit)) n*=1000; else if(/百/.test(unit)) n*=100 } return Math.round(n) }
  const cnAll=[...scope.matchAll(/([一二两三四五六七八九十百千万亿]+)/g)]
  if(cnAll.length){ let pick=null; for(const m of cnAll){ const s=m[1]; if(/[百千万亿]/.test(s)||s.length>1){ pick=s; break } } if(!pick) pick=cnAll[0][1]; return chineseToNumber(pick) }
  const fbNum=t.match(/([￥¥]?)(\d+(?:\.\d{1,2})?)/)
  if(fbNum) return parseFloat(fbNum[2])
  const fbCn=t.match(/([一二两三四五六七八九十百千万亿]+)/)
  if(fbCn) return chineseToNumber(fbCn[1])
  return NaN
}
function extractDate(text){
  const abs1=text.match(/(\d{4}[\/-]\d{1,2}[\/-]\d{1,2})/)
  const abs2=text.match(/(\d{4}年\d{1,2}月\d{1,2}日)/)
  const md=text.match(/(\d{1,2}[\/-]\d{1,2})/)
  if(abs1) return normalizeDate(abs1[1])
  if(abs2) return normalizeDate(abs2[1])
  if(md) return normalizeDate(md[1])
  const now=new Date()
  const y=now.getFullYear()
  if(/今天/.test(text)) return normalizeDate(`${y}-${now.getMonth()+1}-${now.getDate()}`)
  if(/昨天|昨日/.test(text)) { const d=new Date(now); d.setDate(d.getDate()-1); return normalizeDate(`${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`) }
  if(/前天/.test(text)) { const d=new Date(now); d.setDate(d.getDate()-2); return normalizeDate(`${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`) }
  const wkMap={ '一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'日':7,'天':7 }
  const lastWeek=text.match(/上周([一二三四五六日天])/)
  const thisWeek=text.match(/本周([一二三四五六日天])/)
  const weekend=/周末/.test(text)
  if(lastWeek){
    const target=wkMap[lastWeek[1]]
    const d=new Date(now)
    const cur=d.getDay()===0?7:d.getDay()
    const diff=cur+(7-target)
    d.setDate(d.getDate()-diff)
    return normalizeDate(`${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`)
  }
  if(thisWeek){
    const target=wkMap[thisWeek[1]]
    const d=new Date(now)
    const cur=d.getDay()===0?7:d.getDay()
    const diff=target-cur
    d.setDate(d.getDate()+diff)
    return normalizeDate(`${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`)
  }
  if(weekend){
    const d=new Date(now)
    const cur=d.getDay()===0?7:d.getDay()
    const diff=6-cur
    d.setDate(d.getDate()+diff)
    return normalizeDate(`${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`)
  }
  if(/今年国庆|国庆/.test(text)) return `${y}-10-01`
  return now.toISOString().slice(0,10)
}
function extractEvent(text){
  if(/婚礼|结婚|婚宴|喜酒|办喜事|摆酒/.test(text)) return '婚礼'
  if(/满月|满月酒|百日|百天/.test(text)) return '满月宴'
  if(/寿宴|生日|生辰|过寿/.test(text)) return '寿宴'
  if(/乔迁|搬家宴|入宅/.test(text)) return '乔迁宴'
  if(/升学|升学宴|考上|录取通知/.test(text)) return '升学宴'
  if(/开业|开张|开业庆典/.test(text)) return '开业庆典'
  if(/春节|清明|端午|中秋|国庆/.test(text)) return '节日红包'
  return '人情往来'
}
function extractPayment(text){
  if(/微信红包/.test(text)) return '微信红包'
  if(/微信转账/.test(text)) return '微信转账'
  if(/支付宝转账/.test(text)) return '支付宝转账'
  if(/银行卡转账|银行转账/.test(text)) return '银行卡'
  if(/现金/.test(text)) return '现金'
  if(/红包/.test(text)) return '红包'
  if(/支付宝/.test(text)) return '支付宝'
  if(/微信/.test(text)) return '微信'
  return '微信'
}
function parseMessage(msg){
  const text=msg.trim()
  if(!text) return null
  const isReceived=/回礼|收礼/.test(text)
  const type=isReceived?'gift_received':'gift_given'
  const amount=extractAmount(text)
  if(!amount||isNaN(amount)) return null
  const record_date=extractDate(text)
  const event_name=extractEvent(text)
  const payment_method=extractPayment(text)
  const RELATION_WORDS=['同事','朋友','同学','领导','老师','师兄','师姐','亲戚','邻居','哥哥','姐姐','叔叔','阿姨','伯伯','婶婶','舅舅','舅妈','姑姑','姑父','堂哥','堂姐','堂妹','表哥','表姐','表弟','表妹','老','小','大','哥','姐']
  const BOUNDARY_WORDS=['随礼','回礼','婚礼','满月','酒','宴','红包','微信','支付宝','银行卡','元','￥','礼金','份子','份子钱','随份子','开业','乔迁','升学']
  function extractAfter(prefix){
    const m=text.match(prefix)
    if(!m) return undefined
    const start=m.index+m[0].length
    let end=text.length
    for(const w of BOUNDARY_WORDS){
      const idx=text.indexOf(w,start)
      if(idx!==-1) end=Math.min(end,idx)
    }
    const numIdx=text.slice(start).search(/[0-9￥¥]/)
    if(numIdx!==-1) end=Math.min(end,start+numIdx)
    const seg=text.slice(start,end)
    let cleaned=seg
    for(const r of RELATION_WORDS) cleaned=cleaned.replace(new RegExp(r,'g'),'')
    cleaned=cleaned.replace(/国庆|中秋|春节|端午|清明/g,'')
    const nameMatch=cleaned.match(/[\u4e00-\u9fa5]{1,4}/)
    return nameMatch?nameMatch[0]:undefined
  }
  const giveName=extractAfter(/给/)
  const recvName=extractAfter(/收到/)
  const inlineMatch=text.match(/([\u4e00-\u9fa5]{1,4})的?(?=婚礼|结婚|满月|满月酒|寿宴|生日|乔迁|升学|开业)/)
  const inlineName=inlineMatch&&!/国庆|中秋|春节|端午|清明/.test(inlineMatch[1])?inlineMatch[1]:undefined
  const contact_name=isReceived?(recvName||giveName||inlineName):(giveName||recvName||inlineName)
  return {type,contact_name,event_name,amount,record_date,payment_method,notes:''}
}
const samples=[
  '刚给同事张伟随礼800结婚红包',
  '收到李娜回礼1200',
  '上周六给王哥孩子满月随份子两千五',
  '国庆给表弟礼金3k 微信转账',
  '昨天参加老李乔迁，随礼一千二',
  '中秋收阿姨回礼500红包'
]
console.log(JSON.stringify(samples.map(s=>parseMessage(s)),null,2))