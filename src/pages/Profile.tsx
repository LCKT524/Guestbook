import { User, Phone, Mail, Calendar, Settings, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('退出登录成功')
      navigate('/login')
    } catch (error: any) {
      toast.error(error.message || '退出登录失败')
    }
  }

  const menuItems = [
    {
      icon: User,
      title: '个人信息',
      description: '管理您的个人资料',
      onClick: () => navigate('/profile/edit'),
    },
    {
      icon: Calendar,
      title: '数据统计',
      description: '查看您的礼簿统计',
      onClick: () => navigate('/statistics'),
    },
    {
      icon: Settings,
      title: '设置',
      description: '应用设置和偏好',
      onClick: () => navigate('/settings'),
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 用户信息卡片 */}
      <div className="bg-gradient-to-r from-orange-400 to-orange-500 pt-8 pb-16">
        <div className="px-4 text-center text-white">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-orange-500" />
          </div>
          <h2 className="text-xl font-bold mb-1">{user?.nickname || '用户'}</h2>
          <p className="text-orange-100">
            {user?.phone || user?.email || '暂无联系方式'}
          </p>
        </div>
      </div>

      {/* 功能菜单 */}
      <div className="px-4 -mt-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-4">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            return (
              <div key={item.title}>
                <button
                  onClick={item.onClick}
                  className="w-full flex items-center p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center mr-3">
                    <Icon className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900">{item.title}</div>
                    <div className="text-sm text-gray-500">{item.description}</div>
                  </div>
                  <div className="text-gray-400">›</div>
                </button>
                {index < menuItems.length - 1 && (
                  <div className="border-b border-gray-100 mx-4" />
                )}
              </div>
            )
          })}
        </div>

        {/* 退出登录 */}
        <button
          onClick={handleLogout}
          className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center hover:bg-red-50 transition-colors"
        >
          <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center mr-3">
            <LogOut className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex-1 text-left">
            <div className="font-medium text-red-600">退出登录</div>
            <div className="text-sm text-red-500">安全退出您的账户</div>
          </div>
        </button>
      </div>
    </div>
  )
}