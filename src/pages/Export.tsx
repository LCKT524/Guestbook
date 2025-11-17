import { useState } from 'react'
import { Download, Upload, FileText, Calendar, Filter } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'

export default function Export() {
  const { records, contacts, categories } = useApp()
  const [exporting, setExporting] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [exportType, setExportType] = useState<'all' | 'given' | 'received'>('all')

  const handleExport = async () => {
    if (records.length === 0) {
      toast.error('没有数据可以导出')
      return
    }

    setExporting(true)
    try {
      // 筛选数据
      let filteredRecords = records
      
      if (startDate) {
        filteredRecords = filteredRecords.filter(r => r.record_date >= startDate)
      }
      if (endDate) {
        filteredRecords = filteredRecords.filter(r => r.record_date <= endDate)
      }
      if (exportType !== 'all') {
        filteredRecords = filteredRecords.filter(r => r.type === `gift_${exportType}`)
      }

      if (filteredRecords.length === 0) {
        toast.error('筛选条件下没有数据')
        return
      }

      // 准备导出数据
      const exportData = filteredRecords.map(record => {
        const contact = contacts.find(c => c.id === record.contact_id)
        const category = categories.find(cat => cat.id === record.category_id)
        return {
          '事件名称': record.event_name,
          '联系人': contact?.name || '未知联系人',
          '地址': contact?.address || '',
          '类型': record.type === 'gift_given' ? '送礼' : '收礼',
          '日期': record.record_date,
          '金额': record.amount,
          '支付方式': record.payment_method || '',
          '备注': record.note || '',
          '分类': category?.name || '',
          '创建时间': new Date(record.created_at).toLocaleString('zh-CN'),
        }
      })

      // 创建工作簿
      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '礼簿记录')

      // 设置列宽
      const colWidths = [
        { wch: 15 }, // 事件名称
        { wch: 12 }, // 联系人
        { wch: 10 }, // 地址
        { wch: 8 },  // 类型
        { wch: 12 }, // 日期
        { wch: 10 }, // 金额
        { wch: 10 }, // 支付方式
        { wch: 20 }, // 备注
        { wch: 18 }, // 创建时间
      ]
      ws['!cols'] = colWidths

      // 生成文件名
      const fileName = `礼簿记录_${new Date().toISOString().slice(0, 10)}_${exportType === 'all' ? '全部' : exportType === 'given' ? '送礼' : '收礼'}.xlsx`

      // 下载文件
      XLSX.writeFile(wb, fileName)
      
      toast.success(`成功导出 ${exportData.length} 条记录`)
    } catch (error) {
      console.error('导出失败:', error)
      toast.error('导出失败，请重试')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面标题 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => window.history.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              返回
            </button>
            <h1 className="text-lg font-semibold text-gray-900">数据导出</h1>
            <button
              onClick={handleExport}
              disabled={exporting || records.length === 0}
              className="text-orange-500 hover:text-orange-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              导出
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* 导出说明 */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">导出说明</h3>
              <p className="text-sm text-gray-600">
                您可以将礼簿记录导出为Excel文件，方便备份或在电脑上进行数据分析。
              </p>
            </div>
          </div>
        </div>

        {/* 数据概览 */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-medium text-gray-900 mb-3">数据概览</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">{records.length}</div>
              <div className="text-sm text-gray-600">总记录数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">
                {records.filter(r => r.type === 'gift_given').length}
              </div>
              <div className="text-sm text-gray-600">送礼记录</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {records.filter(r => r.type === 'gift_received').length}
              </div>
              <div className="text-sm text-gray-600">收礼记录</div>
            </div>
          </div>
        </div>

        {/* 筛选条件 */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-medium text-gray-900 mb-3">筛选条件（可选）</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                记录类型
              </label>
              <select
                value={exportType}
                onChange={(e) => setExportType(e.target.value as any)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">全部记录</option>
                <option value="given">仅送礼记录</option>
                <option value="received">仅收礼记录</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  开始日期
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  结束日期
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 导出按钮 */}
        <button
          onClick={handleExport}
          disabled={exporting || records.length === 0}
          className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {exporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              导出中...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              导出Excel文件
            </>
          )}
        </button>

        {records.length === 0 && (
          <div className="text-center py-8">
            <Download className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">暂无数据可导出</p>
            <p className="text-sm text-gray-400 mt-1">先添加一些记录再回来导出</p>
          </div>
        )}
      </div>
    </div>
  )
}