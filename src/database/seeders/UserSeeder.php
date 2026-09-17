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
        $this->seedUser('Administrador', 'santyadmin@appleboss.com', 'Santyadmin123', 'admin');
        $this->seedUser('Ayelen Vargas', 'ayelenvargas877@gmail.com', 'TeKieromucho9', 'vendedor');
        $this->seedUser('Jhoel Abasto', 'jhoelabastoortega@gmail.com', 'Jesusmitodo93', 'vendedor');
    }

    private function seedUser(string $name, string $email, string $password, string $role): void
    {
        $normalizedEmail = strtolower($email);
        $user = User::query()
            ->whereRaw('LOWER(email) = ?', [$normalizedEmail])
            ->first() ?? new User();
        $user->name = $name;
        $user->email = $normalizedEmail;
        $user->password = Hash::make($password);
        $user->rol = $role;
        $user->save();
    }
}
