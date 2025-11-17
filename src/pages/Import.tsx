import { useState } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useApp } from '../contexts/AppContext'
import toast from 'react-hot-toast'

interface ImportData {
  '事件名称'?: string
  '联系人'?: string
  '关系'?: string
  '类型'?: string
  '日期'?: string
  '金额'?: string
  '支付方式'?: string
  '备注'?: string
}

export default function Import() {
  const [file, setFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<ImportData[]>([])
  const [importing, setImporting] = useState(false)
  const { addRecord, contacts, categories } = useApp()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
      toast.error('请选择Excel文件')
      return
    }

    setFile(selectedFile)
    previewFile(selectedFile)
  }

  const previewFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as ImportData[]
        
        setPreviewData(jsonData.slice(0, 10)) // 只显示前10行预览
      } catch (error) {
        console.error('预览文件失败:', error)
        toast.error('文件预览失败')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleImport = async () => {
    if (!file) return

    setImporting(true)
    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as ImportData[]

          let importedCount = 0
          let skippedCount = 0

          for (const row of jsonData) {
            try {
              // 验证必要字段
              if (!row['事件名称'] || !row['类型'] || !row['金额'] || !row['日期']) {
                skippedCount++
                continue
              }

              // 转换数据类型
              const amount = parseFloat(row['金额']?.toString().replace(/[^\d.]/g, '') || '0')
              if (isNaN(amount) || amount <= 0) {
                skippedCount++
                continue
              }

              // 转换类型
              const type = row['类型']?.includes('送') ? 'gift_given' : 'gift_received'
              
              // 查找或创建联系人
              let contactId = undefined
              if (row['联系人']) {
                const existingContact = contacts.find(c => c.name === row['联系人'])
                if (existingContact) {
                  contactId = existingContact.id
                }
              }

              let categoryId = undefined
              if ((row as any)['分类']) {
                const cat = categories.find(c => c.name === String((row as any)['分类']))
                if (cat) categoryId = cat.id
              }

              // 创建记录
              await addRecord({
                user_id: '', // 将在addRecord中设置
                contact_id: contactId,
                category_id: categoryId,
                type,
                event_name: row['事件名称'],
                record_date: row['日期'] || new Date().toISOString().slice(0, 10),
                amount,
                payment_method: row['支付方式'] || '现金',
                note: row['备注'],
              })

              importedCount++
            } catch (error) {
              console.error('导入单行失败:', error)
              skippedCount++
            }
          }

          toast.success(`导入完成！成功导入 ${importedCount} 条记录，跳过 ${skippedCount} 条`)
          setFile(null)
          setPreviewData([])
        } catch (error) {
          console.error('导入失败:', error)
          toast.error('导入失败，请检查文件格式')
        } finally {
          setImporting(false)
        }
      }
      reader.readAsArrayBuffer(file)
    } catch (error) {
      console.error('文件读取失败:', error)
      toast.error('文件读取失败')
      setImporting(false)
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
            <h1 className="text-lg font-semibold text-gray-900">数据导入</h1>
            <button
              onClick={handleImport}
              disabled={!file || importing || previewData.length === 0}
              className="text-orange-500 hover:text-orange-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              导入
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* 导入说明 */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">导入说明</h3>
              <p className="text-sm text-gray-600 mb-2">
                支持导入Excel文件（.xlsx, .xls格式），请确保文件包含以下列：
              </p>
              <div className="text-sm text-gray-600 space-y-1">
                <div>• <strong>事件名称</strong> - 必填，如：张三婚礼</div>
                <div>• <strong>类型</strong> - 必填，如：送礼、收礼</div>
                <div>• <strong>金额</strong> - 必填，数字格式</div>
                <div>• <strong>日期</strong> - 必填，格式：2024-01-01</div>
                <div>• <strong>联系人</strong> - 可选，已存在联系人会自动匹配</div>
                <div>• <strong>支付方式</strong> - 可选，如：现金、微信、支付宝</div>
                <div>• <strong>备注</strong> - 可选</div>
              </div>
            </div>
          </div>
        </div>

        {/* 文件选择 */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-medium text-gray-900 mb-3">选择文件</h3>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
              id="file-input"
            />
            <label htmlFor="file-input" className="cursor-pointer">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <div className="text-sm text-gray-600 mb-2">
                {file ? (
                  <span className="text-green-600 font-medium">已选择：{file.name}</span>
                ) : (
                  '点击选择Excel文件或拖拽文件到此处'
                )}
              </div>
              <div className="text-xs text-gray-500">
                支持 .xlsx, .xls 格式，最大 10MB
              </div>
            </label>
          </div>

          {file && (
            <button
              onClick={() => {
                setFile(null)
                setPreviewData([])
              }}
              className="mt-3 text-sm text-red-500 hover:text-red-600"
            >
              清除选择
            </button>
          )}
        </div>

        {/* 数据预览 */}
        {previewData.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-medium text-gray-900 mb-3">数据预览（前10行）</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    {Object.keys(previewData[0]).map((key) => (
                      <th key={key} className="text-left py-2 px-3 font-medium text-gray-700">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      {Object.values(row).map((value, cellIndex) => (
                        <td key={cellIndex} className="py-2 px-3 text-gray-600">
                          {String(value || '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 p-3 bg-green-50 rounded-lg flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-700">
                预览显示前10行数据，实际导入将处理所有行
              </div>
            </div>
          </div>
        )}

        {/* 导入按钮 */}
        <button
          onClick={handleImport}
          disabled={!file || importing || previewData.length === 0}
          className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {importing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              导入中...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              导入数据
            </>
          )}
        </button>

        {/* 注意事项 */}
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">注意事项</p>
              <ul className="space-y-1 text-xs">
                <li>• 重复的联系人会自动匹配，不会重复创建</li>
                <li>• 金额必须为数字，格式错误的数据将被跳过</li>
                <li>• 建议先备份现有数据再进行导入操作</li>
                <li>• 大批量数据导入可能需要一些时间，请耐心等待</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}