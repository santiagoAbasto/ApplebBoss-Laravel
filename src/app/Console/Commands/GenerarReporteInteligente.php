<?php

namespace App\Console\Commands;

use App\Services\ReporteInteligenteService;
use Illuminate\Console\Command;

class GenerarReporteInteligente extends Command
{
    protected $signature = 'reporte:inteligente';

    protected $description = 'Genera el análisis comercial con IA (Claude Opus 5.5) y lo guarda.';

    public function handle(ReporteInteligenteService $svc): int
    {
        $hoy = now()->toDateString();

        // Solo se genera si hubo ventas o servicios ese día; si no, no se hace.
        $hayVentas = \App\Models\Venta::whereDate('fecha', $hoy)->exists()
            || \App\Models\ServicioTecnico::whereDate('fecha', $hoy)->exists();

        if (! $hayVentas) {
            $this->info("Sin ventas ni servicios el {$hoy}; no se genera reporte.");
            return self::SUCCESS;
        }

        $this->info("Generando análisis del día {$hoy} con IA...");
        try {
            $r = $svc->generar($hoy, $hoy); // reporte del día
            $this->info("OK · reporte #{$r->id} · período {$r->period}");
            return self::SUCCESS;
        } catch (\Throwable $e) {
            $this->error('Falló: ' . $e->getMessage());
            report($e);
            return self::FAILURE;
        }
    }
}
