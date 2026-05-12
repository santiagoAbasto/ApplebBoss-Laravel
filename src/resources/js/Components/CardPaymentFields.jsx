import { CreditCard } from 'lucide-react';
import NeonInput from '@/Components/NeonInput';

const onlyFourDigits = (value) => value.replace(/\D/g, '').slice(0, 4);

export default function CardPaymentFields({
  inicio,
  fin,
  onChangeInicio,
  onChangeFin,
  errors = {},
}) {
  const start = inicio || '1234';
  const end = fin || '5678';

  return (
    <div className="md:col-span-2 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5 items-stretch">
      <div className="relative overflow-hidden rounded-2xl bg-slate-950 p-5 text-white shadow-xl min-h-[190px]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.35),transparent_32%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.35),transparent_28%)]" />
        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="h-8 w-11 rounded-md bg-gradient-to-br from-amber-200 to-amber-500 shadow-inner" />
            <CreditCard size={30} className="text-white/80" />
          </div>

          <div>
            <div className="font-mono text-lg tracking-[0.18em]">
              {start} •••• •••• {end}
            </div>
            <div className="mt-5 flex items-end justify-between text-xs uppercase tracking-wide text-white/70">
              <span>Apple Boss</span>
              <span>Tarjeta</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Inicio de tarjeta
          </label>
          <NeonInput
            inputMode="numeric"
            maxLength={4}
            placeholder="Ej: 1234"
            value={inicio}
            onChange={(e) => onChangeInicio(onlyFourDigits(e.target.value))}
          />
          {errors.inicio_tarjeta && (
            <p className="mt-1 text-xs text-rose-600">{errors.inicio_tarjeta}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fin de tarjeta
          </label>
          <NeonInput
            inputMode="numeric"
            maxLength={4}
            placeholder="Ej: 5678"
            value={fin}
            onChange={(e) => onChangeFin(onlyFourDigits(e.target.value))}
          />
          {errors.fin_tarjeta && (
            <p className="mt-1 text-xs text-rose-600">{errors.fin_tarjeta}</p>
          )}
        </div>
      </div>
    </div>
  );
}
