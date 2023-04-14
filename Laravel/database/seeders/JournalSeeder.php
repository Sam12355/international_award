<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Journal;

class JournalSeeder extends Seeder
{
    /**
     * Seed the default journals.
     */
    public function run(): void
    {
        $journals = [
            ['name' => 'Journal of Agricultural Sciences',         'issn' => '2517-8382', 'description' => 'Crop science, soil management and agronomy research'],
            ['name' => 'Journal of Sustainable Farming',           'issn' => '2517-8404', 'description' => 'Sustainable agriculture and innovation in farming systems'],
            ['name' => 'Journal of Food & Biosystems Engineering', 'issn' => '2517-8411', 'description' => 'Food technology, post-harvest engineering and biosystems'],
        ];

        foreach ($journals as $data) {
            Journal::firstOrCreate(['issn' => $data['issn']], $data);
        }
    }
}
