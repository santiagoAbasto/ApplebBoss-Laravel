<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
            ALTER TABLE automation_reports
            ALTER COLUMN content TYPE jsonb
            USING content::jsonb
        ");
    }

    public function down(): void
    {
        DB::statement("
            ALTER TABLE automation_reports
            ALTER COLUMN content TYPE text
        ");
    }
};