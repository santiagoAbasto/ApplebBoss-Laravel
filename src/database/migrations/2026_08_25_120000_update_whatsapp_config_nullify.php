<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Reemplazar el número ficticio por null hasta que se configure el real
        DB::table('configuracion_tienda')
            ->where('clave', 'whatsapp_numero')
            ->update(['valor' => null]);

        // Agregar campo de habilitación si no existe
        $exists = DB::table('configuracion_tienda')->where('clave', 'whatsapp_enabled')->exists();
        if (!$exists) {
            DB::table('configuracion_tienda')->insert([
                'clave'      => 'whatsapp_enabled',
                'valor'      => '0',
                'tipo'       => 'booleano',
                'grupo'      => 'contacto',
                'etiqueta'   => 'WhatsApp habilitado',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Limpiar número del mensaje de WhatsApp también
        DB::table('configuracion_tienda')
            ->where('clave', 'whatsapp_mensaje')
            ->update(['valor' => 'Hola Apple Boss, quiero consultar sobre sus productos.']);
    }

    public function down(): void
    {
        DB::table('configuracion_tienda')
            ->where('clave', 'whatsapp_numero')
            ->update(['valor' => null]);

        DB::table('configuracion_tienda')
            ->where('clave', 'whatsapp_enabled')
            ->delete();
    }
};
