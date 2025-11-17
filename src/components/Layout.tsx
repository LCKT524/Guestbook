import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import { Home, PlusCircle, BookOpen, Users, User, Settings, Sparkles } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Layout() {
  const [activeTab, setActiveTab] = useState('home')
  const { user } = useAuth()

  const navItems = [
    { id: 'home', icon: Home, label: '首页', href: '/' },
    { id: 'records', icon: BookOpen, label: '礼簿', href: '/records' },
    { id: 'add', icon: PlusCircle, label: '记账', href: '/record/add' },
    { id: 'contacts', icon: Users, label: '联系人', href: '/contacts' },
    { id: 'profile', icon: User, label: '我的', href: '/profile' },
    { id: 'assistant', icon: Sparkles, label: '助手', href: '/assistant' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 主要内容区域 */}
      <main className="px-4 py-4">
        <Outlet />
      </main>

      {/* 底部导航栏 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            
            return (
              <a
                key={item.id}
                href={item.href}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center w-16 h-12 rounded-lg transition-colors ${
                  isActive
                    ? 'text-orange-500 bg-orange-50'
                    : 'text-gray-600 hover:text-orange-500'
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs">{item.label}</span>
              </a>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
