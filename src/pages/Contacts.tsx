import { useState } from 'react'
import { Search, Plus, User, Phone, Calendar, DollarSign } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { useNavigate } from 'react-router-dom'

export default function Contacts() {
  const [searchTerm, setSearchTerm] = useState('')
  const { contacts, loading } = useApp()
  const navigate = useNavigate()

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contact.phone && contact.phone.includes(searchTerm))
  )

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
            <h1 className="text-lg font-semibold text-gray-900">联系人</h1>
            <button
              onClick={() => navigate('/contact/add')}
              className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" />
              添加
            </button>
          </div>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="px-4 py-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
            placeholder="搜索联系人姓名或电话"
          />
        </div>
      </div>

      {/* 联系人列表 */}
      <div className="px-4 pb-20">
        {filteredContacts.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">
              {searchTerm ? '未找到匹配的联系人' : '暂无联系人'}
            </p>
            <p className="text-sm text-gray-400 mb-4">
              {searchTerm ? '尝试其他搜索词' : '添加你的第一个联系人'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => navigate('/contact/add')}
                className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Plus className="w-4 h-4 mr-1" />
                添加联系人
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/contact/${contact.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{contact.name}</div>
                      {contact.address && (
                        <div className="text-sm text-gray-500">{contact.address}</div>
                      )}
                      {contact.phone && (
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <Phone className="w-3 h-3 mr-1" />
                          {contact.phone}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">电话</div>
                    <div className="text-lg font-semibold text-orange-500">
                      {contact.phone || '—'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}