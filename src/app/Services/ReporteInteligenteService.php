<?php

namespace App\Services;

use App\Http\Controllers\Automation\TopProductsController;
use App\Models\AutomationReport;
use App\Models\SystemNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;

/**
 * Genera el "Reporte inteligente" (análisis comercial con IA) dentro de Laravel.
 * Reúne los datos reales (TopProductsController), los manda a Claude (Opus 5.5)
 * y guarda un AutomationReport. Lo usan el comando diario (20:00) y el botón del panel.
 */
class ReporteInteligenteService
{
    /**
     * @param  string|null  $inicio  fecha_inicio (Y-m-d). Si viene con $fin, analiza ese rango.
     * @param  string|null  $fin     fecha_fin (Y-m-d). Sin fechas → histórico total.
     */
    public function generar(?string $inicio = null, ?string $fin = null): AutomationReport
    {
        $data = $this->datosComerciales($inicio, $fin);
        $report = $this->analizar($data);
        return $this->guardar($data, $report, $inicio, $fin);
    }

    /** Datos comerciales reales, reutilizando la lógica del endpoint existente. */
    private function datosComerciales(?string $inicio, ?string $fin): array
    {
        $query = [];
        if ($inicio) { $query['fecha_inicio'] = $inicio; }
        if ($fin) { $query['fecha_fin'] = $fin; }
        $resp = app(TopProductsController::class)(Request::create('/api/automation/top-products', 'GET', $query));
        return $resp->getData(true);
    }

    /** Llama a Claude y arma el informe estructurado (con respaldo factual). */
    private function analizar(array $d): array
    {
        $num = fn ($v) => (float) ($v ?? 0);
        $fuente = [
            'period_start' => $d['period_start'] ?? null,
            'period_end' => $d['period_end'] ?? null,
            'facturacion_total' => $num($d['facturacion_total'] ?? 0),
            'utilidad_bruta' => $num($d['utilidad_bruta'] ?? 0),
            'utilidad_disponible' => $num($d['utilidad_disponible'] ?? 0),
            'margen_global_pct' => $num($d['margen_global_pct'] ?? 0),
            'crecimiento_mensual_pct' => $num($d['crecimiento_mensual_pct'] ?? 0),
            'categoria_mas_rentable' => $d['categoria_mas_rentable'] ?? null,
            'resumen_categorias' => array_slice($d['resumen_categorias'] ?? [], 0, 8),
            'mix_ventas_categorias' => array_slice($d['mix_ventas_categorias'] ?? [], 0, 8),
            'kpis_comerciales' => $d['kpis_comerciales'] ?? [],
            'top_productos_rentables' => array_slice($d['top_productos_rentables'] ?? [], 0, 8),
            'top_productos_mayor_rotacion' => array_slice($d['top_productos_mayor_rotacion'] ?? [], 0, 8),
            'analisis_celulares' => $d['analisis_celulares'] ?? [],
            'analisis_computadoras' => $d['analisis_computadoras'] ?? [],
            'analisis_accesorios' => $d['analisis_accesorios'] ?? [],
        ];

        $system = 'Eres analista comercial senior de AppleBoss (tienda Apple en Cochabamba, Bolivia). '
            . 'Respondé SOLO JSON válido, sin markdown. Español claro, breve y accionable para toma de decisiones. '
            . 'No inventes cifras: conservá los valores numéricos del JSON recibido.';

        $schema = "Generá un informe inteligente con ESTA estructura exacta (solo JSON):\n"
            . '{"period_start":"' . ($fuente['period_start'] ?? '') . '","period_end":"' . ($fuente['period_end'] ?? '') . '",'
            . '"resumen_ejecutivo":{"descripcion":"2-3 frases con la foto del negocio y qué hacer","facturacion_total":0,"utilidad_total":0,"margen_global_pct":0,"crecimiento_mensual_pct":0},'
            . '"analisis_por_categoria":[{"categoria":"texto","ingresos":0,"utilidad":0,"margen_promedio_pct":0,"nivel_riesgo":"BAJO|MEDIO|ALTO","observacion":"texto"}],'
            . '"riesgos_estrategicos":[{"tipo":"texto","descripcion":"texto","impacto":"texto"}],'
            . '"oportunidades":[{"descripcion":"texto","impacto_estimado":"texto"}],'
            . '"recomendaciones_ejecutivas":[{"accion":"texto concreto","prioridad":"ALTA|MEDIA|BAJA"}],'
            . '"productos_destacados":[{"producto":"texto","categoria":"texto","unidades":0,"utilidad":0,"margen_pct":0}]}' . "\n"
            . "Reglas: máximo 4 ítems por lista, textos breves. Recomendaciones concretas sobre inventario, precios, margen, descuentos, reposición o combos. "
            . "Datos reales del negocio: " . json_encode($fuente, JSON_UNESCAPED_UNICODE);

        $report = [];
        try {
            $resp = Http::withHeaders([
                'x-api-key' => (string) config('services.anthropic.key'),
                'anthropic-version' => '2023-06-01',
                'content-type' => 'application/json',
            ])->timeout(300)->retry(2, 2000)->post('https://api.anthropic.com/v1/messages', [
                'model' => 'claude-opus-5-5',
                'max_tokens' => 8000,
                'system' => $system,
                'messages' => [['role' => 'user', 'content' => $schema]],
            ]);

            if ($resp->successful()) {
                $texto = collect($resp->json('content', []))
                    ->firstWhere('type', 'text')['text'] ?? '';
                $texto = trim($texto);
                if (str_starts_with($texto, '```')) {
                    $texto = preg_replace('/^```(?:json)?\s*/i', '', $texto);
                    $texto = preg_replace('/\s*```$/', '', $texto);
                }
                $report = json_decode(trim($texto), true) ?: [];
            }
        } catch (\Throwable $e) {
            report($e);
            $report = [];
        }

        return $this->conRespaldoFactual($report, $fuente);
    }

    /** Rellena lo factual con los datos reales por si la IA falla o recorta. */
    private function conRespaldoFactual(array $r, array $s): array
    {
        $num = fn ($v) => (float) ($v ?? 0);
        $r['period_start'] = $s['period_start'];
        $r['period_end'] = $s['period_end'];
        $re = $r['resumen_ejecutivo'] ?? [];
        $re['facturacion_total'] = $num($s['facturacion_total']);
        $re['utilidad_total'] = $num($s['utilidad_bruta']);
        $re['margen_global_pct'] = $num($s['margen_global_pct']);
        $re['crecimiento_mensual_pct'] = $num($s['crecimiento_mensual_pct']);
        if (empty($re['descripcion'])) {
            $re['descripcion'] = 'Facturación Bs ' . number_format($s['facturacion_total'], 2)
                . ', utilidad Bs ' . number_format($s['utilidad_bruta'], 2)
                . ' y margen ' . number_format($s['margen_global_pct'], 2) . '%.';
        }
        $r['resumen_ejecutivo'] = $re;

        if (empty($r['analisis_por_categoria']) && ! empty($s['resumen_categorias'])) {
            $r['analisis_por_categoria'] = collect($s['resumen_categorias'])->take(5)->map(fn ($c) => [
                'categoria' => $c['categoria'] ?? 'sin_categoria',
                'ingresos' => $num($c['ingresos'] ?? 0),
                'utilidad' => $num($c['utilidad'] ?? 0),
                'margen_promedio_pct' => $num($c['margen_pct'] ?? 0),
                'nivel_riesgo' => $num($c['margen_pct'] ?? 0) < 10 ? 'MEDIO' : 'BAJO',
                'observacion' => 'Incluida por datos comerciales.',
            ])->values()->all();
        }
        // Analítica por producto: la IA no la devuelve, viene de los datos reales.
        foreach (['analisis_celulares', 'analisis_computadoras', 'analisis_accesorios'] as $k) {
            if (empty($r[$k]) && ! empty($s[$k])) {
                $r[$k] = $s[$k];
            }
        }

        // Respaldo de decisiones por si la IA no las trae (o no hay API key).
        [$riesgos, $oportunidades, $recomendaciones] = $this->decisionesFactuales($s);
        if (empty($r['recomendaciones_ejecutivas'])) {
            $r['recomendaciones_ejecutivas'] = $recomendaciones;
        }
        if (empty($r['riesgos_estrategicos'])) {
            $r['riesgos_estrategicos'] = $riesgos;
        }
        if (empty($r['oportunidades'])) {
            $r['oportunidades'] = $oportunidades;
        }

        foreach (['riesgos_estrategicos', 'oportunidades', 'recomendaciones_ejecutivas'] as $k) {
            $r[$k] = array_slice($r[$k] ?? [], 0, 5);
        }
        $r['productos_destacados'] = ! empty($r['productos_destacados'])
            ? array_slice($r['productos_destacados'], 0, 5)
            : array_slice($s['top_productos_rentables'] ?? [], 0, 5);
        $r['datos_base'] = $s;
        return $r;
    }

    /** Decisiones derivadas de los datos reales (respaldo si la IA no responde). */
    private function decisionesFactuales(array $s): array
    {
        $label = fn ($k) => [
            'celular' => 'Celulares', 'computadora' => 'Computadoras',
            'producto_general' => 'Accesorios', 'productos_generales' => 'Accesorios',
            'producto_apple' => 'Apple', 'servicio_tecnico' => 'Servicio técnico',
        ][$k] ?? ucfirst(str_replace('_', ' ', (string) $k));
        $pct = fn ($v) => number_format((float) $v, 2) . '%';

        $cats = collect($s['resumen_categorias'] ?? []);
        $mix = collect($s['mix_ventas_categorias'] ?? []);

        // Recomendaciones
        $rec = [];
        $rot = collect($s['top_productos_mayor_rotacion'] ?? [])->take(3)->pluck('producto')->filter()->values()->all();
        if ($rot) {
            $rec[] = ['accion' => 'Reponer stock de los productos de mayor rotación: ' . implode(', ', $rot) . '.', 'prioridad' => 'ALTA'];
        }
        $bajo = $cats->filter(fn ($c) => ($c['ingresos'] ?? 0) > 0 && ($c['margen_pct'] ?? 0) < 10)->sortBy('margen_pct')->first();
        if ($bajo) {
            $rec[] = ['accion' => 'Revisar precios y costos en ' . $label($bajo['categoria'] ?? '') . ' (margen ' . $pct($bajo['margen_pct'] ?? 0) . ').', 'prioridad' => 'ALTA'];
        }
        $top = $s['categoria_mas_rentable'] ?? null;
        if ($top) {
            $rec[] = ['accion' => 'Impulsar ' . $label($top['categoria'] ?? '') . ', que concentra la mayor utilidad del período.', 'prioridad' => 'MEDIA'];
        }
        $rec[] = ['accion' => 'Sumar accesorios y servicio técnico en cada venta para subir el ticket promedio.', 'prioridad' => 'MEDIA'];

        // Riesgos
        $ri = [];
        $conc = $mix->sortByDesc('participacion_ingresos_pct')->first();
        if ($conc && ($conc['participacion_ingresos_pct'] ?? 0) >= 50) {
            $ri[] = ['tipo' => 'Concentración', 'descripcion' => 'La categoría ' . ($conc['categoria'] ?? '') . ' concentra el ' . number_format((float) ($conc['participacion_ingresos_pct'] ?? 0), 1) . '% de la facturación.', 'impacto' => 'Alta dependencia de una sola línea de negocio.'];
        }
        if (($s['margen_global_pct'] ?? 0) > 0 && ($s['margen_global_pct'] ?? 0) < 12) {
            $ri[] = ['tipo' => 'Margen ajustado', 'descripcion' => 'El margen global del período es de ' . $pct($s['margen_global_pct'] ?? 0) . '.', 'impacto' => 'Poco colchón ante descuentos o subas de costo.'];
        }

        // Oportunidades
        $op = [];
        $mejor = $cats->filter(fn ($c) => ($c['ingresos'] ?? 0) > 0)->sortByDesc('margen_pct')->first();
        if ($mejor) {
            $op[] = ['descripcion' => 'Escalar ' . $label($mejor['categoria'] ?? '') . ', la categoría con mejor margen (' . $pct($mejor['margen_pct'] ?? 0) . ').', 'impacto_estimado' => 'Mejora directa de la utilidad.'];
        }
        $op[] = ['descripcion' => 'Ofrecer accesorios y servicio técnico junto a cada equipo.', 'impacto_estimado' => 'Más ticket y margen por venta.'];

        return [$ri, $op, array_slice($rec, 0, 5)];
    }

    /** Guarda el AutomationReport del período y crea la notificación. */
    private function guardar(array $data, array $report, ?string $inicio = null, ?string $fin = null): AutomationReport
    {
        if ($inicio && $fin) {
            $period = $inicio === $fin ? 'dia_' . $inicio : 'rango_' . $inicio . '_' . $fin;
        } else {
            $period = 'historico_' . now()->toDateString();
        }
        $saved = AutomationReport::updateOrCreate(
            ['period' => $period],
            [
                'content' => $report,
                'period_start' => $data['period_start'] ?? now()->toDateString(),
                'period_end' => $data['period_end'] ?? now()->toDateString(),
                'engine_version' => 'claude-opus-5-5',
                'prompt_version' => 'retail_v4_laravel',
                'generated_at' => now(),
            ]
        );

        if (Schema::hasTable('system_notifications')) {
            SystemNotification::updateOrCreate(
                ['type' => 'report', 'report_id' => $saved->id],
                [
                    'title' => 'Nuevo análisis inteligente disponible',
                    'message' => 'Se generó el análisis comercial del ' . now()->format('d/m/Y H:i') . '.',
                ]
            );
        }

        return $saved;
    }
}
