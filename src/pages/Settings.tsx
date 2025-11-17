import { useState } from 'react'
import { Download, Upload, Shield, Bell, HelpCircle, FileText } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import toast from 'react-hot-toast'

export default function Settings() {
  const { records, contacts } = useApp()
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      // 这里实现导出功能
      toast.success('数据导出功能开发中...')
    } catch (error) {
      toast.error('导出失败')
    } finally {
      setExporting(false)
    }
  }

  const handleImport = () => {
    toast.success('数据导入功能开发中...')
  }

  const settingsItems = [
    {
      title: '数据导出',
      description: '导出您的所有数据到Excel文件',
      icon: Download,
      onClick: handleExport,
      loading: exporting,
    },
    {
      title: '数据导入',
      description: '从Excel文件导入数据',
      icon: Upload,
      onClick: handleImport,
    },
    {
      title: '隐私与安全',
      description: '管理您的隐私设置',
      icon: Shield,
      onClick: () => toast.success('隐私设置功能开发中...'),
    },
    {
      title: '通知设置',
      description: '管理应用通知偏好',
      icon: Bell,
      onClick: () => toast.success('通知设置功能开发中...'),
    },
    {
      title: '帮助与反馈',
      description: '获取帮助或发送反馈',
      icon: HelpCircle,
      onClick: () => toast.success('帮助功能开发中...'),
    },
    {
      title: '关于应用',
      description: '查看应用信息和版本',
      icon: FileText,
      onClick: () => {
        const version = import.meta.env.VITE_APP_VERSION || '1.0.0'
        toast.success(`人情份子钱记录 v${version}`)
      },
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面标题 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <h1 className="text-lg font-semibold text-gray-900">设置</h1>
        </div>
      </div>

      {/* 数据概览 */}
      <div className="px-4 py-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">数据概览</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">{records.length}</div>
              <div className="text-sm text-gray-600">礼簿记录</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{contacts.length}</div>
              <div className="text-sm text-gray-600">联系人</div>
            </div>
          </div>
        </div>

        {/* 设置选项 */}
        <div className="space-y-2">
          {settingsItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.title}
                onClick={item.onClick}
                disabled={item.loading}
                className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center mr-3">
                    <Icon className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900">{item.title}</div>
                    <div className="text-sm text-gray-500">{item.description}</div>
                  </div>
                  {item.loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500" />
                  ) : (
                    <div className="text-gray-400">›</div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}