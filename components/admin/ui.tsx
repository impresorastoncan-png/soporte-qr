import Link from 'next/link'
import type { ReactNode } from 'react'

export function PageHeader({
  titulo,
  subtitulo,
  actions,
}: {
  titulo: string
  subtitulo?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{titulo}</h1>
        {subtitulo && <p className="text-sm text-gray-500 mt-1">{subtitulo}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 ${className}`}>{children}</div>
  )
}

export function PrimaryButton({
  children,
  type = 'button',
  disabled,
  onClick,
  href,
}: {
  children: ReactNode
  type?: 'button' | 'submit'
  disabled?: boolean
  onClick?: () => void
  href?: string
}) {
  const className =
    'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed'
  const style = { backgroundColor: disabled ? '#9ca3af' : '#162f52' }
  if (href) {
    return (
      <Link href={href} className={className} style={style}>
        {children}
      </Link>
    )
  }
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={className} style={style}>
      {children}
    </button>
  )
}

export function SecondaryButton({
  children,
  type = 'button',
  onClick,
  href,
}: {
  children: ReactNode
  type?: 'button' | 'submit'
  onClick?: () => void
  href?: string
}) {
  const className =
    'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors'
  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    )
  }
  return (
    <button type={type} onClick={onClick} className={className}>
      {children}
    </button>
  )
}

export function Field({
  label,
  required,
  hint,
  children,
  error,
}: {
  label: string
  required?: boolean
  hint?: string
  children: ReactNode
  error?: string
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
        {hint && <span className="text-gray-400 font-normal"> — {hint}</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

export const inputClass =
  'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 bg-white'

export function Badge({ bg, text, label }: { bg: string; text: string; label: string }) {
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-xs font-semibold"
      style={{ backgroundColor: bg, color: text }}
    >
      {label}
    </span>
  )
}

export function EmptyState({ titulo, subtitulo, action }: { titulo: string; subtitulo?: string; action?: ReactNode }) {
  return (
    <div className="p-12 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-3l-1 2h-6l-1-2H4" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-gray-700">{titulo}</p>
      {subtitulo && <p className="text-xs text-gray-500 mt-1">{subtitulo}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function FormActions({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-end gap-2 pt-5 border-t border-gray-100 mt-6">{children}</div>
}
