import { useState } from 'react'
import { Search, Filter, Download, Calendar, DollarSign, User, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useApp } from '../contexts/AppContext'
import { useNavigate } from 'react-router-dom'

export default function Records() {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'gift_given' | 'gift_received'>('all')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const { records, contacts, categories, loading, deleteRecord } = useApp()
  const navigate = useNavigate()

  const filteredRecords = records.filter(record => {
    const contact = contacts.find(c => c.id === record.contact_id)
    const matchesSearch = !searchTerm || 
      record.event_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact && contact.name.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesType = typeFilter === 'all' || record.type === typeFilter
    const matchesCategory = !categoryFilter || record.category_id === categoryFilter
    const matchesDate = !dateFilter || record.record_date === dateFilter
    
    return matchesSearch && matchesType && matchesCategory && matchesDate
  })

  const handleDelete = async (id: string) => {
    try {
      await deleteRecord(id)
      toast.success('已删除记录')
    } catch (e: any) {
      toast.error(e?.message || '删除失败')
    }
  }

  // 计算统计数据
  const totalGiven = filteredRecords
    .filter(record => record.type === 'gift_given')
    .reduce((sum, record) => sum + record.amount, 0)

  const totalReceived = filteredRecords
    .filter(record => record.type === 'gift_received')
    .reduce((sum, record) => sum + record.amount, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面标题 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">礼簿</h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate('/record/add')}
                className="flex items-center px-3 py-2 text-orange-500 hover:text-orange-600"
              >
                记账
              </button>
              <button
                onClick={() => navigate('/export')}
                className="flex items-center px-3 py-2 text-orange-500 hover:text-orange-600"
              >
                <Download className="w-4 h-4 mr-1" />
                导出
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-red-50 rounded-lg">
                <DollarSign className="w-5 h-5 text-red-500" />
              </div>
              <span className="text-xs text-gray-500">筛选结果</span>
            </div>
            <div className="text-xl font-bold text-gray-900">¥{totalGiven.toLocaleString()}</div>
            <div className="text-sm text-gray-600">送礼支出</div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-green-50 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <span className="text-xs text-gray-500">筛选结果</span>
            </div>
            <div className="text-xl font-bold text-gray-900">¥{totalReceived.toLocaleString()}</div>
            <div className="text-sm text-gray-600">收礼收入</div>
          </div>
        </div>

        {/* 搜索和筛选 */}
        <div className="space-y-3 mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
              placeholder="搜索事件或联系人"
            />
          </div>

          <div className="flex space-x-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">全部类型</option>
              <option value="gift_given">送礼</option>
              <option value="gift_received">收礼</option>
            </select>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
            />

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">全部分类</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 记录列表 */}
      <div className="px-4 pb-20">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">
              {searchTerm || typeFilter !== 'all' || dateFilter ? '未找到匹配的记录' : '暂无记录'}
            </p>
            <p className="text-sm text-gray-400 mb-4">
              {searchTerm || typeFilter !== 'all' || dateFilter ? '尝试调整筛选条件' : '开始记录你的第一笔人情往来'}
            </p>
            {!searchTerm && typeFilter === 'all' && !dateFilter && (
              <button
                onClick={() => navigate('/record/add')}
                className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                添加记录
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRecords.map((record) => {
              const contact = contacts.find(c => c.id === record.contact_id)
              const isGiven = record.type === 'gift_given'
              const cat = categories.find(c => c.id === record.category_id)
              
              return (
                <div
                  key={record.id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/record/${record.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${isGiven ? 'bg-red-500' : 'bg-green-500'}`} />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{record.event_name}</div>
                        <div className="text-sm text-gray-600 flex items-center mt-1">
                          <User className="w-3 h-3 mr-1" />
                          {contact?.name || '未知联系人'}
                          <span className="mx-2">·</span>
                          <Calendar className="w-3 h-3 mr-1" />
                          {record.record_date}
                          {cat && (
                            <span className="ml-2 px-2 py-0.5 text-xs rounded-full border" style={{ borderColor: cat.color, color: cat.color }}>
                              {cat.name}
                            </span>
                          )}
                        </div>
                        {record.note && (
                          <div className="text-sm text-gray-500 mt-1">{record.note}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex items-center space-x-2">
                      <div className={`text-lg font-semibold ${isGiven ? 'text-red-600' : 'text-green-600'}`}>
                        {isGiven ? '-' : '+'}¥{record.amount.toLocaleString()}
                      </div>
                      {record.payment_method && (
                        <div className="text-xs text-gray-500 mt-1">{record.payment_method}</div>
                      )}
                      <button
                        className="p-2 text-gray-400 hover:text-red-600"
                        onClick={(e) => { e.stopPropagation(); handleDelete(record.id) }}
                        aria-label="删除记录"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}