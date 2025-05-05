<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UserSeeder extends Seeder
{
    /**
     * Ejecuta los seeders.
     */
    public function run(): void
    {
        User::create([
            'name' => 'Administrador',
            'email' => 'santyadmin@appleboss.com',
            'password' => Hash::make('Santyadmin123'),
            'rol' => 'admin',
        ]);

        User::create([
            'name' => 'Ayelen Vargas',
            'email' => 'Ayelenvargas877@gmail.com',
            'password' => Hash::make('TeKieromucho9'),
            'rol' => 'vendedor',
        ]);

        User::create([
            'name' => 'Jhoel Abasto',
            'email' => 'jhoelabastoortega@gmail.com',
            'password' => Hash::make('Jesusmitodo93'),
            'rol' => 'vendedor',
        ]);
    }
}
