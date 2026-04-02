import { useState, useEffect } from 'react'
import axios from 'axios'
import dayjs from 'dayjs'

export default function AutomationAlert({ report }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!report) return

    const today = dayjs().format('YYYY-MM-DD')
    const lastSeen = localStorage.getItem('automation_alert_seen')

    if (lastSeen !== today) {
      setVisible(true)
      localStorage.setItem('automation_alert_seen', today)
    }
  }, [report])

  if (!report || !visible) return null

  const markRead = async () => {
    try {
      await axios.post(`/admin/automation/reports/${report.id}/read`)
    } catch (e) {}
    setVisible(false)
  }

  return (
    <div className="fixed top-6 right-6 z-50 w-[420px] animate-slideIn">
      <div className="bg-white shadow-2xl border border-yellow-200 rounded-2xl overflow-hidden">

        {/* HEADER */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            <div>
              <p className="text-sm font-semibold">Análisis Inteligente</p>
              <p className="text-xs opacity-90">Periodo {report.period}</p>
            </div>
          </div>

          <button
            onClick={() => setVisible(false)}
            className="text-white text-sm opacity-80 hover:opacity-100"
          >
            ✕
          </button>
        </div>

        {/* CONTENT */}
        <div className="px-5 py-4 max-h-[220px] overflow-y-auto">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {report.content}
          </p>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 px-5 py-3 bg-gray-50">
          <button
            onClick={markRead}
            className="px-4 py-2 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
          >
            Entendido
          </button>
        </div>
      </div>

      {/* Animación */}
      <style>
        {`
          .animate-slideIn {
            animation: slideIn 0.35s ease-out forwards;
          }

          @keyframes slideIn {
            from {
              transform: translateY(-10px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  )
}
