'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

const COLORS = ['#162f52', '#295536', '#73262f', '#d97706', '#6366f1', '#0891b2']

export default function GraficoVisitasMes({
  datos,
  tecnicos,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  datos: any[]
  tecnicos: string[]
}) {
  if (datos.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Sin visitas registradas aún
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={datos} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        {tecnicos.map((tecnico, i) => (
          <Bar
            key={tecnico}
            dataKey={tecnico}
            fill={COLORS[i % COLORS.length]}
            radius={[4, 4, 0, 0]}
            stackId="a"
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
