import { Routes, Route, Navigate, BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AppProvider } from './contexts/AppContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import RecordAdd from './pages/RecordAdd'
import RecordDetail from './pages/RecordDetail'
import Records from './pages/Records'
import Contacts from './pages/Contacts'
import ContactDetail from './pages/ContactDetail'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Assistant from './pages/Assistant'
import Export from './pages/Export'
import Import from './pages/Import'
import { useAuth } from './contexts/AuthContext'

// 保护路由组件
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }
  
  return user ? children : <Navigate to="/login" replace />
}

// 公开路由组件（未登录时访问）
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }
  
  return user ? <Navigate to="/" replace /> : children
}

function MainApp() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <Routes>
            {/* 公开路由 */}
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } />
            
            {/* 受保护的路由 */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Home />} />
              <Route path="record/add" element={<RecordAdd />} />
              <Route path="record/:id" element={<RecordDetail />} />
              <Route path="records" element={<Records />} />
              <Route path="contacts" element={<Contacts />} />
              <Route path="contact/:id" element={<ContactDetail />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
              <Route path="assistant" element={<Assistant />} />
              <Route path="export" element={<Export />} />
              <Route path="import" element={<Import />} />
            </Route>
            
            {/* 重定向 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default MainApp
