import { useState } from 'react'
import axios from 'axios'

export default function AutomationAlert({ report }) {
    const [visible, setVisible] = useState(true)

    if (!report || !visible) return null

    const markRead = async () => {
        axios.post(`/admin/automation/reports/${report.id}/read`)
        setVisible(false)
    }

    return (
        <div className="relative overflow-hidden rounded-xl border border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50 shadow-md">

            <div className="absolute top-3 right-3 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                NUEVO
            </div>

            <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                    <div className="text-3xl">⚠️</div>
                    <div>
                        <h3 className="font-bold text-yellow-800 text-lg">
                            Alerta automática del sistema
                        </h3>
                        <p className="text-xs text-gray-500">
                            Periodo {report.period}
                        </p>
                    </div>
                </div>

                <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                    {report.content}
                </pre>

                <div className="mt-4 text-right">
                    <button
                        onClick={markRead}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    )
}
