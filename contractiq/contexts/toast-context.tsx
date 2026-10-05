'use client'

import { createContext, useContext, useState, useCallback } from 'react'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastContextValue {
  showToast: (message: string, type: Toast['type']) => void
}

export const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
})

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: Toast['type']) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev.slice(-2), { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const bgClass = { success: 'bg-green-50 border-green-500', error: 'bg-red-50 border-red-500', info: 'bg-blue-50 border-blue-600' }
  const textClass = { success: 'text-green-700', error: 'text-red-700', info: 'text-blue-700' }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`flex items-start gap-2 px-4 py-3 rounded-lg border shadow-md max-w-xs text-sm ${bgClass[t.type]} ${textClass[t.type]}`}
            >
              <span className="flex-1">{t.message}</span>
              <button
                onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))}
                className="text-inherit opacity-60 hover:opacity-100 leading-none"
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  return useContext(ToastContext)
}
