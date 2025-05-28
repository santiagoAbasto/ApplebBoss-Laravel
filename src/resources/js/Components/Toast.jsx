import { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';

const icons = {
  success: <CheckCircle className="w-5 h-5 text-green-600" />,
  error: <XCircle className="w-5 h-5 text-red-600" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
  info: <Info className="w-5 h-5 text-blue-600" />,
};

const baseStyles = {
  success: 'bg-white border border-green-300 text-green-700',
  error: 'bg-white border border-red-300 text-red-700',
  warning: 'bg-white border border-yellow-300 text-yellow-700',
  info: 'bg-white border border-blue-300 text-blue-700',
};

export default function Toast({
  message = 'Cotización creada con éxito',
  show = false,
  type = 'success',
  duration = 3000,
}) {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timeout = setTimeout(() => setVisible(false), duration);
      return () => clearTimeout(timeout);
    }
  }, [show, duration]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg animate-fade-in transition-all duration-300 ${baseStyles[type]}`}
      >
        {icons[type] || icons.success}
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}
