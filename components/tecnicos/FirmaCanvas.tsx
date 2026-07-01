'use client'

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'

export interface FirmaCanvasHandle {
  isEmpty: () => boolean
  toDataURL: () => string
  clear: () => void
}

const FirmaCanvas = forwardRef<FirmaCanvasHandle>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // Using any because signature_pad has no official React types and dynamic import typing is complex
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const padRef = useRef<any>(null)

  useEffect(() => {
    let mounted = true

    import('signature_pad').then(({ default: SignaturePad }) => {
      if (!mounted || !canvasRef.current) return

      const canvas = canvasRef.current
      const ratio = Math.max(window.devicePixelRatio || 1, 1)
      canvas.width = canvas.offsetWidth * ratio
      canvas.height = canvas.offsetHeight * ratio
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.scale(ratio, ratio)

      padRef.current = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: '#162f52',
        minWidth: 1.5,
        maxWidth: 3,
      })
    })

    return () => { mounted = false }
  }, [])

  useImperativeHandle(ref, () => ({
    isEmpty: () => padRef.current?.isEmpty() ?? true,
    toDataURL: () => padRef.current?.toDataURL('image/png') ?? '',
    clear: () => padRef.current?.clear(),
  }))

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-48 border-2 border-gray-300 rounded-xl bg-white touch-none cursor-crosshair"
      style={{ touchAction: 'none' }}
    />
  )
})

FirmaCanvas.displayName = 'FirmaCanvas'

export default FirmaCanvas
