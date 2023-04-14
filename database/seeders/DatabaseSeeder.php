<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            JournalSeeder::class,
        ]);

        // Create a default admin user for local development
        \App\Models\User::factory()->create([
            'name'  => 'Admin User',
            'email' => 'admin@sjplatform.local',
            'role'  => 'admin',
        ]);

        \App\Models\User::factory()->create([
            'name'  => 'Reviewer User',
            'email' => 'reviewer@sjplatform.local',
            'role'  => 'reviewer',
        ]);
    }
}
