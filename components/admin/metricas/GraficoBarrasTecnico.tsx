'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

interface DatoTecnico {
  nombre: string
  respuesta: number
  resolucion: number
}

export default function GraficoBarrasTecnico({ datos }: { datos: DatoTecnico[] }) {
  if (datos.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Sin datos registrados aún
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={datos} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={v => `${v}h`} tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value, name) => [
            typeof value === 'number' ? `${value.toFixed(1)}h` : value,
            name === 'respuesta' ? 'Tiempo de respuesta' : 'Tiempo de resolución',
          ]}
        />
        <Legend
          formatter={name => name === 'respuesta' ? 'Tiempo de respuesta' : 'Tiempo de resolución'}
        />
        <Bar dataKey="respuesta" fill="#162f52" radius={[4, 4, 0, 0]} />
        <Bar dataKey="resolucion" fill="#295536" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
