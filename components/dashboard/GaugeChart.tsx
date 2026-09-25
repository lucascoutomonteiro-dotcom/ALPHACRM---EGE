'use client'

import { useState } from 'react'
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'

interface GaugeChartProps {
  label: string
  pct: number
  tooltip?: string
  sublabel?: string
}

export function GaugeChart({ label, pct, tooltip, sublabel }: GaugeChartProps) {
  const [show, setShow] = useState(false)
  const color = pct >= 100 ? '#22C55E' : pct >= 70 ? '#3B82F6' : pct >= 30 ? '#FBBF24' : '#EF4444'
  const data = [{ value: Math.min(pct, 100), fill: color }, { value: 100, fill: '#F3F4F6' }]

  return (
    <div className="flex flex-col items-center relative">
      <div
        className="relative h-28 w-28 cursor-default"
        onMouseEnter={() => tooltip && setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" startAngle={90} endAngle={-270} data={data} barSize={10}>
            <RadialBar dataKey="value" cornerRadius={5} background={false} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold" style={{ color }}>{pct}%</span>
        </div>

        {show && tooltip && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg z-10">
            {tooltip}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
          </div>
        )}
      </div>
      <span className="text-xs text-gray-500 mt-1 text-center">{label}</span>
      {sublabel && (
        <span className="text-[10px] text-gray-400 mt-0.5 text-center leading-tight">{sublabel}</span>
      )}
    </div>
  )
}
