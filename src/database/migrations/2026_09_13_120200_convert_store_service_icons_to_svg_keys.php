<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/** Los servicios guardaban emojis como ícono; ahora usan claves del set SVG propio. */
return new class extends Migration
{
    private const MAP = [
        '🔍' => 'scan', '🔎' => 'scan', '🔧' => 'wrench', '🛠️' => 'wrench', '🛠' => 'wrench',
        '📦' => 'package', '🚚' => 'truck', '✅' => 'badge', '✔️' => 'badge',
        '🛡️' => 'shield', '🛡' => 'shield', '🔋' => 'battery', '♻️' => 'exchange', '🔄' => 'exchange',
        '💬' => 'chat', '🏪' => 'store', '📱' => 'phone', '💻' => 'laptop',
    ];

    public function up(): void
    {
        foreach (self::MAP as $emoji => $key) {
            DB::table('store_services')->where('icon', $emoji)->update(['icon' => $key]);
        }
    }

    public function down(): void
    {
        // Irreversible a propósito: no se vuelve a emojis.
    }
};
