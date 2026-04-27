'use client'

import { useState, useEffect, type ReactNode } from 'react'

const SESSION_KEY = 'toncan_reportes_unlocked'

export default function PinGate({
  children,
  lockedFallback,
}: {
  children: ReactNode
  lockedFallback: ReactNode
}) {
  const [unlocked, setUnlocked] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === '1') {
      setUnlocked(true)
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setChecking(true)
    try {
      const res = await fetch('/api/admin/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })
      const data = await res.json()
      if (data.valid) {
        sessionStorage.setItem(SESSION_KEY, '1')
        setUnlocked(true)
        setShowModal(false)
      } else {
        setError('PIN incorrecto')
      }
    } catch {
      setError('Error al verificar')
    }
    setChecking(false)
  }

  if (unlocked) {
    return <>{children}</>
  }

  return (
    <>
      {lockedFallback}

      {/* Boton para desbloquear */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all"
          style={{ backgroundColor: '#162f52' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Desbloquear datos
        </button>
      </div>

      {/* Modal PIN */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800">Acceso restringido</h3>
              <p className="text-sm text-gray-500 mt-1">Ingresa el PIN para ver datos financieros</p>
            </div>

            <form onSubmit={handleSubmit}>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={e => { setPin(e.target.value); setError('') }}
                placeholder="PIN"
                className="w-full text-center text-2xl tracking-[0.5em] font-mono border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              {error && <p className="text-red-500 text-xs text-center mt-2">{error}</p>}

              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setPin(''); setError('') }}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={checking || pin.length < 4}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50"
                  style={{ backgroundColor: '#162f52' }}
                >
                  {checking ? 'Verificando...' : 'Desbloquear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
