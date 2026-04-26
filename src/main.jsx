import React from 'react'
import ReactDOM from 'react-dom/client'
import { useRegisterSW } from 'virtual:pwa-register/react'
import './index.css'
import App from './App'
import SuccessPage from './components/SuccessPage'

function usePWAPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
    registration,
  } = useRegisterSW({
    onNeedRefresh() {
      if (confirm('Dostępna jest nowa wersja aplikacji. Odświeżyć?')) {
        updateServiceWorker(true)
      }
    },
    onOfflineReady() {
      console.log('Aplikacja gotowa do pracy offline')
    },
    onRegisterError(error) {
      console.error('Błąd rejestracji SW:', error)
    },
  })

  return { offlineReady, needRefresh, updateServiceWorker, registration }
}

function PWAInstallPrompt() {
  const { offlineReady, needRefresh, updateServiceWorker, registration } = usePWAPrompt()
  const [showPrompt, setShowPrompt] = React.useState(false)

  const dismiss = () => {
    localStorage.setItem('pwa-dismissed', Date.now().toString())
    setShowPrompt(false)
  }

  React.useEffect(() => {
    const dismissed = localStorage.getItem('pwa-dismissed')
    if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) return

    const handleBeforeInstall = (e) => {
      e.preventDefault()
      window.deferredPrompt = e
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  const handleInstall = async () => {
    if (!window.deferredPrompt) return

    window.deferredPrompt.prompt()
    const { outcome } = await window.deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('Użytkownik zainstalował aplikację')
    }

    window.deferredPrompt = null
    setShowPrompt(false)
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-white rounded-lg shadow-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#c8860a' }}>
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Zainstaluj aplikację</p>
            <p className="text-sm text-gray-500">Dodaj do ekranu głównego</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={dismiss}
            className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Nie teraz
          </button>
          <button
            onClick={handleInstall}
            className="px-4 py-2 text-white rounded-lg font-medium transition-colors"
            style={{ background: '#c8860a' }}
          >
            Instaluj
          </button>
        </div>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {window.location.pathname === '/success' ? <SuccessPage /> : <App />}
    <PWAInstallPrompt />
  </React.StrictMode>
)
