import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Home, PlusCircle, BookOpen, Users, User, Settings, Sparkles } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Layout() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const navItems = [
    { id: 'home', icon: Home, label: '首页', href: '/' },
    { id: 'records', icon: BookOpen, label: '礼簿', href: '/records' },
    { id: 'contacts', icon: Users, label: '联系人', href: '/contacts' },
    { id: 'profile', icon: User, label: '我的', href: '/profile' },
    { id: 'assistant', icon: Sparkles, label: '助手', href: '/assistant' },
  ]

  return (
    <div className="grid grid-rows-[4rem,1fr,4rem] h-screen bg-gray-50">
      <header className="row-start-1 bg-white border-b border-gray-200 h-16">
        <div className="flex items-center justify-between h-full px-4">
          <h1 className="text-lg font-semibold text-gray-900">
            {pathname === '/' && '首页'}
            {pathname.startsWith('/records') && '礼簿'}
            {pathname.startsWith('/contacts') && '联系人'}
            {pathname.startsWith('/assistant') && '助手'}
            {pathname.startsWith('/profile') && '我的'}
          </h1>
          <div className="flex items-center space-x-2">
            {pathname.startsWith('/records') && (
              <button
                onClick={() => navigate('/export')}
                className="flex items-center px-3 py-2 text-orange-500 hover:text-orange-600"
              >
                导出
              </button>
            )}
            {pathname.startsWith('/contacts') && (
              <button
                onClick={() => navigate('/contact/add')}
                className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                + 添加
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="row-start-2 overflow-y-auto px-4 pb-[env(safe-area-inset-bottom)]">
        <Outlet />
      </main>

      <nav className="row-start-3 bg-white border-t border-gray-200">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon
            
            return (
              <NavLink
                key={item.id}
                to={item.href}
                end={item.href === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center w-16 h-12 rounded-lg transition-colors ${
                    isActive ? 'text-orange-500 bg-orange-50' : 'text-gray-600 hover:text-orange-500'
                  }`
                }
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs">{item.label}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
