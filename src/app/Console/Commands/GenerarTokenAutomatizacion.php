<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

/**
 * Genera un token seguro para el canal de automatización (n8n) o para el export financiero.
 *
 * No toca el .env ni n8n (eso rompería la integración): solo imprime el token y explica dónde va. En Docker van los
 * dos .env a la vez (src/.env para Laravel y el de la raíz para n8n); si n8n está en otro servidor, se rota sin
 * cortarlo con AUTOMATION_TOKENS_PREVIOS como ventana de gracia.
 */
class GenerarTokenAutomatizacion extends Command
{
    protected $signature = 'automation:token {--export : Genera el token del export financiero (ámbito export)}';

    protected $description = 'Genera un token seguro para la automatización (n8n) sin tocar el .env ni n8n.';

    public function handle(): int
    {
        $token = bin2hex(random_bytes(32)); // 64 hex, alta entropía
        $var   = $this->option('export') ? 'AUTOMATION_EXPORT_TOKEN' : 'AUTOMATION_TOKEN';

        $this->newLine();
        $this->info("Token nuevo para {$var}:");
        $this->line("  {$token}");
        $this->newLine();

        if ($this->option('export')) {
            $this->comment('Es el token del export financiero: n8n NO lo usa. Ponlo solo en src/.env (el de Laravel):');
            $this->line("  AUTOMATION_EXPORT_TOKEN={$token}");
        } else {
            // El token vive en dos lugares: Laravel lo lee de src/.env y n8n lo recibe de docker-compose, que lo toma del
            // .env de la raíz del proyecto ($env.AUTOMATION_TOKEN en los flujos).
            $this->comment('Pon el MISMO token en los dos .env:');
            $this->line("  - src/.env (Laravel):                  AUTOMATION_TOKEN={$token}");
            $this->line("  - .env de la raíz del proyecto (n8n):  AUTOMATION_TOKEN={$token}");
            $this->comment('Después, para que los dos lo usen:');
            $this->line('  docker exec appleboss-app php artisan config:clear');
            $this->line('  docker compose up -d n8n');
            $this->newLine();
            $this->comment('Si n8n corre en otro servidor y no puedes cambiarlo al mismo tiempo (ventana de gracia):');
            $this->line('  1) En src/.env, pasa el token viejo a AUTOMATION_TOKENS_PREVIOS (separa con coma si hay varios).');
            $this->line('  2) Pon el nuevo en AUTOMATION_TOKEN y corre php artisan config:clear: los dos valen mientras actualizas n8n.');
            $this->line('  3) Cuando n8n ya use el nuevo, vacía AUTOMATION_TOKENS_PREVIOS y vuelve a correr php artisan config:clear.');
        }

        $this->newLine();
        return self::SUCCESS;
    }
}
