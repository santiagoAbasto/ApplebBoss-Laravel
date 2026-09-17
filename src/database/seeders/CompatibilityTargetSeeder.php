<?php

namespace Database\Seeders;

use App\Models\CompatibilityTarget;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CompatibilityTargetSeeder extends Seeder
{
    public function run(): void
    {
        $devices = [
            // ─── iPhone ───────────────────────────────────────────────────────
            ['family' => 'iphone', 'generation' => 'iPhone 16',    'names' => ['iPhone 16', 'iPhone 16 Plus', 'iPhone 16 Pro', 'iPhone 16 Pro Max']],
            ['family' => 'iphone', 'generation' => 'iPhone 15',    'names' => ['iPhone 15', 'iPhone 15 Plus', 'iPhone 15 Pro', 'iPhone 15 Pro Max']],
            ['family' => 'iphone', 'generation' => 'iPhone 14',    'names' => ['iPhone 14', 'iPhone 14 Plus', 'iPhone 14 Pro', 'iPhone 14 Pro Max']],
            ['family' => 'iphone', 'generation' => 'iPhone 13',    'names' => ['iPhone 13', 'iPhone 13 mini', 'iPhone 13 Pro', 'iPhone 13 Pro Max']],
            ['family' => 'iphone', 'generation' => 'iPhone 12',    'names' => ['iPhone 12', 'iPhone 12 mini', 'iPhone 12 Pro', 'iPhone 12 Pro Max']],
            ['family' => 'iphone', 'generation' => 'iPhone 11',    'names' => ['iPhone 11', 'iPhone 11 Pro', 'iPhone 11 Pro Max']],
            ['family' => 'iphone', 'generation' => 'iPhone XS/XR', 'names' => ['iPhone XS', 'iPhone XS Max', 'iPhone XR']],
            ['family' => 'iphone', 'generation' => 'iPhone X',     'names' => ['iPhone X']],
            ['family' => 'iphone', 'generation' => 'iPhone SE',    'names' => ['iPhone SE (1.ª gen)', 'iPhone SE (2.ª gen)', 'iPhone SE (3.ª gen)']],

            // ─── iPad ─────────────────────────────────────────────────────────
            ['family' => 'ipad', 'generation' => 'iPad Pro 13"',  'names' => ['iPad Pro 13" (M4)', 'iPad Pro 13" (M2)', 'iPad Pro 12.9" (M1)', 'iPad Pro 12.9" (2020)', 'iPad Pro 12.9" (2018)']],
            ['family' => 'ipad', 'generation' => 'iPad Pro 11"',  'names' => ['iPad Pro 11" (M4)', 'iPad Pro 11" (M2)', 'iPad Pro 11" (M1)', 'iPad Pro 11" (2020)', 'iPad Pro 11" (2018)']],
            ['family' => 'ipad', 'generation' => 'iPad Air',      'names' => ['iPad Air 13" (M2)', 'iPad Air 11" (M2)', 'iPad Air (M1)', 'iPad Air (2022)', 'iPad Air (2020)']],
            ['family' => 'ipad', 'generation' => 'iPad mini',     'names' => ['iPad mini (A17 Pro)', 'iPad mini (6.ª gen)', 'iPad mini (5.ª gen)']],
            ['family' => 'ipad', 'generation' => 'iPad',          'names' => ['iPad (10.ª gen)', 'iPad (9.ª gen)', 'iPad (8.ª gen)']],

            // ─── Mac ──────────────────────────────────────────────────────────
            ['family' => 'mac', 'generation' => 'MacBook Pro 16"', 'names' => ['MacBook Pro 16" (M4)', 'MacBook Pro 16" (M3)', 'MacBook Pro 16" (M2)', 'MacBook Pro 16" (M1)']],
            ['family' => 'mac', 'generation' => 'MacBook Pro 14"', 'names' => ['MacBook Pro 14" (M4)', 'MacBook Pro 14" (M3)', 'MacBook Pro 14" (M2)', 'MacBook Pro 14" (M1)']],
            ['family' => 'mac', 'generation' => 'MacBook Air',     'names' => ['MacBook Air 15" (M3)', 'MacBook Air 13" (M3)', 'MacBook Air 15" (M2)', 'MacBook Air 13" (M2)', 'MacBook Air (M1)']],
            ['family' => 'mac', 'generation' => 'iMac',            'names' => ['iMac (M4)', 'iMac (M3)', 'iMac (M1)']],
            ['family' => 'mac', 'generation' => 'Mac mini',        'names' => ['Mac mini (M4)', 'Mac mini (M2)']],
            ['family' => 'mac', 'generation' => 'Mac Studio',      'names' => ['Mac Studio (M4)', 'Mac Studio (M2)', 'Mac Studio (M1)']],
            ['family' => 'mac', 'generation' => 'Mac Pro',         'names' => ['Mac Pro (M2 Ultra)']],

            // ─── Apple Watch ──────────────────────────────────────────────────
            ['family' => 'watch', 'generation' => 'Apple Watch Ultra', 'names' => ['Apple Watch Ultra 2', 'Apple Watch Ultra']],
            ['family' => 'watch', 'generation' => 'Apple Watch Series', 'names' => ['Apple Watch Series 10', 'Apple Watch Series 9', 'Apple Watch Series 8', 'Apple Watch Series 7', 'Apple Watch Series 6', 'Apple Watch Series 5', 'Apple Watch SE (2.ª gen)', 'Apple Watch SE (1.ª gen)']],

            // ─── AirPods ──────────────────────────────────────────────────────
            ['family' => 'airpods', 'generation' => 'AirPods Pro', 'names' => ['AirPods Pro (2.ª gen)', 'AirPods Pro (1.ª gen)']],
            ['family' => 'airpods', 'generation' => 'AirPods',     'names' => ['AirPods (4.ª gen)', 'AirPods (3.ª gen)', 'AirPods (2.ª gen)']],
            ['family' => 'airpods', 'generation' => 'AirPods Max', 'names' => ['AirPods Max (USB-C)', 'AirPods Max (Lightning)']],
        ];

        $order = 0;
        foreach ($devices as $group) {
            foreach ($group['names'] as $name) {
                $slug = Str::slug($name);
                CompatibilityTarget::updateOrCreate(
                    ['slug' => $slug],
                    [
                        'family'     => $group['family'],
                        'generation' => $group['generation'],
                        'name'       => $name,
                        'active'     => true,
                        'sort_order' => $order++,
                    ]
                );
            }
        }
    }
}
