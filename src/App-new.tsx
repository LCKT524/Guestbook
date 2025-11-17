import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import MainApp from './MainApp-new'
import './index.css'

function App() {
  return (
    <>
      <MainApp />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#363636',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          },
          success: {
            style: {
              background: '#f0fdf4',
              color: '#166534',
              border: '1px solid #bbf7d0',
            },
          },
          error: {
            style: {
              background: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fecaca',
            },
          },
        }}
      />
    </>
  )
}

export default App