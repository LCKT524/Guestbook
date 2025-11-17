import { useState } from 'react'
import { Gift, TrendingUp, TrendingDown } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'

export default function Home() {
  const { records, contacts, loading } = useApp()
  const { user } = useAuth()

  // 计算统计数据
  const currentMonth = new Date().toISOString().slice(0, 7)
  const monthlyRecords = records.filter(record => 
    record.record_date.startsWith(currentMonth)
  )

  const monthlyGiven = monthlyRecords
    .filter(record => record.type === 'gift_given')
    .reduce((sum, record) => sum + record.amount, 0)

  const monthlyReceived = monthlyRecords
    .filter(record => record.type === 'gift_received')
    .reduce((sum, record) => sum + record.amount, 0)

  const recentRecords = records.slice(0, 5)
  const netMonthly = monthlyReceived - monthlyGiven

  const months: string[] = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const monthlySeries = months.map(m => {
    const rs = records.filter(r => r.record_date.startsWith(m))
    const given = rs.filter(r => r.type === 'gift_given').reduce((s, r) => s + r.amount, 0)
    const recv = rs.filter(r => r.type === 'gift_received').reduce((s, r) => s + r.amount, 0)
    return recv - given
  })
  const maxAbs = Math.max(1, ...monthlySeries.map(v => Math.abs(v)))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 欢迎区域 */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">你好，{user?.nickname || '用户'}！</h1>
        <p className="text-orange-100">管理你的人情往来，让记账更简单</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-red-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-red-500" />
            </div>
            <span className="text-xs text-gray-500">本月</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">¥{monthlyGiven.toLocaleString()}</div>
          <div className="text-sm text-gray-600">送礼支出</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <TrendingDown className="w-5 h-5 text-green-500" />
            </div>
            <span className="text-xs text-gray-500">本月</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">¥{monthlyReceived.toLocaleString()}</div>
          <div className="text-sm text-gray-600">收礼收入</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-slate-50 rounded-lg">
              <TrendingUp className={`w-5 h-5 ${netMonthly >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            </div>
            <span className="text-xs text-gray-500">本月</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">¥{netMonthly.toLocaleString()}</div>
          <div className="text-sm text-gray-600">净收入</div>
        </div>
      </div>

      {/* 趋势看板 */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold mb-4">6个月净额趋势</h2>
        <div className="flex items-end space-x-2 h-24">
          {monthlySeries.map((v, idx) => {
            const h = Math.round((Math.abs(v) / maxAbs) * 96)
            const pos = v >= 0
            return (
              <div key={idx} className="flex flex-col items-center">
                <div className={`w-6 ${pos ? 'bg-green-500' : 'bg-red-500'}`} style={{ height: `${h}px` }} />
                <div className="text-xs text-gray-500 mt-1">{months[idx].slice(5)}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 快捷操作 */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold mb-4">快捷操作</h2>
        <div className="grid grid-cols-2 gap-3">
          <button className="flex flex-col items-center p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors">
            <Gift className="w-6 h-6 text-orange-500 mb-2" />
            <span className="text-sm font-medium text-gray-700">添加送礼</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
            <Gift className="w-6 h-6 text-blue-500 mb-2" />
            <span className="text-sm font-medium text-gray-700">添加收礼</span>
          </button>
        </div>
      </div>

      {/* 最近记录 */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">最近记录</h2>
          <span className="text-sm text-gray-500">共 {records.length} 条</span>
        </div>
        
        {recentRecords.length === 0 ? (
          <div className="text-center py-8">
            <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">暂无记录</p>
            <p className="text-sm text-gray-400 mt-1">点击上方按钮添加第一条记录</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentRecords.map((record) => {
              const contact = contacts.find(c => c.id === record.contact_id)
              const isGiven = record.type === 'gift_given'
              
              return (
                <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${isGiven ? 'bg-red-500' : 'bg-green-500'}`} />
                    <div>
                      <div className="font-medium text-gray-900">{record.event_name}</div>
                      <div className="text-sm text-gray-600">
                        {contact?.name || '未知联系人'} · {record.record_date}
                      </div>
                    </div>
                  </div>
                  <div className={`font-semibold ${isGiven ? 'text-red-600' : 'text-green-600'}`}>
                    {isGiven ? '-' : '+'}¥{record.amount.toLocaleString()}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        
        {records.length > 5 && (
          <button className="w-full mt-4 py-2 text-sm text-orange-500 hover:text-orange-600 font-medium">
            查看更多
          </button>
        )}
      </div>
    </div>
  )
}
